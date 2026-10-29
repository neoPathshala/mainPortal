import 'server-only';
import {db} from './db';

let viewsReady:Promise<void>|undefined;
let eventsReady:Promise<void>|undefined;

/** Runtime roles verify the schema; only the migration identity may change it. */
export function ensureSiteAnalytics(includePWA=false){
 if(!viewsReady)viewsReady=Promise.resolve(
  db.$queryRaw`SELECT "id", "clientType" FROM "neo"."SitePageView" LIMIT 0`
 ).then(()=>{}).catch(error=>{viewsReady=undefined;throw error;});
 if(!includePWA)return viewsReady;
 if(!eventsReady)eventsReady=Promise.resolve(
  db.$queryRaw`SELECT "id", "clientType" FROM "neo"."SitePWAEvent" LIMIT 0`
 ).then(()=>{}).catch(error=>{eventsReady=undefined;throw error;});
 return Promise.all([viewsReady,eventsReady]).then(()=>{});
}

/** Prisma's pg adapter nests PostgreSQL SQLSTATE under driverAdapterError.cause. */
export function isAnalyticsSchemaUnavailable(error:unknown){
 if(!error||typeof error!=='object')return false;
 const failure=error as {code?:string;meta?:{code?:string;driverAdapterError?:{cause?:{originalCode?:string}}}};
 if(failure.code!=='P2010')return false;
 const code=failure.meta?.code||failure.meta?.driverAdapterError?.cause?.originalCode;
 return typeof code==='string'&&['42P01','42703','3F000','42501'].includes(code);
}
