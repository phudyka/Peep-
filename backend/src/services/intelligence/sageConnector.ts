/**
 * sageConnector.ts
 *
 * Connecteur Sage — expose le catalogue produits de l'ERP comme un
 * `IProductRepository`. Trois modes sont prévus, sélectionnés par
 * la variable d'environnement `SAGE_MODE` :
 *
 *   - "mock"  → jeu de données fictif en mémoire (dev / démo, défaut)
 *   - "csv"   → import d'un export CSV Sage (stub, non implémenté ici)
 *   - "api"   → connexion REST à l'API Sage (stub, non implémenté ici)
 *
 * Le format Sage utilise le vocabulaire ERP français (designation,
 * prixAchat, marque, famille…). Le mapping Sage → UnifiedProduct se
 * fait dans `mapSageToUnified()`.
 */
import type { ProductCategory } from '@prisma/client';
import type { IProductRepository, UnifiedProduct } from '../../models/productRepository';

// ─── Format Sage (wire format ERP) ─────────────────────────────────────────────

export interface SageProduct {
  reference: string;
  designation: string;
  prixAchat: number;
  prixVente: number;
  stock: number;
  famille: string;       // ex: "POMPE", "FILTRE", "SKIMMER"
  sousFamille: string;   // ex: "POMPE_MONO", "FILTRE_SABLE"
  marque: string;
  caracteristiques: Record<string, string | number>; // puissance, débit, diamètre…
}

// ─── Mapping famille Sage → ProductCategory Prisma ─────────────────────────────

const FAMILLE_TO_CATEGORY: Record<string, ProductCategory> = {
  POMPE:   'PUMP',
  FILTRE:  'FILTER',
  SKIMMER: 'SKIMMER',
  VANNE:   'VALVE',
  TUYAU:   'PIPE',
  BUSE:    'NOZZLE',
  SABLE:   'SAND',
};

// ─── Jeu de données mock — 25 références piscine hydraulique réalistes ─────────
// Marques : Hayward, Pentair, Astral, Behringer, Desjoyaux, Waterline (cf. prompt)

const MOCK_SAGE_CATALOG: SageProduct[] = [
  // ─ Pompes mono-vitesse (puissances normalisées 0.25 → 2.2 kW) ─
  { reference: 'PMP-HAY-025', designation: 'Pompe Hayward Super Pump 0.25kW', marque: 'Hayward', famille: 'POMPE', sousFamille: 'POMPE_MONO',
    prixAchat: 285, prixVente: 449, stock: 4,
    caracteristiques: { puissance: 0.25, debit: 7, hmt: 10, connexion: '1.5"' } },
  { reference: 'PMP-HAY-033', designation: 'Pompe Hayward Super Pump 0.33kW', marque: 'Hayward', famille: 'POMPE', sousFamille: 'POMPE_MONO',
    prixAchat: 315, prixVente: 489, stock: 6,
    caracteristiques: { puissance: 0.33, debit: 9, hmt: 10, connexion: '1.5"' } },
  { reference: 'PMP-PEN-050', designation: 'Pompe Pentair SuperFlo 0.5kW', marque: 'Pentair', famille: 'POMPE', sousFamille: 'POMPE_MONO',
    prixAchat: 389, prixVente: 599, stock: 8,
    caracteristiques: { puissance: 0.5, debit: 12, hmt: 10, connexion: '1.5"' } },
  { reference: 'PMP-AST-075', designation: 'Pompe Astral Sena 0.75kW', marque: 'Astral', famille: 'POMPE', sousFamille: 'POMPE_MONO',
    prixAchat: 425, prixVente: 659, stock: 5,
    caracteristiques: { puissance: 0.75, debit: 14, hmt: 10, connexion: '2"' } },
  { reference: 'PMP-HAY-110', designation: 'Pompe Hayward Max-Flo 1.1kW', marque: 'Hayward', famille: 'POMPE', sousFamille: 'POMPE_MONO',
    prixAchat: 489, prixVente: 749, stock: 3,
    caracteristiques: { puissance: 1.1, debit: 18, hmt: 12, connexion: '2"' } },
  { reference: 'PMP-PEN-150', designation: 'Pompe Pentair IntelliFlo 1.5kW', marque: 'Pentair', famille: 'POMPE', sousFamille: 'POMPE_MONO',
    prixAchat: 645, prixVente: 989, stock: 2,
    caracteristiques: { puissance: 1.5, debit: 24, hmt: 12, connexion: '2"' } },
  { reference: 'PMP-AST-220', designation: 'Pompe Astral Aral 2.2kW Tri', marque: 'Astral', famille: 'POMPE', sousFamille: 'POMPE_TRI',
    prixAchat: 825, prixVente: 1290, stock: 1,
    caracteristiques: { puissance: 2.2, debit: 32, hmt: 14, connexion: '2.5"' } },

  // ─ Filtres à sable (diamètres standard Ø400 → Ø800) ─
  { reference: 'FLT-BEH-400', designation: 'Filtre Behringer Ø400 sable', marque: 'Behringer', famille: 'FILTRE', sousFamille: 'FILTRE_SABLE',
    prixAchat: 215, prixVente: 339, stock: 7,
    caracteristiques: { diametre: 400, surface: 0.13, debit: 8 } },
  { reference: 'FLT-BEH-500', designation: 'Filtre Behringer Ø500 sable', marque: 'Behringer', famille: 'FILTRE', sousFamille: 'FILTRE_SABLE',
    prixAchat: 289, prixVente: 449, stock: 5,
    caracteristiques: { diametre: 500, surface: 0.2, debit: 12 } },
  { reference: 'FLT-DSJ-600', designation: 'Filtre Desjoyaux Ø600 sable', marque: 'Desjoyaux', famille: 'FILTRE', sousFamille: 'FILTRE_SABLE',
    prixAchat: 389, prixVente: 599, stock: 4,
    caracteristiques: { diametre: 600, surface: 0.28, debit: 16 } },
  { reference: 'FLT-HAY-700', designation: 'Filtre Hayward Pro Series Ø700', marque: 'Hayward', famille: 'FILTRE', sousFamille: 'FILTRE_SABLE',
    prixAchat: 479, prixVente: 749, stock: 3,
    caracteristiques: { diametre: 700, surface: 0.38, debit: 22 } },
  { reference: 'FLT-BEH-800', designation: 'Filtre Behringer Ø800 sable haute capacité', marque: 'Behringer', famille: 'FILTRE', sousFamille: 'FILTRE_SABLE',
    prixAchat: 615, prixVente: 949, stock: 2,
    caracteristiques: { diametre: 800, surface: 0.5, debit: 30 } },

  // ─ Skimmers ─
  { reference: 'SKM-WTL-STD', designation: 'Skimmer Waterline standard ABS', marque: 'Waterline', famille: 'SKIMMER', sousFamille: 'SKIMMER_STD',
    prixAchat: 39, prixVente: 65, stock: 35,
    caracteristiques: { type: 'standard', debit: 8, connexion: '1.5"' } },
  { reference: 'SKM-WTL-WIDE', designation: 'Skimmer Waterline grande meurtrière', marque: 'Waterline', famille: 'SKIMMER', sousFamille: 'SKIMMER_WIDE',
    prixAchat: 49, prixVente: 79, stock: 22,
    caracteristiques: { type: 'wide', debit: 10, connexion: '1.5"' } },
  { reference: 'SKM-HAY-PRO', designation: 'Skimmer Hayward Pro à clapet', marque: 'Hayward', famille: 'SKIMMER', sousFamille: 'SKIMMER_PRO',
    prixAchat: 58, prixVente: 95, stock: 15,
    caracteristiques: { type: 'pro', debit: 12, connexion: '2"' } },

  // ─ Vannes 6 voies (Top/Side) ─
  { reference: 'VLV-PEN-6V-50', designation: 'Vanne 6 voies Pentair Ø50 Top', marque: 'Pentair', famille: 'VANNE', sousFamille: 'VANNE_6V',
    prixAchat: 79, prixVente: 129, stock: 18,
    caracteristiques: { diametre: 50, type: '6_voies_top' } },
  { reference: 'VLV-PEN-6V-63', designation: 'Vanne 6 voies Pentair Ø63 Side', marque: 'Pentair', famille: 'VANNE', sousFamille: 'VANNE_6V',
    prixAchat: 89, prixVente: 145, stock: 12,
    caracteristiques: { diametre: 63, type: '6_voies_side' } },
  { reference: 'VLV-AST-2V-75', designation: 'Vanne 2 voies Astral Ø75', marque: 'Astral', famille: 'VANNE', sousFamille: 'VANNE_2V',
    prixAchat: 35, prixVente: 59, stock: 24,
    caracteristiques: { diametre: 75, type: '2_voies' } },

  // ─ Tuyauterie PVC pression ─
  { reference: 'PVC-GEN-50', designation: 'Tuyau PVC pression Ø50 (rouleau 25m)', marque: 'Générique', famille: 'TUYAU', sousFamille: 'PVC_PRESS',
    prixAchat: 62, prixVente: 99, stock: 40,
    caracteristiques: { diametre: 50, longueur: 25 } },
  { reference: 'PVC-GEN-63', designation: 'Tuyau PVC pression Ø63 (rouleau 25m)', marque: 'Générique', famille: 'TUYAU', sousFamille: 'PVC_PRESS',
    prixAchat: 79, prixVente: 125, stock: 32,
    caracteristiques: { diametre: 63, longueur: 25 } },
  { reference: 'PVC-GEN-75', designation: 'Tuyau PVC pression Ø75 (rouleau 25m)', marque: 'Générique', famille: 'TUYAU', sousFamille: 'PVC_PRESS',
    prixAchat: 105, prixVente: 165, stock: 22,
    caracteristiques: { diametre: 75, longueur: 25 } },
  { reference: 'PVC-GEN-90', designation: 'Tuyau PVC pression Ø90 (rouleau 25m)', marque: 'Générique', famille: 'TUYAU', sousFamille: 'PVC_PRESS',
    prixAchat: 145, prixVente: 229, stock: 14,
    caracteristiques: { diametre: 90, longueur: 25 } },

  // ─ Buses de refoulement ─
  { reference: 'NZL-WTL-50', designation: 'Buse refoulement Waterline Ø50 ABS', marque: 'Waterline', famille: 'BUSE', sousFamille: 'BUSE_STD',
    prixAchat: 8, prixVente: 14, stock: 80,
    caracteristiques: { diametre: 50, debit: 4 } },
  { reference: 'NZL-AST-63', designation: 'Buse refoulement Astral Ø63 orientable', marque: 'Astral', famille: 'BUSE', sousFamille: 'BUSE_ORIENT',
    prixAchat: 12, prixVente: 22, stock: 45,
    caracteristiques: { diametre: 63, debit: 6 } },

  // ─ Sable filtrant ─
  { reference: 'SBL-GEN-25', designation: 'Sac sable filtrant 0.4/0.8 — 25 kg', marque: 'Générique', famille: 'SABLE', sousFamille: 'SABLE_QUARTZ',
    prixAchat: 12, prixVente: 19, stock: 120,
    caracteristiques: { granulometrie: '0.4-0.8', conditionnement: 25 } },
];

// ─── Cache en mémoire avec TTL ────────────────────────────────────────────────

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 heure

interface CacheEntry {
  data: SageProduct[];
  fetchedAt: number;
}
let cache: CacheEntry | null = null;

function readCache(): SageProduct[] | null {
  if (!cache) return null;
  if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
    cache = null;
    return null;
  }
  return cache.data;
}

function writeCache(data: SageProduct[]): void {
  cache = { data, fetchedAt: Date.now() };
}

/** Vide le cache. Utile pour les tests et après un import CSV/API. */
export function invalidateSageCache(): void {
  cache = null;
}

// ─── Sources concrètes par mode ────────────────────────────────────────────────

async function fetchMock(): Promise<SageProduct[]> {
  return MOCK_SAGE_CATALOG;
}

async function fetchCsv(): Promise<SageProduct[]> {
  // Stub Phase 1 : l'import CSV passera par l'endpoint POST /api/admin/sage/import-csv
  // qui peuplera le cache via writeCache(). En attendant on retombe sur mock pour
  // ne pas planter le pipeline.
  console.warn('[sageConnector] SAGE_MODE=csv non implémenté — fallback mock');
  return MOCK_SAGE_CATALOG;
}

async function fetchApi(): Promise<SageProduct[]> {
  // Stub Phase 1 : connexion REST à l'API Sage (SAGE_API_URL + SAGE_API_KEY).
  // Format Sage côté API non encore connu — à implémenter quand spec disponible.
  console.warn('[sageConnector] SAGE_MODE=api non implémenté — fallback mock');
  return MOCK_SAGE_CATALOG;
}

async function fetchByMode(): Promise<SageProduct[]> {
  const mode = (process.env.SAGE_MODE ?? 'mock').toLowerCase();
  switch (mode) {
    case 'csv': return fetchCsv();
    case 'api': return fetchApi();
    case 'mock':
    default:    return fetchMock();
  }
}

// ─── Mapping SageProduct → UnifiedProduct ─────────────────────────────────────

function mapSageToUnified(sp: SageProduct, fetchedAt: Date): UnifiedProduct {
  const category = FAMILLE_TO_CATEGORY[sp.famille] ?? 'OTHER';
  return {
    id:             `sage:${sp.reference}`,
    sageRef:        sp.reference,
    name:           sp.designation,
    brand:          sp.marque,
    category,
    technicalSpecs: sp.caracteristiques,
    purchasePrice:  sp.prixAchat,
    sellPrice:      sp.prixVente,
    unit:           sp.famille === 'SABLE' ? 'sac' : sp.famille === 'TUYAU' ? 'rouleau' : 'unit',
    stock:          sp.stock,
    source:         'sage',
    fetchedAt,
  };
}

// ─── Implémentation IProductRepository ────────────────────────────────────────

export class SageRepository implements IProductRepository {
  readonly sourceName = 'sage' as const;

  async getAll(): Promise<UnifiedProduct[]> {
    const cached = readCache();
    let rows: SageProduct[];
    let fetchedAt: Date;

    if (cached) {
      rows = cached;
      fetchedAt = new Date(cache!.fetchedAt);
    } else {
      rows = await fetchByMode();
      writeCache(rows);
      fetchedAt = new Date();
    }

    return rows.map(r => mapSageToUnified(r, fetchedAt));
  }

  async getByCategory(category: ProductCategory): Promise<UnifiedProduct[]> {
    const all = await this.getAll();
    return all.filter(p => p.category === category);
  }

  async getById(id: string): Promise<UnifiedProduct | null> {
    const all = await this.getAll();
    return all.find(p => p.id === id) ?? null;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.getAll();
      return true;
    } catch {
      return false;
    }
  }
}

/** Singleton partagé : un seul cache pour tous les appelants. */
export const sageRepository = new SageRepository();
