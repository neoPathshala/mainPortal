import {randomBytes,scrypt as scryptCallback,timingSafeEqual} from 'node:crypto';
function derive(password:string,salt:string):Promise<Buffer>{return new Promise((resolve,reject)=>scryptCallback(password,salt,64,{N:32768,r:8,p:1,maxmem:67108864},(error,key)=>error?reject(error):resolve(key)));}
export function checkPasswordLength(value:unknown,minimum=14):asserts value is string{if(typeof value!=='string'||value.length<minimum||value.length>256)throw new Error(`Use a password between ${minimum} and 256 characters.`);}
export async function hashStudentPassword(password:string,minimum=14){checkPasswordLength(password,minimum);const salt=randomBytes(16).toString('hex');return `scrypt:${salt}:${(await derive(password,salt)).toString('hex')}`;}
export async function verifyStudentPassword(password:unknown,stored:string){if(typeof password!=='string'||password.length>256)return false;const [kind,salt,hash]=stored.split(':');if(kind!=='scrypt'||!(/^[a-f0-9]{32}$/).test(salt)||!(/^[a-f0-9]{128}$/).test(hash))return false;return timingSafeEqual(Buffer.from(hash,'hex'),await derive(password,salt));}
export const dummyStudentPassword=`scrypt:${'0'.repeat(32)}:${'0'.repeat(128)}`;
