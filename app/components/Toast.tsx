'use client';
import { useEffect, useState } from 'react';
import { CheckCircle } from 'lucide-react';

interface ToastProps {
  message: string;
  show: boolean;
  onHide: () => void;
}

export default function Toast({ message, show, onHide }: ToastProps) {
  useEffect(() => {
    if (show) {
      const t = setTimeout(onHide, 2500);
      return () => clearTimeout(t);
    }
  }, [show, onHide]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm font-medium text-gray-800 transition-all duration-300 ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <CheckCircle size={16} className="text-emerald-500 shrink-0" />
      {message}
    </div>
  );
}
