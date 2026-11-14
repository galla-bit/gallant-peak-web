import {useState} from 'react';
import {storeDescription} from './VerifiedStoreDirectory';

/** Owner-admin control. Parent MUST enforce server-side owner authorization.
 * Saving is delegated to an authenticated, audited admin endpoint.
 * This component does not persist directly or publish unapproved copy.
 */
export function EditStoreDescription({storeName,initialDescription='',onSave}:
  {storeName:string;initialDescription?:string;onSave:(description:string|null)=>Promise<void>}) {
  const [description,setDescription]=useState(initialDescription);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const valid=description.trim().length===0 || !!storeDescription(description);
  async function save() {
    if(!valid || saving) return;
    setSaving(true);
    setError('');
    try {
      await onSave(storeDescription(description)??null);
    } catch {
      setError('Description could not be saved. No change was confirmed.');
    } finally {
      setSaving(false);
    }
  }
  return <section aria-label={`Edit description for ${storeName}`}>
    <h3>Edit store description</h3>
    <label htmlFor="store-description-editor">Description for {storeName}</label>
    <textarea id="store-description-editor" maxLength={240} value={description}
      onChange={event=>setDescription(event.target.value)} />
    <p>{description.length}/240 characters. Leave blank to omit the description.</p>
    <button type="button" disabled={!valid||saving} onClick={save}>
      {saving?'Saving…':'Save description'}
    </button>
    {error&&<p role="alert">{error}</p>}
  </section>;
}
