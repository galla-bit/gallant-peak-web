import {useCallback,useEffect,useRef,useState} from 'react';
import {RetailerApiError,type RetailerClient} from './api';
import type {AccessibleStores} from './contracts';
type Status='loading'|'anonymous'|'ready'|'error'|'session-ended'|'logout-unconfirmed';
interface State {status:Status;stores:AccessibleStores['stores'];selectedStoreId:string|null;csrf?:string;generation:number}
export function useRetailerSession(client:RetailerClient){
 const scope=useRef({generation:0,controller:new AbortController()});
 const [state,setState]=useState<State>({status:'loading',stores:[],selectedStoreId:null,generation:0});
 const fresh=useCallback(()=>{scope.current.controller.abort();scope.current={generation:scope.current.generation+1,controller:new AbortController()};return scope.current;},[]);
 const recheck=useCallback(async()=>{const current=fresh();setState({status:'loading',stores:[],selectedStoreId:null,generation:current.generation});try{
  const session=await client.getSession(current.controller.signal);if(scope.current!==current)return;
  if(!session.authenticated){setState({status:'anonymous',stores:[],selectedStoreId:null,generation:current.generation});return;}
  const accessible=await client.getStores(current.controller.signal);if(scope.current!==current)return;
  setState({status:'ready',stores:accessible.stores,selectedStoreId:null,csrf:session.csrf_token,generation:current.generation});
 }catch(error){if(scope.current!==current)return;setState({status:error instanceof RetailerApiError&&error.category==='session-ended'?'session-ended':'error',stores:[],selectedStoreId:null,generation:current.generation});}},[client,fresh]);
 useEffect(()=>{void recheck();return()=>{fresh();};},[recheck,fresh]);
 const selectStore=useCallback((id:string)=>{if(state.status!=='ready'||!state.stores.some(store=>store.id===id)||state.selectedStoreId===id)return;const current=fresh();setState(old=>({...old,selectedStoreId:id,generation:current.generation}));},[state,fresh]);
 const logout=useCallback(async()=>{const csrf=state.csrf;const current=fresh();setState({status:'loading',stores:[],selectedStoreId:null,generation:current.generation});try{if(!csrf)throw new Error('No session');await client.logout(csrf,current.controller.signal);if(scope.current===current)setState({status:'anonymous',stores:[],selectedStoreId:null,generation:current.generation});}catch{if(scope.current===current)setState({status:'logout-unconfirmed',stores:[],selectedStoreId:null,generation:current.generation});}},[state.csrf,client,fresh]);
 const onDenied=useCallback((category:string)=>{if(category==='denied'){void recheck();}else if(category==='session-ended'){const current=fresh();setState({status:'session-ended',stores:[],selectedStoreId:null,generation:current.generation});}},[fresh,recheck]);
 const signalForGeneration=useCallback(()=>scope.current.controller.signal,[]);
 return {...state,selectStore,recheck,logout,onDenied,signalForGeneration};
}
export type RetailerSessionController=ReturnType<typeof useRetailerSession>;
