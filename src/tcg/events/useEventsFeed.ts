import {useEffect, useState} from 'react';
import {inactiveEventsFeed, loadTcgEventsFeed, type TcgEventsFeedResult} from './feed';

export function useEventsFeed(endpoint?:string, supplied?:TcgEventsFeedResult, now?:number): TcgEventsFeedResult {
  const [loaded,setLoaded]=useState<{endpoint?:string;feed:TcgEventsFeedResult}>(()=>
    ({endpoint,feed:inactiveEventsFeed(endpoint?'loading':'unconfigured')}));
  useEffect(()=>{
    if (supplied) return;
    let active=true;
    setLoaded({endpoint,feed:inactiveEventsFeed(endpoint?'loading':'unconfigured')});
    if (endpoint) void loadTcgEventsFeed({endpoint,now:now??Date.now()}).then(feed=>{
      if (active) setLoaded({endpoint,feed});
    });
    return ()=>{active=false;};
  },[endpoint,supplied,now]);
  return supplied??(loaded.endpoint===endpoint?loaded.feed:inactiveEventsFeed(endpoint?'loading':'unconfigured'));
}
