export function safeSyllabusLink(value:unknown):value is string{
 if(typeof value!=='string'||!value||value.length>2048||/[\s\u0000-\u001f\u007f\\]/.test(value))return false;
 if(/^\/(?!\/)/.test(value)||/^#[a-zA-Z0-9_-]+$/.test(value))return true;
 try{const url=new URL(value);return url.protocol==='https:'&&!url.username&&!url.password;}catch{return false;}
}
