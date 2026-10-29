/** These endpoints accept plain JSON, multipart and form bodies, without inflation. */
export function hasEncodedRequestBody(headers:Pick<Headers,'get'>){
 const encoding=headers.get('content-encoding')?.trim();
 return Boolean(encoding&&!/^identity$/i.test(encoding));
}
