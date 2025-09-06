"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const PaymentsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ invoiceId:'', amount:'', paymentDate:'', method:'', reference:'' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'paymentDate'|'amount'|'method'>('paymentDate');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchInvoices = async () => { try { const r = await fetch('/api/invoices'); const d = await r.json().catch(()=>[]); setInvoices(Array.isArray(d)?d:[]);} catch{} };
  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/payments'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchInvoices(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); let arr = items; if(q) arr = arr.filter((it:any)=> [it.method, it.reference].some((v:any)=> String(v||'').toLowerCase().includes(q))); arr = [...arr].sort((a:any,b:any)=>{ const av = sortBy==='paymentDate'? new Date(a[sortBy]).getTime(): a[sortBy]; const bv = sortBy==='paymentDate'? new Date(b[sortBy]).getTime(): b[sortBy]; if(av<bv) return sortDir==='asc'?-1:1; if(av>bv) return sortDir==='asc'?1:-1; return 0; }); return arr; }, [items, filterQ, sortBy, sortDir]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!form.invoiceId || !form.amount || !form.paymentDate) { setMessage({ type:'error', text:'Invoice, Amount and Payment Date are required.' }); setLoading(false); return; }
      const payload: any = { ...form };
      payload.invoiceId = Number(payload.invoiceId);
      payload.amount = Number(payload.amount);
      payload.paymentDate = new Date(payload.paymentDate).toISOString();
      const res = await apiFetch('/api/payments', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ invoiceId:'', amount:'', paymentDate:'', method:'', reference:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ invoiceId: String(it.invoiceId||''), amount: String(it.amount??''), paymentDate: it.paymentDate? new Date(it.paymentDate).toISOString().slice(0,10):'', method: it.method||'', reference: it.reference||'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete payment?')) return; setLoading(true); try { const res = await apiFetch('/api/payments', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Payments</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search method/ref" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <div className="flex gap-2 w-full md:w-auto">
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border p-2 rounded"><option value="paymentDate">Payment Date</option><option value="amount">Amount</option><option value="method">Method</option></select>
            <select value={sortDir} onChange={e=>setSortDir(e.target.value as any)} className="border p-2 rounded"><option value="asc">Asc</option><option value="desc">Desc</option></select>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.invoiceId} onChange={e=>setForm({ ...form, invoiceId: e.target.value })} required>
            <option value="">-- Invoice --</option>
            {invoices.map((inv:any)=> <option key={inv.id} value={inv.id}>{inv.id} - {new Date(inv.issueDate).toLocaleDateString()} - {inv.amount}</option>)}
          </select>
          <input type="number" step="0.01" className="border p-2 rounded" placeholder="Amount" value={form.amount} onChange={e=>setForm({ ...form, amount: e.target.value })} required />
          <input type="date" className="border p-2 rounded" value={form.paymentDate} onChange={e=>setForm({ ...form, paymentDate: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Method" value={form.method} onChange={e=>setForm({ ...form, method: e.target.value })} />
          <input className="border p-2 rounded" placeholder="Reference" value={form.reference} onChange={e=>setForm({ ...form, reference: e.target.value })} />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ invoiceId:'', amount:'', paymentDate:'', method:'', reference:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Payment Date</th><th className="p-2 border text-left">Amount</th><th className="p-2 border text-left">Method</th><th className="p-2 border text-left">Reference</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{new Date(it.paymentDate).toLocaleDateString()}</td>
                  <td className="p-2">{it.amount}</td>
                  <td className="p-2">{it.method}</td>
                  <td className="p-2">{it.reference}</td>
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

export default PaymentsPage;
