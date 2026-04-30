import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { Quote } from '../types';

export function useQuote(initialQuoteId?: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();
  // 🐛 Fix #21 : ref pour annuler les saves obsolètes (race condition)
  const saveSeqRef = useRef(0);

  useEffect(() => {
    if (initialQuoteId) {
      api.get(`/quotes/${initialQuoteId}`).then(res => setQuote(res.data));
    }
  }, [initialQuoteId]);

  // 🐛 Fix #20 : cleanup du timer au unmount pour éviter setState sur composant démonté
  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const saveQuote = useCallback(async (currentQuote: Quote) => {
    // 🐛 Fix #21 : chaque save reçoit un numéro de séquence
    //   Si une save plus récente s'exécute, celle-ci n'écrase pas le state
    const seq = ++saveSeqRef.current;
    setSaving(true);
    try {
      if (currentQuote.id) {
        const { data } = await api.put(`/quotes/${currentQuote.id}`, currentQuote);
        // N'applique la réponse que si c'est bien la dernière save lancée
        if (seq === saveSeqRef.current) {
          setQuote(data);
        }
      } else {
        const { data } = await api.post('/quotes', currentQuote);
        if (seq === saveSeqRef.current) {
          setQuote(data);
        }
      }
      setIsDirty(false);
    } catch (e) {
      console.error('[useQuote] Erreur sauvegarde:', e);
    } finally {
      setSaving(false);
    }
  }, []);

  const updateQuote = (updates: Partial<Quote>) => {
    setQuote(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      setIsDirty(true);

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        saveQuote(next);
      }, 1000);

      return next;
    });
  };

  return { quote, updateQuote, isDirty, saving };
}
