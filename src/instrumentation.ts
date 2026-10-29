import type {Instrumentation} from 'next';

export async function register(){
  if(process.env.NEXT_RUNTIME==='nodejs'){
    const {assertSecureRuntime}=await import('./lib/runtime-security');
    assertSecureRuntime();
    const {registerResponseMonitor}=await import('./lib/platform-monitor.server');
    registerResponseMonitor();
  }
}

export const onRequestError:Instrumentation.onRequestError=async(error,request,context)=>{
  // Keep Node-only imports inside a positive runtime branch. Webpack must be
  // able to remove the entire branch when compiling instrumentation for Edge.
  if(process.env.NEXT_RUNTIME==='nodejs'){
    if(request.path.startsWith('/api/error-reports'))return;
    try{
      const {recordError}=await import('./lib/error-reports.server');
      const err=error as Error&{digest?:string;cause?:unknown};
      await recordError({reference:err.digest,path:request.path,method:request.method,message:err.message,stack:err.stack+(err.cause?'\nCause: '+String(err.cause):''),route:context.routePath+' ('+context.routeType+')'});
    }catch{console.error('[error-report capture failed]');}
  }
};
