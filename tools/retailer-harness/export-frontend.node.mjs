import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,mkdir,readFile,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {exportFrontend} from './export-frontend.mjs';

async function fixture({fail=false,link=false,leakContextual=false,cache=false,fixtureMarker=''}={}){
 const root=await mkdtemp(join(tmpdir(),'gp-export-'));const checkout=join(root,'checkout');await mkdir(checkout);
 const git=(...args)=>execFileSync('git',['-C',checkout,...args],{encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim();
 await writeFile(join(checkout,'package.json'),JSON.stringify({scripts:{build:'node build.mjs'}}));await writeFile(join(checkout,'package-lock.json'),'{}\n');
 await writeFile(join(checkout,'build.mjs'),`import{mkdirSync,writeFileSync,symlinkSync}from'node:fs';import{join}from'node:path';const out=process.argv[process.argv.indexOf('--outDir')+1];if(${fail})process.exit(2);if(${cache})writeFileSync('tsconfig.app.tsbuildinfo','GENERATED CACHE');mkdirSync(join(out,'assets'),{recursive:true});writeFileSync(join(out,'index.html'),'<div id="root"></div>');writeFileSync(join(out,'assets','Z.js'),'ASSET');writeFileSync(join(out,'assets','app.js'),(process.env.VITE_RETAILER_EDITOR_PREVIEW==='true'?'PRIVATE RETAILER EDITOR PREVIEW Contextual store editor':(${leakContextual}?'PUBLIC Contextual store editor':'PUBLIC'))+${JSON.stringify(fixtureMarker)});${link?"symlinkSync(out,join(out,'assets','bad'),process.platform==='win32'?'junction':'dir')":''}`);
 if(cache)await writeFile(join(checkout,'.gitignore'),'*.tsbuildinfo\n');
 git('init','-b','fixture');git('remote','add','origin','https://github.com/galla-bit/gallant-peak-web.git');git('add','.');git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','fixture');
 return{root,checkout,git,head:git('rev-parse','HEAD'),out:join(root,'output'),close:()=>rm(root,{recursive:true,force:true})};
}
const rejected=(p,code)=>assert.rejects(p,e=>e.code===code);

test('rejects dirty source and wrong head before building',async()=>{const f=await fixture();try{
 await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:'0'.repeat(40),outputPath:f.out,preview:true}),'source_mismatch');
 await writeFile(join(f.checkout,'untracked.txt'),'dirty');await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:true}),'dirty_source');
}finally{await f.close()}});
test('requires explicit role and preserves existing output',async()=>{const f=await fixture();try{
 await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out}),'invalid_input');
 await mkdir(f.out);await writeFile(join(f.out,'keep'),'keep');await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:true}),'output_exists');assert.equal(await readFile(join(f.out,'keep'),'utf8'),'keep');
}finally{await f.close()}});
test('exports both explicit roles with sorted exact hashes from clean source',async()=>{const f=await fixture();try{
 for(const preview of [true,false]){const out=join(f.root,String(preview));const result=await exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:out,preview});
 const raw=await readFile(join(out,'frontend-provenance.json'));assert.equal(result.manifestSha256,createHash('sha256').update(raw).digest('hex'));const m=JSON.parse(raw);assert.equal(m.preview_enabled,preview);assert.equal(m.source_commit,f.head);assert.deepEqual(m.files.map(v=>v.path),['dist/assets/Z.js','dist/assets/app.js','dist/index.html']);for(const file of m.files)assert.equal(file.sha256,createHash('sha256').update(await readFile(join(out,file.path))).digest('hex'));assert.equal(f.git('status','--porcelain'),'');}
}finally{await f.close()}});
test('failed build leaves no exported output',async()=>{const f=await fixture({fail:true});try{await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:true}),'build_failed');await assert.rejects(readFile(join(f.out,'frontend-provenance.json')));}finally{await f.close()}});
test('symlinked generated assets cannot be exported',async()=>{const f=await fixture({link:true});try{await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:true}),'unsafe_asset');}finally{await f.close()}});
test('ignored environment files cannot alter a supposedly clean artifact build',async()=>{const f=await fixture();try{
 await writeFile(join(f.checkout,'.gitignore'),'.env*\n');f.git('add','.gitignore');f.git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','ignore');const head=f.git('rev-parse','HEAD');await writeFile(join(f.checkout,'.env.local'),'VITE_SOMETHING=unreviewed');assert.equal(f.git('status','--porcelain'),'');
 await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:head,outputPath:f.out,preview:true}),'build_environment');
}finally{await f.close()}});
test('unreviewed inherited Vite configuration is refused',async()=>{const f=await fixture();const before=process.env.VITE_UNREVIEWED;try{process.env.VITE_UNREVIEWED='test';await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:true}),'build_environment');}finally{if(before===undefined)delete process.env.VITE_UNREVIEWED;else process.env.VITE_UNREVIEWED=before;await f.close()}});
test('ignored public files and external symlinks cannot gain provenance',async()=>{const f=await fixture();try{
 await writeFile(join(f.checkout,'.gitignore'),'public/\n');f.git('add','.gitignore');f.git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','ignore public');const head=f.git('rev-parse','HEAD');await mkdir(join(f.checkout,'public'));await writeFile(join(f.checkout,'public','untracked.log'),'unreviewed');assert.equal(f.git('status','--porcelain'),'');
 await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:head,outputPath:f.out,preview:true}),'build_environment');
 await rm(join(f.checkout,'public','untracked.log'));await writeFile(join(f.root,'canary'),'external');await symlink(join(f.root,'canary'),join(f.checkout,'public','canary'));
 await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:head,outputPath:f.out,preview:true}),'build_environment');
}finally{await f.close()}});
test('output parent alias into checkout is refused before staging',async()=>{const f=await fixture();try{
 await writeFile(join(f.checkout,'.gitignore'),'node_modules/\n');f.git('add','.gitignore');f.git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-qm','ignore dependencies');const head=f.git('rev-parse','HEAD');await mkdir(join(f.checkout,'node_modules'));await symlink(join(f.checkout,'node_modules'),join(f.root,'alias'));
 await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:head,outputPath:join(f.root,'alias','output'),preview:true}),'unsafe_output');
 assert.deepEqual(await (await import('node:fs/promises')).readdir(join(f.checkout,'node_modules')),[]);
}finally{await f.close()}});
test('Git config environment cannot redirect source discovery',async()=>{const f=await fixture();const previous=process.env.GIT_CONFIG_COUNT;try{
 process.env.GIT_CONFIG_COUNT='invalid';await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:true}),'git_override');
}finally{if(previous===undefined)delete process.env.GIT_CONFIG_COUNT;else process.env.GIT_CONFIG_COUNT=previous;await f.close()}});

test('rejects default bundle leaking the PR C contextual editor',async()=>{const f=await fixture({leakContextual:true});try{await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:false}),'build_role_mismatch');}finally{await f.close()}});

test('removes only newly generated TypeScript build info before clean-source recheck',async()=>{const f=await fixture({cache:true});try{
 await exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:true});await assert.rejects(readFile(join(f.checkout,'tsconfig.app.tsbuildinfo')));assert.equal(f.git('status','--porcelain'),'');
}finally{await f.close()}});
test('pre-existing ignored TypeScript build info is refused and preserved',async()=>{const f=await fixture({cache:true});try{
 const p=join(f.checkout,'tsconfig.app.tsbuildinfo');await writeFile(p,'PRE-EXISTING');await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:f.out,preview:true}),'build_environment');assert.equal(await readFile(p,'utf8'),'PRE-EXISTING');
}finally{await f.close()}});

test('rejects known synthetic fixture markers in either artifact role',async()=>{
 for(const marker of ['https://id.gp-issuer.test','synthetic-private-agreement','1931ec083379f5e2fdd294a2be7f6667b4ab65c7d5ebb60c0fcffaf70da2c4ef']){
  const f=await fixture({fixtureMarker:marker});
  try{for(const preview of [false,true])await rejected(exportFrontend({checkoutPath:f.checkout,expectedCommit:f.head,outputPath:join(f.root,'output-'+preview),preview}),'build_role_mismatch');}
  finally{await f.close()}
 }
});
test('UTF-8 byte ordering is deterministic for macrons and supplementary Unicode',async()=>{
 const names=['dist/assets/\\uE000.js','dist/assets/\\u{10000}.js','dist/assets/ā.js','dist/assets/A.js'];
 const ordered=[...names].sort((a,b)=>Buffer.compare(Buffer.from(a,'utf8'),Buffer.from(b,'utf8')));
 assert.deepEqual(ordered,['dist/assets/A.js','dist/assets/ā.js','dist/assets/\\uE000.js','dist/assets/\\u{10000}.js']);
});
