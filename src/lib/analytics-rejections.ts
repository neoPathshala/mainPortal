const invalidInput=new Set(['Invalid visit.','Invalid path.','Invalid engagement time.','Invalid PWA event.','Invalid PWA event time.']);
/** Prisma exceptions also say "Invalid ... invocation"; they are server failures. */
export function analyticsRejectionStatus(error:unknown):400|403|429|null{
 if(!error||typeof error!=='object')return null;
 const failure=error as {code?:unknown;message?:unknown;name?:unknown};
 if(typeof failure.code==='string'&&/^P\d{4}$/.test(failure.code))return null;
 if(failure.message==='Request not allowed.')return 403;
 if(failure.message==='Too many requests. Please try again later.')return 429;
 if(failure.name==='SyntaxError'||typeof failure.message==='string'&&invalidInput.has(failure.message))return 400;
 return null;
}
