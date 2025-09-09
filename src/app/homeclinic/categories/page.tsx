"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Category { id:number; categoryName:string; services?: any[] }

const CategoriesPage: React.FC = () => {
  const [items,setItems]=useState<Category[]>([]);
  const [form,setForm]=useState<{id:number|null; categoryName:string}>({id:null, categoryName:''});
  const [loading,setLoading]=useState(false);
  const [q,setQ]=useState('');
  const [msg,setMsg]=useState<{type:string;text:string}|null>(null);

  const load= async()=>{
    try { const r= await fetch('/api/categories'); const d= await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch { setItems([]);} }
  useEffect(()=>{load();},[]);

  const filtered = useMemo(()=> items.filter(i=>!q || i.categoryName.toLowerCase().includes(q.toLowerCase())),[items,q]);

  const submit= async(e:React.FormEvent)=>{e.preventDefault(); if(!form.categoryName.trim()) return; setLoading(true); setMsg({type:'info',text: form.id?'Updating...':'Creating...'}); try { const res= await fetch('/api/categories',{method: form.id?'PUT':'POST', body: JSON.stringify(form.id?{ id: form.id, categoryName: form.categoryName }: { categoryName: form.categoryName })}); const data= await res.json().catch(()=>({})); if(!res.ok){ setMsg({type:'error',text:data.error||'Failed'});} else { setMsg({type:'success',text: form.id?'Updated':'Created'}); setForm({id:null,categoryName:''}); await load(); } } finally { setLoading(false);} };
  const edit=(c:Category)=> setForm({id:c.id, categoryName:c.categoryName});
  const del= async(id:number)=>{ if(!confirm('Delete category?')) return; setLoading(true); try { const r= await fetch('/api/categories',{method:'DELETE', body: JSON.stringify({id})}); if(r.ok) { setMsg({type:'success',text:'Deleted'}); await load(); } else setMsg({type:'error',text:'Delete failed'});} finally { setLoading(false);} };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-start justify-between mb-6"><h1 className="text-2xl font-semibold">Categories</h1><LogoutButton/></div>
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded ${msg.type==='error'?'bg-red-100 text-red-700': msg.type==='success'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{msg.text}</div>}
        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6 flex flex-col sm:flex-row gap-3">
          <input value={form.categoryName} onChange={e=>setForm(f=>({...f,categoryName:e.target.value}))} placeholder="Category name" className="border p-2 rounded flex-1" required />
          <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">{form.id?'Update':'Add'}</button>
          {form.id && <button type="button" onClick={()=>setForm({id:null,categoryName:''})} className="px-3 py-2 rounded border">Cancel</button>}
        </form>
        <div className="mb-3 flex items-center gap-2"><input placeholder="Search" value={q} onChange={e=>setQ(e.target.value)} className="border p-2 rounded w-full max-w-xs" /></div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b bg-gray-50"><th className="p-2">Name</th><th className="p-2">Services</th><th className="p-2 w-40">Actions</th></tr></thead>
            <tbody>
              {filtered.map(c=> (
                <tr key={c.id} className="border-b last:border-0">
                  <td className="p-2">{c.categoryName}</td>
                  <td className="p-2">{c.services?.length ?? '-'}</td>
                  <td className="p-2 space-x-2">
                    <button onClick={()=>edit(c)} className="px-2 py-1 text-xs rounded bg-emerald-600 text-white">Edit</button>
                    <button onClick={()=>del(c.id)} className="px-2 py-1 text-xs rounded bg-red-600 text-white">Del</button>
                  </td>
                </tr>
              ))}
              {filtered.length===0 && <tr><td colSpan={3} className="p-4 text-center text-gray-400">No categories</td></tr>}
            </tbody>
          </table>
        </div>
        {loading && <div className="mt-4"><LoadingSpinner/></div>}
      </main>
    </div>
  );
};

export default CategoriesPage;
