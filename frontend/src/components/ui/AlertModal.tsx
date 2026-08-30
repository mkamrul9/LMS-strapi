import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  title?: string;
}

export default function AlertModal({ isOpen, onClose, message, title = 'Notification' }: AlertModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4 text-amber-500">
            <AlertCircle className="w-6 h-6" />
            <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          </div>
          <p className="text-slate-600 text-sm leading-relaxed mb-6">
            {message}
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Okay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
