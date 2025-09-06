"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

type Rx = any;
type RxDetail = any;

const PrescriptionsPage: React.FC = () => {
  const [items, setItems] = useState<Rx[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ patientId: '', doctorId: '', date: '', notes: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  // inline detail editor state per prescription id
  const [detailDrafts, setDetailDrafts] = useState<Record<number, RxDetail>>({});

  const fetchPatients = async () => { try { const r = await fetch('/api/patients'); const d = await r.json().catch(()=>[]); setPatients(Array.isArray(d)?d:[]);} catch{} };
  const fetchDoctors = async () => { try { const r = await fetch('/api/doctors'); const d = await r.json().catch(()=>[]); setDoctors(Array.isArray(d)?d:[]);} catch{} };
  const fetchMedicines = async () => { try { const r = await fetch('/api/medicines'); const d = await r.json().catch(()=>[]); setMedicines(Array.isArray(d)?d:[]);} catch{} };
  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/prescriptions'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchPatients(); fetchDoctors(); fetchMedicines(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); if(!q) return items; return items.filter((it:any)=> [it.notes, it.patient?.firstName, it.patient?.lastName, it.doctor?.firstName, it.doctor?.lastName].some((v:any)=> String(v||'').toLowerCase().includes(q))); }, [items, filterQ]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload: any = { ...form };
      if (payload.patientId) payload.patientId = Number(payload.patientId);
      if (payload.doctorId) payload.doctorId = Number(payload.doctorId);
      if (payload.date) payload.date = new Date(payload.date).toISOString();
      const res = await apiFetch('/api/prescriptions', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ patientId:'', doctorId:'', date:'', notes:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ patientId: it.patientId? String(it.patientId):'', doctorId: it.doctorId? String(it.doctorId):'', date: it.date? new Date(it.date).toISOString().slice(0,16):'', notes: it.notes||'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete prescription?')) return; setLoading(true); try { const res = await apiFetch('/api/prescriptions', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  // Detail helpers
  const getDraft = (rxId:number)=> detailDrafts[rxId] || { prescriptionId: rxId, medicineId:'', dosage:'', frequency:'', duration:'' };
  const setDraft = (rxId:number, patch:Partial<RxDetail>)=> setDetailDrafts(prev=> ({ ...prev, [rxId]: { ...getDraft(rxId), ...patch }}));
  const addDetail = async (rxId:number)=>{
    const draft = getDraft(rxId);
    if (!draft.medicineId || !draft.dosage || !draft.frequency || !draft.duration) { setMessage({ type:'error', text:'Fill all detail fields' }); return; }
    setLoading(true);
    try {
      const payload = { ...draft, medicineId: Number(draft.medicineId), prescriptionId: rxId };
      const res = await apiFetch('/api/prescriptiondetails', { method:'POST', body: JSON.stringify(payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Add detail failed' });
      else { setMessage({ type:'success', text:'Detail added' }); setDetailDrafts(prev=> ({ ...prev, [rxId]: { prescriptionId: rxId, medicineId:'', dosage:'', frequency:'', duration:'' } })); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Add detail failed' }); }
    setLoading(false);
  };
  const deleteDetail = async (detailId:number)=>{
    if (!confirm('Delete detail?')) return; setLoading(true);
    try { const res = await apiFetch('/api/prescriptiondetails', { method:'DELETE', body: JSON.stringify({ id: detailId }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else { setMessage({ type:'success', text:'Detail deleted' }); await fetchItems(); } } catch { setMessage({ type:'error', text:'Delete failed' }); }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Prescriptions</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search patient/doctor/notes" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded w-full md:w-auto"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.patientId} onChange={e=>setForm({ ...form, patientId: e.target.value })} required>
            <option value="">-- Patient --</option>
            {patients.map((p:any)=> <option key={p.id} value={p.id}>{p.hospitalNo} - {p.firstName} {p.lastName}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.doctorId} onChange={e=>setForm({ ...form, doctorId: e.target.value })} required>
            <option value="">-- Doctor --</option>
            {doctors.map((d:any)=> <option key={d.id} value={d.id}>{d.firstName} {d.lastName}</option>)}
          </select>
          <input type="datetime-local" className="border p-2 rounded" value={form.date} onChange={e=>setForm({ ...form, date: e.target.value })} required />
          <input className="border p-2 rounded md:col-span-2" placeholder="Notes" value={form.notes} onChange={e=>setForm({ ...form, notes: e.target.value })} />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ patientId:'', doctorId:'', date:'', notes:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Date</th><th className="p-2 border text-left">Patient</th><th className="p-2 border text-left">Doctor</th><th className="p-2 border text-left hidden md:table-cell">Notes</th><th className="p-2 border">Details</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((rx:any)=> (
                <tr key={rx.id} className="border-t align-top">
                  <td className="p-2 hidden md:table-cell">{rx.id}</td>
                  <td className="p-2">{new Date(rx.date).toLocaleString()}</td>
                  <td className="p-2">{rx.patient ? `${rx.patient.firstName} ${rx.patient.lastName}` : rx.patientId}</td>
                  <td className="p-2">{rx.doctor ? `${rx.doctor.firstName} ${rx.doctor.lastName}` : rx.doctorId}</td>
                  <td className="p-2 hidden md:table-cell">{rx.notes}</td>
                  <td className="p-2">
                    <div className="space-y-2">
                      {(rx.details||[]).map((d:any)=> (
                        <div key={d.id} className="flex flex-col md:flex-row gap-2 items-start md:items-center border p-2 rounded">
                          <div className="flex-1">{d.medicine ? d.medicine.name : d.medicineId} • {d.dosage} • {d.frequency} • {d.duration}</div>
                          <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>deleteDetail(d.id)}>Remove</button>
                        </div>
                      ))}
                      <div className="flex flex-col md:flex-row gap-2 items-start md:items-center border-t pt-2">
                        <select className="border p-2 rounded" value={getDraft(rx.id).medicineId} onChange={e=>setDraft(rx.id, { medicineId: e.target.value })}>
                          <option value="">-- Medicine --</option>
                          {medicines.map((m:any)=> <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                        <input className="border p-2 rounded" placeholder="Dosage" value={getDraft(rx.id).dosage} onChange={e=>setDraft(rx.id, { dosage: e.target.value })} />
                        <input className="border p-2 rounded" placeholder="Frequency" value={getDraft(rx.id).frequency} onChange={e=>setDraft(rx.id, { frequency: e.target.value })} />
                        <input className="border p-2 rounded" placeholder="Duration" value={getDraft(rx.id).duration} onChange={e=>setDraft(rx.id, { duration: e.target.value })} />
                        <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={()=>addDetail(rx.id)}>Add</button>
                      </div>
                    </div>
                  </td>
                  <td className="p-2"><div className="flex flex-col md:flex-row gap-2"><button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(rx)}>Edit</button><button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(rx.id)}>Delete</button></div></td>
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

export default PrescriptionsPage;
