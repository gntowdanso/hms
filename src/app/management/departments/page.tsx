"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getAuth } from '@/utils/auth';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';

const DepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ name: '', description: '', hospitalId: '' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  const [filterName, setFilterName] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const fetchDepartments = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/departments');
      const data = await res.json().catch(() => []);
      if (Array.isArray(data)) {
        setDepartments(data);
      } else {
        setDepartments([]);
      }
    } catch (e) {}
    setLoading(false);
  };

  const fetchHospitals = async () => {
    try {
      const res = await apiFetch('/api/hospital');
      const data = await res.json().catch(() => []);
      setHospitals(Array.isArray(data) ? data : []);
    } catch {}
  };

  // staff list and head selection removed per request

  useEffect(() => { fetchDepartments(); fetchHospitals(); }, []);

  const safeServerMessage = (resObj: any) => {
    if (!resObj) return '';
    if (typeof resObj === 'string') return resObj;
    if (typeof resObj === 'object') return (resObj.error || (resObj as any).message || JSON.stringify(resObj));
    return String(resObj);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    if (!form.name || !String(form.name).trim()) { setMessage({ type: 'error', text: 'Department name is required' }); setLoading(false); return; }
    if (!form.hospitalId) { setMessage({ type: 'error', text: 'Hospital is required' }); setLoading(false); return; }
    const payload: any = { name: form.name, description: form.description || null, hospitalId: Number(form.hospitalId) };
    const user = getAuth();
    if (user && user.username) payload.userName = user.username;
    setMessage({ type: 'info', text: editingId ? 'Updating...' : 'Creating...' });
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { id: editingId, ...payload } : payload;
    try {
      payload.username = user.username;
      const res = await apiFetch('/api/departments', { method, body: JSON.stringify(body) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        const serverMsg = safeServerMessage(result) || 'Server error';
        setMessage({ type: 'error', text: serverMsg });
        setLoading(false);
        return;
      }
      setMessage({ type: 'success', text: editingId ? 'Department updated' : 'Department created' });
      setForm({ name: '', description: '', hospitalId: '' });
      setEditingId(null);
      await fetchDepartments();
    } catch (e) {
      setMessage({ type: 'error', text: 'Request failed' });
    }
    setLoading(false);
  };

  const handleEdit = (d: any) => { setForm({ name: d.name, description: d.description, hospitalId: d.hospitalId }); setEditingId(d.id); };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete department?')) return;
    setLoading(true);
    try {
      const res = await apiFetch('/api/departments', { method: 'DELETE', body: JSON.stringify({ id }) });
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
    await fetchDepartments();
    setLoading(false);
  };

  // memoized lists
  const filtered = useMemo(() => {
    if (!Array.isArray(departments)) return [];
    return departments.filter(d => {
      if (filterName) {
        const q = filterName.toLowerCase();
        if (!String(d.name || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [departments, filterName]);

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
        <h2 className="text-2xl font-bold mb-4">Departments</h2>
        {loading && <LoadingSpinner />}

        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border p-2 rounded" required />
          <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="border p-2 rounded" />
          <select value={form.hospitalId} onChange={e => setForm({ ...form, hospitalId: e.target.value })} className="border p-2 rounded" required>
            <option value="">Select Hospital</option>
            {hospitals.map(h => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
          <div className="md:col-span-2 flex gap-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={() => { setEditingId(null); setForm({ name: '', description: '', hospitalId: '' }); }}>Cancel</button>}
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
                  <th className="p-2 border"><button onClick={() => { if (sortColumn === 'name') setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortColumn('name'); setSortDir('asc'); } }}>Name {sortColumn === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}</button></th>
                  <th className="p-2 border">Hospital</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(d => (
                  <tr key={d.id} className="border-t">
                    <td className="p-2 border">{d.id}</td>
                    <td className="p-2 border">{d.name}</td>
                    <td className="p-2 border">{hospitals.find(h => h.id === d.hospitalId)?.name || d.hospitalId}</td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={() => handleEdit(d)}>Edit</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => handleDelete(d.id)}>Delete</button>
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

export default DepartmentPage;
