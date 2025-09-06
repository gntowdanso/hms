"use client";
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import LoadingSpinner from './LoadingSpinner';

const RouteChangeLoader: React.FC = () => {
  const pathname = usePathname();
  const prev = useRef<string | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (prev.current === null) {
      prev.current = pathname;
      return;
    }
    if (prev.current !== pathname) {
      // show a brief loader on route change
      setShow(true);
      const t = setTimeout(() => setShow(false), 500);
      prev.current = pathname;
      return () => clearTimeout(t);
    }
  }, [pathname]);

  if (!show) return null;
  return (
    <div className="fixed top-0 left-0 w-full bg-white/50 backdrop-blur z-50">
      <div className="max-w-4xl mx-auto p-2">
        <LoadingSpinner message="Loading..." />
      </div>
    </div>
  );
};

export default RouteChangeLoader;
