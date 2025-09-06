"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Detail = { id?: number; username?: string; labRequestId?: number; labResultId?: number; code: string; result: string; referenceRange?: string; flag?: string; rating?: string; unit?: string };

const LabResultsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ labRequestId:'', resultDetails:'', resultDate:'', verifiedBy:'', imageURL:'', imageBase64:'' });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterQ, setFilterQ] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [detailsDraft, setDetailsDraft] = useState<Detail[]>([]);

  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/labresults'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  const fetchLabRequests = async () => { try { const r = await fetch('/api/labrequests'); const d = await r.json().catch(()=>[]); setLabRequests(Array.isArray(d)?d:[]);} catch{} };
  useEffect(()=>{ fetchLabRequests(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); if(!q) return items; return items.filter((it:any)=> [it.resultDetails, it.labRequest?.status].some((v:any)=> String(v||'').toLowerCase().includes(q))); }, [items, filterQ]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const addDraft = () => setDetailsDraft(d => [...d, { code:'', result:'', referenceRange:'', flag:'', rating:'', unit:'' }]);
  const updateDraft = (idx:number, patch: Partial<Detail>) => setDetailsDraft(d => d.map((it,i)=> i===idx? { ...it, ...patch }: it));
  const removeDraft = (idx:number) => setDetailsDraft(d => d.filter((_,i)=> i!==idx));

  const createOrUpdateDetails = async (labResultId: number) => {
    // naive sync: delete-and-recreate when editing, else create all
    const existing = await fetch(`/api/labresultdetails?labResultId=${labResultId}`).then(r=>r.json()).catch(()=>[]);
    if (Array.isArray(existing) && existing.length) {
      for (const det of existing) { try { await apiFetch('/api/labresultdetails', { method:'DELETE', body: JSON.stringify({ id: det.id }) }); } catch {} }
    }
    for (const det of detailsDraft) {
      const payload = { ...det, labResultId, labRequestId: Number(form.labRequestId||0) };
      await apiFetch('/api/labresultdetails', { method:'POST', body: JSON.stringify(payload) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload: any = { ...form };
      if (payload.labRequestId) payload.labRequestId = Number(payload.labRequestId);
      if (payload.verifiedBy !== '') payload.verifiedBy = Number(payload.verifiedBy);
      if (payload.resultDate) payload.resultDate = new Date(payload.resultDate).toISOString();
      if (payload.imageURL === '') delete payload.imageURL;
      if (payload.imageBase64 === '') delete payload.imageBase64;
      const res = await apiFetch('/api/labresults', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else {
        const labResultId = editingId ? editingId : result?.id;
        if (labResultId) await createOrUpdateDetails(Number(labResultId));
        setMessage({ type:'success', text: editingId? 'Updated':'Created' });
        setForm({ labRequestId:'', resultDetails:'', resultDate:'', verifiedBy:'', imageURL:'', imageBase64:'' }); setImagePreview(''); setEditingId(null); setDetailsDraft([]); await fetchItems();
      }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ labRequestId: String(it.labRequestId), resultDetails: it.resultDetails||'', resultDate: new Date(it.resultDate).toISOString().slice(0,16), verifiedBy: String(it.verifiedBy||''), imageURL: it.imageURL||'', imageBase64: it.imageBase64||'' });
    if (it.imageBase64) setImagePreview(`data:image/*;base64,${it.imageBase64}`); else if (it.imageURL) setImagePreview(it.imageURL); else setImagePreview('');
    setEditingId(it.id); setDetailsDraft((it.details||[]).map((d:any)=> ({ code:d.code||'', result:d.result||'', referenceRange:d.referenceRange||'', flag:d.flag||'', rating:d.rating||'', unit:d.unit||'' })) ); };
  const handleFileChange = async (file?: File | null) => {
    if (!file) { setForm((f:any)=>({ ...f, imageBase64:'' })); setImagePreview(''); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setForm((f:any)=> ({ ...f, imageBase64: base64 }));
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete lab result?')) return; setLoading(true); try { const res = await apiFetch('/api/labresults', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Lab Results</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search details/status" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded w-full md:w-auto"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.labRequestId} onChange={e=>setForm({ ...form, labRequestId: e.target.value })} required>
            <option value="">-- Lab Request --</option>
            {labRequests.map((r:any)=> <option key={r.id} value={r.id}>Req #{r.id} - {r.test?.testName || r.testId}</option>)}
          </select>
          <input type="datetime-local" className="border p-2 rounded" value={form.resultDate} onChange={e=>setForm({ ...form, resultDate: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Verified By (staffId)" value={form.verifiedBy} onChange={e=>setForm({ ...form, verifiedBy: e.target.value })} required />
          <textarea className="border p-2 rounded md:col-span-3" placeholder="Result Details" value={form.resultDetails} onChange={e=>setForm({ ...form, resultDetails: e.target.value })} required />
          <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <input className="border p-2 rounded md:col-span-2" placeholder="Image URL (optional)" value={form.imageURL} onChange={e=>setForm({ ...form, imageURL: e.target.value })} />
            <input type="file" accept="image/*" className="border p-2 rounded" onChange={e=>handleFileChange(e.target.files?.[0])} />
          </div>
          {imagePreview && (
            <div className="md:col-span-3 flex items-center gap-3">
              <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded border" />
              <button type="button" className="bg-gray-300 px-3 py-1 rounded" onClick={()=>{ setForm((f:any)=>({ ...f, imageBase64:'' })); setImagePreview(''); }}>Clear Image</button>
            </div>
          )}

          <div className="md:col-span-3">
            <div className="flex items-center justify-between mb-2"><h3 className="font-semibold">Result Details (structured)</h3><button type="button" onClick={addDraft} className="bg-green-600 text-white px-3 py-1 rounded">Add Detail</button></div>
            <div className="space-y-2">
              {detailsDraft.map((d, idx)=> (
                <div key={idx} className="grid grid-cols-1 md:grid-cols-6 gap-2 items-center">
                  <input className="border p-2 rounded" placeholder="Code" value={d.code} onChange={e=>updateDraft(idx, { code: e.target.value })} />
                  <input className="border p-2 rounded" placeholder="Result" value={d.result} onChange={e=>updateDraft(idx, { result: e.target.value })} />
                  <input className="border p-2 rounded" placeholder="Reference Range" value={d.referenceRange||''} onChange={e=>updateDraft(idx, { referenceRange: e.target.value })} />
                  <input className="border p-2 rounded" placeholder="Flag" value={d.flag||''} onChange={e=>updateDraft(idx, { flag: e.target.value })} />
                  <input className="border p-2 rounded" placeholder="Rating" value={d.rating||''} onChange={e=>updateDraft(idx, { rating: e.target.value })} />
                  <div className="flex gap-2 items-center">
                    <input className="border p-2 rounded w-full" placeholder="Unit" value={d.unit||''} onChange={e=>updateDraft(idx, { unit: e.target.value })} />
                    <button type="button" onClick={()=>removeDraft(idx)} className="bg-red-500 text-white px-2 py-1 rounded">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="md:col-span-3 flex gap-2 justify-end mt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ labRequestId:'', resultDetails:'', resultDate:'', verifiedBy:'' }); setDetailsDraft([]); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Date</th><th className="p-2 border text-left">Request</th><th className="p-2 border text-left hidden md:table-cell">Verified By</th><th className="p-2 border text-left hidden md:table-cell">Details</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{new Date(it.resultDate).toLocaleString()}</td>
                  <td className="p-2">Req #{it.labRequestId}</td>
                  <td className="p-2 hidden md:table-cell">{it.verifiedBy}</td>
                  <td className="p-2 hidden md:table-cell">{(it.details||[]).map((d:any)=> d.code).join(', ')}</td>
                  <td className="p-2"><div className="flex flex-col md:flex-row gap-2"><button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(it)}>Edit</button><button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(it.id)}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Showing {total===0?0:start+1} - {Math.min(start+pageSize,total)} of {total}</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
            <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=> (page*pageSize < total ? p+1 : p))} disabled={page*pageSize >= total}>Next</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LabResultsPage;
