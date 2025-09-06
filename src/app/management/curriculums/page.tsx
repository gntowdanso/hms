"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getAuth } from '@/utils/auth';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';

const CurriculumsPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ academicYearId: '', classId: '', subjectId: '', termId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterYear, setFilterYear] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const fetchItems = async () => { setLoading(true); try { const res = await fetch('/api/curriculums'); const d = await res.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]); } catch(e){} setLoading(false); };
  const fetchLookups = async ()=>{ try {
      const [yRes,cRes,sRes,tRes] = await Promise.all([fetch('/api/academicyears'), fetch('/api/classes'), fetch('/api/subjects'), fetch('/api/terms')]);
      const [y,c,s,t] = await Promise.all([yRes.json().catch(()=>[]), cRes.json().catch(()=>[]), sRes.json().catch(()=>[]), tRes.json().catch(()=>[])]);
      setYears(Array.isArray(y)?y:[]);
      setClasses(Array.isArray(c)?c:[]);
      setSubjects(Array.isArray(s)?s:[]);
      setTerms(Array.isArray(t)?t:[]);
    } catch(e){} };

  useEffect(()=>{ fetchItems(); fetchLookups(); }, []);

  const safeServerMessage = (resObj: any) => { if (!resObj) return ''; if (typeof resObj === 'string') return resObj; if (typeof resObj === 'object') return (resObj.error || resObj.message || JSON.stringify(resObj)); return String(resObj); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!form.academicYearId || !form.classId || !form.subjectId || !form.termId) {
      setMessage({ type:'error', text:'Select year, class, term and subject' });
      setLoading(false);
      return;
    }
    const payload: any = {};
    if (form.academicYearId) payload.academicYearId = Number(form.academicYearId);
    if (form.classId) payload.classId = Number(form.classId);
    if (form.subjectId) payload.subjectId = Number(form.subjectId);
    if (form.termId) payload.termId = Number(form.termId);
    try {
      const res = await apiFetch('/api/curriculums', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) { setMessage({ type:'error', text: safeServerMessage(result) || 'Server error' }); setLoading(false); return; }
      setMessage({ type:'success', text: editingId ? 'Updated' : 'Created' }); setForm({ academicYearId:'', classId:'', subjectId:'' }); setEditingId(null); await fetchItems();
    } catch(e){ setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };

  const handleEdit = (c:any)=>{ setForm({ academicYearId: c.academicYear ? String(c.academicYear.id) : '', classId: c.class ? String(c.class.id) : '', subjectId: c.subject ? String(c.subject.id) : '', termId: c.term ? String(c.term.id) : '' }); setEditingId(c.id); };
  const handleDelete = async (id:number)=>{
    if(!confirm('Delete curriculum?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/curriculums', { method:'DELETE', body: JSON.stringify({ id }) });
      const result = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeServerMessage(result)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems();
    } catch(e){ setMessage({ type:'error', text:'Delete failed' }); }
    setLoading(false);
  };

  const filtered = useMemo(()=>{ if(!Array.isArray(items)) return []; return items.filter(it=>{ if(filterYear && it.academicYear){ if(String(it.academicYear.id) !== String(filterYear)) return false; } if(filterClass && it.class){ if(String(it.class.id) !== String(filterClass)) return false; } return true; }); }, [items, filterYear, filterClass]);
  const totalFiltered = filtered.length; const start = (page-1)*pageSize; const pageItems = useMemo(()=>filtered.slice(start, start+pageSize), [filtered, start, pageSize]); const showingStart = totalFiltered===0?0:start+1; const showingEnd = Math.min(start+pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Curriculums</h2>
        {loading && <LoadingSpinner />}
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={form.academicYearId} onChange={e=>setForm({...form, academicYearId: e.target.value})} className="border p-2 rounded">
            <option value="">-- Academic Year --</option>
            {years.map(y=> <option key={y.id} value={y.id}>{y.yearName}</option>)}
          </select>
          <select value={form.classId} onChange={e=>setForm({...form, classId: e.target.value})} className="border p-2 rounded">
            <option value="">-- Class --</option>
            {classes.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={form.subjectId} onChange={e=>setForm({...form, subjectId: e.target.value})} className="border p-2 rounded">
            <option value="">-- Subject --</option>
            {subjects.map(s=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="md:col-span-2 flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ academicYearId:'', classId:'', subjectId:'' }); }}>Cancel</button>}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <select value={filterYear} onChange={e=>{ setFilterYear(e.target.value); setPage(1); }} className="border p-2 rounded">
              <option value="">All years</option>
              {years.map(y=> <option key={y.id} value={y.id}>{y.yearName}</option>)}
            </select>
            <select value={filterClass} onChange={e=>{ setFilterClass(e.target.value); setPage(1); }} className="border p-2 rounded">
              <option value="">All classes</option>
              {classes.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <select value={filterTerm} onChange={e=>{ setFilterTerm(e.target.value); setPage(1); }} className="border p-2 rounded">
              <option value="">All terms</option>
              {terms.map(t=> <option key={t.id} value={t.id}>{t.name}</option>)}
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
                  <th className="p-2 border">Year</th>
                  <th className="p-2 border">Class</th>
                  <th className="p-2 border">Subject</th>
                  <th className="p-2 border">Term</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(it=> (
                  <tr key={it.id} className="border-t">
                    <td className="p-2 border">{it.id}</td>
                    <td className="p-2 border">{it.academicYear ? it.academicYear.yearName : ''}</td>
                    <td className="p-2 border">{it.class ? it.class.name : ''}</td>
                    <td className="p-2 border">{it.subject ? it.subject.name : ''}</td>
                    <td className="p-2 border">{it.term ? it.term.name : ''}</td>
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

export default CurriculumsPage;
