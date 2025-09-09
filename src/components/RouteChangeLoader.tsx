"use client";
import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';

// A very lightweight route-change indicator that avoids content flash.
// It only appears if the navigation takes longer than a short threshold,
// and renders a thin progress bar at the top instead of a full overlay.
const RouteChangeLoader: React.FC = () => {
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (prevPath.current === null) {
      prevPath.current = pathname;
      return;
    }
    if (prevPath.current !== pathname) {
      // Reset bar state
      setProgress(0);
      setVisible(false);
      // Only show after a small delay to skip instant transitions
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setVisible(true);
        // Animate faux progress: quickly to 70%, then complete shortly after
        setProgress(70);
        const mid = setTimeout(() => setProgress(100), 150);
        const done = setTimeout(() => {
          setVisible(false);
        }, 350);
        return () => { clearTimeout(mid); clearTimeout(done); };
      }, 180);
      prevPath.current = pathname;
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-0.5 z-50 pointer-events-none">
      <div
        className="h-full bg-blue-600 transition-[width] duration-150 ease-out"
        style={{ width: progress + '%' }}
      />
    </div>
  );
};

export default RouteChangeLoader;
