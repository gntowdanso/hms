"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const InsurancePage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ patientId:'', provider:'', policyNumber:'', coverageDetails:'', startDate:'', endDate:'' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'startDate'|'endDate'|'provider'>('startDate');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchPatients = async () => { try { const r = await fetch('/api/patients'); const d = await r.json().catch(()=>[]); setPatients(Array.isArray(d)?d:[]);} catch{} };
  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/insurances'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchPatients(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); let arr = items; if(q) arr = arr.filter((it:any)=> [it.provider, it.policyNumber].some((v:any)=> String(v||'').toLowerCase().includes(q))); arr = [...arr].sort((a:any,b:any)=>{ const av = sortBy==='startDate'||sortBy==='endDate'? new Date(a[sortBy]).getTime(): String(a[sortBy]||''); const bv = sortBy==='startDate'||sortBy==='endDate'? new Date(b[sortBy]).getTime(): String(b[sortBy]||''); if(av<bv) return sortDir==='asc'?-1:1; if(av>bv) return sortDir==='asc'?1:-1; return 0; }); return arr; }, [items, filterQ, sortBy, sortDir]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!form.patientId || !form.provider || !form.policyNumber || !form.startDate) { setMessage({ type:'error', text:'Patient, Provider, Policy Number, Start Date are required.' }); setLoading(false); return; }
      const payload: any = { ...form };
      payload.patientId = Number(payload.patientId);
      if (payload.startDate) payload.startDate = new Date(payload.startDate).toISOString();
      if (payload.endDate) payload.endDate = new Date(payload.endDate).toISOString();
      const res = await apiFetch('/api/insurances', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ patientId:'', provider:'', policyNumber:'', coverageDetails:'', startDate:'', endDate:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ patientId: String(it.patientId||''), provider: it.provider||'', policyNumber: it.policyNumber||'', coverageDetails: it.coverageDetails||'', startDate: it.startDate? new Date(it.startDate).toISOString().slice(0,10):'', endDate: it.endDate? new Date(it.endDate).toISOString().slice(0,10):'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete insurance?')) return; setLoading(true); try { const res = await apiFetch('/api/insurances', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Insurance</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search provider/policy" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <div className="flex gap-2 w-full md:w-auto">
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border p-2 rounded"><option value="startDate">Start Date</option><option value="endDate">End Date</option><option value="provider">Provider</option></select>
            <select value={sortDir} onChange={e=>setSortDir(e.target.value as any)} className="border p-2 rounded"><option value="asc">Asc</option><option value="desc">Desc</option></select>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.patientId} onChange={e=>setForm({ ...form, patientId: e.target.value })} required>
            <option value="">-- Patient --</option>
            {patients.map((p:any)=> <option key={p.id} value={p.id}>{p.id} - {p.firstName} {p.lastName}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Provider" value={form.provider} onChange={e=>setForm({ ...form, provider: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Policy Number" value={form.policyNumber} onChange={e=>setForm({ ...form, policyNumber: e.target.value })} required />
          <input className="border p-2 rounded md:col-span-2" placeholder="Coverage Details" value={form.coverageDetails} onChange={e=>setForm({ ...form, coverageDetails: e.target.value })} />
          <input type="date" className="border p-2 rounded" value={form.startDate} onChange={e=>setForm({ ...form, startDate: e.target.value })} required />
          <input type="date" className="border p-2 rounded" value={form.endDate} onChange={e=>setForm({ ...form, endDate: e.target.value })} />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ patientId:'', provider:'', policyNumber:'', coverageDetails:'', startDate:'', endDate:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Patient</th><th className="p-2 border text-left">Provider</th><th className="p-2 border text-left">Policy</th><th className="p-2 border text-left">Start</th><th className="p-2 border text-left">End</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{it.patient? `${it.patient.firstName||''} ${it.patient.lastName||''}`: it.patientId}</td>
                  <td className="p-2">{it.provider}</td>
                  <td className="p-2">{it.policyNumber}</td>
                  <td className="p-2">{it.startDate? new Date(it.startDate).toLocaleDateString(): ''}</td>
                  <td className="p-2">{it.endDate? new Date(it.endDate).toLocaleDateString(): ''}</td>
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

export default InsurancePage;
