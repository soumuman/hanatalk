import {build as validateModules} from 'esbuild';
import {contentSecurityPolicy} from './scripts/cloud-build.js';
import {mkdir,cp,rm,readFile,writeFile} from 'node:fs/promises';
await validateModules({entryPoints:['js/app.js'],bundle:true,write:false,format:'esm',platform:'browser',logLevel:'warning'});
await mkdir('dist',{recursive:true});
for(const file of ['index.html','css','js','icons','manifest.json','service-worker.js'])await cp(file,`dist/${file}`,{recursive:true});
const html=await readFile('dist/index.html','utf8');
await writeFile('dist/index.html',html.replace('<meta charset="UTF-8">',`<meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy}"><meta name="referrer" content="no-referrer">`));
console.log('Static PWA built in dist/');
