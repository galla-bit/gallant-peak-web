/** Test artifact export only. Does not install dependencies, fetch source or deploy. */
import {mkdtemp,lstat,realpath,mkdir,readdir,readFile,writeFile,rename,rm} from 'node:fs/promises';
import {resolve,relative,dirname,join,sep,isAbsolute,delimiter} from 'node:path';
import {readdirSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export class FrontendExportError extends Error{constructor(code){super(code);this.code=code;}}
const fail=code=>{throw new FrontendExportError(code)};
const sha=data=>createHash('sha256').update(data).digest('hex');
const inside=(parent,path)=>{const r=relative(parent,path);return r===''||!isAbsolute(r)&&r!=='..'&&!r.startsWith('..'+sep)};
async function exists(path){try{await lstat(path);return true}catch(e){if(e.code==='ENOENT')return false;throw e}}
function git(checkout,args,raw=false){try{const value=execFileSync('git',['--no-pager','-C',checkout,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']});return raw?value:value.trim()}catch{fail('git_unavailable')}}
function verify(checkout,expected){
 if(readdirSync(checkout).some(n=>n==='.env'||n.startsWith('.env.'))||Object.keys(process.env).some(k=>k.startsWith('VITE_')&&k!=='VITE_RETAILER_EDITOR_PREVIEW'))fail('build_environment');
 if(git(checkout,['rev-parse','HEAD'])!==expected)fail('source_mismatch');
 const origin=git(checkout,['remote','get-url','origin']);
 if(!['https://github.com/galla-bit/gallant-peak-web.git','https://github.com/galla-bit/gallant-peak-web','git@github.com:galla-bit/gallant-peak-web.git'].includes(origin))fail('repository_mismatch');
 if(git(checkout,['status','--porcelain=v1','--untracked-files=normal']))fail('dirty_source');
 const ignored=git(checkout,['ls-files','--others','--ignored','--exclude-standard','--directory','-z'],true).split('\0').filter(Boolean);
 if(ignored.some(path=>path!=='node_modules/'&&!path.startsWith('node_modules/')))fail('build_environment');
}
function buildCommand(){
 if(process.platform!=='win32')return ['npm',[]];
 for(const directory of (process.env.PATH??'').split(delimiter)){
  if(!existsSync(join(directory,'npm.cmd')))continue;
  for(const cli of [join(directory,'npm-cli.js'),join(directory,'node_modules','npm','bin','npm-cli.js')]){
   if(existsSync(cli))return [process.execPath,[cli]];
  }
 }
 fail('build_failed');
}
export async function exportFrontend({checkoutPath,expectedCommit,outputPath,preview}={}){
 if(typeof checkoutPath!=='string'||typeof outputPath!=='string'||! /^[a-f0-9]{40}$/.test(expectedCommit??'')||typeof preview!=='boolean')fail('invalid_input');
 if(Object.keys(process.env).some(k=>k.startsWith('GIT_')&&k!=='GIT_PAGER'))fail('git_override');
 const checkout=resolve(checkoutPath),output=resolve(outputPath);
 if((await lstat(checkout)).isSymbolicLink()||await realpath(checkout)!==checkout)fail('unsafe_checkout');
 const parent=dirname(output);
 const physicalParent=await realpath(parent);
 if(physicalParent!==parent||inside(checkout,output))fail('unsafe_output');
 verify(checkout,expectedCommit);
 if(await exists(output))fail('output_exists');
 const stage=await mkdtemp(join(dirname(output),'.gp-retailer-export-'));let reserved=false;
 try{
  const dist=join(stage,'dist');
  try{const [command,prefix]=buildCommand();execFileSync(command,[...prefix,'run','build','--','--outDir',dist],{cwd:checkout,env:{...process.env,VITE_RETAILER_EDITOR_PREVIEW:preview?'true':'false'},stdio:['ignore','pipe','pipe'],timeout:180000})}catch{fail('build_failed')}
  const files=[];let bundle='';
  async function walk(dir){
   for(const name of (await readdir(dir)).sort()){
    const path=join(dir,name),stat=await lstat(path);
    if(stat.isSymbolicLink()||!inside(dist,path))fail('unsafe_asset');
    if(stat.isDirectory())await walk(path);
    else if(stat.isFile()){
     if(path.endsWith('.map'))fail('unsafe_asset');
     const bytes=await readFile(path);files.push({path:'dist/'+relative(dist,path).split(sep).join('/'),sha256:sha(bytes)});
     if(/\.(js|html)$/.test(path))bundle+=bytes.toString('utf8');
    }else fail('unsafe_asset');
   }
  }
  await walk(dist);files.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);
  if(!files.some(f=>f.path==='dist/index.html')||!files.some(f=>f.path.endsWith('.js')))fail('invalid_build');
  if(bundle.includes('PRIVATE RETAILER EDITOR PREVIEW')!==preview||bundle.includes('Contextual store editor')!==preview||bundle.includes('1931ec083379f5e2fdd294a2be7f6667b4ab65c7d5ebb60c0fcffaf70da2c4ef'))fail('build_role_mismatch');
  verify(checkout,expectedCommit);
  const manifest={schema_version:1,repository:'galla-bit/gallant-peak-web',source_commit:expectedCommit,package_lock_sha256:sha(await readFile(join(checkout,'package-lock.json'))),preview_enabled:preview,files};
  const raw=JSON.stringify(manifest,null,2)+'\n';await writeFile(join(stage,'frontend-provenance.json'),raw,{flag:'wx'});
  try{await mkdir(output);reserved=true}catch(e){if(e.code==='EEXIST')fail('output_exists');throw e}
  await rename(dist,join(output,'dist'));await rename(join(stage,'frontend-provenance.json'),join(output,'frontend-provenance.json'));
  return{manifest,manifestSha256:sha(raw)};
 }catch(error){if(reserved)await rm(output,{recursive:true,force:true});if(error instanceof FrontendExportError)throw error;fail('export_failed')}
 finally{await rm(stage,{recursive:true,force:true})}
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const options={};let valid=true;const names={'--checkout':'checkoutPath','--expected-commit':'expectedCommit','--output':'outputPath','--preview':'preview'};
 for(let i=2;i<process.argv.length;i+=2){const key=names[process.argv[i]],value=process.argv[i+1];if(!key||!value||Object.hasOwn(options,key)){valid=false;break}options[key]=key==='preview'?(value==='true'?true:value==='false'?false:undefined):value;}
 try{if(!valid)fail('invalid_input');const result=await exportFrontend(options);console.log(JSON.stringify({source_commit:result.manifest.source_commit,preview_enabled:result.manifest.preview_enabled,manifest_sha256:result.manifestSha256}))}
 catch(error){console.error(error instanceof FrontendExportError?error.code:'export_failed');process.exitCode=1}
}
