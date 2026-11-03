import type {RetailerClient} from './api';
import {identifier,type MutationInput,type MutationIntent} from './contracts';
export function createIntent(input:MutationInput,key:string,generation:number):MutationIntent{
 identifier(key);const copy=JSON.parse(JSON.stringify(input)) as MutationInput;Object.freeze(copy.body);Object.freeze(copy);return Object.freeze({input:copy,key,generation});
}
export function createMutationWorkflow(client:RetailerClient,generation:number){
 let intent:MutationIntent|null=null,busy=false,disposed=false;
 return {
  get intent(){return intent;},get busy(){return busy;},
  prepare(input:MutationInput,key:string=crypto.randomUUID()){if(busy||disposed)throw new Error('Save unavailable');intent=createIntent(input,key,generation);return intent;},
  async submit(csrf:string,signal?:AbortSignal){if(busy||!intent||disposed)throw new Error('Save unavailable');busy=true;try{return await client.save(intent,csrf,signal);}finally{busy=false;}},
  async retry(csrf:string,signal?:AbortSignal){return this.submit(csrf,signal);},
  discard(){intent=null;},dispose(){disposed=true;intent=null;}
 };
}
