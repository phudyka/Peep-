// @ts-nocheck
import React from 'react';

interface Props {
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
}

const statusConfig = {
  DRAFT:    { label: 'BROUILLON', className: 'bg-amber-950/40 text-amber-400 border border-amber-500/30' },
  SENT:     { label: 'ENVOYÉ',    className: 'bg-blue-950/40 text-blue-400 border border-blue-500/30' },
  ACCEPTED: { label: 'ACCEPTÉ',   className: 'bg-green-950/40 text-green-400 border border-green-500/30' },
  REJECTED: { label: 'REFUSÉ',    className: 'bg-red-950/40 text-red-400 border border-red-500/30' },
};

export const StatusChip: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.DRAFT;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} transition-all duration-150`}>
      {config.label}
    </span>
  );
};

