// @ts-nocheck
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-2xl bg-peep-surface border border-peep-border shadow-2xl shadow-black/50 p-6">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-all duration-150"
        >
          &times;
        </button>
        <h2 className="text-xl font-bold text-slate-100 mb-4">{title}</h2>
        {children}
        {footer && (
          <div className="flex justify-end gap-3 mt-6 pt-5 border-t border-peep-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

