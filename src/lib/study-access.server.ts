import {mobilePwa} from "./pwa-access";
import {headers} from "next/headers";
import {coursesComingSoon} from './course-availability';
import 'server-only';
import {cache} from 'react';
import {redirect} from 'next/navigation';
import {db} from './db';
import {parsePresentation,sitePresentationKey} from './site-presentation';
import {getSession} from './security/auth';

// Authorization is request-scoped, never stored in the optional presentation cache.
export const canReadStudyResources=cache(async()=>{
 if(coursesComingSoon)return false;
 const row=await db.platformObject.findUnique({where:{key:sitePresentationKey},select:{body:true}});
 const request=await headers();
 const appLocked=mobilePwa(request.get('x-session-client'),request.get('x-session-device'),request.get('user-agent')||'');
 const locked=row?parsePresentation(JSON.parse(Buffer.from(row.body).toString())).study.requireStudySignIn===true:false;
 return !(locked||appLocked) || Boolean(await getSession());
});
export async function requireStudyAccess(){if(coursesComingSoon)redirect('/courses');if(!await canReadStudyResources())redirect('/login');}
