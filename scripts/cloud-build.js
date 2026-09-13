import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {build} from 'esbuild';
const defaults=JSON.parse(await readFile(new URL('../config/public.json',import.meta.url),'utf8'));
let env={SUPABASE_URL:defaults.url,SUPABASE_PUBLISHABLE_KEY:defaults.key,...process.env};
for(const file of ['.env','.env.local']){try{for(const line of (await readFile(file,'utf8')).split(/\r?\n/)){const m=line.match(/^([A-Z_]+)=(.*)$/);if(m)env[m[1]]=m[2].trim().replace(/^['"]|['"]$/g,'');}}catch(e){if(e.code!=='ENOENT')throw e;}}
const url=env.SUPABASE_URL||'',key=env.SUPABASE_PUBLISHABLE_KEY||'';
if(url||key){if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url))throw Error('Use your HTTPS Supabase project URL');
let valid=key.startsWith('sb_publishable_');if(key.startsWith('eyJ')){try{valid=JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role==='anon';}catch{}}
if(!valid)throw Error('Only a publishable or anon key may be included');}
await mkdir('js/vendor',{recursive:true});
await writeFile('js/cloud/config.js',`export const config=${JSON.stringify({url,key})};\n`);
await build({stdin:{contents:"export {createClient} from '@supabase/supabase-js';",resolveDir:process.cwd()},bundle:true,format:'esm',platform:'browser',outfile:'js/vendor/supabase.js',minify:true,target:['safari15']});

export const contentSecurityPolicy=`default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self' ${url||''}; object-src 'none'; base-uri 'none'; form-action 'self';`;
