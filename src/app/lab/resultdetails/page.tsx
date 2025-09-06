"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const LabResultDetailsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ labRequestId:'', labResultId:'', code:'', result:'', referenceRange:'', flag:'', rating:'', unit:'' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterQ, setFilterQ] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [labRequests, setLabRequests] = useState<any[]>([]);
  const [labResults, setLabResults] = useState<any[]>([]);

  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/labresultdetails'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  const fetchLabRequests = async () => { try { const r = await fetch('/api/labrequests'); const d = await r.json().catch(()=>[]); setLabRequests(Array.isArray(d)?d:[]);} catch{} };
  const fetchLabResults = async () => { try { const r = await fetch('/api/labresults'); const d = await r.json().catch(()=>[]); setLabResults(Array.isArray(d)?d:[]);} catch{} };
  useEffect(()=>{ fetchLabRequests(); fetchLabResults(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); if(!q) return items; return items.filter((it:any)=> [it.code, it.result, it.flag, it.unit].some((v:any)=> String(v||'').toLowerCase().includes(q))); }, [items, filterQ]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload: any = { ...form };
      if (payload.labRequestId) payload.labRequestId = Number(payload.labRequestId);
      if (payload.labResultId) payload.labResultId = Number(payload.labResultId);
      const res = await apiFetch('/api/labresultdetails', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ labRequestId:'', labResultId:'', code:'', result:'', referenceRange:'', flag:'', rating:'', unit:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ labRequestId:String(it.labRequestId), labResultId:String(it.labResultId), code: it.code||'', result: it.result||'', referenceRange: it.referenceRange||'', flag: it.flag||'', rating: it.rating||'', unit: it.unit||'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete detail?')) return; setLoading(true); try { const res = await apiFetch('/api/labresultdetails', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Lab Result Details</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search code/result" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded w-full md:w-auto"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.labRequestId} onChange={e=>setForm({ ...form, labRequestId: e.target.value })} required>
            <option value="">-- Lab Request --</option>
            {labRequests.map((r:any)=> <option key={r.id} value={r.id}>Req #{r.id}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.labResultId} onChange={e=>setForm({ ...form, labResultId: e.target.value })} required>
            <option value="">-- Lab Result --</option>
            {labResults.map((r:any)=> <option key={r.id} value={r.id}>Res #{r.id}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Code" value={form.code} onChange={e=>setForm({ ...form, code: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Result" value={form.result} onChange={e=>setForm({ ...form, result: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Reference Range" value={form.referenceRange} onChange={e=>setForm({ ...form, referenceRange: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Flag" value={form.flag} onChange={e=>setForm({ ...form, flag: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Rating" value={form.rating} onChange={e=>setForm({ ...form, rating: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Unit" value={form.unit} onChange={e=>setForm({ ...form, unit: e.target.value })} />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ labRequestId:'', labResultId:'', code:'', result:'', referenceRange:'', flag:'', rating:'', unit:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Req</th><th className="p-2 border text-left">Res</th><th className="p-2 border text-left">Code</th><th className="p-2 border text-left hidden md:table-cell">Result</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{it.labRequestId}</td>
                  <td className="p-2">{it.labResultId}</td>
                  <td className="p-2">{it.code}</td>
                  <td className="p-2 hidden md:table-cell">{it.result}</td>
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

export default LabResultDetailsPage;
