import { cp, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const out=path.join(root,'www');
const files=['index.html','manifest.webmanifest','icon-192.svg','icon-512.svg','sw.js'];

await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});

for(const file of files){
  const src=path.join(root,file);
  if(!existsSync(src))throw new Error(`Missing required web asset: ${file}`);
  await cp(src,path.join(out,file));
}

console.log(`Prepared Capacitor web bundle in ${out}`);
