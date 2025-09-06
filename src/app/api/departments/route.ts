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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (id) {
      const dept = await prisma.department.findUnique({ where: { id: Number(id) } });
      if (!dept) return NextResponse.json({ error: 'Department not found' }, { status: 404 });
      return NextResponse.json(dept);
    }
    const depts = await prisma.department.findMany();
    return NextResponse.json(depts);
  } catch (err) {
    console.error('GET /api/departments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Mutating endpoints require a role header for now. Integrate with proper server-side auth later.
function requireMutatingRole(req: Request) {
  const role = parseRoleFromHeaders(req);
  if (role === null) return { ok: false, reason: 'missing or invalid x-user-role header' };
  if (role > 2) return { ok: false, reason: 'insufficient role privileges' };
  return { ok: true };
}

export async function POST(req: Request) {
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });

    const body = await req.json();
  const { name } = body || {};
    if (!name || typeof name !== 'string' || !name.trim()) 
        {
      return NextResponse.json({ error: 'Missing or invalid department name' }, { status: 400 });
    }

    const data: any = { name: name.trim() };
    if (body.hospitalId) {
      data.hospitalId = Number(body.hospitalId);
    }
    // compute a username (generate from name if client didn't provide one)
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let username = (body && body.username) ? String(body.username).trim() : (base || `dept-${Date.now()}`);
    // ensure uniqueness; try a few times
    let attempt = 0;
    while (attempt < 10) 
        {
      // eslint-disable-next-line no-await-in-loop
  const exists = await prisma.department.findFirst({ where: { username } });
      if (!exists) break;
      attempt += 1;
      username = `${base}-${attempt}`;
    }
    data.username = username;

    // debug help: log body and data
    console.debug('POST /api/departments body:', body);
    console.debug('POST /api/departments data:', data);

  const dept = await prisma.department.create({ data });
    return NextResponse.json(dept);
  } catch (err) {
    console.error('POST /api/departments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) 
{
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });

    const body = await req.json();
  const { id, name } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });

    const data: any = {};
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Invalid department name' }, { status: 400 });
      }
      data.name = name.trim();
    }
  // headId removed from department model; ignore any client-provided headId

    const updated = await prisma.department.update({ where: { id: parsedId }, data });
    return NextResponse.json(updated);
  } catch (err) {
    console.error('PUT /api/departments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) 
{
  try {
    const check = requireMutatingRole(req);
    if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });

    const body = await req.json();
    const { id } = body || {};
    const parsedId = Number(id);
    if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing or invalid id' }, { status: 400 });

    await prisma.department.delete({ where: { id: parsedId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/departments error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
