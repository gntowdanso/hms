"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { clearAuth } from '@/utils/auth';

const LogoutButton: React.FC<{ className?: string }> = ({ className }) => {
  const router = useRouter();
  return (
    <button
      className={className || 'absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700'}
      onClick={() => {
        try { clearAuth(); } catch (e) { /* ignore */ }
        router.push('/login');
      }}
    >
      Logout
    </button>
  );
};

export default LogoutButton;
