import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Step1_PoolDimensions } from '../components/wizard/Step1_PoolDimensions';
import { Step2_PoolOptions } from '../components/wizard/Step2_PoolOptions';
import { Step3_Results } from '../components/wizard/Step3_Results';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useCalculate } from '../hooks/useCalculate';
import api from '../services/api';
import { PoolInput } from '../types';
import { AlertCircle } from 'lucide-react';

const defaultInput: PoolInput = {
  length: 8, width: 4, depthShallow: 1.2, depthDeep: 1.8,
  type: 'SKIMMER', usage: 'RESIDENTIAL',
  options: { heating: false, spa: false, counterCurrent: false, lighting: true }
};

const NewQuote = () => {
  const navigate = useNavigate();
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  // 🐛 Fix #25 : état d'erreur visible par l'utilisateur
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  const { input, updateInput, updateOption, result, loading, setOverride, resetOverride } = useCalculate(defaultInput);

  const handleCreate = async () => {
    if (!result || !clientName.trim()) return;
    setCreateError(null);
    setCreating(true);
    try {
      const payload = {
        poolData: input,
        calcParams: {},
        calculationResult: result,
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || null,
      };
      const { data } = await api.post('/quotes', payload);
      navigate(`/quote/${data.id}`);
    } catch (e: any) {
      // 🐛 Fix #25 : message d'erreur visible dans l'UI
      const msg = e?.response?.data?.error || 'Erreur lors de la création du devis.';
      setCreateError(msg);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Créer un nouveau devis</h1>
        <Button onClick={handleCreate} disabled={!result || !clientName.trim() || creating}>
          {creating ? 'Création...' : 'Créer le brouillon'}
        </Button>
      </div>

      {/* 🐛 Fix #25 : bannière d'erreur */}
      {createError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          {createError}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium mb-4">Détails du client</h3>
            <div className="space-y-4">
              <Input label="Nom du client" value={clientName} onChange={e => setClientName(e.target.value)} required />
              <Input label="Email du client" type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Step1_PoolDimensions input={input} updateInput={updateInput} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <Step2_PoolOptions input={input} updateOption={updateOption} />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 min-h-full">
            <Step3_Results 
              result={result} 
              loading={loading} 
              setOverride={setOverride} 
              resetOverride={resetOverride} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewQuote;
