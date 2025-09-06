"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type TTxn = 'ISSUED'|'RETURNED'|'STOCKED';

const TransactionsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ medicineId:'', patientId:'', quantity:'', transactionDate:'', type:'ISSUED' as TTxn });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterQ, setFilterQ] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [sortBy, setSortBy] = useState<'transactionDate'|'type'|'quantity'|'patient'|'medicine'>('transactionDate');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');

  const fetchPatients = async () => { try { const r = await fetch('/api/patients'); const d = await r.json().catch(()=>[]); setPatients(Array.isArray(d)?d:[]);} catch{} };
  const fetchMedicines = async () => { try { const r = await fetch('/api/medicines'); const d = await r.json().catch(()=>[]); setMedicines(Array.isArray(d)?d:[]);} catch{} };
  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/pharmacytransactions'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchPatients(); fetchMedicines(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ 
    const q = filterQ.trim().toLowerCase();
    let arr = items;
    if(q) arr = arr.filter((it:any)=> [it.patient?.firstName, it.patient?.lastName, it.medicine?.name, it.type].some((v:any)=> String(v||'').toLowerCase().includes(q)));
    arr = [...arr].sort((a:any,b:any)=>{
      const val = (x:any)=> {
        if (sortBy==='patient') return `${x.patient?.firstName||''} ${x.patient?.lastName||''}`.toLowerCase();
        if (sortBy==='medicine') return String(x.medicine?.name||'').toLowerCase();
        if (sortBy==='transactionDate') return new Date(x.transactionDate).getTime();
        return x[sortBy];
      };
      const av = val(a); const bv = val(b);
      if (av < bv) return sortDir==='asc'? -1: 1;
      if (av > bv) return sortDir==='asc'? 1: -1;
      return 0;
    });
    return arr; 
  }, [items, filterQ, sortBy, sortDir]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!form.patientId || !form.medicineId) { setMessage({ type:'error', text:'Patient and Medicine are required.' }); setLoading(false); return; }
      if (form.quantity === '' || Number(form.quantity) <= 0) { setMessage({ type:'error', text:'Quantity must be greater than 0.' }); setLoading(false); return; }
      if (!form.transactionDate) { setMessage({ type:'error', text:'Transaction date is required.' }); setLoading(false); return; }
      const payload: any = { ...form };
      if (payload.medicineId) payload.medicineId = Number(payload.medicineId);
      if (payload.patientId) payload.patientId = Number(payload.patientId);
      if (payload.quantity) payload.quantity = Number(payload.quantity);
      if (payload.transactionDate) payload.transactionDate = new Date(payload.transactionDate).toISOString();
      const res = await apiFetch('/api/pharmacytransactions', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ medicineId:'', patientId:'', quantity:'', transactionDate:'', type:'ISSUED' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ medicineId: String(it.medicineId||''), patientId: String(it.patientId||''), quantity: String(it.quantity??''), transactionDate: it.transactionDate? new Date(it.transactionDate).toISOString().slice(0,16):'', type: it.type||'ISSUED' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete transaction?')) return; setLoading(true); try { const res = await apiFetch('/api/pharmacytransactions', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Pharmacy Transactions</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search patient/medicine/type" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <div className="flex gap-2 w-full md:w-auto">
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border p-2 rounded">
              <option value="transactionDate">Date</option>
              <option value="patient">Patient</option>
              <option value="medicine">Medicine</option>
              <option value="type">Type</option>
              <option value="quantity">Quantity</option>
            </select>
            <select value={sortDir} onChange={e=>setSortDir(e.target.value as any)} className="border p-2 rounded">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
            <button type="button" className="border px-3 rounded" onClick={()=>{
              const headers = ['ID','Date','Patient','Medicine','Type','Quantity'];
              const rows = filtered.map((it:any)=> [it.id,new Date(it.transactionDate).toISOString(),`${it.patient?.firstName||''} ${it.patient?.lastName||''}`.trim(),it.medicine?.name||'',it.type,it.quantity]);
              const csv = [headers, ...rows].map(r=> r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'pharmacy-transactions.csv'; a.click(); URL.revokeObjectURL(url);
            }}>Export CSV</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.patientId} onChange={e=>setForm({ ...form, patientId: e.target.value })} required>
            <option value="">-- Patient --</option>
            {patients.map((p:any)=> <option key={p.id} value={p.id}>{p.hospitalNo} - {p.firstName} {p.lastName}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.medicineId} onChange={e=>setForm({ ...form, medicineId: e.target.value })} required>
            <option value="">-- Medicine --</option>
            {medicines.map((m:any)=> <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <input type="number" className="border p-2 rounded" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({ ...form, quantity: e.target.value })} required />
          <input type="datetime-local" className="border p-2 rounded" value={form.transactionDate} onChange={e=>setForm({ ...form, transactionDate: e.target.value })} required />
          <select className="border p-2 rounded" value={form.type} onChange={e=>setForm({ ...form, type: e.target.value })}>
            {(['ISSUED','RETURNED','STOCKED'] as TTxn[]).map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ medicineId:'', patientId:'', quantity:'', transactionDate:'', type:'ISSUED' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Date</th><th className="p-2 border text-left">Patient</th><th className="p-2 border text-left">Medicine</th><th className="p-2 border text-left">Type</th><th className="p-2 border text-left">Qty</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{new Date(it.transactionDate).toLocaleString()}</td>
                  <td className="p-2">{it.patient ? `${it.patient.firstName} ${it.patient.lastName}` : it.patientId}</td>
                  <td className="p-2">{it.medicine?.name || it.medicineId}</td>
                  <td className="p-2">{it.type}</td>
                  <td className="p-2">{it.quantity}</td>
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

export default TransactionsPage;
