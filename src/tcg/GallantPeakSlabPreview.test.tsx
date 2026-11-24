// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import {GallantPeakSlabPreview} from './GallantPeakSlabPreview';
import inventory from '../../data/drafts/gallant-peak-pcg-slabs.json';

afterEach(cleanup);

describe('Gallant Peak draft slab inventory',()=>{
  it('has nine unique certificates and approved total of NZ$255',()=>{
    expect(inventory.publication_status).toBe('draft');
    expect(inventory.items).toHaveLength(9);
    expect(new Set(inventory.items.map(item=>item.certificate_number)).size).toBe(9);
    expect(inventory.items.reduce((sum,item)=>sum+item.price_nzd,0)).toBe(255);
    expect(inventory.items.every(item=>item.quantity===1&&item.price_approved&&item.image_asset===null)).toBe(true);
    expect(inventory.items.find(item=>item.name==='Gyarados VMAX')?.certificate_number).toBe('000176293');
    expect(inventory.items.find(item=>item.name==='Kangaskhan')?.certificate_number).toBe('000176303');
  });
  it('renders separate draft cards and never fabricates certificate report URLs or checkout',()=>{
    render(<GallantPeakSlabPreview/>);
    expect(screen.getAllByRole('article')).toHaveLength(9);
    expect(screen.getByRole('heading',{name:'Gyarados VMAX'})).toBeTruthy();
    expect(screen.getByRole('heading',{name:'Kangaskhan'})).toBeTruthy();
    expect(screen.getAllByRole('link')).toHaveLength(9);
    expect(screen.getAllByRole('link',{name:/view pcg grading report/i})).toHaveLength(7);
    for (const item of inventory.items.filter(item=>item.certificate_verified)) {
      const link=screen.getByRole('link',{name:`View PCG Grading Report for ${item.name}`});
      expect(link.getAttribute('href')).toBe(`https://pcgpopreport.com/report/${item.certificate_number}`);
    }
    for (const name of ['Flareon','Vaporeon']) {
      const article=screen.getByRole('heading',{name}).closest('article')!;
      expect(within(article).getByRole('link').getAttribute('href')).toBe('https://pcgpopreport.com/');
      expect(within(article).getByText(/pending slab label review/i)).toBeTruthy();
    }
    expect(screen.queryByRole('button',{name:/buy|checkout|purchase/i})).toBeNull();
    fireEvent.change(screen.getByLabelText('PCG grade'),{target:{value:'9.5'}});
    expect(screen.getAllByRole('article')).toHaveLength(5);
    expect(screen.queryByRole('heading',{name:'Kangaskhan'})).toBeNull();
  });
});
