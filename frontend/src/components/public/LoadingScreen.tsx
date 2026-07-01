import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = "Initializing CertiFlow..." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E52E40] mx-auto mb-4"></div>
        <p className="text-neutral-600">{message}</p>
      </div>
    </div>
  );
};