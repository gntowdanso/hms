"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';
import { getAuth } from '@/utils/auth';

const NursesPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ username: '', staffNo: '', firstName: '', lastName: '', qualification: '', departmentId: '', wardId: '', contactInfo: '', employmentDate: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterQ, setFilterQ] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchDeps = async () => { try { const r = await fetch('/api/departments'); const d = await r.json().catch(()=>[]); setDepartments(Array.isArray(d)?d:[]);} catch{} };
  const fetchWards = async () => { try { const r = await fetch('/api/wards'); const d = await r.json().catch(()=>[]); setWards(Array.isArray(d)?d:[]);} catch{} };
  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/nurses'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchDeps(); fetchWards(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); if(!q) return items; return items.filter((it:any)=> [it.staffNo,it.firstName,it.lastName].some((v:any)=> String(v||'').toLowerCase().includes(q))); }, [items, filterQ]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const user = getAuth();
      const payload: any = { ...form };
      payload.username = payload.username || user?.username || `${form.firstName}-${form.lastName}`;
      if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
      if (payload.wardId) payload.wardId = Number(payload.wardId);
      if (payload.employmentDate) payload.employmentDate = new Date(payload.employmentDate).toISOString();
      const res = await apiFetch('/api/nurses', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ username:'', staffNo:'', firstName:'', lastName:'', qualification:'', departmentId:'', wardId:'', contactInfo:'', employmentDate:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ username: it.username||'', staffNo: it.staffNo||'', firstName: it.firstName||'', lastName: it.lastName||'', qualification: it.qualification||'', departmentId: it.departmentId? String(it.departmentId):'', wardId: it.wardId? String(it.wardId):'', contactInfo: it.contactInfo||'', employmentDate: it.employmentDate? new Date(it.employmentDate).toISOString().slice(0,10):'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete nurse?')) return; setLoading(true); try { const res = await apiFetch('/api/nurses', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Nurses</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search name or staff no" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded w-full md:w-auto"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="Staff No" value={form.staffNo} onChange={e=>setForm({ ...form, staffNo: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="First name" value={form.firstName} onChange={e=>setForm({ ...form, firstName: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Last name" value={form.lastName} onChange={e=>setForm({ ...form, lastName: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Qualification" value={form.qualification} onChange={e=>setForm({ ...form, qualification: e.target.value })} />
          <select className="border p-2 rounded" value={form.departmentId} onChange={e=>setForm({ ...form, departmentId: e.target.value })} required>
            <option value="">-- Department --</option>
            {departments.map((d:any)=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.wardId} onChange={e=>setForm({ ...form, wardId: e.target.value })} required>
            <option value="">-- Ward --</option>
            {wards.filter((w:any)=> !form.departmentId || w.departmentId === Number(form.departmentId)).map((w:any)=> <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Contact info" value={form.contactInfo} onChange={e=>setForm({ ...form, contactInfo: e.target.value })} />
          <input type="date" className="border p-2 rounded" value={form.employmentDate} onChange={e=>setForm({ ...form, employmentDate: e.target.value })} />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ username:'', staffNo:'', firstName:'', lastName:'', qualification:'', departmentId:'', wardId:'', contactInfo:'', employmentDate:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Staff No</th><th className="p-2 border text-left">First</th><th className="p-2 border text-left hidden md:table-cell">Last</th><th className="p-2 border text-left hidden md:table-cell">Dept</th><th className="p-2 border text-left hidden md:table-cell">Ward</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{it.staffNo}</td>
                  <td className="p-2">{it.firstName}</td>
                  <td className="p-2 hidden md:table-cell">{it.lastName}</td>
                  <td className="p-2 hidden md:table-cell">{it.department?.name}</td>
                  <td className="p-2 hidden md:table-cell">{it.ward?.name}</td>
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

export default NursesPage;
