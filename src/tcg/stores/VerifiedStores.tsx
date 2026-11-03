import {useEffect,useRef,useState,type ReactNode} from 'react';
import {EventsView} from '../events/EventsView';
import type {TcgEventsFeedResult} from '../events/feed';
import {inactiveEventsFeed} from '../events/feed';
import {authorisedStores,retailerEvents,type RetailerSpace} from './model';
import {DEMO_NOW,demonstrationEvents,mythicDeckPreview} from './demonstration';

export function DemonstrationNotice() {
  return <p className="notice" role="status"><strong>Demonstration data only.</strong> No production retailer authorisation, live Shopify connection, live inventory or Instant Checkout qualification. Event examples use a fixed reference date of 2 November 2026.</p>;
}
const sections=['Overview','Products','News & Updates','Events & Competitions'] as const;
export function RetailerProfile({store,feed,now,onBack,ownerControl}:{store:RetailerSpace;feed:TcgEventsFeedResult;now?:number;onBack:()=>void;ownerControl?:ReactNode}) {
  const [section,setSection]=useState<typeof sections[number]>('Overview');
  const heading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{heading.current?.focus();},[]);
  const demo=store.relationship.kind==='demonstration';
  return <div className="retailer-space">
    <button type="button" onClick={onBack}>Back to Verified Stores</button>
    <div className="section-head"><div><p className="eyebrow">{demo?'RETAILER SPACE PREVIEW':'VERIFIED STORE'}</p><h2 ref={heading} tabIndex={-1}>{store.name}</h2><p>{store.description}</p></div>{ownerControl}</div>
    {demo&&<DemonstrationNotice/>}
    <div role="group" aria-label={`${store.name} sections`} className="radar-views">{sections.map(name=><button type="button" key={name} aria-pressed={section===name} onClick={()=>setSection(name)}>{name}</button>)}</div>
    <section aria-label={`${store.name} ${section}`}>
      {section==='Overview'&&<><h3>Overview</h3><p>{demo?'A preview of a retailer community space. MythicDeck is not listed as an authorised Verified Store.':'This space is listed through an authorised retailer relationship.'}</p><p>Browse retailer products, community news and competitions independently of stock availability.</p></>}
      {section==='Products'&&<><h3>Retailer products</h3><p className="muted">Retailer-managed listings stay in this space. Gallant Peak controls broader publication to Products, Radar and New & Upcoming.</p>{store.products.length?<ul className="tcg-product-grid" aria-label="Retailer products">{store.products.map(product=><li key={product.id}><article className="tcg-event-card"><h4>{product.name}</h4><p>{product.description}</p></article></li>)}</ul>:<p role="status">No retailer products published in this space.</p>}</>}
      {section==='News & Updates'&&<><h3>News & Updates</h3>{store.updates.length?<ul className="tcg-event-list">{store.updates.map(update=><li key={update.id}><article className="tcg-event-card"><time dateTime={update.publishedAt}>{update.publishedAt}</time><h4>{update.title}</h4><p>{update.body}</p></article></li>)}</ul>:<p role="status">No retailer updates published.</p>}</>}
      {section==='Events & Competitions'&&<><h3>Events & Competitions</h3><EventsView feed={retailerEvents(feed,store.organiserId)} now={now} demonstration={demo}/></>}
    </section>
  </div>;
}
const noStores:readonly RetailerSpace[]=[];
export function VerifiedStores({stores=noStores,eventsFeed=inactiveEventsFeed('unconfigured'),now,onOpen,returnStoreId}:{stores?:readonly RetailerSpace[];eventsFeed?:TcgEventsFeedResult;now?:number;onOpen?:(id:string)=>void;returnStoreId?:string}) {
  const [selected,setSelected]=useState<string|null>(null);
  const returnTo=useRef<string|null>(returnStoreId??null);
  const directory=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    if(selected!==null||returnTo.current===null) return;
    const trigger=Array.from(directory.current?.querySelectorAll<HTMLButtonElement>("button[data-store]")??[]).find(button=>button.dataset.store===returnTo.current);
    trigger?.focus();
    const timer=returnStoreId?window.setTimeout(()=>trigger?.focus(),0):undefined;
    returnTo.current=null;
    return ()=>{if(timer!==undefined)window.clearTimeout(timer);};
  },[selected]);
  const authorised=authorisedStores(stores);
  const store=selected===mythicDeckPreview.id?mythicDeckPreview:authorised.find(item=>item.id===selected);
  if(store) return <RetailerProfile key={store.id} store={store} feed={store.relationship.kind==='demonstration'?demonstrationEvents:eventsFeed} now={store.relationship.kind==='demonstration'?DEMO_NOW:now} onBack={()=>{returnTo.current=store.id;setSelected(null);}}/>;
  return <div className="verified-stores" ref={directory}>
    <div className="section-head"><div><p className="eyebrow">RETAILER COMMUNITY SPACES</p><h2>Verified Stores</h2></div><p>Verified Store status requires an authorised retailer relationship.</p></div>
    <p className="muted">Scraping, collectors, stock confidence, discovery and checkout qualification do not grant Verified Store status. Collector-monitored retailers such as Farmers remain outside this directory unless separately onboarded.</p>
    {authorised.length?<ul aria-label="Authorised Verified Stores" className="tcg-product-grid">{authorised.map(item=><li key={item.id}><article className="tcg-event-card"><h3>{item.name}</h3><p>{item.description}</p><button type="button" data-store={item.id} onClick={()=>onOpen?onOpen(item.id):setSelected(item.id)}>Open {item.name}</button></article></li>)}</ul>:<p role="status" className="notice">No authorised retailer spaces are connected in this build.</p>}
    <section className="retailer-preview" aria-label="Retailer demonstration"><h3>Preview the first pilot space</h3><p>MythicDeck is a demonstration of the framework, separate from the authorised directory.</p><button type="button" data-store={mythicDeckPreview.id} onClick={()=>onOpen?onOpen(mythicDeckPreview.id):setSelected(mythicDeckPreview.id)}>Preview MythicDeck demonstration</button></section>
  </div>;
}
