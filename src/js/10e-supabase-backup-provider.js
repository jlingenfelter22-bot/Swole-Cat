// Phase 8.2 Supabase provider for private bounded cloud backups.
const SWOLE_CAT_SUPABASE_BACKUP_BUCKET='swole-cat-backups';

const swoleCatSupabaseBackupProvider={
  async listBackups({ownerId}){
    const client=await getSwoleCatSupabaseClient();
    const {data,error}=await client
      .from('backup_metadata')
      .select('id,owner_id,object_path,backup_format,format_version,schema_version,app_version,exported_at,sha256,size_bytes,source_device,created_at')
      .eq('owner_id',ownerId)
      .order('created_at',{ascending:false})
      .limit(20);
    if(error)throw error;
    return data||[];
  },
  async uploadBackup({ownerId,objectPath,json,metadata}){
    const client=await getSwoleCatSupabaseClient();
    if(String(metadata?.owner_id||'')!==String(ownerId||''))throw new Error('Backup owner mismatch.');
    const blob=new Blob([json],{type:'application/json'});
    const {error:uploadError}=await client.storage
      .from(SWOLE_CAT_SUPABASE_BACKUP_BUCKET)
      .upload(objectPath,blob,{contentType:'application/json',cacheControl:'3600',upsert:false});
    if(uploadError)throw uploadError;

    const {data,error:metadataError}=await client
      .from('backup_metadata')
      .insert(metadata)
      .select('id,owner_id,object_path,backup_format,format_version,schema_version,app_version,exported_at,sha256,size_bytes,source_device,created_at')
      .single();
    if(metadataError){
      try{await client.storage.from(SWOLE_CAT_SUPABASE_BACKUP_BUCKET).remove([objectPath])}catch(cleanupError){}
      throw metadataError;
    }
    return data;
  },
  async downloadBackup({ownerId,objectPath}){
    if(!String(objectPath||'').startsWith(String(ownerId||'')+'/'))throw new Error('Backup path does not belong to this account.');
    const client=await getSwoleCatSupabaseClient();
    const {data,error}=await client.storage
      .from(SWOLE_CAT_SUPABASE_BACKUP_BUCKET)
      .download(objectPath);
    if(error)throw error;
    if(!data?.text)throw new Error('Cloud backup file could not be read.');
    return data.text();
  },
  async deleteBackup({ownerId,backupId,objectPath}){
    if(!String(objectPath||'').startsWith(String(ownerId||'')+'/'))throw new Error('Backup path does not belong to this account.');
    const client=await getSwoleCatSupabaseClient();
    const {error:storageError}=await client.storage
      .from(SWOLE_CAT_SUPABASE_BACKUP_BUCKET)
      .remove([objectPath]);
    if(storageError)throw storageError;
    const {error:metadataError}=await client
      .from('backup_metadata')
      .delete()
      .eq('id',backupId)
      .eq('owner_id',ownerId);
    if(metadataError)throw metadataError;
    return {ok:true};
  }
};

SwoleCatRuntime.getService('cloudBackup')?.registerProvider?.(swoleCatSupabaseBackupProvider);
