import {useCallback,useEffect,useRef,useState} from 'react';
import {createRetailerClient,RetailerApiError,type RetailerClient} from './api';
import type {AccessibleStores} from './contracts';

export const retailerClient=createRetailerClient((...args)=>fetch(...args));
type State={status:'loading'|'anonymous'|'ready'|'unavailable'|'logout-unconfirmed';stores:AccessibleStores['stores'];csrf?:string;expires?:number;scope:string};
const empty=(status:State['status'],scope:string):State=>({status,stores:[],scope});
const sessionEnded=(error:unknown)=>error instanceof RetailerApiError&&error.category==='session-ended';
// A logout is a server operation, not a page read. Navigation must neither abort
// it nor let a new page restore hints from a session awaiting revocation.
type Logout={result:Promise<'anonymous'|'logout-unconfirmed'>;pending:boolean};
const logouts=new WeakMap<RetailerClient,Logout>();

/** Ephemeral presentation state. Protected operations reauthorise on the server. */
export function useRetailerAccess(client:RetailerClient=retailerClient,scope='entry'){
 const [state,setState]=useState<State>(()=>empty('loading',scope));
 const current=useRef<AbortController|null>(null);
 const begin=useCallback(()=>{
  current.current?.abort();
  const controller=new AbortController();current.current=controller;
  setState(empty('loading',scope));return controller;
 },[scope]);
 const refresh=useCallback(async()=>{
  const controller=begin();
  try{
   const logout=logouts.get(client);
   if(logout){const status=await logout.result;if(!controller.signal.aborted)setState(empty(status,scope));return;}
   const session=await client.getSession(controller.signal);
   const stores=session.authenticated?(await client.getStores(controller.signal)).stores:[];
   if(controller.signal.aborted)return;
   const expires=session.expires_at===null?undefined:Date.parse(session.expires_at);
   if(expires!==undefined&&expires<=Date.now()){setState(empty('anonymous',scope));return;}
   setState({status:session.authenticated?'ready':'anonymous',stores,csrf:session.csrf_token,expires,scope});
  }catch(error){if(!controller.signal.aborted)setState(empty(sessionEnded(error)?'anonymous':'unavailable',scope));}
 },[client,scope,begin]);
 useEffect(()=>{
  void refresh();
  const onFocus=()=>{if(document.visibilityState!=='hidden')void refresh();};
  const onVisibility=()=>{
   if(document.visibilityState==='hidden'){current.current?.abort();setState(empty('loading',scope));}
   else void refresh();
  };
  window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onVisibility);
  return()=>{current.current?.abort();window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onVisibility);};
 },[refresh,scope]);
 useEffect(()=>{
  if(state.expires===undefined)return;
  const timer=window.setTimeout(()=>{current.current?.abort();setState(empty('anonymous',scope));},Math.min(2147483647,Math.max(0,state.expires-Date.now())));
  return()=>window.clearTimeout(timer);
 },[state.expires,scope]);
 const logout=async()=>{
  const csrf=state.csrf;const controller=begin();
  let operation=logouts.get(client);
  if(!operation){
   const result=(async():Promise<'anonymous'|'logout-unconfirmed'>=>{
    try{if(!csrf)throw new Error('Missing session');await client.logout(csrf);return 'anonymous';}
    catch(error){return sessionEnded(error)?'anonymous':'logout-unconfirmed';}
   })();
   operation={result,pending:true};logouts.set(client,operation);
   const owned=operation;void result.then(()=>{owned.pending=false;});
  }
  const status=await operation.result;
  if(!controller.signal.aborted)setState(empty(status,scope));
 };
 const recheck=async()=>{
  if(!logouts.get(client)?.pending)logouts.delete(client);
  await refresh();
 };
 const login=async(navigate:(url:string)=>void)=>{
  const controller=begin();
  try{
   const logout=logouts.get(client);if(logout)await logout.result;
   if(controller.signal.aborted)return;
   logouts.delete(client);
   const session=await client.getSession(controller.signal);
   if(controller.signal.aborted)return;
   if(session.authenticated){void refresh();return;}
   const url=await client.login(session.csrf_token,controller.signal);
   if(!controller.signal.aborted)navigate(url);
  }catch(error){if(!controller.signal.aborted)setState(empty(sessionEnded(error)?'anonymous':'unavailable',scope));}
 };
 return {...(state.scope===scope?state:empty('loading',scope)),refresh:recheck,logout,login};
}
