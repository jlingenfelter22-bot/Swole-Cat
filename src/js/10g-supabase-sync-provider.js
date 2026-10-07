// Phase 8.3 Supabase transport for versioned record-level sync.
const swoleCatSupabaseSyncProvider={
  async registerDevice({ownerId,device}){
    const client=await getSwoleCatSupabaseClient();
    const columns='id,owner_id,device_name,platform,app_version,last_seen_at';
    const samePlatform=(a,b)=>{
      const left=String(a||''),right=String(b||'');
      if(left===right)return true;
      return ['web','pwa'].includes(left)&&['web','pwa'].includes(right);
    };
    const updateExisting=async existing=>{
      if(!samePlatform(existing?.platform,device.platform)){
        return {collision:true,existing};
      }
      const patch={
        device_name:device.device_name,
        platform:device.platform,
        app_version:device.app_version,
        last_seen_at:device.last_seen_at
      };
      const {error}=await client
        .from('devices')
        .update(patch)
        .eq('id',device.id)
        .eq('owner_id',ownerId);
      if(error)throw error;
      return {...existing,...patch};
    };

    const {data:existing,error:selectError}=await client
      .from('devices')
      .select(columns)
      .eq('id',device.id)
      .maybeSingle();
    if(selectError)throw selectError;
    if(existing)return updateExisting(existing);

    const inserted={
      id:device.id,
      owner_id:ownerId,
      device_name:device.device_name,
      platform:device.platform,
      app_version:device.app_version,
      last_seen_at:device.last_seen_at
    };
    const {error}=await client
      .from('devices')
      .insert(inserted);

    if(!error)return inserted;
    if(error?.code!=='23505')throw error;

    // Registration is intentionally idempotent. A second Sync Now can race the
    // first insert, and stale/copied local metadata can also collide with an
    // existing installation ID. Re-read after a unique-key collision.
    const {data:afterCollision,error:collisionReadError}=await client
      .from('devices')
      .select(columns)
      .eq('id',device.id)
      .maybeSingle();
    if(collisionReadError)throw collisionReadError;
    if(!afterCollision)return {collision:true};
    return updateExisting(afterCollision);
  },

  async pullChanges({ownerId,afterSeq,limit=500}){
    const client=await getSwoleCatSupabaseClient();
    const {data,error}=await client
      .from('sync_records')
      .select('owner_id,record_type,record_id,payload_json,record_version,server_change_seq,source_device_id,client_updated_at,server_updated_at,deleted_at,schema_version,last_mutation_id')
      .eq('owner_id',ownerId)
      .gt('server_change_seq',Number(afterSeq)||0)
      .order('server_change_seq',{ascending:true})
      .limit(Math.max(1,Math.min(1000,Number(limit)||500)));
    if(error)throw error;
    return data||[];
  },

  async getRecord({ownerId,type,id}){
    const client=await getSwoleCatSupabaseClient();
    const {data,error}=await client
      .from('sync_records')
      .select('owner_id,record_type,record_id,payload_json,record_version,server_change_seq,source_device_id,client_updated_at,server_updated_at,deleted_at,schema_version,last_mutation_id')
      .eq('owner_id',ownerId)
      .eq('record_type',type)
      .eq('record_id',id)
      .maybeSingle();
    if(error)throw error;
    return data||null;
  },

  async insertRecord({ownerId,deviceId,mutation,schemaVersion}){
    const client=await getSwoleCatSupabaseClient();
    const payload={
      owner_id:ownerId,
      record_type:mutation.type,
      record_id:mutation.id,
      payload_json:mutation.deleted?null:mutation.payload,
      source_device_id:deviceId,
      client_updated_at:new Date().toISOString(),
      deleted_at:mutation.deleted?new Date().toISOString():null,
      schema_version:schemaVersion,
      last_mutation_id:mutation.mutationId
    };
    const {data,error}=await client
      .from('sync_records')
      .insert(payload)
      .select('owner_id,record_type,record_id,payload_json,record_version,server_change_seq,source_device_id,client_updated_at,server_updated_at,deleted_at,schema_version,last_mutation_id')
      .maybeSingle();

    if(!error&&data)return {row:data};
    if(error?.code!=='23505')throw error;

    const current=await this.getRecord({ownerId,type:mutation.type,id:mutation.id});
    if(current&&String(current.last_mutation_id||'')===String(mutation.mutationId))return {row:current,idempotent:true};
    return {conflict:true,current};
  },

  async updateRecord({ownerId,deviceId,mutation,schemaVersion}){
    const client=await getSwoleCatSupabaseClient();
    const patch={
      payload_json:mutation.deleted?null:mutation.payload,
      source_device_id:deviceId,
      client_updated_at:new Date().toISOString(),
      deleted_at:mutation.deleted?new Date().toISOString():null,
      schema_version:schemaVersion,
      last_mutation_id:mutation.mutationId
    };
    const {data,error}=await client
      .from('sync_records')
      .update(patch)
      .eq('owner_id',ownerId)
      .eq('record_type',mutation.type)
      .eq('record_id',mutation.id)
      .eq('record_version',mutation.expectedVersion)
      .select('owner_id,record_type,record_id,payload_json,record_version,server_change_seq,source_device_id,client_updated_at,server_updated_at,deleted_at,schema_version,last_mutation_id')
      .maybeSingle();
    if(error)throw error;
    if(data)return {row:data};

    const current=await this.getRecord({ownerId,type:mutation.type,id:mutation.id});
    if(current&&String(current.last_mutation_id||'')===String(mutation.mutationId))return {row:current,idempotent:true};
    return {conflict:true,current};
  }
};

SwoleCatRuntime.getService('cloudSync')?.registerProvider?.(swoleCatSupabaseSyncProvider);
