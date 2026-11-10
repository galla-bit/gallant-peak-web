// @vitest-environment jsdom
import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {VerifiedStoreDirectory,validStoreWebsite} from './VerifiedStoreDirectory';
import type {RetailerSpace} from './model';
afterEach(cleanup);
const base:RetailerSpace={id:'synthetic',name:'Synthetic TCG Store',description:'Synthetic only',organiserId:'synthetic',relationship:{kind:'authorised',reference:'synthetic-approval'},websiteUrl:'https://example.com',products:[],updates:[]};
it('shows only authorised retailers with valid external store links',()=>{
 render(<VerifiedStoreDirectory stores={[base,{...base,id:'monitored',name:'Monitored',relationship:{kind:'monitored'}},{...base,id:'unsafe',name:'Unsafe',websiteUrl:'javascript:alert(1)'}]}/>);
 const link=screen.getByRole('link',{name:'Visit Synthetic TCG Store website'});
 expect(link.getAttribute('href')).toBe('https://example.com');
 expect(link.getAttribute('rel')).toContain('noopener');
 expect(screen.queryByText('Monitored')).toBeNull();
 expect(screen.queryByText('Unsafe')).toBeNull();
 expect(screen.queryByRole('button',{name:/Open Synthetic/})).toBeNull();
});
it('never publishes a demonstration as an authorised store',()=>{
 render(<VerifiedStoreDirectory stores={[{...base,relationship:{kind:'demonstration'}}]}/>);
 expect(screen.getByRole('status').textContent).toMatch(/No verified store cards/);
});
it('rejects unsafe destinations',()=>{
 for(const url of ['http://example.com','javascript:alert(1)','https://localhost','https://user:pass@example.com','https://example.com/#fragment'])
   expect(validStoreWebsite(url)).toBe(false);
 expect(validStoreWebsite('https://example.com/store')).toBe(true);
});
