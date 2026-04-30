import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Plus, FileText, Upload, AlertCircle, Trash2 } from 'lucide-react';
import { Quote } from '../types';

const Dashboard = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  // 🐛 Fix #23 : état d'erreur sur le fetch
  const [fetchError, setFetchError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuotes();
  }, []);

  const fetchQuotes = () => {
    api.get('/quotes')
      .then(res => setQuotes(res.data))
      .catch(() => setFetchError('Impossible de charger les devis. Vérifiez votre connexion.'));
  };

  const handleDeleteQuote = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevents navigating to the quote
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce devis ? Cette action est irréversible.")) {
      try {
        await api.delete(`/quotes/${id}`);
        fetchQuotes();
      } catch (err) {
        alert("Erreur lors de la suppression du devis.");
      }
    }
  };

  // 🧹 Fix #24 : fonction d'import CSV (ouvre un input file caché)
  const handleImportCsv = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const form = new FormData();
      form.append('file', file);
      try {
        const { data } = await api.post('/catalog/import', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        alert(`Import terminé : ${data.stats.created} créés, ${data.stats.updated} mis à jour, ${data.stats.skipped} ignorés, ${data.stats.errors} erreurs.`);
      } catch {
        alert('Échec de l\'import du catalogue.');
      }
    };
    input.click();
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">Gérez vos devis et votre catalogue.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={handleImportCsv}>
            <Upload className="mr-2 h-4 w-4" /> Importer le catalogue
          </Button>
          <Button onClick={() => navigate('/quote/new')}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau devis
          </Button>
        </div>
      </div>

      {/* 🐛 Fix #23 : affichage de l'erreur */}
      {fetchError && (
        <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          {fetchError}
        </div>
      )}

      <div className="bg-white shadow sm:rounded-md border border-gray-200 flex-1 overflow-y-auto min-h-0">
        <ul className="divide-y divide-gray-200">
          {quotes.map(quote => (
            <li key={quote.id}>
              <div
                onClick={() => navigate(`/quote/${quote.id}`)}
                className="block hover:bg-gray-50 w-full text-left transition duration-150 ease-in-out cursor-pointer"
              >
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-primary-600 truncate">{quote.reference}</p>
                      <p className="text-sm text-gray-500">{quote.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${quote.status === 'DRAFT'    ? 'bg-gray-100 text-gray-800' :
                        quote.status === 'SENT'     ? 'bg-blue-100 text-blue-800' :
                        quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                      {quote.status === 'DRAFT'    ? 'BROUILLON' :
                       quote.status === 'SENT'     ? 'ENVOYÉ' :
                       quote.status === 'ACCEPTED' ? 'ACCEPTÉ' :
                       'REFUSÉ'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(quote.createdAt!).toLocaleDateString('fr-FR')}
                    </span>
                    <button 
                      onClick={(e) => handleDeleteQuote(e, quote.id!)}
                      className="ml-4 text-red-500 hover:text-red-700 p-2 rounded-full hover:bg-red-50 transition-colors"
                      title="Supprimer ce devis"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
          {!fetchError && quotes.length === 0 && (
            <li className="px-4 py-8 text-center text-gray-500">
              Aucun devis trouvé. Créez votre premier devis !
            </li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
