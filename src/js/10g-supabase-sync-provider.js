// Phase 8.3 Supabase transport for record-level multi-device sync.
const SWOLE_CAT_SYNC_RECORD_SELECT='owner_id,record_type,record_id,payload_json,schema_version,record_version,server_change_seq,source_device_id,client_updated_at,server_updated_at,deleted_at';

async function swoleCatSyncGetRemoteRecord(client,{ownerId,type,id}){
  const {data,error}=await client
    .from('sync_records')
    .select(SWOLE_CAT_SYNC_RECORD_SELECT)
    .eq('owner_id',ownerId)
    .eq('record_type',type)
    .eq('record_id',id)
    .maybeSingle();
  if(error)throw error;
  return data||null;
}

const swoleCatSupabaseSyncProvider={
  async registerDevice({id,ownerId,deviceName,platform,appVersion}){
    const client=await getSwoleCatSupabaseClient();
    const row={
      id,
      owner_id:ownerId,
      device_name:deviceName,
      platform,
      app_version:appVersion,
      last_seen_at:new Date().toISOString()
    };
    const {data,error}=await client
      .from('devices')
      .upsert(row,{onConflict:'id'})
      .select('id,owner_id,device_name,platform,app_version,created_at,last_seen_at')
      .single();
    if(error)throw error;
    return data;
  },

  async pullChanges({ownerId,afterSeq,limit=500}){
    const client=await getSwoleCatSupabaseClient();
    const {data,error}=await client
      .from('sync_records')
      .select(SWOLE_CAT_SYNC_RECORD_SELECT)
      .eq('owner_id',ownerId)
      .gt('server_change_seq',Math.max(0,Number(afterSeq)||0))
      .order('server_change_seq',{ascending:true})
      .limit(Math.max(1,Math.min(500,Number(limit)||500)));
    if(error)throw error;
    return data||[];
  },

  async getRecord({ownerId,type,id}){
    const client=await getSwoleCatSupabaseClient();
    return swoleCatSyncGetRemoteRecord(client,{ownerId,type,id});
  },

  async insertRecord({ownerId,deviceId,type,id,payload,deletedAt,clientUpdatedAt}){
    const client=await getSwoleCatSupabaseClient();
    const row={
      owner_id:ownerId,
      record_type:type,
      record_id:id,
      payload_json:payload,
      schema_version:DATA_SCHEMA_VERSION,
      source_device_id:deviceId,
      client_updated_at:clientUpdatedAt,
      deleted_at:deletedAt||null
    };
    const {data,error}=await client
      .from('sync_records')
      .insert(row)
      .select(SWOLE_CAT_SYNC_RECORD_SELECT)
      .single();
    if(error){
      if(String(error.code||'')==='23505'){
        return {
          conflict:true,
          record:await swoleCatSyncGetRemoteRecord(client,{ownerId,type,id})
        };
      }
      throw error;
    }
    return {conflict:false,record:data};
  },

  async updateRecord({ownerId,deviceId,type,id,payload,deletedAt,clientUpdatedAt,expectedVersion}){
    const client=await getSwoleCatSupabaseClient();
    const patch={
      payload_json:payload,
      schema_version:DATA_SCHEMA_VERSION,
      source_device_id:deviceId,
      client_updated_at:clientUpdatedAt,
      deleted_at:deletedAt||null
    };
    const {data,error}=await client
      .from('sync_records')
      .update(patch)
      .eq('owner_id',ownerId)
      .eq('record_type',type)
      .eq('record_id',id)
      .eq('record_version',Number(expectedVersion)||0)
      .select(SWOLE_CAT_SYNC_RECORD_SELECT);
    if(error)throw error;
    if(Array.isArray(data)&&data.length===1)return {conflict:false,record:data[0]};
    return {
      conflict:true,
      record:await swoleCatSyncGetRemoteRecord(client,{ownerId,type,id})
    };
  }
};

SwoleCatRuntime.getService('sync')?.registerProvider?.(swoleCatSupabaseSyncProvider);
