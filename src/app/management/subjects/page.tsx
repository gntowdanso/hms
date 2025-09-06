"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getAuth } from '@/utils/auth';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';

const SubjectsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ name: '', code: '', departmentId: '', category: '', creditHours: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterName, setFilterName] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const fetchItems = async () => { setLoading(true); try { const res = await fetch('/api/subjects'); const d = await res.json().catch(()=>[]); setItems(Array.isArray(d) ? d : []); } catch(e){} setLoading(false); };
  const fetchDepts = async () => { try { const res = await fetch('/api/departments'); const d = await res.json().catch(()=>[]); setDepartments(Array.isArray(d)?d:[]); } catch(e){} };

  useEffect(()=>{ fetchItems(); fetchDepts(); }, []);

  const safeServerMessage = (resObj: any) => { if (!resObj) return ''; if (typeof resObj === 'string') return resObj; if (typeof resObj === 'object') return (resObj.error || resObj.message || JSON.stringify(resObj)); return String(resObj); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    if (!form.name || !String(form.name).trim()) { setMessage({ type: 'error', text: 'Name required' }); setLoading(false); return; }
  const payload: any = {
    name: form.name,
    code: form.code || null,
    category: form.category || null,
    // treat empty string or null as no value; allow '0' as valid number
    creditHours: form.creditHours !== '' && form.creditHours != null ? Number(form.creditHours) : null,
  };
  if (form.departmentId) payload.departmentId = Number(form.departmentId);
  const user = getAuth(); if (user && user.username) payload.userName = user.username;
    try {
  const res = await apiFetch('/api/subjects', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(()=>({})); if (!res.ok) { setMessage({ type: 'error', text: safeServerMessage(result) || 'Server error' }); setLoading(false); return; }
  setMessage({ type: 'success', text: editingId ? 'Updated' : 'Created' }); setForm({ name: '', code:'', departmentId:'', category: '', creditHours: '' }); setEditingId(null); await fetchItems();
    } catch(e){ setMessage({ type: 'error', text: 'Request failed' }); }
    setLoading(false);
  };

  const handleEdit = (c:any)=>{ setForm({ name: c.name, code: c.code || '', departmentId: c.department ? String(c.department.id) : '', category: c.category || '', creditHours: c.creditHours != null ? String(c.creditHours) : '' }); setEditingId(c.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete subject?')) return; setLoading(true); try { const res = await apiFetch('/api/subjects', { method:'DELETE', body: JSON.stringify({ id }) }); const result = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeServerMessage(result)||'Delete failed' }); else { setMessage({ type:'success', text:'Deleted' }); } await fetchItems(); } catch(e){ setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  const filtered = useMemo(()=>{ if(!Array.isArray(items)) return []; return items.filter(it=>{ if(filterName){ const q = filterName.toLowerCase(); if(!String(it.name||'').toLowerCase().includes(q)) return false; } if(filterDept && it.department){ if(String(it.department.id) !== String(filterDept)) return false; } return true; }); }, [items, filterName, filterDept]);
  const totalFiltered = filtered.length; const start = (page-1)*pageSize; const pageItems = useMemo(()=>filtered.slice(start, start+pageSize), [filtered, start, pageSize]); const showingStart = totalFiltered===0?0:start+1; const showingEnd = Math.min(start+pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Subjects</h2>
        {loading && <LoadingSpinner />}
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} placeholder="Name (e.g., Mathematics)" className="border p-2 rounded" required />
          <input value={form.code} onChange={e=>setForm({...form, code: e.target.value})} placeholder="Code (optional)" className="border p-2 rounded" />
          <input value={form.creditHours} onChange={e=>setForm({...form, creditHours: e.target.value})} placeholder="Credit Hours (optional)" className="border p-2 rounded" />
          <select value={form.departmentId} onChange={e=>setForm({...form, departmentId: e.target.value})} className="border p-2 rounded">
            <option value="">-- Department (optional) --</option>
            {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input value={form.category} onChange={e=>setForm({...form, category: e.target.value})} placeholder="Category (optional)" className="border p-2 rounded" />
          <div className="md:col-span-2 flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ name:'', code:'', departmentId:'', category: '', creditHours: '' }); }}>Cancel</button>}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <input placeholder="Filter by name..." className="border p-2 rounded" value={filterName} onChange={e=>{ setFilterName(e.target.value); setPage(1); }} />
            <select value={filterDept} onChange={e=>{ setFilterDept(e.target.value); setPage(1); }} className="border p-2 rounded">
              <option value="">All departments</option>
              {departments.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-gray-600">Page size</div>
              <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded">
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>

          {message && <div className={`mb-2 p-2 rounded ${message.type==='success'?'bg-green-100 text-green-800':message.type==='error'?'bg-red-100 text-red-800':'bg-blue-100 text-blue-800'}`}>{message.text}</div>}

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Code</th>
                  <th className="p-2 border">Department</th>
                  <th className="p-2 border">Category</th>
                   <th className="p-2 border">Credit Hours</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(it=> (
                  <tr key={it.id} className="border-t">
                    <td className="p-2 border">{it.id}</td>
                    <td className="p-2 border">{it.name}</td>
                    <td className="p-2 border">{it.code}</td>
                    <td className="p-2 border">{it.department ? it.department.name : ''}</td>
                    <td className="p-2 border">{it.category}</td>
                    <td className="p-2 border">{it.creditHours}</td>
                    <td className="p-2 border"><div className="flex gap-2"><button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(it)}>Edit</button><button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(it.id)}>Delete</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Showing {showingStart} - {showingEnd} of {totalFiltered}</div>
            <div className="flex gap-2">
              <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
              <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=> (page*pageSize < totalFiltered ? p+1 : p))} disabled={page*pageSize >= totalFiltered}>Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SubjectsPage;
