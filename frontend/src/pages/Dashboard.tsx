import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Plus, FileText, Upload } from 'lucide-react';
import { Quote } from '../types';

const Dashboard = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/quotes').then(res => setQuotes(res.data));
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="mt-1 text-sm text-gray-500">Gérez vos devis et votre catalogue.</p>
        </div>
        <div className="flex gap-4">
          <Button variant="secondary" onClick={() => {/* Handle CSV Upload */}}>
            <Upload className="mr-2 h-4 w-4" /> Importer le catalogue
          </Button>
          <Button onClick={() => navigate('/quote/new')}>
            <Plus className="mr-2 h-4 w-4" /> Nouveau devis
          </Button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
        <ul className="divide-y divide-gray-200">
          {quotes.map(quote => (
            <li key={quote.id}>
              <button 
                onClick={() => navigate(`/quote/${quote.id}`)}
                className="block hover:bg-gray-50 w-full text-left transition duration-150 ease-in-out"
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
                      ${quote.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                        quote.status === 'SENT' ? 'bg-blue-100 text-blue-800' :
                        quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'}`}>
                      {quote.status === 'DRAFT' ? 'BROUILLON' :
                        quote.status === 'SENT' ? 'ENVOYÉ' :
                        quote.status === 'ACCEPTED' ? 'ACCEPTÉ' :
                        'REFUSÉ'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(quote.createdAt!).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </button>
            </li>
          ))}
          {quotes.length === 0 && (
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
