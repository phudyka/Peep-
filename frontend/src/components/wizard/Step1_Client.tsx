// @ts-nocheck
import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Props {
  clientName: string;
  clientEmail: string;
  setClientName: (v: string) => void;
  setClientEmail: (v: string) => void;
  onNext: () => void;
}

export const Step1_Client: React.FC<Props> = ({ clientName, clientEmail, setClientName, setClientEmail, onNext }) => {
  const isValid = clientName.trim().length > 0;

  return (
    <Card className="max-w-lg mx-auto w-full" header={
      <>
        <h2 className="text-lg font-bold text-slate-100">Votre client</h2>
        <p className="text-sm text-slate-500 mt-1">Saisissez les informations de contact du prospect.</p>
      </>
    }>
      <div className="space-y-6">
        <Input 
          label="Nom du client" 
          placeholder="ex: Jean Dupont"
          required
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
        />
        <Input 
          label="Email du client" 
          type="email" 
          placeholder="ex: jean.dupont@email.com"
          value={clientEmail}
          onChange={(e) => setClientEmail(e.target.value)}
        />
        <div className="flex justify-end pt-2">
          <Button 
            variant="primary"
            disabled={!isValid}
            onClick={onNext}
          >
            Suivant →
          </Button>
        </div>
      </div>
    </Card>
  );
};

