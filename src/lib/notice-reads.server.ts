import 'server-only';
import {db} from './db';
import {getStudentNotices} from './student-notices.server';
import {noticesForSemester} from './semester-notices';

export const noticeReadPrefix=(userId:string)=>`notice-read:${userId}:`;
const readKey=(userId:string,noticeId:string)=>`${noticeReadPrefix(userId)}${noticeId}`;

/** Only published notices in the student's saved course can be acknowledged. */
export async function markNoticesRead(userId:string,ids:string[]){
 const {student,notices}=await getStudentNotices();
 if(!student.authenticated||!student.courseSlug)return;
 const allowed=new Set(notices.map(notice=>notice.id));
 const accepted=[...new Set(ids)].filter(id=>allowed.has(id));
 if(accepted.length)await db.platformObject.createMany({data:accepted.map(id=>({key:readKey(userId,id),body:Buffer.from('{}')})),skipDuplicates:true});
}

export async function unreadNoticeState(userId:string){
 const {student,notices}=await getStudentNotices();
 const relevant=noticesForSemester(notices,student.semester,student.courseSlug||undefined);
 if(!student.authenticated||!student.courseSlug||!notices.length)return {unreadIds:[],pendingIds:[]};
 const receipts=await db.platformObject.findMany({where:{key:{in:notices.map(notice=>readKey(userId,notice.id))}},select:{key:true}});
 const read=new Set(receipts.map(receipt=>receipt.key));
 const pendingIds=notices.filter(notice=>!read.has(readKey(userId,notice.id))).map(notice=>notice.id);
 const relevantIds=new Set(relevant.map(notice=>notice.id));
 return {unreadIds:pendingIds.filter(id=>relevantIds.has(id)),pendingIds};
}
