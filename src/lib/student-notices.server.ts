import 'server-only';
import {cache} from 'react';
import {getStudentDefaults} from './security/student-defaults';
import {getPublishedNotices} from './notices.server';

/** Scope notice payloads before they reach any client component or ticker. */
export const getStudentNotices=cache(async()=>{
  const student=await getStudentDefaults();
  if(!student.authenticated||!student.courseSlug)return {student,notices:[]};
  const notices=await getPublishedNotices().catch(()=>[]);
  return {student,notices:notices.filter(notice=>!notice.targetCourseSlug||notice.targetCourseSlug===student.courseSlug)};
});
