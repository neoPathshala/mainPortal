/** Browser favicon probes must not enter a database-backed course route. */
export function GET(){return new Response(null,{status:308,headers:{Location:'/logo.webp','Cache-Control':'public, max-age=86400'}});}
