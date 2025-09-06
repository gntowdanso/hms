"use client";
import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center p-4">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600 mr-3" />
      <span className="text-gray-600">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
