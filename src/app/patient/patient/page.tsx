"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';
import { getAuth } from '@/utils/auth';

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const ADMISSION_STATUSES = ['OUTPATIENT','INPATIENT','DISCHARGED'];

const PatientPage: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ username: '', hospitalNo: '', firstName: '', lastName: '', gender: 'Male', dob: '', address: '', contactInfo: '', emergencyContact: '', admissionStatus: 'OUTPATIENT', bloodGroup: 'O+' , hospitalId: null });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterQ, setFilterQ] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchHospitals = async () => {
    try {
      const res = await fetch('/api/hospitals');
      if (!res.ok) throw new Error('no hospitals');
      const data = await res.json();
      if (Array.isArray(data) && data.length) {
        setHospitals(data);
        return;
      }
    } catch (e) {
      // fallback: generate 3 sequential hospitals for UI
      const generated = [1,2,3].map(i=>({ id: i, name: `Hospital ${i}` }));
      setHospitals(generated);
      // also seed a hospitalNo for the form so mobile users see something
  setForm((f: any) => ({ ...f, hospitalId: generated[0].id, hospitalNo: generateHospitalNo(generated[0].id) }));
    }
  };

  const generateHospitalNo = (hospitalId: number | null) => {
    const h = hospitalId ?? 0;
    const rand = Math.floor(100000 + Math.random() * 900000);
    return `H${h}-${rand}`;
  };

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/patients');
      const d = await res.json().catch(() => []);
      setPatients(d || []);
    } catch (e) {
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ fetchHospitals(); fetchPatients(); }, []);

  const safeMsg = (o: any) => typeof o === 'string' ? o : (o?.message || JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: 'info', text: editingId ? 'Updating...' : 'Creating...' });
    try {
  // ensure username exists (backend expects it) - default to hospitalNo when not provided
  const payload = { ...form, username: form.username || form.hospitalNo, dob: form.dob ? new Date(form.dob).toISOString() : undefined };
       const user = getAuth();
             payload.username = user.username;
      const res = await apiFetch('/api/patients', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: safeMsg(result) || 'Server error' });
      } else {
        setMessage({ type: 'success', text: editingId ? 'Patient updated' : 'Patient created' });
        setForm({ username: '', hospitalNo: '', firstName: '', lastName: '', gender: 'Male', dob: '', address: '', contactInfo: '', emergencyContact: '', admissionStatus: 'OUTPATIENT', bloodGroup: 'O+', hospitalId: hospitals[0]?.id ?? null });
  // regenerate hospitalNo for next create
  setForm((f: any) => ({ ...f, hospitalNo: generateHospitalNo(hospitals[0]?.id ?? null) }));
        setEditingId(null);
        await fetchPatients();
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Request failed' });
    }
    setLoading(false);
  };

  const handleEdit = (p: any) => {
  setForm({ username: p.username, hospitalNo: p.hospitalNo, firstName: p.firstName, lastName: p.lastName, gender: p.gender || 'Male', dob: p.dob ? new Date(p.dob).toISOString().slice(0,10) : '', address: p.address, contactInfo: p.contactInfo, emergencyContact: p.emergencyContact, admissionStatus: p.admissionStatus, bloodGroup: p.bloodGroup || 'O+', hospitalId: p.hospitalId });
    setEditingId(p.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete patient?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/patients', { method: 'DELETE', body: JSON.stringify({ id }) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type: 'error', text: safeMsg(result) || 'Delete failed' });
      else setMessage({ type: 'success', text: 'Deleted' });
      await fetchPatients();
    } catch (e) {
      setMessage({ type: 'error', text: 'Delete failed' });
    }
    setLoading(false);
  };

  const filtered = useMemo(()=> {
    return patients.filter(p=>{
      if (!filterQ) return true;
      const q = filterQ.toLowerCase();
      return String(p.username||'').toLowerCase().includes(q) || String(p.firstName||'').toLowerCase().includes(q) || String(p.lastName||'').toLowerCase().includes(q) || String(p.hospitalNo||'').toLowerCase().includes(q);
    });
  }, [patients, filterQ]);

  const sorted = useMemo(()=>{
    const copy = [...filtered];
    copy.sort((a,b)=>{
      const aV = (a as any)[sortColumn];
      const bV = (b as any)[sortColumn];
      if (aV == null && bV == null) return 0;
      if (aV == null) return sortDir === 'asc' ? -1 : 1;
      if (bV == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof aV === 'string') return sortDir === 'asc' ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
      return sortDir === 'asc' ? (aV - bV) : (bV - aV);
    });
    return copy;
  }, [filtered, sortColumn, sortDir]);

  const totalFiltered = sorted.length;
  const start = (page-1)*pageSize;
  const pageItems = sorted.slice(start, start + pageSize);
  const showingStart = totalFiltered === 0 ? 0 : start + 1;
  const showingEnd = Math.min(start + pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Patients</h2>
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search by name or hospital no" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded w-full md:w-auto">
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
          </select>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Username is not exposed on the UI; backend will use hospitalNo as fallback. */}
          <input className="border p-2 rounded w-full" placeholder="Hospital No" value={form.hospitalNo} onChange={e=>setForm({...form, hospitalNo: e.target.value})} required />
          <select className="border p-2 rounded" value={form.hospitalId ?? ''} onChange={e=>{ const hid = e.target.value ? Number(e.target.value) : null; setForm({...form, hospitalId: hid, hospitalNo: editingId ? form.hospitalNo : generateHospitalNo(hid)}); }}>
            <option value="">-- Select Hospital --</option>
            {hospitals.map(h=> <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.hospitalId ?? ''} onChange={e=>setForm({...form, hospitalId: e.target.value ? Number(e.target.value) : null})}>
            <option value="">-- Select Hospital --</option>
            {hospitals.map(h=> <option key={h.id} value={h.id}>{h.name}</option>)}
          </select>
          <input className="border p-2 rounded" placeholder="First name" value={form.firstName} onChange={e=>setForm({...form, firstName: e.target.value})} required />
          <input className="border p-2 rounded" placeholder="Last name" value={form.lastName} onChange={e=>setForm({...form, lastName: e.target.value})} required />
          <select className="border p-2 rounded" value={form.gender} onChange={e=>setForm({...form, gender: e.target.value})}><option>Male</option><option>Female</option><option>Other</option></select>
          <input type="date" className="border p-2 rounded" value={form.dob} onChange={e=>setForm({...form, dob: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Contact info" value={form.contactInfo} onChange={e=>setForm({...form, contactInfo: e.target.value})} />
          <input className="border p-2 rounded" placeholder="Emergency contact" value={form.emergencyContact} onChange={e=>setForm({...form, emergencyContact: e.target.value})} />
          <select className="border p-2 rounded" value={form.admissionStatus} onChange={e=>setForm({...form, admissionStatus: e.target.value})}>
            {ADMISSION_STATUSES.map(s=> <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="border p-2 rounded" value={form.bloodGroup} onChange={e=>setForm({...form, bloodGroup: e.target.value})}>
            {BLOOD_GROUPS.map(bg=> <option key={bg} value={bg}>{bg}</option>)}
          </select>
          <div className="md:col-span-3 flex flex-col md:flex-row gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full md:w-auto">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded w-full md:w-auto" onClick={()=>{ setEditingId(null); setForm({ username: '', hospitalNo: generateHospitalNo(hospitals[0]?.id ?? null), firstName: '', lastName: '', gender: 'Male', dob: '', address: '', contactInfo: '', emergencyContact: '', admissionStatus: 'OUTPATIENT', bloodGroup: 'O+', hospitalId: hospitals[0]?.id ?? null }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2 border text-left hidden md:table-cell">ID</th>
                <th className="p-2 border text-left">Hospital No</th>
                <th className="p-2 border text-left">First Name</th>
                <th className="p-2 border text-left hidden md:table-cell">Last Name</th>
                <th className="p-2 border text-left hidden md:table-cell">Gender</th>
                <th className="p-2 border text-left hidden md:table-cell">DOB</th>
                <th className="p-2 border text-left hidden md:table-cell">Blood</th>
                <th className="p-2 border text-left">Status</th>
                <th className="p-2 border text-left hidden md:table-cell">Hospital</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map(p => (
                <tr key={p.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{p.id}</td>
                  <td className="p-2">{p.hospitalNo}</td>
                  <td className="p-2">{p.firstName}</td>
                  <td className="p-2 hidden md:table-cell">{p.lastName}</td>
                  <td className="p-2 hidden md:table-cell">{p.gender}</td>
                  <td className="p-2 hidden md:table-cell">{p.dob ? new Date(p.dob).toLocaleDateString() : ''}</td>
                  <td className="p-2 hidden md:table-cell">{p.bloodGroup}</td>
                  <td className="p-2">{p.admissionStatus}</td>
                  <td className="p-2 hidden md:table-cell">{p.hospital ? p.hospital.name : (hospitals.find(h=>h.id===p.hospitalId)?.name ?? '')}</td>
                  <td className="p-2">
                    <div className="flex flex-col md:flex-row gap-2">
                      <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(p)}>Edit</button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(p.id)}>Delete</button>
                    </div>
                  </td>
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
      </main>
    </div>
  );
};

export default PatientPage;

