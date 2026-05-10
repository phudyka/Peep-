import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Step1_Client } from '../components/wizard/Step1_Client';
import { Step2_Dimensions } from '../components/wizard/Step2_Dimensions';
import { Step3_Options } from '../components/wizard/Step3_Options';
import { Step4_Summary } from '../components/wizard/Step4_Summary';
import { useCalculate } from '../hooks/useCalculate';
import api from '../services/api';
import { PoolInput } from '../types';
import { Check, AlertCircle } from 'lucide-react';
import { cn } from '../components/ui/Button';

const defaultInput: PoolInput = {
  shape: 'RECTANGULAR',
  shapeParams: { shape: 'RECTANGULAR', length: 8, width: 4 },
  length: 8, width: 4, depthShallow: 1.2, depthDeep: 1.5,
  type: 'SKIMMER', usage: 'RESIDENTIAL',
  options: { heating: false, spa: false, counterCurrent: false, lighting: true }
};

const steps = ['Client', 'Piscine', 'Options', 'Résumé'];

const NewQuote = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  const { input, updateInput, updateOption, result } = useCalculate(defaultInput);

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
      setCreateError(e?.response?.data?.error || 'Erreur lors de la création du devis.');
      setCreating(false);
    }
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div className="max-w-5xl mx-auto w-full flex flex-col gap-8">
      <div className="flex flex-col items-center gap-6">
        <h1 className="text-2xl font-bold text-slate-100">Nouveau devis</h1>
        
        {/* Stepper */}
        <div className="flex items-center gap-0">
          {steps.map((label, i) => {
            const stepNum = i + 1;
            const isComplete = step > stepNum;
            const isCurrent = step === stepNum;
            const isPending = step < stepNum;
            return (
              <div key={i} className="flex items-center">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all",
                  isComplete ? "bg-green-500 border-green-500 text-[#07090f]"    : "",
                  isCurrent  ? "bg-transparent border-green-500 text-green-400"  : "",
                  isPending  ? "bg-transparent border-[#1e2a3a] text-slate-600"  : "",
                )}>
                  {isComplete ? <Check size={14} /> : stepNum}
                </div>
                {i < steps.length - 1 && (
                  <div className={cn(
                    "h-0.5 w-16 transition-colors",
                    isComplete ? "bg-green-500" : "bg-[#1e2a3a]"
                  )} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {createError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm max-w-lg mx-auto w-full">
          <AlertCircle size={16} />
          {createError}
        </div>
      )}

      <div className="flex-1 w-full">
        {step === 1 && (
          <Step1_Client 
            clientName={clientName} clientEmail={clientEmail} 
            setClientName={setClientName} setClientEmail={setClientEmail} 
            onNext={nextStep} 
          />
        )}
        {step === 2 && (
          <Step2_Dimensions 
            input={input} updateInput={updateInput} 
            onBack={prevStep} onNext={nextStep} 
          />
        )}
        {step === 3 && (
          <Step3_Options 
            input={input} updateOption={updateOption} 
            onBack={prevStep} onNext={nextStep} 
          />
        )}
        {step === 4 && (
          <Step4_Summary 
            clientName={clientName} input={input} 
            onBack={prevStep} onSubmit={handleCreate} isSubmitting={creating}
          />
        )}
      </div>
    </div>
  );
};

export default NewQuote;

