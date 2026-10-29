/** Local file links are retired. Hosted R2 links are read from the resource catalog. */
export async function POST() {
 return Response.json({error:'Local PDF links are no longer supported. Use the hosted resource URL.'}, {
  status:410,headers:{'Cache-Control':'private, no-store'},
 });
}
