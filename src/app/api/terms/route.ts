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
			const item = await prisma.term.findUnique({ where: { id: Number(id) }, include: { academicYear: true } });
			if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
			return NextResponse.json(item);
		}
		const list = await prisma.term.findMany({ include: { academicYear: true } });
		return NextResponse.json(list);
	} catch (err) {
		console.error('GET /api/terms error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const check = requireMutatingRole(req);
		if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
		const body = await req.json();
		const { name, startDate, endDate, status, academicYearId } = body || {};
		if (!name) return NextResponse.json({ error: 'Missing name' }, { status: 400 });
		const data: any = { name: String(name).trim(), startDate: startDate ? new Date(startDate) : null, endDate: endDate ? new Date(endDate) : null, status: status || 'ACTIVE' };
		if (academicYearId) data.academicYear = { connect: { id: Number(academicYearId) } };
		const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || `term-${Date.now()}`;
		let username = base;
		let attempt = 0;
		while (attempt < 10) {
			const exists = await prisma.term.findUnique({ where: { username } });
			if (!exists) break;
			attempt++;
			username = `${base}-${attempt}`;
		}
		data.username = username;
		const created = await prisma.term.create({ data });
		return NextResponse.json(created);
	} catch (err) {
		console.error('POST /api/terms error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function PUT(req: Request) {
	try {
		const check = requireMutatingRole(req);
		if (!check.ok) return NextResponse.json({ error: check.reason }, { status: 401 });
		const body = await req.json();
		const { id, name, startDate, endDate, status, academicYearId } = body || {};
		const parsedId = Number(id);
		if (Number.isNaN(parsedId)) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
		const data: any = {};
		if (name !== undefined) data.name = String(name).trim();
		if (startDate !== undefined) data.startDate = startDate ? new Date(startDate) : null;
		if (endDate !== undefined) data.endDate = endDate ? new Date(endDate) : null;
		if (status !== undefined) data.status = status;
		if (academicYearId !== undefined) data.academicYearId = academicYearId === '' || academicYearId === null ? null : Number(academicYearId);
		const updated = await prisma.term.update({ where: { id: parsedId }, data });
		return NextResponse.json(updated);
	} catch (err) {
		console.error('PUT /api/terms error', err);
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
		await prisma.term.delete({ where: { id } });
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error('DELETE /api/terms error', err);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
