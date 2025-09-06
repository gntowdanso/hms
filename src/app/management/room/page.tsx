"use client";
import React, { useEffect, useState, useMemo } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import { apiFetch } from '@/utils/apiFetch';
import LogoutButton from '@/components/LogoutButton';

const RoomPage: React.FC = () => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [wards, setWards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ wardId: '', roomNumber: '', bedNumber: '', status: 'AVAILABLE' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [filterRoom, setFilterRoom] = useState('');
  const [message, setMessage] = useState<{ type: 'success'|'error'|'info', text: string } | null>(null);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rooms');
      const d = await res.json().catch(() => []);
      setRooms(d || []);
    } catch (e) {
      // ignore
    } finally { setLoading(false); }
  };

  const fetchWards = async () => {
    try { const res = await fetch('/api/wards'); const d = await res.json().catch(() => []); setWards(d || []); } catch(e){}
  };

  useEffect(()=>{ fetchRooms(); fetchWards(); }, []);

  const safeServerMessage = (resObj: any) => {
    if (!resObj) return '';
    if (typeof resObj === 'string') return resObj;
    if (typeof resObj === 'object') return (resObj.error || resObj.message || JSON.stringify(resObj));
    return String(resObj);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setMessage({ type: 'info', text: editingId ? 'Updating...' : 'Creating...' });
    try {
      const payload = { wardId: form.wardId ? Number(form.wardId) : null, roomNumber: form.roomNumber, bedNumber: form.bedNumber, status: form.status };
      const res = await apiFetch('/api/rooms', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(editingId ? { id: editingId, ...payload } : payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type: 'error', text: safeServerMessage(result) || 'Server error' });
      else { setMessage({ type: 'success', text: editingId ? 'Room updated' : 'Room created' }); setForm({ wardId: '', roomNumber: '', bedNumber: '', status: 'AVAILABLE' }); setEditingId(null); await fetchRooms(); }
    } catch(e){ setMessage({ type: 'error', text: 'Request failed' }); }
    setLoading(false);
  };

  const handleEdit = (r:any) => { setForm({ wardId: r.wardId, roomNumber: r.roomNumber, bedNumber: r.bedNumber, status: r.status }); setEditingId(r.id); };
  const handleDelete = async (id:number) => { if(!window.confirm('Delete room?')) return; setLoading(true); try { const res = await apiFetch('/api/rooms',{ method:'DELETE', body: JSON.stringify({ id }) }); const result = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeServerMessage(result)||'Delete failed' }); else setMessage({ type:'success', text: 'Deleted' }); await fetchRooms(); } catch(e){ setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  const filtered = useMemo(()=> rooms.filter(r => { if(filterRoom){ const q = filterRoom.toLowerCase(); if(!String(r.roomNumber||'').toLowerCase().includes(q) && !String(r.bedNumber||'').toLowerCase().includes(q)) return false; } return true; }), [rooms, filterRoom]);
  const totalFiltered = filtered.length; const start = (page-1)*pageSize; const pageItems = useMemo(() => filtered.slice(start, start + pageSize), [filtered, start, pageSize]);
  const showingStart = totalFiltered === 0 ? 0 : start + 1; const showingEnd = Math.min(start + pageSize, totalFiltered);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <LogoutButton />
      <main className="flex-1 p-8 relative">
        <h2 className="text-2xl font-bold mb-4">Rooms</h2>
        {loading && <LoadingSpinner />}
        {message && <div className={`mb-2 p-2 rounded ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <form onSubmit={handleSubmit} className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <select value={form.wardId} onChange={e=>setForm({ ...form, wardId: e.target.value })} className="border p-2 rounded">
            <option value="">-- Select Ward --</option>
            {wards.map(w=> <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <input value={form.roomNumber} onChange={e=>setForm({ ...form, roomNumber: e.target.value })} placeholder="Room number" className="border p-2 rounded" required />
          <input value={form.bedNumber} onChange={e=>setForm({ ...form, bedNumber: e.target.value })} placeholder="Bed number" className="border p-2 rounded" />
          <select value={form.status} onChange={e=>setForm({ ...form, status: e.target.value })} className="border p-2 rounded">
            <option value="AVAILABLE">Available</option>
            <option value="OCCUPIED">Occupied</option>
            <option value="UNDERMAINTENANCE">Under maintenance</option>
          </select>
          <div className="flex gap-2 md:col-span-2">
            <button className="bg-blue-600 text-white px-4 py-2 rounded" type="submit">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ wardId: '', roomNumber: '', bedNumber: '', status: 'AVAILABLE' }); }}>Cancel</button>}
          </div>
        </form>

        <div className="mt-4">
          <div className="flex gap-2 items-center mb-2">
            <input placeholder="Filter by room/bed..." className="border p-2 rounded" value={filterRoom} onChange={e=>{ setFilterRoom(e.target.value); setPage(1); }} />
            <div className="ml-auto flex items-center gap-2">
              <div className="text-sm text-gray-600">Page size</div>
              <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded">
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
                  <th className="p-2 border">Ward</th>
                  <th className="p-2 border">Room</th>
                  <th className="p-2 border">Bed</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map(r=> (
                  <tr key={r.id} className="border-t">
                    <td className="p-2 border">{r.id}</td>
                    <td className="p-2 border">{r.ward?.name || ''}</td>
                    <td className="p-2 border">{r.roomNumber}</td>
                    <td className="p-2 border">{r.bedNumber}</td>
                    <td className="p-2 border">{r.status}</td>
                    <td className="p-2 border">
                      <div className="flex gap-2">
                        <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(r)}>Edit</button>
                        <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(r.id)}>Delete</button>
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

export default RoomPage;
