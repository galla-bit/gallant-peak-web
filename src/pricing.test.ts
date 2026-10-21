import {describe,expect,it} from 'vitest';
const garment={tee:50,hoodie:70};const print={small:10,large:25,sleeve:15};
const total=(g:number,ps:number[])=>g+ps.reduce((a,b)=>a+b,0);
describe('approved Custom pricing examples',()=>{it('hoodie + large = 95',()=>expect(total(garment.hoodie,[print.large])).toBe(95));it('tee + small + large = 85',()=>expect(total(garment.tee,[print.small,print.large])).toBe(85));it('hoodie + small + large + sleeve = 120',()=>expect(total(garment.hoodie,[print.small,print.large,print.sleeve])).toBe(120));});
