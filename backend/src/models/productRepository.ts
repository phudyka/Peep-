/**
 * productRepository.ts
 *
 * Couche d'abstraction "source de produits" : permet de brancher / débrancher
 * indifféremment Sage, un scraper web, une base de connaissance, etc., sans
 * que le moteur de matching ne dépende d'une source concrète.
 *
 * Tout nouveau connecteur (Sage CSV, Sage API, scraper Playwright, …) doit
 * implémenter cette interface — il sera alors immédiatement utilisable par
 * `intelligence/index.ts` et par `scoring/productMatcher.ts`.
 */
import type { ProductCategory } from '@prisma/client';

export type ProductSource = 'sage' | 'scraped' | 'manual' | 'estimated';

/**
 * Forme unifiée d'un produit, indépendante de la source.
 * Les spécifications techniques (puissance, débit, diamètre, …) restent dans
 * un dictionnaire libre pour ne pas figer le modèle — le matcher sait quelles
 * clés lire par catégorie (cf. `scoring/productMatcher.ts`).
 */
export interface UnifiedProduct {
  id: string;
  sageRef: string;
  name: string;
  brand: string;
  category: ProductCategory;
  technicalSpecs: Record<string, unknown>;
  purchasePrice: number;
  sellPrice: number;
  unit: string;
  stock: number;
  source: ProductSource;
  /** Date de fraîcheur de la donnée (utile pour le scoring de confiance). */
  fetchedAt: Date;
}

export interface IProductRepository {
  /** Retourne tous les produits actifs connus de la source. */
  getAll(): Promise<UnifiedProduct[]>;

  /** Filtre par catégorie hydraulique. */
  getByCategory(category: ProductCategory): Promise<UnifiedProduct[]>;

  /** Recherche par identifiant interne. */
  getById(id: string): Promise<UnifiedProduct | null>;

  /** Nom de la source, pour le logging et le scoring de confiance. */
  readonly sourceName: ProductSource;

  /** True si la source répond — sert au fallback gracieux. */
  isAvailable(): Promise<boolean>;
}
