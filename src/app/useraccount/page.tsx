"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function UserAccountPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/management/useraccount');
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="text-lg font-medium">Redirecting to Management › User Accounts</div>
        <div className="text-sm text-gray-600 mt-2">If not redirected automatically, <a href="/management/useraccount" className="text-blue-600 underline">click here</a>.</div>
      </div>
    </div>
  );
}
