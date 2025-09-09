"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Patient { id:number; firstName:string; lastName:string; hospitalNo:string }
interface Service { id:number; serviceName:string }
interface ServicePackage { id:number; packageName:string }
interface ServiceOrder { id:number; createdAt:string; status:string; doctorReferral:boolean; patient:Patient; service?:Service|null; servicePackage?:ServicePackage|null }

const ServiceOrdersPage: React.FC = () => {
  const [orders,setOrders]=useState<ServiceOrder[]>([]);
  const [patients,setPatients]=useState<Patient[]>([]);
  const [services,setServices]=useState<Service[]>([]);
  const [packages,setPackages]=useState<ServicePackage[]>([]);
  const [form,setForm]=useState<any>({ id:null, patientId:'', doctorReferral:false, serviceId:'', packageId:'', status:'Pending' });
  const [loading,setLoading]=useState(false);
  const [q,setQ]=useState('');
  const [msg,setMsg]=useState<{type:string;text:string}|null>(null);

  const load = async()=>{
    try {
      const [od, pt, sv, pk] = await Promise.all([
        fetch('/api/serviceorders').then(r=>r.json().catch(()=>[])),
        fetch('/api/patients').then(r=>r.json().catch(()=>[])).catch(()=>[]),
        fetch('/api/services').then(r=>r.json().catch(()=>[])),
        fetch('/api/servicepackages').then(r=>r.json().catch(()=>[])),
      ]);
      setOrders(Array.isArray(od)?od:[]);
      setPatients(Array.isArray(pt)?pt:[]);
      setServices(Array.isArray(sv)?sv:[]);
      setPackages(Array.isArray(pk)?pk:[]);
    } catch {}
  };
  useEffect(()=>{load();},[]);

  const filtered = useMemo(()=> orders.filter(o=> !q || (o.patient?.firstName+" "+o.patient?.lastName).toLowerCase().includes(q.toLowerCase()) || o.id.toString()===q ),[orders,q]);

  const submit= async(e:React.FormEvent)=>{ e.preventDefault(); if(!form.patientId || (!form.serviceId && !form.packageId)) return; setLoading(true); setMsg({type:'info',text: form.id?'Updating...':'Creating...'}); try { const payload={...form, patientId:Number(form.patientId)||null, serviceId: form.serviceId? Number(form.serviceId): null, packageId: form.packageId? Number(form.packageId): null, doctorReferral: !!form.doctorReferral}; const res= await fetch('/api/serviceorders',{ method: form.id?'PUT':'POST', body: JSON.stringify(payload) }); if(res.ok){ setMsg({type:'success',text: form.id?'Updated':'Created'}); setForm({ id:null, patientId:'', doctorReferral:false, serviceId:'', packageId:'', status:'Pending' }); await load(); } else setMsg({type:'error',text:'Save failed'});} finally { setLoading(false);} };
  const edit=(o:ServiceOrder)=> setForm({ id:o.id, patientId:o.patient?.id, doctorReferral:o.doctorReferral, serviceId:o.service?.id||'', packageId:o.servicePackage?.id||'', status:o.status });
  const del= async(id:number)=>{ if(!confirm('Delete order?')) return; setLoading(true); try { const r= await fetch('/api/serviceorders',{method:'DELETE', body: JSON.stringify({id})}); if(r.ok){ setMsg({type:'success',text:'Deleted'}); await load(); } else setMsg({type:'error',text:'Delete failed'});} finally { setLoading(false);} };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-start justify-between mb-6"><h1 className="text-2xl font-semibold">Patient Services </h1><LogoutButton/></div>
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded ${msg.type==='error'?'bg-red-100 text-red-700': msg.type==='success'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{msg.text}</div>}
        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.patientId} onChange={e=>setForm((f:any)=>({...f,patientId:e.target.value}))} className="border p-2 rounded" required><option value="">Patient</option>{patients.map(p=> <option key={p.id} value={p.id}>{p.hospitalNo} - {p.firstName} {p.lastName}</option>)}</select>
          <select value={form.serviceId} onChange={e=>setForm((f:any)=>({...f,serviceId:e.target.value, packageId:''}))} className="border p-2 rounded"><option value="">Service (single)</option>{services.map(s=> <option key={s.id} value={s.id}>{s.serviceName}</option>)}</select>
          <select value={form.packageId} onChange={e=>setForm((f:any)=>({...f,packageId:e.target.value, serviceId:''}))} className="border p-2 rounded"><option value="">Package</option>{packages.map(p=> <option key={p.id} value={p.id}>{p.packageName}</option>)}</select>
          <div className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!form.doctorReferral} onChange={e=>setForm((f:any)=>({...f,doctorReferral:e.target.checked}))} /> <span>Doctor Referral</span></div>
          <select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} className="border p-2 rounded"><option>Pending</option><option>Processing</option><option>Completed</option><option>Cancelled</option></select>
          <div className="md:col-span-4 flex gap-2"><button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">{form.id?'Update':'Add Order'}</button>{form.id && <button type="button" onClick={()=>setForm({ id:null, patientId:'', doctorReferral:false, serviceId:'', packageId:'', status:'Pending' })} className="px-3 py-2 rounded border">Cancel</button>}</div>
        </form>
        <div className="mb-3 flex items-center gap-2"><input placeholder="Search by patient name or exact ID" value={q} onChange={e=>setQ(e.target.value)} className="border p-2 rounded w-full max-w-xs" /></div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b bg-gray-50"><th className="p-2">ID</th><th className="p-2">Patient</th><th className="p-2">Type</th><th className="p-2">Item</th><th className="p-2">Status</th><th className="p-2">Referral</th><th className="p-2">Created</th><th className="p-2 w-44">Actions</th></tr></thead>
            <tbody>{filtered.map(o=> {
              const patientName = o.patient ? `${o.patient.firstName} ${o.patient.lastName}` : '-';
              const type = o.service ? 'Service' : (o.servicePackage ? 'Package' : '-');
              const itemName = o.service?.serviceName || o.servicePackage?.packageName || '-';
              const created = o.createdAt ? new Date(o.createdAt).toLocaleString() : '-';
              return (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="p-2">{o.id}</td>
                  <td className="p-2">{patientName}</td>
                  <td className="p-2">{type}</td>
                  <td className="p-2">{itemName}</td>
                  <td className="p-2">{o.status || '-'}</td>
                  <td className="p-2">{o.doctorReferral? 'Yes':'No'}</td>
                  <td className="p-2">{created}</td>
                  <td className="p-2 space-x-2"><button onClick={()=>edit(o)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded">Edit</button><button onClick={()=>del(o.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Del</button></td>
                </tr>
              );
            })}{filtered.length===0 && <tr><td colSpan={8} className="p-4 text-center text-gray-400">No orders</td></tr>}</tbody>
          </table>
        </div>
        {loading && <div className="mt-4"><LoadingSpinner/></div>}
      </main>
    </div>
  );
};
export default ServiceOrdersPage;
