import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('dist'),prefix='/hanatalk/';
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png'};
http.createServer(async(req,res)=>{
 try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/hanatalk'){res.writeHead(302,{Location:prefix});return res.end();}
  if(!pathname.startsWith(prefix))throw Error('not found');
  const relative=pathname.slice(prefix.length)||'index.html';
  if(relative.split('/').some(p=>p.startsWith('.')))throw Error('not found');
  const file=path.resolve(root,relative);
  if(!file.startsWith(root+path.sep))throw Error('not found');
  const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(body);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(4174,'127.0.0.1',()=>console.log('HanaTalk: http://127.0.0.1:4174/hanatalk/'));
