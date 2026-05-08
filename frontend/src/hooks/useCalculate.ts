import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { PoolInput, InstallationResult } from '../types';

export function useCalculate(initialInput: PoolInput, initialOverrides: Record<string, number> = {}) {
  const [input, setInput] = useState<PoolInput>(initialInput);
  const [userOverrides, setUserOverrides] = useState<Record<string, number>>(initialOverrides);
  const [result, setResult] = useState<InstallationResult | null>(null);
  const [loading, setLoading] = useState(false);

  // 🐛 Fix #22 : resynchronise le state interne quand initialInput change significativement
  // (cas typique : QuoteDetail monte avec quote=null, puis quote arrive depuis l'API)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // On ne resync que si le pool a des dimensions réelles (non l'objet vide par défaut)
    if (initialInput && initialInput.shapeParams) {
      setInput(initialInput);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput?.shape, initialInput?.shapeParams, initialInput?.type, initialInput?.usage]);

  useEffect(() => {
    // Pas de calcul si les paramètres de forme sont absents
    if (!input?.shape || !input?.shapeParams) return;

    const calculate = async () => {
      setLoading(true);
      try {
        const { data } = await api.post('/calculate', { poolData: input, userOverrides });
        setResult(data);
      } catch (error) {
        console.error('[useCalculate] Calcul échoué:', error);
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
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const resetAllOverrides = () => setUserOverrides({});

  return { input, updateInput, updateOption, result, loading, userOverrides, setOverride, resetOverride, resetAllOverrides };
}
