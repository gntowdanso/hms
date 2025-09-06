"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';
import { getAuth } from '@/utils/auth';

const UserAccountPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ username: '', password: '', role: 'Admin', isActive: true });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [filterName, setFilterName] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const auth = getAuth();
  // derive a role string for the current user. In some dev flows auth may store roleId.
  const currentRole = auth?.role ?? (typeof auth?.roleId === 'number' && auth.roleId === 1 ? 'Admin' : undefined);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const roleQuery = currentRole ? `?role=${encodeURIComponent(currentRole)}` : '';
      const res = await fetch(`/api/useraccount${roleQuery}`);
      const d = await res.json().catch(() => []);
      setUsers(d || []);
    } catch (e) {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

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
      const payload: any = { username: form.username, passwordHash: form.password || undefined, role: form.role, isActive: form.isActive };
      const res = await apiFetch('/api/useraccount', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: 'error', text: safeServerMessage(result) || 'Server error' });
      } else {
        setMessage({ type: 'success', text: editingId ? 'User updated' : 'User created' });
        setForm({ username: '', password: '', role: 'Admin', isActive: true });
        setEditingId(null);
        await fetchUsers();
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Request failed' });
    }
    setLoading(false);
  };

  const handleEdit = (u: any) => {
    setForm({ username: u.username, password: '', role: u.role || 'Admin', isActive: u.isActive });
    setEditingId(u.id);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete user?')) return;
    setLoading(true);
    try {
  const res = await apiFetch('/api/useraccount', { method: 'DELETE', body: JSON.stringify({ id, roleId: currentRole }) });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) setMessage({ type: 'error', text: safeServerMessage(result) || 'Delete failed' });
      else setMessage({ type: 'success', text: 'Deleted successfully' });
      await fetchUsers();
    } catch (e) {
      setMessage({ type: 'error', text: 'Delete failed' });
    }
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return users.filter(u => {
      if (filterName) {
        const q = filterName.toLowerCase();
        if (!u.username?.toLowerCase().includes(q)) return false;
      }
      if (filterRole && u.role !== filterRole) return false;
      return true;
    });
  }, [users, filterName, filterRole]);

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
        <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
        {loading && <LoadingSpinner />}
        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.username} onChange={e=>setForm({ ...form, username: e.target.value })} placeholder="Username" className="border p-2 rounded" required />
          <input type="password" value={form.password} onChange={e=>setForm({ ...form, password: e.target.value })} placeholder={editingId ? 'New Password (optional)' : 'Password'} className="border p-2 rounded" required={!editingId} />
          <select value={form.role} onChange={e=>setForm({ ...form, role: e.target.value })} className="border p-2 rounded">
            <option value="Admin">Admin</option>
            <option value="Finance">Finance</option>
            <option value="Medical">Medical</option>
            <option value="Reception">Reception</option>
            <option value="Security">Security</option>
          </select>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={e=>setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <div className="flex gap-2 md:col-span-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ username: '', password: '', role: 'Admin', isActive: true }); }}>Cancel</button>}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <input placeholder="Filter by username..." className="border p-2 rounded" value={filterName} onChange={e => { setFilterName(e.target.value); setPage(1); }} />
            <select value={filterRole} onChange={e => { setFilterRole(e.target.value); setPage(1); }} className="border p-2 rounded">
              <option value="">All roles</option>
              <option value="Admin">Admin</option>
              <option value="Finance">Finance</option>
              <option value="Medical">Medical</option>
              <option value="Reception">Reception</option>
              <option value="Security">Security</option>
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
                  <th className="p-2 border">Username</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Active</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(u=> (
                  <tr key={u.id} className="border-t">
                    <td className="p-2 border">{u.id}</td>
                    <td className="p-2 border">{u.username}</td>
                    <td className="p-2 border">{u.role}</td>
                    <td className="p-2 border">{u.isActive ? 'Yes' : 'No'}</td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(u)}>Edit</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(u.id)}>Delete</button>
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

export default UserAccountPage;
