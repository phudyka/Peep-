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
        <span className="text-sm font-medium text-gray-500 mr-2">Statut :</span>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
          ${quote.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
            quote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
            quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'}`}>
          {quote.status}
        </span>
      </div>
      
      <Button variant="secondary" onClick={() => generatePDF('internal')}>
        <FileText className="mr-2 h-4 w-4" /> PDF Interne
      </Button>
      <Button variant="secondary" onClick={() => generatePDF('client')}>
        <FileText className="mr-2 h-4 w-4" /> PDF Client
      </Button>
      
      {quote.status === 'DRAFT' && (
        <Button onClick={() => updateStatus('SENT')} className="bg-blue-600 hover:bg-blue-700">
          <Send className="mr-2 h-4 w-4" /> Marquer envoyé
        </Button>
      )}
      
      {quote.status === 'SENT' && (
        <>
          <Button onClick={() => updateStatus('ACCEPTED')} className="bg-green-600 hover:bg-green-700">
            <CheckCircle className="mr-2 h-4 w-4" /> Accepter
          </Button>
          <Button onClick={() => updateStatus('REJECTED')} variant="danger">
            <XCircle className="mr-2 h-4 w-4" /> Refuser
          </Button>
        </>
      )}
    </div>
  );
};
