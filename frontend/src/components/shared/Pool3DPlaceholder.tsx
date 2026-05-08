import React from 'react';
import { Package } from 'lucide-react';

export const Pool3DPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center rounded-xl border border-[#1e2a3a] bg-[#0d1117]">
    <div className="w-16 h-16 rounded-2xl bg-[#161b25] border border-[#1e2a3a] flex items-center justify-center mb-4">
      <Package size={28} className="text-slate-600" />
    </div>
    <h3 className="text-base font-semibold text-slate-300 mb-1">Visualisation 3D</h3>
    <p className="text-sm text-slate-500">Bientôt disponible</p>
  </div>
);
