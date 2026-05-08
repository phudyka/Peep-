import { useParams, useNavigate } from 'react-router-dom';
import { useQuote } from '../hooks/useQuote';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Download, Flame, Waves, Wind, Lightbulb } from 'lucide-react';
import { StatusChip } from '../components/shared/StatusChip';
import { HydraulicResultsCard } from '../components/shared/HydraulicResultsCard';
import { PoolShape2D } from '../components/shared/PoolShape2D';
import { Pool3DPlaceholder } from '../components/shared/Pool3DPlaceholder';
import { SHAPE_META } from '../components/shared/PoolShapeSelector';
import { formatNumber } from '../utils/format';

const TYPE_LABELS: Record<string, string> = { SKIMMER: 'Skimmer', OVERFLOW: 'Débordement', ROMAN: 'Romaine' };
const USAGE_LABELS: Record<string, string> = { RESIDENTIAL: 'Résidentiel', PUBLIC: 'Public' };

const QuoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quote, updateQuote, isDirty, saving } = useQuote(id);

  if (!quote) return <div className="p-8 text-center text-slate-500">Chargement du devis...</div>;

  const generatePDF = (type: 'internal' | 'client') => window.open(`/api/quotes/${id}/pdf?type=${type}`, '_blank');
  const totalHT = quote.lines.reduce((sum, l) => sum + (l.quantity * l.unitPrice * (1 - l.discount / 100)), 0);
  const poolData = quote.poolData;
  const shape = poolData?.shape || 'RECTANGULAR';
  const shapeMeta = SHAPE_META[shape];
  const shapeParams = poolData?.shapeParams ?? { shape: 'RECTANGULAR', length: 0, width: 0 };

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full gap-6 pb-20">
      <div className="sticky top-0 z-10 flex justify-between items-center px-4 py-4 bg-[#0d1117] border-b border-[#1e2a3a] rounded-xl">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}><ArrowLeft size={18} /></Button>
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-3">
              <span className="font-mono">{quote.reference}</span>
              <StatusChip status={quote.status} />
            </h1>
            <p className="text-xs text-slate-500">
              {quote.clientName} • {saving ? 'Enregistrement...' : (isDirty ? 'Modifications non sauvegardées' : 'Toutes les modifications sont sauvegardées')}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => generatePDF('internal')}><Download size={15} /> PDF Interne</Button>
          <Button variant="secondary" size="sm" onClick={() => generatePDF('client')}><Download size={15} /> PDF Client</Button>
          {quote.status !== 'SENT' && (
            <Button variant="primary" size="sm" onClick={() => updateQuote({ status: 'SENT' })}>Marquer envoyé</Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <div className="px-5 py-4 border-b border-[#1e2a3a]">
            <h3 className="text-sm font-semibold text-slate-200">Client</h3>
          </div>
          <div className="p-5 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Nom</p>
              <p className="text-sm text-slate-200">{quote.clientName}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Email</p>
              <p className="text-sm text-slate-200">{quote.clientEmail || '—'}</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-[#1e2a3a] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200">Piscine</h3>
            <div className="flex items-center gap-2 text-green-400">
              {shapeMeta?.icon}
              <span className="text-xs font-medium">{shapeMeta?.label}</span>
            </div>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex justify-center mb-4">
              <PoolShape2D shape={shape} shapeParams={shapeParams} className="w-32 h-32" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Type</p>
                <p className="text-slate-200">{TYPE_LABELS[poolData?.type] || poolData?.type}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Usage</p>
                <p className="text-slate-200">{USAGE_LABELS[poolData?.usage] || poolData?.usage}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Petit bain</p>
                <p className="font-mono text-slate-200">{formatNumber(poolData?.depthShallow)} m</p>
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5">Grand bain</p>
                <p className="font-mono text-slate-200">{formatNumber(poolData?.depthDeep)} m</p>
              </div>
            </div>
          </div>
          <div className="px-5 py-3 border-t border-[#1e2a3a]">
            <Pool3DPlaceholder />
          </div>
        </Card>

        <Card>
          <div className="px-5 py-4 border-b border-[#1e2a3a]">
            <h3 className="text-sm font-semibold text-slate-200">Options</h3>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'heating', label: 'Chauffage', icon: Flame, active: poolData?.options?.heating },
                { id: 'spa', label: 'Spa intégré', icon: Waves, active: poolData?.options?.spa },
                { id: 'counterCurrent', label: 'Nage CC', icon: Wind, active: poolData?.options?.counterCurrent },
                { id: 'lighting', label: 'Éclairage', icon: Lightbulb, active: poolData?.options?.lighting },
              ].map(opt => (
                <div key={opt.id} className={`flex items-center gap-3 p-3 rounded-lg border ${opt.active ? 'border-green-500/40 bg-green-500/5' : 'border-[#1e2a3a] bg-[#0d1117]'}`}>
                  <div className={`p-1.5 rounded-full ${opt.active ? 'bg-green-500/10 text-green-400' : 'bg-[#161b25] text-slate-500'}`}>
                    <opt.icon size={16} />
                  </div>
                  <span className={`text-sm ${opt.active ? 'text-green-400' : 'text-slate-500'}`}>{opt.label}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <HydraulicResultsCard result={quote.calculationResult} />

      <Card>
        <div className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#0d1117] border-b border-[#1e2a3a]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Produit</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Qté</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prix Unitaire</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Remise %</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.lines.map((item, index) => (
                <tr key={index} className="border-b border-[#1e2a3a]/60 hover:bg-[#161b25] transition-colors duration-100">
                  <td className="px-4 py-3 text-slate-300">{item.product?.name || 'Article personnalisé'}</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-300">{formatNumber(item.quantity)}</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-300">{formatNumber(item.unitPrice)} €</td>
                  <td className="px-4 py-3 font-mono text-sm text-slate-300">{formatNumber(item.discount)}%</td>
                  <td className="px-4 py-3 text-slate-200 font-mono">{formatNumber(item.quantity * item.unitPrice * (1 - item.discount / 100))} €</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="p-4 flex justify-end items-center gap-4 border-t border-[#1e2a3a]">
            <span className="text-slate-500 font-medium">Total HT :</span>
            <span className="text-xl font-bold text-slate-100 font-mono">{formatNumber(totalHT)} €</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default QuoteDetail;

