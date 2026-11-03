import {it,expect} from 'vitest';
import contract from './fixtures/retailer-api-v1.openapi.json';
import manifest from './fixtures/contract-source.json';
import news from './fixtures/news-response.json';
import {decodeContent,decodePublication,instant} from './contracts';
it('pins the canonical upstream contract content and reviewed source',async()=>{
 expect(manifest.source_sha).toBe('d450aea2186b5556fd6fe1dda10e19fa31ca20c2');const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(contract)));expect(Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')).toBe(manifest.canonical_sha256);
});
it('aligns used routes and closed request/response properties without a custom schema engine',()=>{
 const paths=contract.paths as Record<string,Record<string,unknown>>;expect(paths['/auth/session'].get).toBeTruthy();expect(paths['/auth/logout'].post).toBeTruthy();expect(paths['/api/retailer/v1/me/stores'].get).toBeTruthy();
 for(const plural of ['news','listings','events']){expect(paths['/api/retailer/v1/stores/{store_id}/'+plural].post).toBeTruthy();expect(paths['/api/retailer/v1/stores/{store_id}/'+plural+'/{'+(plural==='events'?'event_id':'entity_id')+'}']?.put).toBeTruthy();}
 const schemas=contract.components.schemas;expect(schemas.ProfileBody.additionalProperties).toBe(false);expect(schemas.ProfileBody.required).toEqual(['name','description','source_url','state']);expect(schemas.ResultBody.properties).not.toHaveProperty('verified');expect(schemas.ResultDTO.properties).toHaveProperty('event_id');expect(schemas.EventDTO.properties).toHaveProperty('organiser_id');expect(decodeContent(news,'news').fields).toHaveProperty('body');
});
it('rejects structurally invalid publication enums and impossible timestamps',()=>{
 expect(()=>decodePublication({schema_version:1,id:'e',revision:1,domains:[{domain:['events'],state:['queued']}]})).toThrow();expect(()=>instant('2026-02-30T12:00:00Z')).toThrow();expect(()=>instant('2026-11-02T25:00:00Z')).toThrow();
});
