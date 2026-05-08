// @ts-nocheck
import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuote } from '../hooks/useQuote';
import { useCalculate } from '../hooks/useCalculate';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, Trash2, Download, RefreshCw } from 'lucide-react';
import { StatusChip } from '../components/shared/StatusChip';
import { Step1_Client } from '../components/wizard/Step1_Client';
import { Step2_Dimensions } from '../components/wizard/Step2_Dimensions';
import { Step3_Options } from '../components/wizard/Step3_Options';
import { HydraulicResultsCard } from '../components/shared/HydraulicResultsCard';
import { QuoteLine } from '../types';
import api from '../services/api';

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quote, updateQuote, isDirty, saving } = useQuote(id);

  const calcHook = useCalculate(
    quote?.poolData ?? {
      shape: 'RECTANGULAR',
      shapeParams: { shape: 'RECTANGULAR', length: 0, width: 0 },
      length: 0, width: 0,
      depthShallow: 0, depthDeep: 0,
      type: 'SKIMMER', usage: 'RESIDENTIAL',
      options: { heating: false, spa: false, counterCurrent: false, lighting: false },
    },
    (quote?.calculationResult?.overrides as unknown as Record<string, number>) ?? {}
  );

  if (!quote) return <div className="p-8 text-center text-slate-500">Chargement du devis...</div>;

  const handleLineUpdate = (index: number, key: keyof QuoteLine, val: any) => {
    const newLines = [...quote.lines];
    newLines[index] = { ...newLines[index], [key]: val, isManuallyEdited: true };
    updateQuote({ lines: newLines });
  };

  const handleLineRemove = (index: number) => {
    const newLines = quote.lines.filter((_, i) => i !== index);
    updateQuote({ lines: newLines });
  };

  const generatePDF = (type: 'internal' | 'client') => window.open(`/api/quotes/${id}/pdf?type=${type}`, '_blank');
  
  const totalHT = quote.lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice * (1 - l.discount / 100)), 0);

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full gap-6 pb-20">
      <div className="flex justify-between items-center px-4 py-4 bg-[#0d1117] border border-[#1e2a3a] rounded-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft size={20} /></Button>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              <span className="font-mono">{quote.reference}</span>
              <StatusChip status={quote.status} />
            </h1>
            <p className="text-xs text-slate-500">
              {quote.clientName} • {saving ? 'Enregistrement...' : (isDirty ? 'Modifications non sauvegardées' : 'Toutes les modifications sont sauvegardées')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => generatePDF('internal')}><Download size={16} /> PDF Interne</Button>
          <Button variant="secondary" onClick={() => generatePDF('client')}><Download size={16} /> PDF Client</Button>
          <Button variant="primary" onClick={() => updateQuote({ status: 'SENT' })}>Marquer envoyé</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Step1_Client 
          clientName={quote.clientName} clientEmail={quote.clientEmail || ''} 
          setClientName={v => updateQuote({ clientName: v })} setClientEmail={v => updateQuote({ clientEmail: v })} 
          onNext={() => {}} 
        />
        <Step2_Dimensions 
          input={calcHook.input} updateInput={(k, v) => { calcHook.updateInput(k, v); updateQuote({ poolData: { ...calcHook.input, [k]: v } }); }} 
          onNext={() => {}} onBack={() => {}} 
        />
        <Step3_Options 
          input={calcHook.input} updateOption={(k, v) => { calcHook.updateOption(k, v); updateQuote({ poolData: { ...calcHook.input, options: { ...calcHook.input.options, [k]: v } } }); }} 
          onNext={() => {}} onBack={() => {}} 
        />
      </div>

      <HydraulicResultsCard 
        result={calcHook.result || quote.calculationResult} 
        loading={calcHook.loading} 
        setOverride={(k, v) => { calcHook.setOverride(k, v); updateQuote({}); }} 
        onRecalculate={() => updateQuote({ calculationResult: calcHook.result! })}
      />

      <Card>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1117] border-b border-[#1e2a3a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Qté</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prix Unitaire</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Remise %</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((item, index) => (
                <tr key={index} className="border-b border-[#1e2a3a]/60">
                  <td className="px-4 py-3 text-slate-300">{item.product?.name || 'Article personnalisé'}</td>
                  <td className="px-4 py-3"><Input className="font-mono" type="number" value={item.quantity.toString()} onChange={v => handleLineUpdate(index, 'quantity', parseFloat(v.target.value)||0)} /></td>
                  <td className="px-4 py-3"><Input className="font-mono" type="number" value={item.unitPrice.toString()} onChange={v => handleLineUpdate(index, 'unitPrice', parseFloat(v.target.value)||0)} /></td>
                  <td className="px-4 py-3"><Input className="font-mono" type="number" value={item.discount.toString()} onChange={v => handleLineUpdate(index, 'discount', parseFloat(v.target.value)||0)} /></td>
                  <td className="px-4 py-3 text-slate-200 font-mono">{(item.quantity * item.unitPrice * (1 - item.discount / 100)).toFixed(2)} €</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" onClick={() => handleLineRemove(index)}><Trash2 size={16} className="text-red-500" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 flex justify-end items-center gap-4 border-t border-[#1e2a3a]">
            <span className="text-slate-500 font-medium">Total HT :</span>
            <span className="text-xl font-bold text-slate-100 font-mono">{totalHT.toFixed(2)} €</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuoteDetail;


export default QuoteDetail;

