import { createDatabaseObjectStore, type ObjectStoreSQL } from '../database-object-store';
import { DEFAULT_SUPPORT,parseSupport,type SupportSettings,type FeedbackRecord,type SupportReceipt } from './schema';
export function createCommunityDatabaseStorage(sql: ObjectStoreSQL) {
  const objects=createDatabaseObjectStore(sql);
  const idCheck=(id:string) => {if(!/^[a-f0-9-]{36}$/.test(id))throw new Error('Invalid identifier.');return id;};
  const fileKey=(name:string) => {if(!/^[a-f0-9-]{36}\.(pdf|png|jpg|webp)$/.test(name))throw new Error('Invalid file.');return `community/files/${name}`;};
  async function readJSON<T>(key:string):Promise<T>{return JSON.parse((await objects.read(key)).toString('utf8'));}
  async function writeJSON(key:string,value:unknown){await objects.write(key,Buffer.from(JSON.stringify(value)));}
  async function list<T extends {createdAt:string}>(folder:string){const keys=(await objects.list(`community/${folder}/`)).filter(k=>/\/[a-f0-9-]{36}\.json$/.test(k));const rows:T[]=[];for(let i=0;i<keys.length;i+=16)rows.push(...await Promise.all(keys.slice(i,i+16).map(k=>readJSON<T>(k))));return rows.sort((a,b)=>b.createdAt.localeCompare(a.createdAt));}
  const api={
    async readSupport():Promise<SupportSettings>{try{return parseSupport(await readJSON('community/support.json'));}catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return structuredClone(DEFAULT_SUPPORT);throw e;}},
    async writeSupport(settings:SupportSettings){await writeJSON('community/support.json',parseSupport(settings));},
    async readFeedback(id:string){return readJSON<FeedbackRecord>(`community/feedback/${idCheck(id)}.json`);},
    async writeFeedback(record:FeedbackRecord){await writeJSON(`community/feedback/${idCheck(record.id)}.json`,record);},
    async listFeedback(){return list<FeedbackRecord>('feedback');},
    async readSupportReceipt(id:string){return readJSON<SupportReceipt>(`community/receipts/${idCheck(id)}.json`);},
    async writeSupportReceipt(record:SupportReceipt){await writeJSON(`community/receipts/${idCheck(record.id)}.json`,record);},
    async listSupportReceipts(){return list<SupportReceipt>('receipts');},
    async saveCommunityFile(name:string,bytes:Uint8Array){await objects.write(fileKey(name),bytes,true);},
    async readCommunityFile(name:string){return objects.read(fileKey(name));},
    async removeCommunityFile(name:string){await objects.remove(fileKey(name));},
    async eraseFeedbackIdentity(userId:string){if(!userId)return;for(const record of await api.listFeedback()){if(record.userId!==userId)continue;if(record.attachment)await api.removeCommunityFile(record.attachment.file);if(record.status!=='published')await objects.remove(`community/feedback/${record.id}.json`);else{const {attachment:_file,...rest}=record;await api.writeFeedback({...rest,userId:'',name:'Deleted student',email:'',anonymous:true,cloudLink:''});}}},
    async eraseSupportReceipts(userId:string){if(!userId)return;for(const r of await api.listSupportReceipts()){if(r.userId!==userId)continue;if(r.attachment)await api.removeCommunityFile(r.attachment.file);await objects.remove(`community/receipts/${r.id}.json`);}},
  };return api;
}
