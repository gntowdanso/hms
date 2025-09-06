"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getAuth } from '@/utils/auth';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';

const StaffPage: React.FC = () => {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ staffNo: '', firstName: '', lastName: '', role: 'ADMIN', departmentId: '', contactInfo: '', email: '', employmentDate: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterName, setFilterName] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const fetchStaff = () => { setLoading(true); fetch('/api/staff').then(r=>r.json()).then(d=>{ setStaff(d||[]); setLoading(false)}).catch(()=>setLoading(false)); };
  const fetchDepartments = () => { fetch('/api/departments').then(r=>r.json()).then(d=>setDepartments(d||[])).catch(()=>{}); };

  useEffect(()=>{ fetchStaff(); fetchDepartments(); }, []);

  const safeServerMessage = (resObj: any) => {
    if (!resObj) return '';
    if (typeof resObj === 'string') return resObj;
    if (typeof resObj === 'object') return (resObj.error || (resObj as any).message || JSON.stringify(resObj));
    return String(resObj);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // validations
    if (!form.staffNo || !String(form.staffNo).trim()) { setMessage({ type: 'error', text: 'Staff number is required' }); setLoading(false); return; }
    if (!form.firstName || !String(form.firstName).trim()) { setMessage({ type: 'error', text: 'First name is required' }); setLoading(false); return; }
    if (!form.lastName || !String(form.lastName).trim()) { setMessage({ type: 'error', text: 'Last name is required' }); setLoading(false); return; }

  const payload: any = { staffNo: form.staffNo, firstName: form.firstName, lastName: form.lastName, role: form.role, departmentId: form.departmentId ? Number(form.departmentId) : null, contactInfo: form.contactInfo || null, email: form.email || null, employmentDate: form.employmentDate ? new Date(form.employmentDate) : null };
    const user = getAuth();
    if (user && user.username) payload.userName = user.username;

    setMessage({ type: 'info', text: editingId ? 'Updating...' : 'Creating...' });
    try {
        payload.username = user.username;
      const res = await apiFetch('/api/staff', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMsg = safeServerMessage(result) || 'Server error';
        setMessage({ type: 'error', text: serverMsg });
        setLoading(false);
        return;
      }
      setMessage({ type: 'success', text: editingId ? 'Staff updated' : 'Staff created' });
  setForm({ staffNo: '', firstName: '', lastName: '', role: 'ADMIN', departmentId: '', contactInfo: '', email: '', employmentDate: '' });
      setEditingId(null);
      await fetchStaff();
    } catch (e) {
      setMessage({ type: 'error', text: 'Request failed' });
    }
    setLoading(false);
  };

  const handleEdit = (s: any) => { setForm({ staffNo: s.staffNo, firstName: s.firstName, lastName: s.lastName, role: s.role, departmentId: s.departmentId || '', contactInfo: s.contactInfo, email: s.email, employmentDate: s.employmentDate ? new Date(s.employmentDate).toISOString().slice(0,10) : '' }); setEditingId(s.id); };

  const handleDelete = async (id: number) => {
    if(!window.confirm('Delete staff?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/staff',{ method:'DELETE', body: JSON.stringify({ id }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMsg = safeServerMessage(result) || 'Delete failed';
        setMessage({ type: 'error', text: serverMsg });
      } else {
        setMessage({ type: 'success', text: 'Deleted successfully' });
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Delete failed' });
    }
    await fetchStaff();
    setLoading(false);
  };

  // memoized filtered/sorted/paginated lists
  const filtered = useMemo(() => {
    return staff.filter(s => {
      if (filterName) {
        const q = filterName.toLowerCase();
        if (!(`${s.firstName} ${s.lastName}`.toLowerCase().includes(q) || String(s.staffNo || '').toLowerCase().includes(q))) return false;
      }
      if (filterDept && String((s.department?.id) || '') !== '' && !String(s.department?.id).includes(filterDept)) return false;
      if (filterRole && s.role !== filterRole) return false;
      return true;
    });
  }, [staff, filterName, filterDept, filterRole]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a,b) => {
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

  const totalFiltered = filtered.length;
  const start = (page-1)*pageSize;
  const pageItems = useMemo(() => sorted.slice(start, start + pageSize), [sorted, start, pageSize]);
  const showingStart = totalFiltered === 0 ? 0 : start + 1;
  const showingEnd = Math.min(start + pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Staff</h2>
        {loading && <LoadingSpinner />}
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.staffNo} onChange={e=>setForm({ ...form, staffNo: e.target.value })} placeholder="Staff No" className="border p-2 rounded" required />
          <input value={form.firstName} onChange={e=>setForm({ ...form, firstName: e.target.value })} placeholder="First Name" className="border p-2 rounded" required />
          <input value={form.lastName} onChange={e=>setForm({ ...form, lastName: e.target.value })} placeholder="Last Name" className="border p-2 rounded" required />
          <select value={form.role} onChange={e=>setForm({ ...form, role: e.target.value })} className="border p-2 rounded">
            <option value="ADMIN">Admin</option>
            <option value="FINANCE">Finance</option>
            <option value="SECURITY">Security</option>
            <option value="MEDICAL">Medical</option>
            <option value="RECEPTION">Reception</option>
            <option value="CLEANER">Cleaner</option>
          </select>
          <select value={form.departmentId} onChange={e=>setForm({ ...form, departmentId: e.target.value })} className="border p-2 rounded">
            <option value="">-- Select Department --</option>
            {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <input value={form.contactInfo} onChange={e=>setForm({ ...form, contactInfo: e.target.value })} placeholder="Contact Info" className="border p-2 rounded" />
          <input value={form.email} onChange={e=>setForm({ ...form, email: e.target.value })} placeholder="Email" className="border p-2 rounded" />
          <input type="date" value={form.employmentDate} onChange={e=>setForm({ ...form, employmentDate: e.target.value })} className="border p-2 rounded" />
          <div className="flex gap-2 md:col-span-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ staffNo: '', firstName: '', lastName: '', role: 'ADMIN', departmentId: '', contactInfo: '', email: '', employmentDate: '' }); }}>Cancel</button>}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <input placeholder="Filter by name or staff no..." className="border p-2 rounded" value={filterName} onChange={e => { setFilterName(e.target.value); setPage(1); }} />
            <select value={filterDept} onChange={e => { setFilterDept(e.target.value); setPage(1); }} className="border p-2 rounded">
              <option value="">All departments</option>
              {departments.map(d => <option key={d.id} value={String(d.id)}>{d.name}</option>)}
            </select>
            <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} className="border p-2 rounded">
              <option value="">All roles</option>
              <option value="ADMIN">Admin</option>
              <option value="FINANCE">Finance</option>
              <option value="SECURITY">Security</option>
              <option value="LIBRARIAN">Librarian</option>
              <option value="TEACHER_LEAD">Teacher Lead</option>
            </select>
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-gray-600">Page size</div>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded">
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>

          {message && (
            <div className={`mb-2 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : message.type === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
              {message.text}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border"><button onClick={() => { if (sortColumn === 'id') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn('id'); setSortDir('asc'); } }}>ID {sortColumn === 'id' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button></th>
                  <th className="p-2 border"><button onClick={() => { if (sortColumn === 'staffNo') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn('staffNo'); setSortDir('asc'); } }}>Staff No {sortColumn === 'staffNo' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button></th>
                  <th className="p-2 border"><button onClick={() => { if (sortColumn === 'firstName') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn('firstName'); setSortDir('asc'); } }}>Name {sortColumn === 'firstName' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button></th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Dept</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(s=> (
                  <tr key={s.id} className="border-t">
                    <td className="p-2 border">{s.id}</td>
                    <td className="p-2 border">{s.staffNo}</td>
                    <td className="p-2 border">{s.firstName} {s.lastName}</td>
                    <td className="p-2 border">{s.role}</td>
                    <td className="p-2 border">{s.department ? s.department.name : ''}</td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(s)}>Edit</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(s.id)}>Delete</button>
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
              <button className="px-3 py-1 border rounded" onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1}>Prev</button>
              <button className="px-3 py-1 border rounded" onClick={() => setPage(p => (page*pageSize < totalFiltered ? p+1 : p))} disabled={page*pageSize >= totalFiltered}>Next</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffPage;
