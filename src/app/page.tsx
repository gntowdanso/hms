
"use client";
import React, { useEffect, useState } from 'react';
import SidebarMenu from '../components/SidebarMenu';
import { getAuth } from '../utils/auth';
import LogoutButton from '../components/LogoutButton';
import { useRouter } from 'next/navigation';

const HomePage: React.FC = () => {
  const [authenticated, setAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const user = getAuth();
    if (!user) {
      router.push('/login');
    } else {
      setAuthenticated(true);
    }
  }, [router]);

  if (!authenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <SidebarMenu />
      <main className="flex-1 p-8 relative">
  <LogoutButton />
        <h2 className="text-3xl font-bold mb-4">Welcome to Hospital Management System</h2>
        <p className="text-lg">Select an option from the menu to get started.</p>
      </main>
    </div>
  );
};

export default HomePage;
