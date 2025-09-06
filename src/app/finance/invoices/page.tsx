"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const InvoicesPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [billings, setBillings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ billingId:'', issueDate:'', dueDate:'', amount:'', status:'' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'issueDate'|'dueDate'|'amount'|'status'>('issueDate');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchBillings = async () => { try { const r = await fetch('/api/billings'); const d = await r.json().catch(()=>[]); setBillings(Array.isArray(d)?d:[]);} catch{} };
  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/invoices'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchBillings(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); let arr = items; if(q) arr = arr.filter((it:any)=> [it.status].some((v:any)=> String(v||'').toLowerCase().includes(q))); arr = [...arr].sort((a:any,b:any)=>{ const av = sortBy==='issueDate'||sortBy==='dueDate'? new Date(a[sortBy]).getTime(): a[sortBy]; const bv = sortBy==='issueDate'||sortBy==='dueDate'? new Date(b[sortBy]).getTime(): b[sortBy]; if(av<bv) return sortDir==='asc'?-1:1; if(av>bv) return sortDir==='asc'?1:-1; return 0; }); return arr; }, [items, filterQ, sortBy, sortDir]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!form.billingId || !form.issueDate || !form.dueDate) { setMessage({ type:'error', text:'Billing, Issue Date, and Due Date are required.' }); setLoading(false); return; }
      const payload: any = { ...form };
      if (payload.billingId) payload.billingId = Number(payload.billingId);
      if (payload.amount) payload.amount = Number(payload.amount);
      if (payload.issueDate) payload.issueDate = new Date(payload.issueDate).toISOString();
      if (payload.dueDate) payload.dueDate = new Date(payload.dueDate).toISOString();
      const res = await apiFetch('/api/invoices', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ billingId:'', issueDate:'', dueDate:'', amount:'', status:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ billingId: String(it.billingId||''), issueDate: it.issueDate? new Date(it.issueDate).toISOString().slice(0,10):'', dueDate: it.dueDate? new Date(it.dueDate).toISOString().slice(0,10):'', amount: String(it.amount??''), status: it.status||'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete invoice?')) return; setLoading(true); try { const res = await apiFetch('/api/invoices', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Invoices</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search status" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <div className="flex gap-2 w-full md:w-auto">
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border p-2 rounded"><option value="issueDate">Issue Date</option><option value="dueDate">Due Date</option><option value="amount">Amount</option><option value="status">Status</option></select>
            <select value={sortDir} onChange={e=>setSortDir(e.target.value as any)} className="border p-2 rounded"><option value="asc">Asc</option><option value="desc">Desc</option></select>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.billingId} onChange={e=>setForm({ ...form, billingId: e.target.value })} required>
            <option value="">-- Billing --</option>
            {billings.map((b:any)=> <option key={b.id} value={b.id}>{b.id} - {new Date(b.billingDate).toLocaleDateString()} - {b.totalAmount}</option>)}
          </select>
          <input type="date" className="border p-2 rounded" value={form.issueDate} onChange={e=>setForm({ ...form, issueDate: e.target.value })} required />
          <input type="date" className="border p-2 rounded" value={form.dueDate} onChange={e=>setForm({ ...form, dueDate: e.target.value })} required />
          <input type="number" step="0.01" className="border p-2 rounded" placeholder="Amount (optional)" value={form.amount} onChange={e=>setForm({ ...form, amount: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Status" value={form.status} onChange={e=>setForm({ ...form, status: e.target.value })} />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ billingId:'', issueDate:'', dueDate:'', amount:'', status:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Issue Date</th><th className="p-2 border text-left">Due Date</th><th className="p-2 border text-left">Amount</th><th className="p-2 border text-left">Status</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{new Date(it.issueDate).toLocaleDateString()}</td>
                  <td className="p-2">{new Date(it.dueDate).toLocaleDateString()}</td>
                  <td className="p-2">{it.amount}</td>
                  <td className="p-2">{it.status}</td>
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

export default InvoicesPage;
