export const courseOrderKey = "catalog:course-order";
export function parseCourseOrder(body?: Uint8Array | null): string[] {
 try { const value:unknown=JSON.parse(body?new TextDecoder().decode(body):"[]");return Array.isArray(value)&&value.every(item=>typeof item==="string")?[...new Set(value)]:[]; } catch { return []; }
}
export function orderCourses<T extends {slug:string;name:string}>(courses:T[],order:string[]):T[] {
 const positions=new Map(order.map((slug,index)=>[slug,index]));
 return [...courses].sort((a,b)=>(positions.get(a.slug)??Number.MAX_SAFE_INTEGER)-(positions.get(b.slug)??Number.MAX_SAFE_INTEGER)||a.name.localeCompare(b.name, "en", {numeric:true}));
}
export function compareSubjectCodes(a:{code:string;name:string},b:{code:string;name:string}):number {
 if(!a.code.trim()||!b.code.trim()){if(a.code.trim())return -1;if(b.code.trim())return 1;}
 return a.code.localeCompare(b.code,"en",{numeric:true,sensitivity:"base"})||a.name.localeCompare(b.name);
}
