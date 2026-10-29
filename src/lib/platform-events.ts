export type EventCategory='page'|'api'|'security'|'runtime'|'action';
export type EventSeverity='info'|'warning'|'error'|'critical';
export function offlineSessionEvent(status:number,path:string,method:string){
 if(status!==401||method!=='GET'||!['/api/offline/snapshot','/api/offline/panel'].includes(path))return null;
 return {category:'security' as const,severity:'info' as const,title:'Offline copy needs sign-in',message:'No active administrator session was available. Background offline refresh pauses until sign-in is verified again.'};
}
export function classifyPlatformEvent(status:number,path:string,route='',message=''){
 const security=[401,403,429].includes(status)||/too many requests|rate limit|lockout|csrf|request not allowed/i.test(message);
 const category:EventCategory=security?'security':path.startsWith('/api/')?'api':route.includes('(action)')?'action':status===404?'page':route.includes('browser')?'runtime':'page';
 const severity:EventSeverity=status>=500?'error':security||status>=400&&status!==404?'warning':'info';
 const title=security?(status===429||/rate limit|too many requests/i.test(message)?'Rate limit triggered':status===401?'Authentication rejected':status===403?'Access denied':'Security policy rejected a request'):category==='api'?`API request failed · ${status}`:category==='runtime'?'Browser error':category==='action'?'Action failed':status===404?'Page not found':'Page failed to load';
 return {category,severity,title};
}
export function monitoredResponse(status:number,path:string){return status>=400&&!path.startsWith('/_next/')&&!['/api/error-reports','/api/activity','/api/admin-search'].some(prefix=>path.startsWith(prefix));}
