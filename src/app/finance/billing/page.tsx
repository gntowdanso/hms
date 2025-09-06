"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type TBillingStatus = 'PAID'|'UNPAID'|'PARTIAL';

const BillingPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ patientId:'', admissionId:'', feesAndChargesId:'', quantity:'', unit:'', totalAmount:'', status:'UNPAID' as TBillingStatus, billingDate: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'billingDate'|'status'|'patient'>('billingDate');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchPatients = async () => { try { const r = await fetch('/api/patients'); const d = await r.json().catch(()=>[]); setPatients(Array.isArray(d)?d:[]);} catch{} };
  const fetchAdmissions = async () => { try { const r = await fetch('/api/admissions'); const d = await r.json().catch(()=>[]); setAdmissions(Array.isArray(d)?d:[]);} catch{} };
  const fetchFees = async () => { try { const r = await fetch('/api/feesandcharges'); const d = await r.json().catch(()=>[]); setFees(Array.isArray(d)?d:[]);} catch{} };
  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/billings'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchPatients(); fetchAdmissions(); fetchFees(); fetchItems(); }, []);

  useEffect(()=>{
    // auto compute totalAmount from fee and quantity if both present
    const q = Number(form.quantity||0); const fee = fees.find((f:any)=> String(f.id) === String(form.feesAndChargesId));
    if (fee && !editingId) { setForm((prev:any)=> ({ ...prev, unit: prev.unit || fee.unit, totalAmount: q * Number(fee.amountPerUnit) })); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.quantity, form.feesAndChargesId, fees]);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); let arr = items; if(q) arr = arr.filter((it:any)=> [`${it.patient?.firstName||''} ${it.patient?.lastName||''}`, it.status, it.feesAndCharges?.type].some((v:any)=> String(v||'').toLowerCase().includes(q))); arr = [...arr].sort((a:any,b:any)=>{ const val=(x:any)=> sortBy==='patient'? `${x.patient?.firstName||''} ${x.patient?.lastName||''}`.toLowerCase() : (sortBy==='billingDate'? new Date(x.billingDate).getTime() : x[sortBy]); const av=val(a), bv=val(b); if(av<bv) return sortDir==='asc'?-1:1; if(av>bv) return sortDir==='asc'?1:-1; return 0; }); return arr; }, [items, filterQ, sortBy, sortDir]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!form.patientId || !form.feesAndChargesId || form.quantity==='' || Number(form.quantity) <= 0 || !form.billingDate) { setMessage({ type:'error', text:'Patient, Fee, Quantity (>0), and Billing Date are required.' }); setLoading(false); return; }
      const payload: any = { ...form };
      if (payload.patientId) payload.patientId = Number(payload.patientId);
      if (payload.admissionId) payload.admissionId = Number(payload.admissionId);
      if (payload.feesAndChargesId) payload.feesAndChargesId = Number(payload.feesAndChargesId);
      if (payload.quantity) payload.quantity = Number(payload.quantity);
      if (payload.totalAmount) payload.totalAmount = Number(payload.totalAmount);
      if (payload.billingDate) payload.billingDate = new Date(payload.billingDate).toISOString();
      const res = await apiFetch('/api/billings', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ patientId:'', admissionId:'', feesAndChargesId:'', quantity:'', unit:'', totalAmount:'', status:'UNPAID', billingDate:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ patientId: String(it.patientId||''), admissionId: it.admissionId? String(it.admissionId):'', feesAndChargesId: String(it.feesAndChargesId||''), quantity: String(it.quantity??''), unit: it.unit||'', totalAmount: String(it.totalAmount??''), status: it.status||'UNPAID', billingDate: it.billingDate? new Date(it.billingDate).toISOString().slice(0,10):'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete billing?')) return; setLoading(true); try { const res = await apiFetch('/api/billings', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Billing</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search patient/status/fee" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <div className="flex gap-2 w-full md:w-auto">
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border p-2 rounded"><option value="billingDate">Date</option><option value="patient">Patient</option><option value="status">Status</option></select>
            <select value={sortDir} onChange={e=>setSortDir(e.target.value as any)} className="border p-2 rounded"><option value="asc">Asc</option><option value="desc">Desc</option></select>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
            <button type="button" className="border px-3 rounded" onClick={()=>{ const headers=['ID','Date','Patient','Fee','Qty','Unit','Total','Status']; const rows = filtered.map((it:any)=>[it.id,new Date(it.billingDate).toISOString().slice(0,10),`${it.patient?.firstName||''} ${it.patient?.lastName||''}`.trim(),it.feesAndCharges?.type||'',it.quantity,it.unit,it.totalAmount,it.status]); const csv=[headers,...rows].map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='billing.csv'; a.click(); URL.revokeObjectURL(url); }}>Export CSV</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.patientId} onChange={e=>setForm({ ...form, patientId: e.target.value })} required>
            <option value="">-- Patient --</option>
            {patients.map((p:any)=> <option key={p.id} value={p.id}>{p.hospitalNo} - {p.firstName} {p.lastName}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.admissionId} onChange={e=>setForm({ ...form, admissionId: e.target.value })}>
            <option value="">-- Admission (optional) --</option>
            {admissions.map((a:any)=> <option key={a.id} value={a.id}>{a.id} - {new Date(a.admissionDate).toLocaleDateString()}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.feesAndChargesId} onChange={e=>setForm({ ...form, feesAndChargesId: e.target.value })} required>
            <option value="">-- Fee Type --</option>
            {fees.map((f:any)=> <option key={f.id} value={f.id}>{f.type} ({f.amountPerUnit}/{f.unit})</option>)}
          </select>
          <input type="number" className="border p-2 rounded" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({ ...form, quantity: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Unit" value={form.unit} onChange={e=>setForm({ ...form, unit: e.target.value })} />
          <input type="number" step="0.01" className="border p-2 rounded" placeholder="Total Amount" value={form.totalAmount} onChange={e=>setForm({ ...form, totalAmount: e.target.value })} />
          <input type="date" className="border p-2 rounded" value={form.billingDate} onChange={e=>setForm({ ...form, billingDate: e.target.value })} required />
          <select className="border p-2 rounded" value={form.status} onChange={e=>setForm({ ...form, status: e.target.value })}>
            {(['PAID','UNPAID','PARTIAL'] as TBillingStatus[]).map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ patientId:'', admissionId:'', feesAndChargesId:'', quantity:'', unit:'', totalAmount:'', status:'UNPAID', billingDate:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Date</th><th className="p-2 border text-left">Patient</th><th className="p-2 border text-left">Fee</th><th className="p-2 border text-left">Qty</th><th className="p-2 border text-left">Unit</th><th className="p-2 border text-left">Total</th><th className="p-2 border text-left">Status</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{new Date(it.billingDate).toLocaleDateString()}</td>
                  <td className="p-2">{it.patient ? `${it.patient.firstName} ${it.patient.lastName}` : it.patientId}</td>
                  <td className="p-2">{it.feesAndCharges?.type}</td>
                  <td className="p-2">{it.quantity}</td>
                  <td className="p-2">{it.unit}</td>
                  <td className="p-2">{it.totalAmount}</td>
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

export default BillingPage;
