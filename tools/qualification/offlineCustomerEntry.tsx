/** Explicit offline evaluation entry. No auto-mount, default fetch or App import. */
import {useEffect,useState} from 'react';
import {loadQualifiedRadar,QualificationRadar,type ProbeResult} from './customerRadarProbe';

function EnabledEntry({fetcher}:{fetcher:typeof fetch}){
  const [state,setState]=useState<{source:typeof fetch;result:ProbeResult|null}>({source:fetcher,result:null});
  useEffect(()=>{
    let active=true;
    setState({source:fetcher,result:null});
    void loadQualifiedRadar(fetcher).then(result=>{if(active)setState({source:fetcher,result});});
    return ()=>{active=false;};
  },[fetcher]);
  if(state.source!==fetcher||state.result===null)return <p role="status">Loading isolated Radar</p>;
  return <QualificationRadar result={state.result}/>;
}

export function OfflineCustomerEntry({enabled,fetcher}:{enabled:boolean;fetcher:typeof fetch}){
  if(enabled!==true||typeof fetcher!=='function')return <p role="status">Offline evaluation disabled</p>;
  return <EnabledEntry fetcher={fetcher}/>;
}
