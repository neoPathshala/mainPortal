import 'server-only';
import {cache} from 'react';
import {db} from '../db';
import {authPolicyKey,defaultAuthPolicy,parseAuthPolicy} from './auth-policy';
export const getAuthPolicy=cache(async()=>{const record=await db.platformObject.findUnique({where:{key:authPolicyKey},select:{body:true}});return record?parseAuthPolicy(JSON.parse(Buffer.from(record.body).toString())):defaultAuthPolicy();});
