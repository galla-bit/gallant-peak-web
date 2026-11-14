// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {EditStoreDescription} from './EditStoreDescription';

afterEach(cleanup);

it('submits supplied text and permits explicit clearing',async()=>{
 const onSave=vi.fn(async (_description:string|null)=>{});
 render(<EditStoreDescription storeName="Synthetic Store" initialDescription="Existing" onSave={onSave}/>);
 fireEvent.change(screen.getByLabelText('Description for Synthetic Store'),{target:{value:'  Verified description  '}});
 fireEvent.click(screen.getByRole('button',{name:'Save description'}));
 await waitFor(()=>expect(onSave).toHaveBeenCalledWith('Verified description'));
 fireEvent.change(screen.getByLabelText('Description for Synthetic Store'),{target:{value:' '}});
 fireEvent.click(screen.getByRole('button',{name:'Save description'}));
 await waitFor(()=>expect(onSave).toHaveBeenCalledWith(null));
});

it('does not report success when saving fails',async()=>{
 const onSave=vi.fn(async()=>{throw new Error('failed');});
 render(<EditStoreDescription storeName="Synthetic Store" onSave={onSave}/>);
 fireEvent.click(screen.getByRole('button',{name:'Save description'}));
 expect(await screen.findByRole('alert')).toBeTruthy();
});
