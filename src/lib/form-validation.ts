export function validPhone(value:string){const phone=value.trim();return !phone||/^\+?[0-9 ()-]+$/.test(phone)&&phone.length<=25&&phone.replace(/\D/g,'').length>=7&&phone.replace(/\D/g,'').length<=15;}
export type FormFieldRules={value:string;label?:string;name?:string;type?:string;required?:boolean;minLength?:number;maxLength?:number;min?:string;max?:string};
/** Same rules for typing, paste and programmatic submit; passwords are never trimmed. */
export function formFieldError(field:FormFieldRules){
 const value=field.type==='password'?field.value:field.value.trim(),label=field.label||'This field';
 if(!value)return field.required?`${label} is required.`:'';
 if(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(value))return `${label} contains unsupported characters.`;
 if(field.minLength&&field.minLength>0&&value.length<field.minLength)return `${label} needs at least ${field.minLength} characters.`;
 if(field.maxLength&&field.maxLength>0&&field.value.length>field.maxLength)return `${label} must be at most ${field.maxLength} characters.`;
 if(field.type==='tel'&&!validPhone(value))return 'Enter a valid phone number (7–15 digits), or leave it blank.';
 if(field.type==='email'&&(!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value)||/[\r\n]/.test(field.value)))return 'Enter a valid email address.';
 if(field.name==='amount'&&(!/^\d{1,8}(?:\.\d{1,2})?$/.test(value)||Number(value)<=0||Number(value)>10000000))return 'Enter an amount greater than zero, up to Rs. 10,000,000, with at most two decimal places.';
 if(field.type==='number'){
  const number=Number(value);if(!Number.isFinite(number))return `${label} must be a valid number.`;
  if(field.min&&number<Number(field.min))return `${label} must be at least ${field.min}.`;
  if(field.max&&number>Number(field.max))return `${label} must be at most ${field.max}.`;
 }
 if(field.name==='cloudLink'){
  try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||!url.hostname.includes('.'))return 'Enter a valid HTTPS sharing link.';}catch{return 'Enter a valid HTTPS sharing link.';}
 }
 return '';
}
