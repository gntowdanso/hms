"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const FeesPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ type:'', amountPerUnit:'', unit:'' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [sortBy, setSortBy] = useState<'type'|'amountPerUnit'|'unit'>('type');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');

  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/feesandcharges'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); let arr = items; if(q) arr = arr.filter((it:any)=> [it.type, it.unit].some((v:any)=> String(v||'').toLowerCase().includes(q))); arr = [...arr].sort((a:any,b:any)=>{ const av=a[sortBy], bv=b[sortBy]; const na = typeof av==='number'? av : String(av||'').toLowerCase(); const nb = typeof bv==='number'? bv : String(bv||'').toLowerCase(); if(na<nb) return sortDir==='asc'?-1:1; if(na>nb) return sortDir==='asc'?1:-1; return 0; }); return arr; }, [items, filterQ, sortBy, sortDir]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!form.type?.trim() || !form.unit?.trim()) { setMessage({ type:'error', text:'Type and Unit are required.' }); setLoading(false); return; }
      if (form.amountPerUnit === '' || Number(form.amountPerUnit) < 0) { setMessage({ type:'error', text:'Amount per unit must be 0 or greater.' }); setLoading(false); return; }
      const payload: any = { ...form, amountPerUnit: Number(form.amountPerUnit) };
      const res = await apiFetch('/api/feesandcharges', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ type:'', amountPerUnit:'', unit:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ type: it.type||'', amountPerUnit: String(it.amountPerUnit??''), unit: it.unit||'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete fee?')) return; setLoading(true); try { const res = await apiFetch('/api/feesandcharges', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Fees & Charges</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search type/unit" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <div className="flex gap-2 w-full md:w-auto">
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border p-2 rounded"><option value="type">Type</option><option value="amountPerUnit">Amount</option><option value="unit">Unit</option></select>
            <select value={sortDir} onChange={e=>setSortDir(e.target.value as any)} className="border p-2 rounded"><option value="asc">Asc</option><option value="desc">Desc</option></select>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
            <button type="button" className="border px-3 rounded" onClick={()=>{ const headers=['ID','Type','AmountPerUnit','Unit']; const rows = filtered.map((it:any)=>[it.id,it.type,it.amountPerUnit,it.unit]); const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='fees.csv'; a.click(); URL.revokeObjectURL(url); }}>Export CSV</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="Type" value={form.type} onChange={e=>setForm({ ...form, type: e.target.value })} required />
          <input type="number" step="0.01" className="border p-2 rounded" placeholder="Amount per Unit" value={form.amountPerUnit} onChange={e=>setForm({ ...form, amountPerUnit: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Unit (e.g., day, scan, test)" value={form.unit} onChange={e=>setForm({ ...form, unit: e.target.value })} required />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ type:'', amountPerUnit:'', unit:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Type</th><th className="p-2 border text-left">Amount/Unit</th><th className="p-2 border text-left">Unit</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{it.type}</td>
                  <td className="p-2">{it.amountPerUnit}</td>
                  <td className="p-2">{it.unit}</td>
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

export default FeesPage;
