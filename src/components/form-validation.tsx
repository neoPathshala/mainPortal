'use client';
import {useEffect} from 'react';
import {formFieldError} from '@/lib/form-validation';
/** Enhances native constraints without replacing form-specific server validation. */
export function FormValidation(){
 useEffect(()=>{
  const editable=(element:Element):element is HTMLInputElement|HTMLTextAreaElement=>(element instanceof HTMLInputElement||element instanceof HTMLTextAreaElement)&&!element.matches(':disabled')&&!element.readOnly&&element.getAttribute('aria-hidden')!=='true'&&!(element instanceof HTMLInputElement&&['hidden','checkbox','radio','file','submit','button'].includes(element.type));
  const clear=(event:Event)=>{const field=event.target;if(field instanceof Element&&editable(field)){field.setCustomValidity('');if(field.name==='password'||field.name==='confirmPassword'){const confirm=field.form?.elements.namedItem('confirmPassword');if(confirm instanceof HTMLInputElement)confirm.setCustomValidity('');}}};
  const submit=(event:Event)=>{
   const form=event.target;if(!(form instanceof HTMLFormElement)||form.noValidate)return;
   let first:HTMLInputElement|HTMLTextAreaElement|undefined;
   for(const field of Array.from(form.elements)){
    if(!editable(field))continue;
    const label=field.labels?.[0]?.textContent?.split('\n')[0]?.trim().slice(0,70)||field.getAttribute('aria-label')||'This field';
    let message=formFieldError({value:field.value,label,name:field.name,type:field instanceof HTMLInputElement?field.type:'text',required:field.required,minLength:field.minLength,maxLength:field.maxLength,min:field instanceof HTMLInputElement?field.min:undefined,max:field instanceof HTMLInputElement?field.max:undefined});
    if(field.name==='confirmPassword'){const password=form.elements.namedItem('password');if(password instanceof HTMLInputElement&&password.value!==field.value)message='Passwords do not match.';}
    field.setCustomValidity(message);if(message&&!first)first=field;
   }
   if(first){event.preventDefault();event.stopImmediatePropagation();first.focus();first.reportValidity();}
  };
  document.addEventListener('input',clear,true);document.addEventListener('change',clear,true);document.addEventListener('submit',submit,true);
  return()=>{document.removeEventListener('input',clear,true);document.removeEventListener('change',clear,true);document.removeEventListener('submit',submit,true);};
 },[]);
 return null;
}
