import { useState, useEffect } from 'react';
import api from '../services/api';
import { PoolInput, InstallationResult } from '../types';

export function useCalculate(initialInput: PoolInput, initialOverrides: Record<string, number> = {}) {
  const [input, setInput] = useState<PoolInput>(initialInput);
  const [userOverrides, setUserOverrides] = useState<Record<string, number>>(initialOverrides);
  const [result, setResult] = useState<InstallationResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculate = async () => {
      setLoading(true);
      try {
        const { data } = await api.post('/calculate', { poolData: input, userOverrides });
        setResult(data);
      } catch (error) {
        console.error('Calculation failed', error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(calculate, 500);
    return () => clearTimeout(debounce);
  }, [input, userOverrides]);

  const updateInput = (key: keyof PoolInput, value: any) => {
    setInput(prev => ({ ...prev, [key]: value }));
  };

  const updateOption = (key: keyof PoolInput['options'], value: boolean) => {
    setInput(prev => ({ ...prev, options: { ...prev.options, [key]: value } }));
  };

  const setOverride = (key: string, value: number) => {
    setUserOverrides(prev => ({ ...prev, [key]: value }));
  };

  const resetOverride = (key: string) => {
    setUserOverrides(prev => {
      const newOverrides = { ...prev };
      delete newOverrides[key];
      return newOverrides;
    });
  };

  const resetAllOverrides = () => {
    setUserOverrides({});
  };

  return { input, updateInput, updateOption, result, loading, userOverrides, setOverride, resetOverride, resetAllOverrides };
}
