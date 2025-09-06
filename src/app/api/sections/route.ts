// cleaned sections route
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function parseRoleFromHeaders(req: Request) {
  try {
    const roleHeader = req.headers.get('x-user-role');
    if (!roleHeader) return null;
    const role = Number(roleHeader);
    if (Number.isNaN(role)) return null;
    return role;
  } catch (e) {
    return null;
  }
}

function requireMutatingRole(req: Request) {
  const role = parseRoleFromHeaders(req);
  if (role === null) return { ok: false, reason: 'missing or invalid x-user-role header' };
  if (role > 2) return { ok: false, reason: 'insufficient role privileges' };
  return { ok: true };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const item = await prisma.section.findUnique({ where: { id: Number(id) }, include: { class: true } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const list = await prisma.section.findMany({ include: { class: true } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/sections error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { classId, name, capacity } = body || {};
    if (!classId) return NextResponse.json({ error: 'Missing classId' }, { status: 400 });
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    const data: any = { classId: Number(classId), name: String(name).trim(), capacity: capacity ? Number(capacity) : null };
    const base = `${String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}` || `section-${Date.now()}`;
    let username = base;
    let attempt = 0;
    while (attempt < 10) {
      const exists = await prisma.section.findUnique({ where: { username } });
      if (!exists) break;
      attempt++;
      username = `${base}-${attempt}`;
    }
    data.username = username;
    const created = await prisma.section.create({ data });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/sections error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, classId, name, capacity } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (classId !== undefined) data.classId = classId === '' || classId === null ? null : Number(classId);
    if (name !== undefined) data.name = String(name).trim();
    if (capacity !== undefined) data.capacity = capacity === '' || capacity === null ? null : Number(capacity);
    const updated = await prisma.section.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/sections error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const id = Number(body?.id);
    if (Number.isNaN(id)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    await prisma.section.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/sections error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

