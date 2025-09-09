"use client";
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LogoutButton from '@/components/LogoutButton';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ServiceOrder { id:number; service?:{serviceName:string}; servicePackage?:{packageName:string}; patient?:{ firstName:string; lastName:string }; report?:ServiceTestReport | null }
interface ServiceTestReport { id:number; actualResult?:string|null; findings?:string|null; comments?:string|null; aiSummary?:string|null; aiProvider?:string|null; reportDate:string; filePath?:string|null; reportBase64?:string|null; orderId:number }

const ServiceReportsPage: React.FC = () => {
  const [orders,setOrders]=useState<ServiceOrder[]>([]);
  const [reports,setReports]=useState<ServiceTestReport[]>([]);
  const [form,setForm]=useState<any>({ id:null, orderId:'', findings:'', comments:'', actualResult:'', filePath:'', reportBase64:'' });
  const [loading,setLoading]=useState(false); const [q,setQ]=useState(''); const [msg,setMsg]=useState<{type:string;text:string}|null>(null);
  const [selectedFile,setSelectedFile]=useState<File|null>(null);
  const [autoSummary,setAutoSummary]=useState('');
  const [aiLoading,setAiLoading]=useState(false);
  const [processing,setProcessing]=useState(false);
  const [autoQueueRunning,setAutoQueueRunning]=useState(false);
  const [autoFailed,setAutoFailed]=useState<string[]>([]);
  const [autoStop,setAutoStop]=useState(false);
  const [autoProgress,setAutoProgress]=useState({done:0,total:0});
  const autoRanRef = useRef(false);

  const load = async()=>{
    try {
      setProcessing(true);
      const [od, rp] = await Promise.all([
        fetch('/api/serviceorders').then(r=>r.json().catch(()=>[])),
        fetch('/api/servicetestreports').then(r=>r.json().catch(()=>[])),
      ]);
      setOrders(Array.isArray(od)?od:[]);
      setReports(Array.isArray(rp)?rp:[]);
    } finally { setProcessing(false); }
  };
  useEffect(()=>{load();},[]);

  // Auto summarization queue: summarize any reports missing aiSummary once after first load
  useEffect(()=>{
    if(autoRanRef.current) return; // run once per mount
    if(reports.length===0) return;
    const pending = reports.filter(r=> !r.aiSummary && (r.findings || r.comments));
    if(pending.length===0) { autoRanRef.current = true; return; }
    autoRanRef.current = true;
    let cancel = false;
    setAutoProgress({done:0,total:pending.length});
    const runQueue = async()=>{
      setAutoQueueRunning(true); setAutoFailed([]);
      for(const r of pending){
        if(cancel || autoStop) break;
        try {
          const res = await fetch('/api/ai/summarize',{ method:'POST', body: JSON.stringify({ text: r.findings || r.comments || '', reportId: r.id })});
          if(!res.ok) autoFailed.push(`#${r.id}`);
        } catch { autoFailed.push(`#${r.id}`); }
        setAutoProgress(p=>({...p,done:p.done+1}));
      }
      await load();
      setAutoQueueRunning(false);
    };
    runQueue();
    return ()=>{ cancel = true; };
  },[reports, autoStop]);

  const filtered = useMemo(()=> reports.filter(r=> !q
    || r.actualResult?.toLowerCase().includes(q.toLowerCase())
    || r.findings?.toLowerCase().includes(q.toLowerCase())
    || r.comments?.toLowerCase().includes(q.toLowerCase())
    || r.orderId.toString()===q ),[reports,q]);

  const relatedOrder = (orderId:number)=> orders.find(o=>o.id===orderId);

  const submit= async(e:React.FormEvent)=>{ e.preventDefault(); if(!form.orderId) return; setLoading(true); setMsg({type:'info',text: form.id?'Updating...':'Creating...'});
    try { 
      let res: Response;
      if(selectedFile){
        const fd = new FormData();
        if(form.id) fd.append('id', String(form.id));
        fd.append('orderId', String(form.orderId));
        fd.append('findings', form.findings||'');
        fd.append('comments', form.comments||'');
        fd.append('reportFile', selectedFile);
        res = await fetch('/api/servicetestreports',{ method: form.id?'PUT':'POST', body: fd });
      } else {
        const payload={...form, orderId:Number(form.orderId)}; 
        res= await fetch('/api/servicetestreports',{ method: form.id?'PUT':'POST', body: JSON.stringify(payload) });
      }
  if(res.ok){ const data = await res.json(); setMsg({type:'success',text: form.id?'Updated':'Created'}); setForm({ id:null, orderId:'', findings:'', comments:'', actualResult:'', filePath:'', reportBase64:'' }); setSelectedFile(null); setAutoSummary(data?.comments||''); await load(); } else { const err=await res.json().catch(()=>({error:'Save failed'})); setMsg({type:'error',text: err.error||'Save failed'}); }
    } finally { setLoading(false);} };
  const edit=(r:ServiceTestReport)=> setForm({ id:r.id, orderId:r.orderId, findings:r.findings||'', comments:r.comments||'', actualResult: r.actualResult||'', filePath:r.filePath||'', reportBase64:r.reportBase64||'' });
  const del= async(id:number)=>{ if(!confirm('Delete report?')) return; setLoading(true); try { const r= await fetch('/api/servicetestreports',{method:'DELETE', body: JSON.stringify({id})}); if(r.ok){ setMsg({type:'success',text:'Deleted'}); await load(); } else setMsg({type:'error',text:'Delete failed'});} finally { setLoading(false);} };

  const fileToBase64 = (file: File) => new Promise<string>((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload=()=>{ const res = reader.result as string; const b64 = res.split(',')[1]||''; resolve(b64); };
    reader.onerror=()=>reject(reader.error);
    reader.readAsDataURL(file);
  });

  const callAISummary = async()=>{
    // Allow user feedback if empty
    // if(!form.findings && !form.comments){
    //   setMsg({type:'error', text:'Provide findings or comments (or paste text) before summarizing.'});
    //   return;
    // }
    setAiLoading(true); setProcessing(true);
    try { const res = await fetch('/api/ai/summarize',{method:'POST', body: JSON.stringify({ text: form.findings || form.comments, reportId: form.id })}); if(res.ok){ const j=await res.json(); setForm((f0:any)=>({...f0, comments: j.summary })); setAutoSummary(j.summary + (j.provider? ` (via ${j.provider}${j.cached? ' cache':''}${j.fallback? ' + fallback':''})`:'')); await load(); } else { const j=await res.json().catch(()=>({error:'AI failed'})); setAutoSummary(j.error||'AI failed'); setMsg({type:'error', text: j.error||'AI failed'}); } } finally { setAiLoading(false); setProcessing(false);} };

  const reSummarize = async(r: ServiceTestReport)=>{
    setProcessing(true);
    try { await fetch('/api/ai/summarize',{ method:'POST', body: JSON.stringify({ text: r.findings || r.comments || '', reportId: r.id })}); await load(); } finally { setProcessing(false);} };

  const autoPendingCount = useMemo(()=> reports.filter(r=> !r.aiSummary && (r.findings || r.comments)).length, [reports]);

  const extractFileText = async(file: File)=>{
    const mime = file.type || 'application/octet-stream';
    if(/^image\//i.test(mime) || mime === 'application/pdf'){
      try {
        // For PDFs we just send first page currently (Gemini can attempt entire file if size small)
        const b64 = await fileToBase64(file);
        const res = await fetch('/api/ai/extract',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ base64: b64, mimeType: mime })});
  if(res.ok){ const j = await res.json(); if(j.text){ setForm((f0:any)=>({...f0, actualResult:j.text, findings:j.text, comments: j.text.slice(0,400)})); setAutoSummary(j.text.slice(0,400)); } else { setMsg({type:'error',text:'Extraction returned empty text'}); } } else { setMsg({type:'error',text:'AI extraction failed'}); }
      } catch { setMsg({type:'error',text:'Extraction error'}); }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-6 md:p-8">
        <div className="sticky top-0 z-10 bg-gray-50 pb-4 -mt-6 -mx-6 md:-mx-8 px-6 md:px-8 pt-6 mb-4 flex flex-wrap items-center justify-between shadow-sm">
          <h1 className="text-2xl font-semibold leading-tight">Patient Service Reports</h1>
          <div className="flex items-center gap-2">
            {form.id ? (
              <a
                href={`/api/servicetestreports/${form.id}/pdf`}
                target="_blank"
                className="px-4 py-2 text-sm rounded bg-indigo-600 text-white hover:bg-indigo-700 transition"
              >Patient Report</a>
            ) : (
              <button
                type="button"
                disabled
                className="px-4 py-2 text-sm rounded bg-gray-300 text-gray-500 cursor-not-allowed"
                title="Select or edit a report to enable"
              >Patient Report</button>
            )}
            <LogoutButton/>
          </div>
        </div>
        {msg && <div className={`mb-4 text-sm px-3 py-2 rounded ${msg.type==='error'?'bg-red-100 text-red-700': msg.type==='success'?'bg-green-100 text-green-700':'bg-blue-100 text-blue-700'}`}>{msg.text}</div>}
        <form onSubmit={submit} className="bg-white p-4 rounded shadow mb-6 grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.orderId} onChange={e=>setForm((f:any)=>({...f,orderId:e.target.value}))} className="border p-2 rounded" required>
            <option value="">Order (no report yet)</option>
            {orders.filter(o=> !o.report).map(o=> {
              const patient = o.patient ? `${o.patient.firstName} ${o.patient.lastName}` : 'Unknown Patient';
              const createdAt = (o as any).createdAt ? new Date((o as any).createdAt).toLocaleDateString() : '';
              return <option key={o.id} value={o.id}>#{o.id} - {patient} - {(o.service?.serviceName || o.servicePackage?.packageName)} {createdAt && `(${createdAt})`}</option>;
            })}
          </select>
          <input value={form.filePath} onChange={e=>setForm((f:any)=>({...f,filePath:e.target.value}))} placeholder="File path (optional)" className="border p-2 rounded" />
          <textarea value={form.findings} onChange={e=>setForm((f:any)=>({...f,findings:e.target.value}))} placeholder="Findings" className="border p-2 rounded md:col-span-4 min-h-24" />
          <textarea value={form.comments} onChange={e=>setForm((f:any)=>({...f,comments:e.target.value}))} placeholder="Comments" className="border p-2 rounded md:col-span-4 min-h-20" />
          <input type="file" onChange={async e=>{ const f=e.target.files?.[0]||null; setSelectedFile(f); if(!f) return; 
            try { const b64 = await fileToBase64(f); setForm((f0:any)=>({...f0, reportBase64:b64, filePath:f.name})); } catch {}
            await extractFileText(f);
            if(f.type.startsWith('text/')){ const text = await f.text(); setForm((f0:any)=>({...f0, actualResult:text, findings:text, comments: text.slice(0,400)})); setAutoSummary(text.slice(0,400)); }
          }} className="border p-2 rounded" />
          <div className="flex items-center gap-2 text-xs md:col-span-4">
            <span className="text-gray-500">Report Generator</span>
            {autoQueueRunning && <>
              <div className="h-2 w-32 bg-gray-200 rounded overflow-hidden"><div className="h-full bg-indigo-500 transition-all" style={{width: (autoProgress.total? (autoProgress.done/autoProgress.total*100):0)+ '%'}} /></div>
              <span className="text-gray-400">{autoProgress.done}/{autoProgress.total}</span>
              <button type="button" onClick={()=>setAutoStop(true)} className="px-2 py-0.5 border rounded">Stop</button>
            </>}
            {!autoQueueRunning && autoProgress.total>0 && autoProgress.done<autoProgress.total && !autoStop && <button type="button" onClick={()=>{setAutoStop(false); autoRanRef.current=false;}} className="px-2 py-0.5 border rounded">Resume</button>}
            {aiLoading && <span className="text-indigo-600 animate-pulse">Running…</span>}
            <button type="button" onClick={callAISummary} disabled={aiLoading} className="ml-auto px-2 py-1 border rounded text-xs disabled:opacity-50">{aiLoading?'Summarizing...':'AI Summarize'}</button>
          </div>
          {/* hidden base64 textarea remains for debug but optional */}
          <textarea value={form.reportBase64} onChange={e=>setForm((f:any)=>({...f,reportBase64:e.target.value}))} placeholder="Base64 Report (optional)" className="border p-2 rounded md:col-span-4 min-h-20 font-mono text-xs hidden" />
          {autoSummary && <div className="md:col-span-4 bg-gray-100 text-xs p-2 rounded"><strong>Auto Summary:</strong> {autoSummary}</div>}
          <div className="md:col-span-4 flex gap-2"><button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">{form.id?'Update':'Add Report'}</button>{form.id && <button type="button" onClick={()=>setForm({ id:null, orderId:'', findings:'', comments:'', actualResult:'', filePath:'', reportBase64:'' })} className="px-3 py-2 rounded border">Cancel</button>}</div>
        </form>
        <div className="mb-3 flex items-center gap-2"><input placeholder="Search by findings, comments or order id" value={q} onChange={e=>setQ(e.target.value)} className="border p-2 rounded w-full max-w-xs" /></div>
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-gray-50">
                <th className="p-2">Order</th>
                <th className="p-2">Patient</th>
                <th className="p-2">Item</th>
                <th className="p-2">Actual Result</th>
                <th className="p-2">Findings</th>
                <th className="p-2">Comments</th>
                <th className="p-2">AI Summary</th>
                <th className="p-2">Date</th>
                <th className="p-2 w-48">Actions</th>
              </tr>
            </thead>
            <tbody>{filtered.map(r=> { const o=relatedOrder(r.orderId); const summarizingCell = autoQueueRunning && !r.aiSummary && (r.findings||r.comments||r.actualResult); return (
              <tr key={r.id} className="border-b last:border-0">
                <td className="p-2">#{r.orderId}</td>
                <td className="p-2">{o?.patient? `${o.patient.firstName} ${o.patient.lastName}`:'-'}</td>
                <td className="p-2">{o?.service?.serviceName || o?.servicePackage?.packageName}</td>
                <td className="p-2 max-w-xs truncate" title={r.actualResult||''}>{r.actualResult?.slice(0,120) || '-'}</td>
                <td className="p-2 max-w-xs truncate" title={r.findings||''}>{r.findings || '-'}</td>
                <td className="p-2 max-w-xs truncate" title={r.comments||''}>{r.comments || '-'}</td>
                <td className="p-2 max-w-xs truncate" title={r.aiSummary||''}>{ summarizingCell ? <span className="animate-pulse text-gray-400">Extracting...</span> : (r.aiSummary? r.aiSummary.slice(0,80)+'…': '-') }</td>
                <td className="p-2">{new Date(r.reportDate).toLocaleString()}</td>
                <td className="p-2 space-x-2">
                  <button onClick={()=>edit(r)} className="px-2 py-1 text-xs bg-emerald-600 text-white rounded">Edit</button>
                  <button onClick={()=>del(r.id)} className="px-2 py-1 text-xs bg-red-600 text-white rounded">Del</button>
                  <button onClick={()=>reSummarize(r)} className="px-2 py-1 text-xs bg-indigo-600 text-white rounded">Retry AI</button>
                  <a href={`/api/servicetestreports/${r.id}/pdf`} target="_blank" className="px-2 py-1 text-xs bg-gray-700 text-white rounded">PDF</a>
                </td>
              </tr>
            ); })}{filtered.length===0 && <tr><td colSpan={9} className="p-4 text-center text-gray-400">No reports</td></tr>}</tbody>
          </table>
        </div>
        {loading && <div className="mt-4"><LoadingSpinner/></div>}
        { (processing || aiLoading || autoQueueRunning) && <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50"><div className="bg-white px-4 py-3 rounded shadow text-sm flex items-center gap-2"><LoadingSpinner/> <span>{ aiLoading? 'Generating AI summary...' : autoQueueRunning? 'Auto summarizing reports...' : 'Loading...'}</span></div></div> }
        {autoFailed.length>0 && <div className="mb-4 space-y-1">{autoFailed.map(f=> <div key={f} className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Auto summary failed for {f}</div>)}</div>}
      </main>
    </div>
  );
};
export default ServiceReportsPage;
