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
      const item = await prisma.subject.findUnique({ where: { id: Number(id) } });
      if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(item);
    }
    const list = await prisma.subject.findMany({ include: { department: true } });
    return NextResponse.json(list);
  } catch (err) {
    console.error('GET /api/subjects error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { name, code, category, creditHours, departmentId } = body || {};
    if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    const data: any = { name: String(name).trim(), code: code ? String(code).trim() : null, category: category || 'CORE', creditHours: creditHours ? Number(creditHours) : null };
    if (departmentId !== undefined && departmentId !== null && departmentId !== '') data.departmentId = Number(departmentId);
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `subject-${Date.now()}`;
    let username = base;
    let attempt = 0;
    while (attempt < 10) {
      const exists = await prisma.subject.findUnique({ where: { username } });
      if (!exists) break;
      attempt++;
      username = `${base}-${attempt}`;
    }
    data.username = username;
    const created = await prisma.subject.create({ data });
    return NextResponse.json(created);
  } catch (err) {
    console.error('POST /api/subjects error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
    const body = await req.json();
    const { id, name, code, category, creditHours, departmentId } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    const data: any = {};
    if (name !== undefined) data.name = String(name).trim();
    if (code !== undefined) data.code = code ? String(code).trim() : null;
    if (category !== undefined) data.category = category;
    if (creditHours !== undefined) data.creditHours = creditHours === '' || creditHours === null ? null : Number(creditHours);
    if (departmentId !== undefined) data.departmentId = departmentId === '' || departmentId === null ? null : Number(departmentId);
    const updated = await prisma.subject.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/subjects error', err);
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
    await prisma.subject.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/subjects error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
