"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Service { id:number; serviceName:string }
interface ServicePackage { id:number; packageName:string; price:number; discount?:number; includedTests?: Service[] }

const PackagesPage: React.FC = () => {
  const [services,setServices]=useState<Service[]>([]);
  const [packages,setPackages]=useState<ServicePackage[]>([]);
  const [form,setForm]=useState<any>({id:null, packageName:'', price:'', discount:'', description:'', includedTestIds:[] as number[]});
  const [loading,setLoading]=useState(false); const [q,setQ]=useState(''); const [msg,setMsg]=useState<{type:string;text:string}|null>(null);
  const load= async()=>{ try { const [pk,sv]= await Promise.all([
    fetch('/api/servicepackages').then(r=>r.json().catch(()=>[])),
    fetch('/api/services').then(r=>r.json().catch(()=>[])),
  ]); setPackages(Array.isArray(pk)?pk:[]); setServices(Array.isArray(sv)?sv:[]);} catch {} };
  useEffect(()=>{load();},[]);
  const filtered = useMemo(()=> packages.filter(p=> !q || p.packageName.toLowerCase().includes(q.toLowerCase())),[packages,q]);

  const toggleIncluded = (id:number)=> setForm((f:any)=> ({...f, includedTestIds: f.includedTestIds.includes(id)? f.includedTestIds.filter((x:number)=>x!==id): [...f.includedTestIds,id]}));

  const submit= async(e:React.FormEvent)=>{e.preventDefault(); if(!form.packageName) return; setLoading(true); setMsg({type:'info',text: form.id?'Updating...':'Creating...'}); try { const payload={...form, price: Number(form.price||0), discount: form.discount? Number(form.discount): null}; const res= await fetch('/api/servicepackages',{method: form.id?'PUT':'POST', body: JSON.stringify(payload)}); if(res.ok){ setMsg({type:'success',text: form.id?'Updated':'Created'}); setForm({id:null, packageName:'', price:'', discount:'', description:'', includedTestIds:[]}); await load(); } else setMsg({type:'error',text:'Failed'});} finally { setLoading(false);} };
  const edit=(p:ServicePackage)=> setForm({ id:p.id, packageName:p.packageName, price:(p as any).price, discount:(p as any).discount||'', description:(p as any).description||'', includedTestIds: (p.includedTests||[]).map(t=>t.id) });
  const del= async(id:number)=>{ if(!confirm('Delete package?')) return; setLoading(true); try { const r= await fetch('/api/servicepackages',{method:'DELETE', body: JSON.stringify({id})}); if(r.ok){ setMsg({type:'success',text:'Deleted'}); await load(); } else setMsg({type:'error',text:'Delete failed'});} finally { setLoading(false);} };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-start justify-between mb-6"><h1 className="text-2xl font-semibold">Service Packages(Multiple Services, consulation,Wellness Fees etc)</h1><LogoutButton/></div>
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded ${msg.type==='error'?'bg-red-100 text-red-700': msg.type==='success'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{msg.text}</div>}
        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <input value={form.packageName} onChange={e=>setForm((f:any)=>({...f,packageName:e.target.value}))} placeholder="Package name" className="border p-2 rounded" required />
          <input type="number" step="0.01" value={form.price} onChange={e=>setForm((f:any)=>({...f,price:e.target.value}))} placeholder="Price" className="border p-2 rounded" required />
            <input type="number" step="0.01" value={form.discount} onChange={e=>setForm((f:any)=>({...f,discount:e.target.value}))} placeholder="Discount" className="border p-2 rounded" />
          <textarea value={form.description} onChange={e=>setForm((f:any)=>({...f,description:e.target.value}))} placeholder="Description" className="border p-2 rounded md:col-span-4" />
          <div className="md:col-span-4">
            <div className="text-sm font-medium mb-1">Included Services</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-auto border p-2 rounded">
              {services.map(s=> (
                <label key={s.id} className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={form.includedTestIds.includes(s.id)} onChange={()=>toggleIncluded(s.id)} />
                  <span>{s.serviceName}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-4 flex gap-2">
            <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">{form.id?'Update':'Add Package'}</button>
            {form.id && <button type="button" onClick={()=>setForm({id:null, packageName:'', price:'', discount:'', description:'', includedTestIds:[]})} className="px-3 py-2 rounded border">Cancel</button>}
          </div>
        </form>
        <div className="mb-3 flex items-center gap-2"><input placeholder="Search packages" value={q} onChange={e=>setQ(e.target.value)} className="border p-2 rounded w-full max-w-xs" /></div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b bg-gray-50"><th className="p-2">Name</th><th className="p-2">Price</th><th className="p-2">Discount</th><th className="p-2">Services</th><th className="p-2 w-40">Actions</th></tr></thead>
            <tbody>{filtered.map(p=> <tr key={p.id} className="border-b last:border-0"><td className="p-2">{p.packageName}</td><td className="p-2">{Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS'}).format((p as any).price||0)}</td><td className="p-2">{(p as any).discount ?? '-'}</td><td className="p-2 text-xs">{(p.includedTests||[]).map(s=>s.serviceName).join(', ')||'-'}</td><td className="p-2 space-x-2"><button onClick={()=>edit(p)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded">Edit</button><button onClick={()=>del(p.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Del</button></td></tr>)}{filtered.length===0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">No packages</td></tr>}</tbody>
          </table>
        </div>
        {loading && <div className="mt-4"><LoadingSpinner/></div>}
      </main>
    </div>
  );
};
export default PackagesPage;
