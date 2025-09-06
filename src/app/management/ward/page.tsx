"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';

const WardPage: React.FC = () => {
  const [wards, setWards] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ name: '', capacity: 0, departmentId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterName, setFilterName] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const fetchWards = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wards');
      const d = await res.json().catch(() => []);
      setWards(d || []);
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch('/api/departments');
      const d = await res.json().catch(() => []);
      setDepartments(d || []);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => { fetchWards(); fetchDepartments(); }, []);

  const safeServerMessage = (resObj: any) => {
    if (!resObj) return '';
    if (typeof resObj === 'string') return resObj;
    if (typeof resObj === 'object') return (resObj.error || resObj.message || JSON.stringify(resObj));
    return String(resObj);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: 'info', text: editingId ? 'Updating...' : 'Creating...' });
    try {
      const payload = { name: form.name, capacity: Number(form.capacity), departmentId: form.departmentId ? Number(form.departmentId) : null };
      const res = await apiFetch('/api/wards', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) setMessage({ type: 'error', text: safeServerMessage(result) || 'Server error' });
      else { setMessage({ type: 'success', text: editingId ? 'Ward updated' : 'Ward created' }); setForm({ name: '', capacity: 0, departmentId: '' }); setEditingId(null); await fetchWards(); }
    } catch (e) { setMessage({ type: 'error', text: 'Request failed' }); }
    setLoading(false);
  };

  const handleEdit = (w: any) => { setForm({ name: w.name, capacity: w.capacity, departmentId: w.departmentId || '' }); setEditingId(w.id); };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete ward?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/wards', { method: 'DELETE', body: JSON.stringify({ id }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) setMessage({ type: 'error', text: safeServerMessage(result) || 'Delete failed' }); else setMessage({ type: 'success', text: 'Deleted' });
      await fetchWards();
    } catch (e) { setMessage({ type: 'error', text: 'Delete failed' }); }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return wards.filter(w => { if (filterName) { const q = filterName.toLowerCase(); if (!w.name?.toLowerCase().includes(q)) return false; } return true; });
  }, [wards, filterName]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a,b) => {
      const aV = (a as any)[sortColumn]; const bV = (b as any)[sortColumn];
      if (aV == null && bV == null) return 0; if (aV == null) return sortDir === 'asc' ? -1 : 1; if (bV == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof aV === 'string') return sortDir === 'asc' ? String(aV).localeCompare(String(bV)) : String(bV).localeCompare(String(aV));
      return sortDir === 'asc' ? (aV - bV) : (bV - aV);
    });
    return copy;
  }, [filtered, sortColumn, sortDir]);

  const totalFiltered = filtered.length; const start = (page-1)*pageSize; const pageItems = useMemo(() => sorted.slice(start, start + pageSize), [sorted, start, pageSize]);
  const showingStart = totalFiltered === 0 ? 0 : start + 1; const showingEnd = Math.min(start + pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Wards</h2>
        {loading && <LoadingSpinner />}
        {message && <div className={`mb-2 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} placeholder="Ward name" className="border p-2 rounded" required />
          <input type="number" value={form.capacity} onChange={e=>setForm({ ...form, capacity: Number(e.target.value) })} placeholder="Capacity" className="border p-2 rounded" required />
          <select value={form.departmentId} onChange={e=>setForm({ ...form, departmentId: e.target.value })} className="border p-2 rounded">
            <option value="">-- Select Department --</option>
            {departments.map(d=> <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <div className="flex gap-2 md:col-span-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ name: '', capacity: 0, departmentId: '' }); }}>Cancel</button>}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <input placeholder="Filter by name..." className="border p-2 rounded" value={filterName} onChange={e => { setFilterName(e.target.value); setPage(1); }} />
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-gray-600">Page size</div>
              <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded">
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-auto border-collapse bg-white">
              <thead>
                <tr className="bg-gray-200">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Capacity</th>
                  <th className="p-2 border">Department</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(w=> (
                  <tr key={w.id} className="border-t">
                    <td className="p-2 border">{w.id}</td>
                    <td className="p-2 border">{w.name}</td>
                    <td className="p-2 border">{w.capacity}</td>
                    <td className="p-2 border">{w.department?.name || ''}</td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(w)}>Edit</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(w.id)}>Delete</button>
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

export default WardPage;
