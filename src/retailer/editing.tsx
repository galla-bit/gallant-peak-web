import {createContext,useCallback,useContext,useEffect,useMemo,useRef,useState,type ReactNode} from 'react';
interface Runtime {disabled:boolean;markDirty:(id:string,dirty:boolean)=>void;leave:(action:()=>void)=>void}
const fallback:Runtime={disabled:false,markDirty:()=>{},leave:action=>action()};
const Editing=createContext<Runtime>(fallback);
export const useEditing=()=>useContext(Editing);
const warning='Discard unsaved store changes?';

export function useUnsavedStoreChanges(){
 const position=useRef({href:window.location.href,index:window.history.state?.idx??0});
 const forms=useRef(new Set<string>());const [dirty,setDirty]=useState(false);
 const markDirty=useCallback((id:string,value:boolean)=>{if(value){if(!forms.current.size)position.current={href:window.location.href,index:window.history.state?.idx??0};forms.current.add(id);}else forms.current.delete(id);setDirty(forms.current.size>0);},[]);
 const discard=useCallback(()=>{forms.current.clear();setDirty(false);},[]);
 const leave=useCallback((action:()=>void)=>{if(forms.current.size&&!window.confirm(warning))return;discard();action();},[discard]);
 useEffect(()=>{
  const before=(event:BeforeUnloadEvent)=>{if(forms.current.size){event.preventDefault();event.returnValue='';}};
  const click=(event:MouseEvent)=>{
   const link=(event.target as Element|null)?.closest?.('a[href]');
   if(!link||!forms.current.size||event.defaultPrevented)return;
   const href=(link as HTMLAnchorElement).href;if(href===window.location.href)return;
   if(!window.confirm(warning)){event.preventDefault();event.stopPropagation();}else discard();
  };
  let restoring=false;
  const pop=(event:PopStateEvent)=>{
   if(restoring){restoring=false;event.stopImmediatePropagation();return;}
   const next=event.state?.idx;const {href:previous,index}=position.current;
   if(forms.current.size&&!window.confirm(warning)){
    event.stopImmediatePropagation();
    if(typeof next==='number'&&next!==index){restoring=true;window.history.go(index-next);}
    else window.history.replaceState(window.history.state,'',previous);
    return;
   }
   discard();position.current={href:window.location.href,index:next??index};
  };
  window.addEventListener('beforeunload',before);document.addEventListener('click',click,true);window.addEventListener('popstate',pop,true);
  return()=>{window.removeEventListener('beforeunload',before);document.removeEventListener('click',click,true);window.removeEventListener('popstate',pop,true);};
 },[discard]);
 return {dirty,markDirty,leave,discard};
}
export function EditingProvider({disabled,markDirty,leave,children}:Runtime&{children:ReactNode}){
 const value=useMemo(()=>({disabled,markDirty,leave}),[disabled,markDirty,leave]);
 return <Editing.Provider value={value}>{children}</Editing.Provider>;
}
