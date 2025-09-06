import { NextResponse } from 'next/server';

// Static roles list since roles are represented as a string on UserAccount
export async function GET() {
  const roles = [
    { id: 1, roleName: 'Admin' },
    { id: 2, roleName: 'Staff' },
    { id: 3, roleName: 'Doctor' },
    { id: 4, roleName: 'Nurse' },
    { id: 5, roleName: 'Patient' },
  ];
  return NextResponse.json(roles);
}
