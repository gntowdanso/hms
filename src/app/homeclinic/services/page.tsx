"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Category { id:number; categoryName:string }
interface SampleType { id:number; sampleName:string }
interface Service { id:number; serviceName:string; price:number; category:{id:number;categoryName:string}; sampleType:{id:number;sampleName:string}; turnaroundTime?:string }

const ServicesPage: React.FC = () => {
  const [services,setServices]=useState<Service[]>([]);
  const [categories,setCategories]=useState<Category[]>([]);
  const [sampleTypes,setSampleTypes]=useState<SampleType[]>([]);
  const [form,setForm]=useState<any>({id:null, serviceName:'', categoryId:'', sampleTypeId:'', price:'', description:'', preparationInstructions:'', turnaroundTime:''});
  const [loading,setLoading]=useState(false); const [q,setQ]=useState(''); const [msg,setMsg]=useState<{type:string;text:string}|null>(null);

  const load= async()=>{
    try { const [sv,cat,st] = await Promise.all([
      fetch('/api/services').then(r=>r.json().catch(()=>[])),
      fetch('/api/categories').then(r=>r.json().catch(()=>[])),
      fetch('/api/sampletypes').then(r=>r.json().catch(()=>[])),
    ]); setServices(Array.isArray(sv)?sv:[]); setCategories(Array.isArray(cat)?cat:[]); setSampleTypes(Array.isArray(st)?st:[]);} catch {}
  };
  useEffect(()=>{load();},[]);

  const filtered = useMemo(()=> services.filter(s=> !q || s.serviceName.toLowerCase().includes(q.toLowerCase())),[services,q]);

  const submit= async(e:React.FormEvent)=>{e.preventDefault(); if(!form.serviceName || !form.categoryId || !form.sampleTypeId) return; setLoading(true); setMsg({type:'info',text: form.id?'Updating...':'Creating...'}); try { const payload={...form, price: Number(form.price||0)}; const res= await fetch('/api/services',{method: form.id?'PUT':'POST', body: JSON.stringify(form.id?payload:payload)}); if(res.ok){ setMsg({type:'success',text: form.id?'Updated':'Created'}); setForm({id:null, serviceName:'', categoryId:'', sampleTypeId:'', price:'', description:'', preparationInstructions:'', turnaroundTime:''}); await load(); } else setMsg({type:'error',text:'Failed'});} finally { setLoading(false);} };
  const edit=(s:Service)=> setForm({ id:s.id, serviceName:s.serviceName, categoryId:s.category.id, sampleTypeId:s.sampleType.id, price:s.price, description:(s as any).description||'', preparationInstructions:(s as any).preparationInstructions||'', turnaroundTime:(s as any).turnaroundTime||'' });
  const del= async(id:number)=>{ if(!confirm('Delete service?')) return; setLoading(true); try { const r= await fetch('/api/services',{method:'DELETE', body: JSON.stringify({id})}); if(r.ok){ setMsg({type:'success',text:'Deleted'}); await load(); } else setMsg({type:'error',text:'Delete failed'});} finally { setLoading(false);} };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-start justify-between mb-6"><h1 className="text-2xl font-semibold">Services(CBC, X-ray,LAB, Urinalysis etc)</h1><LogoutButton/></div>
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded ${msg.type==='error'?'bg-red-100 text-red-700': msg.type==='success'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{msg.text}</div>}
        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.serviceName} onChange={e=>setForm((f:any)=>({...f,serviceName:e.target.value}))} placeholder="Service name" className="border p-2 rounded" required />
          <select value={form.categoryId} onChange={e=>setForm((f:any)=>({...f,categoryId:e.target.value}))} className="border p-2 rounded" required><option value="">Category</option>{categories.map(c=> <option key={c.id} value={c.id}>{c.categoryName}</option>)}</select>
          <select value={form.sampleTypeId} onChange={e=>setForm((f:any)=>({...f,sampleTypeId:e.target.value}))} className="border p-2 rounded" required><option value="">Sample Type</option>{sampleTypes.map(s=> <option key={s.id} value={s.id}>{s.sampleName}</option>)}</select>
          <input type="number" step="0.01" value={form.price} onChange={e=>setForm((f:any)=>({...f,price:e.target.value}))} placeholder="Price" className="border p-2 rounded" required />
          <input value={form.turnaroundTime} onChange={e=>setForm((f:any)=>({...f,turnaroundTime:e.target.value}))} placeholder="Turnaround (e.g. 24h)" className="border p-2 rounded" />
          <input value={form.preparationInstructions} onChange={e=>setForm((f:any)=>({...f,preparationInstructions:e.target.value}))} placeholder="Preparation instructions" className="border p-2 rounded md:col-span-2" />
          <textarea value={form.description} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} placeholder="Description" className="border p-2 rounded md:col-span-3" />
          <div className="md:col-span-3 flex gap-2">
            <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">{form.id?'Update':'Add Service'}</button>
            {form.id && <button type="button" onClick={()=>setForm({id:null, serviceName:'', categoryId:'', sampleTypeId:'', price:'', description:'', preparationInstructions:'', turnaroundTime:''})} className="px-3 py-2 rounded border">Cancel</button>}
          </div>
        </form>
        <div className="mb-3 flex items-center gap-2"><input placeholder="Search services" value={q} onChange={e=>setQ(e.target.value)} className="border p-2 rounded w-full max-w-xs" /></div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b bg-gray-50"><th className="p-2">Name</th><th className="p-2">Category</th><th className="p-2">Sample Type</th><th className="p-2">Price</th><th className="p-2">Turnaround</th><th className="p-2 w-40">Actions</th></tr></thead>
            <tbody>{filtered.map(s=> <tr key={s.id} className="border-b last:border-0"><td className="p-2">{s.serviceName}</td><td className="p-2">{s.category?.categoryName}</td><td className="p-2">{s.sampleType?.sampleName}</td><td className="p-2">{Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS'}).format((s as any).price || 0)}</td><td className="p-2">{(s as any).turnaroundTime || '-'}</td><td className="p-2 space-x-2"><button onClick={()=>edit(s)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded">Edit</button><button onClick={()=>del(s.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Del</button></td></tr>)}{filtered.length===0 && <tr><td colSpan={6} className="p-4 text-center text-gray-400">No services</td></tr>}</tbody>
          </table>
        </div>
        {loading && <div className="mt-4"><LoadingSpinner/></div>}
      </main>
    </div>
  );
};
export default ServicesPage;
