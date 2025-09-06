"use client";
import React, { useEffect, useMemo, useState } from 'react';
import SidebarMenu from '@/components/SidebarMenu';
import LoadingSpinner from '@/components/LoadingSpinner';
import LogoutButton from '@/components/LogoutButton';
import { apiFetch } from '@/utils/apiFetch';

const InventoryPage: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<any>({ name:'', category:'', quantity:'', unitCost:'', supplierId:'' });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterQ, setFilterQ] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState<'name'|'category'|'quantity'|'unitCost'|'supplier'>('name');
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc');
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);

  const fetchItems = async () => { setLoading(true); try { const r = await fetch('/api/inventoryitems'); const d = await r.json().catch(()=>[]); setItems(Array.isArray(d)?d:[]);} catch{ setItems([]);} finally { setLoading(false);} };
  const fetchSuppliers = async () => { try { const r = await fetch('/api/suppliers'); const d = await r.json().catch(()=>[]); setSuppliers(Array.isArray(d)?d:[]);} catch{} };
  useEffect(()=>{ fetchSuppliers(); fetchItems(); }, []);

  const filtered = useMemo(()=>{ 
    const q = filterQ.trim().toLowerCase();
    let arr = items;
    if(q) arr = arr.filter((it:any)=> [it.name, it.category, it.supplier?.name].some((v:any)=> String(v||'').toLowerCase().includes(q)));
    arr = [...arr].sort((a:any,b:any)=>{
      const pick = (x:any)=> sortBy==='supplier'? (x.supplier?.name||'') : x[sortBy];
      const av = pick(a); const bv = pick(b);
      const nav = typeof av === 'number' ? av : String(av||'').toLowerCase();
      const nbv = typeof bv === 'number' ? bv : String(bv||'').toLowerCase();
      if (nav < nbv) return sortDir==='asc'? -1: 1;
      if (nav > nbv) return sortDir==='asc'? 1: -1;
      return 0;
    });
    return arr; 
  }, [items, filterQ, sortBy, sortDir]);
  const start = (page-1)*pageSize; const pageItems = filtered.slice(start, start+pageSize); const total = filtered.length;
  const safeMsg = (o:any)=> typeof o==='string'?o:(o?.message||o?.error||JSON.stringify(o));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try {
      if (!form.name?.trim() || !form.category?.trim() || !form.supplierId) { setMessage({ type:'error', text:'Name, Category and Supplier are required.' }); setLoading(false); return; }
      if (form.quantity === '' || Number(form.quantity) < 0) { setMessage({ type:'error', text:'Quantity must be 0 or greater.' }); setLoading(false); return; }
      if (form.unitCost === '' || Number(form.unitCost) < 0) { setMessage({ type:'error', text:'Unit cost must be 0 or greater.' }); setLoading(false); return; }
      const payload: any = { ...form };
      if (payload.quantity) payload.quantity = Number(payload.quantity);
      if (payload.unitCost) payload.unitCost = Number(payload.unitCost);
      if (payload.supplierId) payload.supplierId = Number(payload.supplierId);
      const res = await apiFetch('/api/inventoryitems', { method: editingId? 'PUT':'POST', body: JSON.stringify(editingId? { id: editingId, ...payload }: payload) });
      const result = await res.json().catch(()=>({}));
      if (!res.ok) setMessage({ type:'error', text: safeMsg(result)||'Server error' });
      else { setMessage({ type:'success', text: editingId? 'Updated':'Created' }); setForm({ name:'', category:'', quantity:'', unitCost:'', supplierId:'' }); setEditingId(null); await fetchItems(); }
    } catch { setMessage({ type:'error', text:'Request failed' }); }
    setLoading(false);
  };
  const handleEdit = (it:any)=>{ setForm({ name: it.name||'', category: it.category||'', quantity: String(it.quantity??''), unitCost: String(it.unitCost??''), supplierId: String(it.supplierId??'') }); setEditingId(it.id); };
  const handleDelete = async (id:number)=>{ if(!confirm('Delete item?')) return; setLoading(true); try { const res = await apiFetch('/api/inventoryitems', { method:'DELETE', body: JSON.stringify({ id }) }); const r = await res.json().catch(()=>({})); if(!res.ok) setMessage({ type:'error', text: safeMsg(r)||'Delete failed' }); else setMessage({ type:'success', text:'Deleted' }); await fetchItems(); } catch { setMessage({ type:'error', text:'Delete failed' }); } setLoading(false); };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SidebarMenu />
      <main className="flex-1 p-8">
        <LogoutButton />
        <h2 className="text-2xl font-semibold mb-4">Inventory Items</h2>
        {loading && <LoadingSpinner />}
        <div className="mb-4 flex flex-col md:flex-row gap-2 items-center">
          <input placeholder="Search name/category/supplier" value={filterQ} onChange={e=>{ setFilterQ(e.target.value); setPage(1); }} className="border p-2 rounded w-full md:flex-1" />
          <div className="flex gap-2 w-full md:w-auto">
            <select value={sortBy} onChange={e=>setSortBy(e.target.value as any)} className="border p-2 rounded">
              <option value="name">Name</option>
              <option value="category">Category</option>
              <option value="supplier">Supplier</option>
              <option value="quantity">Quantity</option>
              <option value="unitCost">Unit Cost</option>
            </select>
            <select value={sortDir} onChange={e=>setSortDir(e.target.value as any)} className="border p-2 rounded">
              <option value="asc">Asc</option>
              <option value="desc">Desc</option>
            </select>
            <select value={pageSize} onChange={e=>{ setPageSize(Number(e.target.value)); setPage(1); }} className="border p-2 rounded"><option value={5}>5</option><option value={10}>10</option><option value={20}>20</option></select>
            <button type="button" className="border px-3 rounded" onClick={()=>{
              const headers = ['ID','Name','Category','Supplier','Quantity','UnitCost'];
              const rows = filtered.map((it:any)=> [it.id,it.name,it.category,it.supplier?.name||'',it.quantity,it.unitCost]);
              const csv = [headers, ...rows].map(r=> r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');
              const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'inventory.csv'; a.click(); URL.revokeObjectURL(url);
            }}>Export CSV</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mb-6 bg-white p-4 rounded shadow grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="border p-2 rounded" placeholder="Name" value={form.name} onChange={e=>setForm({ ...form, name: e.target.value })} required />
          <input className="border p-2 rounded" placeholder="Category" value={form.category} onChange={e=>setForm({ ...form, category: e.target.value })} required />
          <input type="number" className="border p-2 rounded" placeholder="Quantity" value={form.quantity} onChange={e=>setForm({ ...form, quantity: e.target.value })} required />
          <input type="number" step="0.01" className="border p-2 rounded" placeholder="Unit Cost" value={form.unitCost} onChange={e=>setForm({ ...form, unitCost: e.target.value })} required />
          <select className="border p-2 rounded" value={form.supplierId} onChange={e=>setForm({ ...form, supplierId: e.target.value })} required>
            <option value="">-- Supplier --</option>
            {suppliers.map((s:any)=> <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="md:col-span-3 flex gap-2 justify-end">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">{editingId? 'Update':'Create'}</button>
            {editingId && <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ name:'', category:'', quantity:'', unitCost:'', supplierId:'' }); }}>Cancel</button>}
          </div>
        </form>

        {message && <div className={`mb-4 p-2 rounded ${message.type==='success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full table-auto">
            <thead><tr className="bg-gray-100"><th className="p-2 border text-left hidden md:table-cell">ID</th><th className="p-2 border text-left">Name</th><th className="p-2 border text-left">Category</th><th className="p-2 border text-left">Supplier</th><th className="p-2 border text-left">Qty</th><th className="p-2 border text-left">Unit Cost</th><th className="p-2 border">Actions</th></tr></thead>
            <tbody>
              {pageItems.map((it:any)=> (
                <tr key={it.id} className="border-t">
                  <td className="p-2 hidden md:table-cell">{it.id}</td>
                  <td className="p-2">{it.name}</td>
                  <td className="p-2">{it.category}</td>
                  <td className="p-2">{it.supplier?.name}</td>
                  <td className="p-2">{it.quantity}</td>
                  <td className="p-2">{it.unitCost}</td>
                  <td className="p-2"><div className="flex flex-col md:flex-row gap-2"><button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>handleEdit(it)}>Edit</button><button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>handleDelete(it.id)}>Delete</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-gray-600">Showing {total===0?0:start+1} - {Math.min(start+pageSize,total)} of {total}</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>Prev</button>
            <button className="px-3 py-1 border rounded" onClick={()=>setPage(p=> (page*pageSize < total ? p+1 : p))} disabled={page*pageSize >= total}>Next</button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default InventoryPage;
