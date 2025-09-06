"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const SuppliersPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ name:'', contactInfo:'', email:'', address:'' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'name'|'email'|'address'|'contactInfo'>('name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/suppliers'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  useEffect(()=>{ fetchItems(); }, []);

  const filtered = useMemo(()=>{ 
    const q = filterQ.trim().toLowerCase();
    let arr = items;
    if(q) arr = arr.filter((it:any)=> [it.name, it.email, it.address, it.contactInfo].some((v:any)=> String(v||'').toLowerCase().includes(q)));
    arr = [...arr].sort((a:any,b:any)=>{
      const av = String(a[sortBy]||'').toLowerCase();
      const bv = String(b[sortBy]||'').toLowerCase();
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
      if (!form.name?.trim()) { setMessage({ type:'error', text:'Name is required.' }); setLoading(false); return; }
      const payload: any = { ...form };
      const res = await apiFetch('/api/suppliers', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ name:'', contactInfo:'', email:'', address:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ name: it.name||'', contactInfo: it.contactInfo||'', email: it.email||'', address: it.address||'' }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete supplier?')) return; setLoading(true); try { const res = await apiFetch('/api/suppliers', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Suppliers</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search name/email" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <div className="flex gap-2 w-full md:w-auto">
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border p-2 rounded">
              <option value="name">Name</option>
              <option value="email">Email</option>
              <option value="address">Address</option>
              <option value="contactInfo">Contact</option>
            </select>
            <select value={sortDir} onChange={e=>setSortDir(e.target.value as any)} className="border p-2 rounded">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
            <button type="button" className="border px-3 rounded" onClick={()=>{
              const headers = ['ID','Name','Email','Address','Contact'];
              const rows = filtered.map((it:any)=> [it.id,it.name,it.email,it.address,it.contactInfo]);
              const csv = [headers, ...rows].map(r=> r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'suppliers.csv'; a.click(); URL.revokeObjectURL(url);
            }}>Export CSV</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Contact Info" value={form.contactInfo} onChange={e=>setForm({ ...form, contactInfo: e.target.value })} />
          <input className="border p-2 rounded" type="email" placeholder="Email" value={form.email} onChange={e=>setForm({ ...form, email: e.target.value })} />
          <input className="border p-2 rounded md:col-span-3" placeholder="Address" value={form.address} onChange={e=>setForm({ ...form, address: e.target.value })} />
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ name:'', contactInfo:'', email:'', address:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Name</th><th className="p-2 border text-left">Email</th><th className="p-2 border text-left">Address</th><th className="p-2 border text-left">Contact</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.email}</td>
                  <td className="p-2">{it.address}</td>
                  <td className="p-2">{it.contactInfo}</td>
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

export default SuppliersPage;
