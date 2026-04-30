import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuote } from '../hooks/useQuote';
import { useCalculate } from '../hooks/useCalculate';
import { Step1_PoolDimensions } from '../components/wizard/Step1_PoolDimensions';
import { Step2_PoolOptions } from '../components/wizard/Step2_PoolOptions';
import { Step3_Results } from '../components/wizard/Step3_Results';
import { QuoteTable } from '../components/quote/QuoteTable';
import { QuoteActions } from '../components/quote/QuoteActions';
import { PoolVisual } from '../components/quote/PoolVisual';
import { HydraulicPlan } from '../components/quote/HydraulicPlan';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { ChevronLeft, Ruler, Box } from 'lucide-react';
import { QuoteLine } from '../types';

type VisualTab = 'plan2d' | 'visual3d';

const QuoteDetail = () => {
  const [visualTab, setVisualTab] = useState<VisualTab>('plan2d');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quote, updateQuote, isDirty, saving } = useQuote(id);

  // 🐛 Fix #28 : Initialize calculate hook with a structured default to prevent crash on nested `options`
  const calcHook = useCalculate(
    quote?.poolData || { length: 0, width: 0, depthShallow: 0, depthDeep: 0, type: 'SKIMMER', usage: 'RESIDENTIAL', options: {} } as any, 
    quote?.calculationResult?.overrides as any || {}
  );

  if (!quote) return <div className="p-8 text-center">Chargement du devis...</div>;

  const handleLineUpdate = (index: number, updatedLine: QuoteLine) => {
    const newLines = [...quote.lines];
    newLines[index] = updatedLine;
    updateQuote({ lines: newLines });
  };

  const handleLineRemove = (index: number) => {
    const newLines = quote.lines.filter((_, i) => i !== index);
    updateQuote({ lines: newLines });
  };

  const generatePDF = (type: 'internal' | 'client') => {
    window.open(`/api/quotes/${id}/pdf?type=${type}`, '_blank');
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
      <div className="mb-6 flex items-center justify-between shrink-0">
        <div className="flex items-center">
          <Button variant="ghost" className="mr-4 px-2" onClick={() => navigate('/')}>
            <ChevronLeft size={20} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {quote.reference}
              {isDirty && <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span></span>}
            </h1>
            <p className="text-sm text-gray-500">{quote.clientName} • {saving ? 'Enregistrement...' : (isDirty ? 'Modifications non sauvegardées' : 'Toutes les modifications sont sauvegardées')}</p>
          </div>
        </div>
        <QuoteActions quote={quote} updateStatus={(status) => updateQuote({ status })} generatePDF={generatePDF} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden min-h-0">
        <div className="lg:col-span-3 space-y-6 overflow-y-auto pr-2 pb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Détails du client</h3>
            <div className="space-y-4">
              <Input 
                label="Nom du client" 
                value={quote.clientName} 
                onChange={e => updateQuote({ clientName: e.target.value })} 
              />
              <Input 
                label="Email du client" 
                type="email" 
                value={quote.clientEmail || ''} 
                onChange={e => updateQuote({ clientEmail: e.target.value })} 
              />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Step1_PoolDimensions 
              input={calcHook.input} 
              updateInput={(k, v) => { calcHook.updateInput(k, v); updateQuote({ poolData: { ...calcHook.input, [k]: v } }); }} 
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Step2_PoolOptions 
              input={calcHook.input} 
              updateOption={(k, v) => { calcHook.updateOption(k, v); updateQuote({ poolData: { ...calcHook.input, options: { ...calcHook.input.options, [k]: v } } }); }} 
            />
          </div>
        </div>

        <div className="lg:col-span-4 flex flex-col space-y-6 overflow-y-auto pr-2 pb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Moteur hydraulique</h3>
              {Object.keys(calcHook.userOverrides).length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { calcHook.resetAllOverrides(); updateQuote({}); }} className="text-yellow-600">
                  Effacer toutes les surcharges
                </Button>
              )}
            </div>
            <Step3_Results 
              result={calcHook.result || quote.calculationResult} 
              loading={calcHook.loading} 
              setOverride={(k, v) => { calcHook.setOverride(k, v); updateQuote({}); }} 
              resetOverride={(k) => { calcHook.resetOverride(k); updateQuote({}); }} 
            />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex-1">
            <h3 className="text-lg font-medium mb-4">Notes internes</h3>
            <textarea
              className="w-full h-full min-h-[8rem] rounded-md border border-gray-300 p-3 text-sm focus:ring-primary-500 focus:border-primary-500 resize-none"
              placeholder="Ajoutez des notes internes ici..."
              value={quote.internalNotes || ''}
              onChange={e => updateQuote({ internalNotes: e.target.value })}
            />
          </div>
        </div>

        <div className="lg:col-span-5 flex flex-col space-y-6 overflow-y-auto pr-2 pb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Devis d'équipement</h3>
            <QuoteTable 
              lines={quote.lines || []} 
              updateLine={handleLineUpdate} 
              removeLine={handleLineRemove} 
            />
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Onglets 2D / 3D */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setVisualTab('plan2d')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  visualTab === 'plan2d'
                    ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Ruler size={15} />
                Plan hydraulique 2D
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">interne</span>
              </button>
              <button
                onClick={() => setVisualTab('visual3d')}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors ${
                  visualTab === 'visual3d'
                    ? 'border-b-2 border-teal-500 text-teal-600 bg-teal-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Box size={15} />
                Vue 3D Gemini
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono">client</span>
              </button>
            </div>

            <div className="p-6">
              {visualTab === 'plan2d' && (
                <HydraulicPlan quoteId={quote.id} reference={quote.reference} />
              )}
              {visualTab === 'visual3d' && (
                <PoolVisual quoteId={quote.id} />
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default QuoteDetail;
