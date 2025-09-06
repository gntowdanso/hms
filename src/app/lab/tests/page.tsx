"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const LabTestsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ labTypeId: '', testName: '', description: '', departmentId: '', cost: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterQ, setFilterQ] = useState('');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [labTypes, setLabTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/labtests'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  const fetchLabTypes = async () => { try { const r = await fetch('/api/labtypes'); const d = await r.json().catch(()=>[]); setLabTypes(Array.isArray(d)?d:[]);} catch{} };
  const fetchDepartments = async () => { try { const r = await fetch('/api/departments'); const d = await r.json().catch(()=>[]); setDepartments(Array.isArray(d)?d:[]);} catch{} };
  useEffect(()=>{ fetchLabTypes(); fetchDepartments(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ const q = filterQ.trim().toLowerCase(); if(!q) return items; return items.filter((it:any)=> [it.testName, it.description, it.labtype?.name, it.department?.name].some((v:any)=> String(v||'').toLowerCase().includes(q))); }, [items, filterQ]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      const payload: any = { ...form };
      if (payload.labTypeId) payload.labTypeId = Number(payload.labTypeId);
      if (payload.departmentId) payload.departmentId = Number(payload.departmentId);
      if (payload.cost !== '') payload.cost = Number(payload.cost);
      const res = await apiFetch('/api/labtests', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ labTypeId:'', testName:'', description:'', departmentId:'', cost:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ labTypeId: it.labTypeId? String(it.labTypeId):'', testName: it.testName||'', description: it.description||'', departmentId: it.departmentId? String(it.departmentId):'', cost: it.cost??'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete test?')) return; setLoading(true); try { const res = await apiFetch('/api/labtests', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Lab Tests</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search test/type/department" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded w-full md:w-auto"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <select className="border p-2 rounded" value={form.labTypeId} onChange={e=>setForm({ ...form, labTypeId: e.target.value })} required>
            <option value="">-- Lab Type --</option>
            {labTypes.map((t:any)=> <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Test name" value={form.testName} onChange={e=>setForm({ ...form, testName: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Description" value={form.description} onChange={e=>setForm({ ...form, description: e.target.value })} />
          <select className="border p-2 rounded" value={form.departmentId} onChange={e=>setForm({ ...form, departmentId: e.target.value })} required>
            <option value="">-- Department --</option>
            {departments.map((d:any)=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="Cost" type="number" step="0.01" value={form.cost} onChange={e=>setForm({ ...form, cost: e.target.value })} required />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ labTypeId:'', testName:'', description:'', departmentId:'', cost:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Test</th><th className="p-2 border text-left hidden md:table-cell">Type</th><th className="p-2 border text-left hidden md:table-cell">Department</th><th className="p-2 border text-left hidden md:table-cell">Cost</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{it.testName}</td>
                  <td className="p-2 hidden md:table-cell">{it.labtype?.name || it.labTypeId}</td>
                  <td className="p-2 hidden md:table-cell">{it.department?.name || it.departmentId}</td>
                  <td className="p-2 hidden md:table-cell">{it.cost}</td>
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

export default LabTestsPage;
