import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { Quote } from '../types';

export function useQuote(initialQuoteId?: string) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (initialQuoteId) {
      api.get(`/quotes/${initialQuoteId}`).then(res => setQuote(res.data));
    }
  }, [initialQuoteId]);

  const saveQuote = async (currentQuote: Quote) => {
    setSaving(true);
    try {
      if (currentQuote.id) {
        const { data } = await api.put(`/quotes/${currentQuote.id}`, currentQuote);
        setQuote(data);
      } else {
        const { data } = await api.post('/quotes', currentQuote);
        setQuote(data);
        // Normally redirect to new ID
      }
      setIsDirty(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

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
