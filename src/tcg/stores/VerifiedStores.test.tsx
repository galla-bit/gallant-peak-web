// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import {VerifiedStores} from './VerifiedStores';
import type {RetailerSpace} from './model';
import {event,NOW,readyFeed,snapshot,winner} from '../events/test-fixtures';
afterEach(cleanup);
const store:RetailerSpace={id:'another',name:'Another retailer',description:'Independent community',organiserId:'store-a',relationship:{kind:'authorised',reference:'approved-relationship'},products:[],updates:[]};
it('opens a generic authorised retailer and shares only its canonical events/results, with no stock feed',()=>{
 render(<VerifiedStores stores={[store,{...store,id:'farmers',name:'Farmers',relationship:{kind:'monitored'}}]} now={NOW} eventsFeed={readyFeed(snapshot({events:[event(),event({id:'other',organiser_id:'store-b',name:'Other competition'})],winners:[winner()]}))}/>);
 expect(screen.queryByRole('button',{name:'Open Farmers'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Open Another retailer'}));
 expect(screen.queryByText(/Demonstration data only/)).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Products'}));
 expect(screen.getByText(/No retailer products published/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'News & Updates'}));
 expect(screen.getByText(/No retailer updates/)).toBeTruthy();
 fireEvent.click(screen.getByRole('button',{name:'Events & Competitions'}));
 expect(screen.getByRole('heading',{name:'Published competition'})).toBeTruthy();
 expect(screen.queryByText('Other competition')).toBeNull();
 expect(screen.getByText('Published Handle')).toBeTruthy();
 expect(screen.getByRole('link',{name:/View \/ Register/}).getAttribute('href')).toBe('https://example.com/events/a');
 fireEvent.change(screen.getByLabelText('Event organiser'),{target:{value:'all'}});
 expect(screen.queryByText('Other competition')).toBeNull();
});
it('withholds an open retailer when its authorised relationship is removed',()=>{
 const {rerender}=render(<VerifiedStores stores={[store]}/>);
 fireEvent.click(screen.getByRole('button',{name:'Open Another retailer'}));
 rerender(<VerifiedStores stores={[{...store,relationship:{kind:'monitored'}}]}/>);
 expect(screen.queryByRole('heading',{name:'Another retailer'})).toBeNull();
 expect(within(screen.getByRole('region',{name:'Retailer demonstration'})).getByRole('button',{name:/Preview MythicDeck/})).toBeTruthy();
});
it('moves focus to an opened space and restores the directory trigger on return',()=>{
 render(<VerifiedStores stores={[store]}/>);
 const open=screen.getByRole('button',{name:'Open Another retailer'});
 open.focus(); fireEvent.click(open);
 expect(document.activeElement).toBe(screen.getByRole('heading',{name:'Another retailer'}));
 const back=screen.getByRole('button',{name:'Back to Verified Stores'});
 back.focus(); fireEvent.click(back);
 expect(document.activeElement).toBe(screen.getByRole('button',{name:'Open Another retailer'}));
 const preview=screen.getByRole('button',{name:'Preview MythicDeck demonstration'});
 preview.focus(); fireEvent.click(preview);
 expect(document.activeElement).toBe(screen.getByRole('heading',{name:'MythicDeck'}));
 fireEvent.click(screen.getByRole('button',{name:'Back to Verified Stores'}));
 expect(document.activeElement).toBe(screen.getByRole('button',{name:'Preview MythicDeck demonstration'}));
});
