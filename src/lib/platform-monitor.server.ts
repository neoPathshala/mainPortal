import {subscribe,unsubscribe} from 'node:diagnostics_channel';
import type {IncomingMessage,ServerResponse} from 'node:http';
import {classifyPlatformEvent,monitoredResponse,offlineSessionEvent} from './platform-events';
import {recordError} from './error-reports.server';
type Listener=(value:unknown)=>void;
const token={};
const state=globalThis as typeof globalThis&{platformResponseMonitor?:boolean;platformResponseRegistration?:{token:object;listener:Listener}};
export function registerResponseMonitor(){
 const previous=state.platformResponseRegistration;
 if(previous?.token===token)return;
 // A legacy listener has no removable reference. A process restart replaces it.
 if(!previous&&state.platformResponseMonitor)return;
 if(previous)unsubscribe('http.server.response.finish',previous.listener);
 const recent=new Map<string,number>();
 const listener:Listener=value=>{
  const {request,response}=value as {request:IncomingMessage;response:ServerResponse};const path=(request.url||'/').split('?')[0];const status=response.statusCode;
  if(!monitoredResponse(status,path))return;
  if(response.getHeader?.('x-error-reference'))return;
  const key=`${request.method}:${path}:${status}`;const now=Date.now();if(recent.size>2000)recent.clear();if((recent.get(key)||0)>now-10000)return;recent.set(key,now);
  const expected=response.getHeader?.('x-offline-session-required')==='1'?offlineSessionEvent(status,path,request.method||'GET'):null;
  const event=expected||classifyPlatformEvent(status,path);
  void recordError({status,path,method:request.method||'GET',message:expected?.message||event.title+'. HTTP response observed by the application server.',route:'HTTP response',...event}).catch(()=>{});
 };
 subscribe('http.server.response.finish',listener);
 state.platformResponseMonitor=true;state.platformResponseRegistration={token,listener};
}
