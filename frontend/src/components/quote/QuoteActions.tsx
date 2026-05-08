// @ts-nocheck
import React from 'react';
import { Button } from '../ui/Button';
import { FileText, Send, CheckCircle, XCircle } from 'lucide-react';
import { Quote } from '../../types';

interface Props {
  quote: Quote;
  updateStatus: (status: Quote['status']) => void;
  generatePDF: (type: 'internal' | 'client') => void;
}

export const QuoteActions: React.FC<Props> = ({ quote, updateStatus, generatePDF }) => {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex-1">
        <span className="text-sm font-medium text-slate-400 mr-2">Statut :</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-all duration-150
          ${quote.status === 'DRAFT' ? 'bg-amber-950/40 text-amber-400 border border-amber-500/30' :
            quote.status === 'SENT' ? 'bg-blue-950/40 text-blue-400 border border-blue-500/30' :
            quote.status === 'ACCEPTED' ? 'bg-green-950/40 text-green-400 border border-green-500/30' :
            'bg-red-950/40 text-red-400 border border-red-500/30'}`}>
          {quote.status}
        </span>
      </div>
      
      <Button variant="secondary" className="transition-all duration-150" onClick={() => generatePDF('internal')}>
        <FileText className="mr-2 h-4 w-4" /> PDF Interne
      </Button>
      <Button variant="secondary" className="transition-all duration-150" onClick={() => generatePDF('client')}>
        <FileText className="mr-2 h-4 w-4" /> PDF Client
      </Button>
      
      {quote.status === 'DRAFT' && (
        <Button className="bg-blue-600 hover:bg-blue-700 transition-all duration-150" onClick={() => updateStatus('SENT')}>
          <Send className="mr-2 h-4 w-4" /> Marquer envoyé
        </Button>
      )}
      
      {quote.status === 'SENT' && (
        <>
          <Button className="bg-green-600 hover:bg-green-700 transition-all duration-150" onClick={() => updateStatus('ACCEPTED')}>
            <CheckCircle className="mr-2 h-4 w-4" /> Accepter
          </Button>
          <Button onClick={() => updateStatus('REJECTED')} variant="danger" className="transition-all duration-150">
            <XCircle className="mr-2 h-4 w-4" /> Refuser
          </Button>
        </>
      )}
    </div>
  );
};

