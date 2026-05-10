import React from 'react';
import { PoolInput } from '../../types';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Flame, Waves, Wind, Lightbulb } from 'lucide-react';
import { cn } from '../ui/Button';

interface Props {
  input: PoolInput;
  updateOption: (key: keyof PoolInput['options'], value: boolean) => void;
  onNext: () => void;
  onBack: () => void;
}

export const Step3_Options: React.FC<Props> = ({ input, updateOption, onNext, onBack }) => {
  const OptionCard = ({ id, label, icon: Icon, selected }: { id: keyof PoolInput['options'], label: string, icon: any, selected: boolean }) => (
    <div
      onClick={() => updateOption(id, !selected)}
      className={cn(
        "relative flex cursor-pointer rounded-xl border p-4 transition-all duration-150",
        selected 
          ? 'border-green-500 bg-green-500/5' 
          : 'border-[#1e2a3a] bg-[#0d1117] hover:border-[#2a3a50]'
      )}
    >
      <div className="flex items-center gap-4 w-full">
        <div className={cn(
          "p-2 rounded-full",
          selected ? 'bg-green-500/10 text-green-400' : 'bg-[#161b25] text-slate-500'
        )}>
          <Icon size={20} />
        </div>
        <p className={cn("font-medium text-sm", selected ? 'text-green-400' : 'text-slate-200')}>
          {label}
        </p>
      </div>
    </div>
  );

  return (
    <Card className="max-w-lg mx-auto w-full" header={
      <>
        <h2 className="text-lg font-bold text-slate-100">Options</h2>
        <p className="text-sm text-slate-500 mt-1">Sélectionnez les équipements additionnels.</p>
      </>
    }>
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <OptionCard id="heating" label="Chauffage" icon={Flame} selected={input.options.heating} />
          <OptionCard id="spa" label="Spa intégré" icon={Waves} selected={input.options.spa} />
          <OptionCard id="counterCurrent" label="Nage CC" icon={Wind} selected={input.options.counterCurrent} />
          <OptionCard id="lighting" label="Éclairage" icon={Lightbulb} selected={input.options.lighting} />
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="secondary" onClick={onBack}>← Retour</Button>
          <Button variant="primary" onClick={onNext}>Suivant →</Button>
        </div>
      </div>
    </Card>
  );
};

