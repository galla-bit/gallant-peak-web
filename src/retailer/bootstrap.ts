/** Bridge the backend's fixed callback destination before HashRouter reads it. */
export function normalizeRetailerCallback(){
 if(window.location.pathname==='/retailer'&&window.location.hash===''){
  window.history.replaceState(window.history.state,'','/#/retailer');
 }
}
