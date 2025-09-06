"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const LabRequestsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ patientId:'', doctorId:'', testId:'', requestDate:'', status:'PENDING', imageURL:'', imageBase64:'' });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterQ, setFilterQ] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [tests, setTests] = useState<any[]>([]);

  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/labrequests'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  const fetchPatients = async () => { try { const r = await fetch('/api/patients'); const d = await r.json().catch(()=>[]); setPatients(Array.isArray(d)?d:[]);} catch{} };
  const fetchDoctors = async () => { try { const r = await fetch('/api/doctors'); const d = await r.json().catch(()=>[]); setDoctors(Array.isArray(d)?d:[]);} catch{} };
  const fetchTests = async () => { try { const r = await fetch('/api/labtests'); const d = await r.json().catch(()=>[]); setTests(Array.isArray(d)?d:[]);} catch{} };
  useEffect(()=>{ fetchPatients(); fetchDoctors(); fetchTests(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); if(!q) return items; return items.filter((it:any)=> [it.status, it.patient?.firstName, it.patient?.lastName, it.doctor?.firstName, it.doctor?.lastName, it.test?.testName].some((v:any)=> String(v||'').toLowerCase().includes(q))); }, [items, filterQ]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload: any = { ...form };
      if (payload.patientId) payload.patientId = Number(payload.patientId);
      if (payload.doctorId) payload.doctorId = Number(payload.doctorId);
      if (payload.testId) payload.testId = Number(payload.testId);
      if (payload.requestDate) payload.requestDate = new Date(payload.requestDate).toISOString();
      if (payload.imageURL === '') delete payload.imageURL;
      if (payload.imageBase64 === '') delete payload.imageBase64;
      const res = await apiFetch('/api/labrequests', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ patientId:'', doctorId:'', testId:'', requestDate:'', status:'PENDING', imageURL:'', imageBase64:'' }); setImagePreview(''); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ patientId:String(it.patientId), doctorId:String(it.doctorId), testId:String(it.testId), requestDate: new Date(it.requestDate).toISOString().slice(0,16), status: it.status||'', imageURL: it.imageURL||'', imageBase64: it.imageBase64||'' });
    // derive preview from existing fields
    if (it.imageBase64) setImagePreview(`data:image/*;base64,${it.imageBase64}`);
    else if (it.imageURL) setImagePreview(it.imageURL);
    else setImagePreview('');
    setEditingId(it.id);
  };
  const handleFileChange = async (file?: File | null) => {
    if (!file) { setForm((f:any)=>({ ...f, imageBase64:'' })); setImagePreview(''); return; }
    // Read file as Data URL, strip the base64 part for storage
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      setForm((f:any)=> ({ ...f, imageBase64: base64 }));
      setImagePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete lab request?')) return; setLoading(true); try { const res = await apiFetch('/api/labrequests', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Lab Requests</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search patient/doctor/test/status" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
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
          <select className="border p-2 rounded" value={form.testId} onChange={e=>setForm({ ...form, testId: e.target.value })} required>
            <option value="">-- Lab Test --</option>
            {tests.map((t:any)=> <option key={t.id} value={t.id}>{t.testName}</option>)}
          </select>
          <input type="datetime-local" className="border p-2 rounded" value={form.requestDate} onChange={e=>setForm({ ...form, requestDate: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Status" value={form.status} onChange={e=>setForm({ ...form, status: e.target.value })} required />
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
            <input className="border p-2 rounded md:col-span-2" placeholder="Image URL (optional)" value={form.imageURL} onChange={e=>setForm({ ...form, imageURL: e.target.value })} />
            <input type="file" accept="image/*" className="border p-2 rounded" onChange={e=>handleFileChange(e.target.files?.[0])} />
          </div>
          {imagePreview && (
            <div className="md:col-span-3 flex items-center gap-3">
              <img src={imagePreview} alt="Preview" className="h-24 w-24 object-cover rounded border" />
              <button type="button" className="bg-gray-300 px-3 py-1 rounded" onClick={()=>{ setForm((f:any)=>({ ...f, imageBase64:'' })); setImagePreview(''); }}>Clear Image</button>
            </div>
          )}
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ patientId:'', doctorId:'', testId:'', requestDate:'', status:'PENDING', imageURL:'', imageBase64:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Date</th><th className="p-2 border text-left">Patient</th><th className="p-2 border text-left">Doctor</th><th className="p-2 border text-left">Test</th><th className="p-2 border text-left hidden md:table-cell">Status</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{new Date(it.requestDate).toLocaleString()}</td>
                  <td className="p-2">{it.patient ? `${it.patient.firstName} ${it.patient.lastName}` : it.patientId}</td>
                  <td className="p-2">{it.doctor ? `${it.doctor.firstName} ${it.doctor.lastName}` : it.doctorId}</td>
                  <td className="p-2">{it.test ? it.test.testName : it.testId}</td>
                  <td className="p-2 hidden md:table-cell">{it.status}</td>
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

export default LabRequestsPage;
