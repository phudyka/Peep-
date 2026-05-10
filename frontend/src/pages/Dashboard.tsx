import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Plus, Eye, Trash2, AlertCircle } from 'lucide-react';
import { Quote } from '../types';
import { StatusChip } from '../components/shared/StatusChip';

const Dashboard = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/quotes');
      setQuotes(res.data);
      setFetchError(null);
    } catch {
      setFetchError('Impossible de charger les devis. Vérifiez votre connexion.');
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
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Mes devis</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez vos devis et votre catalogue.</p>
        </div>
        <Button 
          variant="primary"
          onClick={() => navigate('/quote/new')}
        >
          <Plus size={15} /> Nouveau devis
        </Button>
      </div>

      {fetchError && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {fetchError}
        </div>
      )}

      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-[#0d1117] border-b border-[#1e2a3a]">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">RÉFÉRENCE</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">CLIENT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">STATUT</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">DATE</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Chargement...</td></tr>
            ) : quotes.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Aucun devis trouvé.</td></tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-b border-[#1e2a3a]/60 hover:bg-[#161b25] transition-colors duration-100">
                  <td className="px-4 py-3 font-mono text-green-400">{quote.reference}</td>
                  <td className="px-4 py-3 text-slate-300">{quote.clientName}</td>
                  <td className="px-4 py-3"><StatusChip status={quote.status} /></td>
                  <td className="px-4 py-3 text-slate-500">
                    {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('fr-FR') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Button variant="ghost" size="xs" onClick={() => navigate(`/quote/${quote.id}`)}>
                        <Eye size={14} />
                      </Button>
                      <Button variant="ghost" size="xs" onClick={(e) => { e.stopPropagation(); handleDeleteQuote(quote.id); }}>
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
};

export default Dashboard;


