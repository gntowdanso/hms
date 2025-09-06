"use client";
import React, { useState } from 'react';
import LoginForm from '../../components/LoginForm';
import LoadingSpinner from '@/components/LoadingSpinner';
import { setAuth } from '../../utils/auth';
import { useRouter } from 'next/navigation';

const LoginPage: React.FC = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (username: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        // set session with default TTL (1 hour)
        setAuth(data.user);
  // using localStorage (setAuth) only; avoid client-side cookies
        router.push('/');
      }
      else 
        {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-100">
      <LoginForm onLogin={handleLogin} />
  {loading && <LoadingSpinner message="Logging in..." />}
      {error && <div className="mt-4 text-red-600">{error}</div>}
    </div>
  );
};

export default LoginPage;
