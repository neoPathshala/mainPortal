export const facultyRegistryKey="academic:faculties:v1";
export type Faculty={id:string;name:string;shortName:string;slug:string;universityId:string;updatedAt:string};
export const facultyValue=(id:string)=>`faculty:${id}`;
export function parseFaculties(value:unknown):Faculty[]{
 if(!value||typeof value!=="object"||!("version" in value)||value.version!==1||!("faculties" in value)||!Array.isArray(value.faculties))return [];
 const ids=new Set<string>(),slugs=new Set<string>();
 return value.faculties.flatMap((entry:unknown)=>{
  if(!entry||typeof entry!=="object")return [];
  const f=entry as Faculty;
  if(![f.id,f.universityId].every(v=>typeof v==="string"&&/^[a-zA-Z0-9_-]{1,100}$/.test(v))||typeof f.name!=="string"||!f.name.trim()||f.name.length>200||typeof f.shortName!=="string"||!f.shortName.trim()||f.shortName.length>50||typeof f.slug!=="string"||f.slug.length>120||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)||typeof f.updatedAt!=="string"||Number.isNaN(Date.parse(f.updatedAt)))return [];
  const scope=`${f.universityId}:${f.slug}`;if(ids.has(f.id)||slugs.has(scope))return [];ids.add(f.id);slugs.add(scope);
  return [{id:f.id,name:f.name,shortName:f.shortName,slug:f.slug,universityId:f.universityId,updatedAt:f.updatedAt}];
 });
}
export function facultyLabel(value:string="",faculties:Faculty[]){return value.startsWith("faculty:")?faculties.find(f=>facultyValue(f.id)===value)?.name||"":value;}
