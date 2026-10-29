/** Bundled study documents are retired; resource URLs now come from PostgreSQL. */
export async function GET() {
 return new Response('This local PDF link is no longer available. Open the resource from its updated hosted link.', {
  status:410,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'},
 });
}
