import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatusChip } from '../components/shared/StatusChip';
import { Quote } from '../types';

export default function Quotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/quotes');
      setQuotes(res.data);
      setError(null);
    } catch {
      setError('Impossible de charger les devis. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ?")) {
      try {
        await api.delete(`/quotes/${id}`);
        fetchQuotes();
      } catch {
        alert("Erreur lors de la suppression du devis.");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mes devis</h1>
          <p className="text-sm text-slate-500 mt-1">Gérez vos devis clients</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/quote/new')}>
          <Plus size={15} /> Nouveau devis
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#0d1117] border-b border-[#1e2a3a]">
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Référence</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Client</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chargement...</td></tr>
            ) : quotes.length > 0 ? (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-[#1e2a3a]/60 hover:bg-[#161b25] transition-colors">
                  <td className="px-4 py-3 text-sm text-slate-300 font-mono text-green-400">{quote.reference}</td>
                  <td className="px-4 py-3 text-sm text-slate-300">{quote.clientName}</td>
                  <td className="px-4 py-3"><StatusChip status={quote.status} /></td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="xs" onClick={() => navigate(`/quote/${quote.id}`)}>
                        <FileText size={14} />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleDeleteQuote(quote.id); }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                  <div className="flex flex-col items-center gap-2">
                    <FileText size={28} className="text-slate-600" />
                    <p>Aucun devis trouvé.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
