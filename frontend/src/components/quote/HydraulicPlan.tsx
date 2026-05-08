// @ts-nocheck
import React, { useEffect, useState, useCallback } from 'react';
import { Download, FileCode2, Maximize2, RefreshCw, X } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../services/api';

interface Props {
  quoteId: string;
  reference: string;
}

export const HydraulicPlan: React.FC<Props> = ({ quoteId, reference }) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // On récupère le SVG comme texte brut
      const response = await api.get(`/quotes/${quoteId}/plan?format=svg`, {
        responseType: 'text',
        headers: { Accept: 'image/svg+xml' },
      });
      setSvgContent(response.data as string);
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Impossible de charger le plan hydraulique.');
    } finally {
      setLoading(false);
    }
  }, [quoteId]);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  // ── Export SVG (Blob download) ──────────────────────────────────────────
  const downloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reference}_plan.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Export DXF (backend endpoint) ──────────────────────────────────────
  const downloadDXF = () => {
    // Le token JWT est dans le header axios par défaut —
    // on ouvre via fetch+blob pour conserver l'auth
    const token = localStorage.getItem('token');
    fetch(`/api/quotes/${quoteId}/plan?format=dxf`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reference}_plan.dxf`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Erreur lors du téléchargement DXF.'));
  };

  // ── Rendu de la barre d'actions ────────────────────────────────────────
  const ActionBar = () => (
    <div className="flex items-center gap-2 flex-wrap">
      <Button
        variant="ghost" size="sm"
        onClick={fetchPlan}
        disabled={loading}
        title="Régénérer le plan"
      >
        <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        <span className="ml-1 hidden sm:inline">Régénérer</span>
      </Button>
      <Button
        variant="ghost" size="sm"
        onClick={downloadSVG}
        disabled={!svgContent}
        title="Télécharger SVG"
      >
        <Download size={14} />
        <span className="ml-1 hidden sm:inline">SVG</span>
      </Button>
      <Button
        variant="ghost" size="sm"
        onClick={downloadDXF}
        disabled={!svgContent}
        title="Télécharger DXF (AutoCAD)"
      >
        <FileCode2 size={14} />
        <span className="ml-1 hidden sm:inline">DXF</span>
      </Button>
      <Button
        variant="ghost" size="sm"
        onClick={() => setFullscreen(true)}
        disabled={!svgContent}
        title="Plein écran"
      >
        <Maximize2 size={14} />
        <span className="ml-1 hidden sm:inline">Plein écran</span>
      </Button>
    </div>
  );

  // ── États de chargement / erreur ────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-default-400">
        <RefreshCw size={28} className="animate-spin" />
        <p className="text-sm">Génération du plan hydraulique…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3 text-danger-500 bg-peep-surface rounded-lg border border-peep-border p-6">
        <p className="text-sm font-medium">{error}</p>
        <Button variant="ghost" size="sm" onClick={fetchPlan}>
          <RefreshCw size={14} className="mr-1" /> Réessayer
        </Button>
      </div>
    );
  }

  return (
    <>
      {/* ── Plan inline ─────────────────────────────────────────────────── */}
      <div>
        {/* Barre d'outils */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-default-400 font-mono">
            Plan technique 2D — Usage interne ETS Maria
          </p>
          <ActionBar />
        </div>

        {/* SVG injecté directement dans le DOM (zoom natif, sélectionnable) */}
        <div
          className="w-full overflow-auto rounded-lg border border-peep-border shadow-sm bg-peep-surface"
          style={{ minHeight: '320px' }}
          dangerouslySetInnerHTML={{ __html: svgContent! }}
        />

        <p className="text-xs text-default-400 mt-2 text-center font-mono">
          Schéma hydraulique schématique — non contractuel — circuits simplifiés à des fins de devis
        </p>
      </div>

      {/* ── Modal plein écran ────────────────────────────────────────────── */}
      {fullscreen && (
        <div
          className="fixed inset-0 z-50 bg-peep-app/80 flex flex-col items-center justify-center p-4"
          onClick={() => setFullscreen(false)}
        >
          <div
            className="bg-peep-surface rounded-xl shadow-2xl w-full max-w-7xl max-h-full overflow-auto relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-2 border-b border-peep-border">
              <span className="text-sm font-mono text-default-500">
                Plan hydraulique 2D — {reference}
              </span>
              <div className="flex items-center gap-2">
                <ActionBar />
                <Button variant="ghost" size="sm" onClick={() => setFullscreen(false)}>
                  <X size={16} />
                </Button>
              </div>
            </div>
            <div
              className="p-4 overflow-auto"
              dangerouslySetInnerHTML={{ __html: svgContent! }}
            />
          </div>
        </div>
      )}
    </>
  );
};

