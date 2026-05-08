import { useEffect, useState } from 'react';
import { BookOpen, Search, AlertCircle } from 'lucide-react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

interface Product {
  id: string;
  sageRef: string;
  name: string;
  brand: string;
  category: string;
  sellPrice: number;
  stock: number;
  active: boolean;
}

export default function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/catalog');
      setProducts(res.data);
      setError(null);
    } catch {
      setError('Impossible de charger le catalogue. Vérifiez votre connexion.');
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase()) ||
    p.sageRef.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-100">Catalogue</h1>
        <p className="text-sm text-slate-500 mt-1">Produits et équipements disponibles</p>
      </div>

      <div className="max-w-sm">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <Input
            type="text"
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Chargement...</div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((product) => (
            <Card key={product.id} className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200">{product.name}</h3>
                {!product.active && (
                  <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">Inactif</span>
                )}
              </div>
              <p className="text-xs text-slate-500 mb-1">{product.brand} • {product.sageRef}</p>
              <p className="text-sm text-slate-400 mb-3">{product.stock} en stock</p>
              <p className="text-lg font-bold text-slate-100 font-mono">{product.sellPrice.toLocaleString()} €</p>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#161b25] border border-[#1e2a3a] flex items-center justify-center mb-4">
            <BookOpen size={28} className="text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-300 mb-1">Aucun produit</h3>
          <p className="text-sm text-slate-500 mb-5 max-w-xs">
            {search ? 'Aucun produit ne correspond à votre recherche.' : 'Le catalogue est vide. Importez un fichier CSV depuis les paramètres administrateur.'}
          </p>
        </div>
      )}
    </div>
  );
}
