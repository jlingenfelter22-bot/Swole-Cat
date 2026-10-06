// Phase 8.4 Supabase provider for short-lived routine/program share tickets.
async function invokeSwoleCatPlanShare(body){
  const client=await getSwoleCatSupabaseClient();
  const {data,error}=await client.functions.invoke('plan-share',{body});
  if(error){
    let message=error?.message||'Cloud sharing request failed.';
    try{
      const payload=await error?.context?.json?.();
      if(payload?.error)message=String(payload.error);
    }catch(parseError){}
    throw new Error(message);
  }
  if(!data?.ok)throw new Error(data?.error||'Cloud sharing request failed.');
  return data;
}

const swoleCatSupabasePlanShareProvider={
  async createShare({envelope}){
    const data=await invokeSwoleCatPlanShare({action:'create',envelope});
    return {
      code:String(data.code||''),
      expiresAt:data.expiresAt||null,
      kind:data.kind||envelope?.kind||null,
      name:data.name||null
    };
  },
  async resolveShare({code}){
    const data=await invokeSwoleCatPlanShare({action:'resolve',code});
    return {
      envelope:data.envelope,
      expiresAt:data.expiresAt||null,
      kind:data.kind||data.envelope?.kind||null,
      name:data.name||null
    };
  }
};

SwoleCatRuntime.getService('planSharing')?.registerProvider?.(swoleCatSupabasePlanShareProvider);
