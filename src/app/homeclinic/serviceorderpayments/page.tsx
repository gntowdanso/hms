"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Payment { id:number; amount:number; paymentMethod:string; status:string; transactionId?:string|null; paymentDate:string; serviceOrder:{ id:number }; patient:{ firstName:string; lastName:string; hospitalNo:string } }
interface ServiceOrder { id:number; patient:{ id:number; firstName:string; lastName:string; hospitalNo:string } }
interface Patient { id:number; firstName:string; lastName:string; hospitalNo:string }

const ServiceOrderPaymentsPage: React.FC = () => {
  const [payments,setPayments]=useState<Payment[]>([]);
  const [orders,setOrders]=useState<ServiceOrder[]>([]);
  const [patients,setPatients]=useState<Patient[]>([]);
  const [form,setForm]=useState<any>({ id:null, serviceOrderId:'', patientId:'', amount:'', paymentMethod:'CASH', status:'Completed', transactionId:'' });
  const [loading,setLoading]=useState(false); const [q,setQ]=useState(''); const [msg,setMsg]=useState<{type:string;text:string}|null>(null);

  const load= async()=>{ try { const [pm, od] = await Promise.all([
    fetch('/api/serviceorderpayments').then(r=>r.json().catch(()=>[])),
    fetch('/api/serviceorders').then(r=>r.json().catch(()=>[])),
  ]); setPayments(Array.isArray(pm)?pm:[]); setOrders(Array.isArray(od)?od:[]); setPatients(Array.isArray(od)? od.map((o:any)=>o.patient).filter((p:any,i:number,arr:any[])=> p && arr.findIndex(pp=>pp?.id===p.id)===i):[]);} catch {} };
  useEffect(()=>{load();},[]);

  const filtered = useMemo(()=> payments.filter(p=> !q || p.serviceOrder.id.toString()===q || p.patient.hospitalNo.toLowerCase().includes(q.toLowerCase())),[payments,q]);

  const submit= async(e:React.FormEvent)=>{ e.preventDefault(); if(!form.serviceOrderId || !form.patientId || !form.amount) return; setLoading(true); setMsg({type:'info',text: form.id?'Updating...':'Recording...'}); try { const payload={...form, serviceOrderId:Number(form.serviceOrderId), patientId:Number(form.patientId), amount:Number(form.amount)}; const res= await fetch('/api/serviceorderpayments',{ method: form.id?'PUT':'POST', body: JSON.stringify(payload) }); if(res.ok){ setMsg({type:'success',text: form.id?'Updated':'Recorded'}); setForm({ id:null, serviceOrderId:'', patientId:'', amount:'', paymentMethod:'CASH', status:'Completed', transactionId:'' }); await load(); } else setMsg({type:'error',text:'Failed'});} finally { setLoading(false);} };
  const edit=(p:Payment)=> setForm({ id:p.id, serviceOrderId:p.serviceOrder.id, patientId: (p as any).patientId || '', amount:p.amount, paymentMethod:p.paymentMethod, status:p.status, transactionId:p.transactionId||'' });
  const del= async(id:number)=>{ if(!confirm('Delete payment?')) return; setLoading(true); try { const r= await fetch('/api/serviceorderpayments',{method:'DELETE', body: JSON.stringify({id})}); if(r.ok){ setMsg({type:'success',text:'Deleted'}); await load(); } else setMsg({type:'error',text:'Delete failed'});} finally { setLoading(false);} };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-6 md:p-8">
        <div className="flex items-start justify-between mb-6"><h1 className="text-2xl font-semibold">Service Order Payments</h1><LogoutButton/></div>
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded ${msg.type==='error'?'bg-red-100 text-red-700': msg.type==='success'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{msg.text}</div>}
        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <select value={form.serviceOrderId} onChange={e=>{ const val=e.target.value; const order=orders.find(o=>o.id===Number(val)); setForm((f:any)=>({...f, serviceOrderId:val, patientId: order? order.patient.id: f.patientId})); }} className="border p-2 rounded" required><option value="">Order</option>{orders.map(o=> <option key={o.id} value={o.id}>#{o.id}</option>)}</select>
          <select value={form.patientId} onChange={e=>setForm((f:any)=>({...f,patientId:e.target.value}))} className="border p-2 rounded" required><option value="">Patient</option>{patients.map(p=> <option key={p.id} value={p.id}>{p.hospitalNo} - {p.firstName} {p.lastName}</option>)}</select>
          <input type="number" step="0.01" value={form.amount} onChange={e=>setForm((f:any)=>({...f,amount:e.target.value}))} placeholder="Amount" className="border p-2 rounded" required />
          <select value={form.paymentMethod} onChange={e=>setForm((f:any)=>({...f,paymentMethod:e.target.value}))} className="border p-2 rounded"><option>CASH</option><option>INSURANCE</option><option>BANK</option><option>MOBILEMONEY</option></select>
          <select value={form.status} onChange={e=>setForm((f:any)=>({...f,status:e.target.value}))} className="border p-2 rounded"><option>Completed</option><option>Pending</option><option>Failed</option></select>
          <input value={form.transactionId} onChange={e=>setForm((f:any)=>({...f,transactionId:e.target.value}))} placeholder="Transaction Ref" className="border p-2 rounded md:col-span-2" />
          <div className="md:col-span-5 flex gap-2"><button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">{form.id?'Update':'Record Payment'}</button>{form.id && <button type="button" onClick={()=>setForm({ id:null, serviceOrderId:'', patientId:'', amount:'', paymentMethod:'CASH', status:'Completed', transactionId:'' })} className="px-3 py-2 rounded border">Cancel</button>}</div>
        </form>
        <div className="mb-3 flex items-center gap-2"><input placeholder="Search by order id or hospital no" value={q} onChange={e=>setQ(e.target.value)} className="border p-2 rounded w-full max-w-xs" /></div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b bg-gray-50"><th className="p-2">Order</th><th className="p-2">Patient</th><th className="p-2">Amount</th><th className="p-2">Method</th><th className="p-2">Status</th><th className="p-2">Txn</th><th className="p-2">Date</th><th className="p-2 w-44">Actions</th></tr></thead>
            <tbody>{filtered.map(p=> <tr key={p.id} className="border-b last:border-0"><td className="p-2">#{p.serviceOrder.id}</td><td className="p-2">{p.patient.hospitalNo}</td><td className="p-2">{Intl.NumberFormat('en-GH',{style:'currency',currency:'GHS'}).format(p.amount||0)}</td><td className="p-2">{p.paymentMethod}</td><td className="p-2">{p.status}</td><td className="p-2 text-xs truncate" title={p.transactionId||''}>{p.transactionId||'-'}</td><td className="p-2">{new Date(p.paymentDate).toLocaleString()}</td><td className="p-2 space-x-2"><button onClick={()=>edit(p)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded">Edit</button><button onClick={()=>del(p.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Del</button></td></tr>)}{filtered.length===0 && <tr><td colSpan={8} className="p-4 text-center text-gray-400">No payments</td></tr>}</tbody>
          </table>
        </div>
        {loading && <div className="mt-4"><LoadingSpinner/></div>}
      </main>
    </div>
  );
};
export default ServiceOrderPaymentsPage;
