# 🐸 Peep — Outil Interne de Devis d'Installations de Piscines

**Peep** est une application web **full-stack** conçue pour les commerciaux d'ETS Maria. Elle automatise le dimensionnement hydraulique d'une piscine à partir de ses dimensions et de sa forme, puis génère un devis d'équipement complet, modifiable, et exportable en PDF — le tout en quelques secondes.

---

## Table des matières

1. [Ce que fait l'application](#1-ce-que-fait-lapplication)
2. [Architecture technique](#2-architecture-technique)
3. [Le moteur de calcul hydraulique](#3-le-moteur-de-calcul-hydraulique)
4. [Base de données & modèles](#4-base-de-données--modèles)
5. [API Backend (routes disponibles)](#5-api-backend-routes-disponibles)
6. [Frontend (pages & flux utilisateur)](#6-frontend-pages--flux-utilisateur)
7. [Sécurité](#7-sécurité)
8. [Installation & démarrage](#8-installation--démarrage)
9. [Variables d'environnement](#9-variables-denvironnement)
10. [Données initiales (seed)](#10-données-initiales-seed)
11. [Gestion des utilisateurs & rôles](#11-gestion-des-utilisateurs--rôles)

---

## 1. Ce que fait l'application

Un commercial sélectionne la **forme** de la piscine (rectangulaire, ronde, ovale, L, freeform) et saisit ses dimensions. Peep exécute alors une **chaîne de calcul hydraulique en 10 étapes** pour déterminer automatiquement :

- Le volume de la piscine
- Le débit de filtration nécessaire
- La puissance de la pompe (normalisée sur les puissances standard du marché)
- Le nombre de skimmers et de refoulements
- Les diamètres de tuyauterie (aspiration & refoulement)
- Le nombre de vannes
- La surface et le diamètre du filtre à sable
- La quantité de sable nécessaire

À partir de ces résultats, l'application peut **associer automatiquement les produits du catalogue** (référencés dans la base de données avec leurs prix Sage) pour constituer la liste de matériel du devis. Le commercial peut ensuite :

- Choisir parmi **5 formes de piscine** avec des paramètres dimensionnels adaptés à chaque forme
- **Surcharger manuellement** n'importe quelle valeur calculée (la valeur est alors marquée comme « manuelle »)
- Ajuster les quantités, prix, et remises ligne par ligne
- Ajouter ou masquer des lignes du devis
- Laisser des notes internes (invisibles sur le PDF client)
- **Générer un plan 2D** de l'installation (format SVG ou DXF AutoCAD)
- Exporter deux versions PDF : une **fiche interne** (avec prix d'achat et marges) et un **devis client** (épuré, avec uniquement les prix de vente)
- Changer le statut du devis : `BROUILLON → ENVOYÉ → ACCEPTÉ / REFUSÉ`

Les **administrateurs** peuvent en plus :
- Gérer les utilisateurs (création, modification, suppression)
- Gérer le catalogue produits (import CSV, activation/désactivation)
- Modifier les paramètres globaux de calcul et les informations de la société

---

## 2. Architecture technique

L'application est entièrement **conteneurisée via Docker Compose** et tourne sur un serveur local accessible depuis n'importe quel poste du réseau d'entreprise.

```
┌─────────────────────────────────────────────────────────────┐
│                    Réseau d'entreprise                      │
│                                                             │
│  💻 Navigateur utilisateur                                  │
│         │  HTTP :80                                         │
│         ▼                                                   │
│  ┌─────────────────┐       ┌──────────────────────────┐    │
│  │  FRONTEND       │       │  BACKEND (Express/Node)  │    │
│  │  React + Vite   │──────▶│  API REST  :3001         │    │
│  │  servi par Nginx│       │  TypeScript + Prisma ORM │    │
│  └─────────────────┘       └────────────┬─────────────┘    │
│                                         │                   │
│                             ┌───────────▼──────────┐       │
│                             │  PostgreSQL 15        │       │
│                             │  Base de données :5432│       │
│                             └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

| Composant  | Technologie                                     | Port |
| :--------- | :---------------------------------------------- | :--- |
| Frontend   | React 18, Vite, TypeScript, TailwindCSS, HeroUI (@heroui/react), Framer Motion, Lucide React | 80   |
| Backend    | Node.js, Express, TypeScript, Prisma ORM, Zod   | 3001 |
| Base de données | PostgreSQL 15                              | 5432 |
| PDF        | pdfmake                                         | —    |
| Plans 2D   | SVG (inline) + DXF R12 (AutoCAD)               | —    |
| IA (optionnel) | Google Gemini API (`@google/generative-ai`) | —    |

Le frontend est construit en production (`npm run build`) et servi statiquement par **Nginx**. Nginx proxifie également les requêtes `/api/*` vers le backend.

### Services backend

| Service                    | Rôle                                                                 |
| :------------------------- | :------------------------------------------------------------------- |
| `hydraulicEngine.ts`       | Moteur de calcul hydraulique en 10 étapes                           |
| `pdfGenerator.ts`          | Génération PDF interne (avec marges) et client (épuré)              |
| `planGenerator.ts`         | Génération de plan 2D au format SVG                                 |
| `dxfGenerator.ts`          | Génération de plan 2D au format DXF R12 (AutoCAD)                  |
| `svgSymbols.ts`            | Symboles paramétriques pour les plans SVG                           |
| `imageGenerator.ts`        | Génération d'aperçu visuel 3D via Gemini (désactivée sans clé API) |
| `quoteBuilder.ts`          | Mapping résultats hydraulique → lignes catalogue (placeholder)      |

---

## 3. Le moteur de calcul hydraulique

Le cœur de Peep est le fichier `backend/src/services/hydraulicEngine.ts`. Il implémente une **chaîne de 10 calculs séquentiels**, chacun pouvant être surchargé manuellement par l'utilisateur.

### Paramètres d'entrée (`PoolInput`)

| Paramètre      | Type                                            | Description                          |
| :------------- | :---------------------------------------------- | :----------------------------------- |
| `shape`        | `RECTANGULAR \| ROUND \| OVAL \| L_SHAPE \| FREEFORM` | Forme de la piscine            |
| `shapeParams`  | `JSON`                                          | Paramètres spécifiques à la forme (longueur, largeur, rayon, etc.) |
| `type`         | `SKIMMER \| OVERFLOW \| ROMAN`                  | Type de système de débordement       |
| `usage`        | `RESIDENTIAL \| PUBLIC`                         | Usage résidentiel ou public          |
| `options`      | `{ heating, spa, counterCurrent, lighting }`    | Options activées                     |

### Paramètres de calcul (`CalcSettings` — stockés en BDD)

Ces valeurs sont modifiables par un administrateur via l'interface `/settings` et servent de référentiel pour tous les calculs :

| Paramètre                  | Défaut | Description                                              |
| :------------------------- | :----- | :------------------------------------------------------- |
| `residentialFilteringTime` | 6 h    | Temps de filtration pour usage résidentiel               |
| `publicFilteringTime`      | 4 h    | Temps de filtration pour usage public                    |
| `residentialHMT`           | 8 m    | Hauteur manométrique totale (résidentiel)                |
| `publicHMT`                | 12 m   | Hauteur manométrique totale (public)                     |
| `pumpEfficiency`           | 0.6    | Rendement de la pompe (60%)                              |
| `m3PerSkimmer`             | 25 m³  | Volume d'eau maximum par skimmer                         |
| `filteringSpeed`           | 30 m/h | Vitesse de filtration au travers du sable                |
| `sandPerM2`                | 300 kg | Masse de sable par m² de surface filtrante               |
| `overflowFlowMultiplier`   | 1.3    | Multiplicateur de débit pour piscines à débordement      |
| `spaFlowAddition`          | +4 m³/h| Débit additionnel si option spa activée                  |
| `counterCurrentAddition`   | +3 m³/h| Débit additionnel si nage à contre-courant               |

### Chaîne de calcul (10 étapes)

```
Étape 1  →  Volume = longueur × largeur × ((profShallow + profDeep) / 2)
Étape 2  →  Débit de base = Volume / Temps de filtration
Étape 3  →  Débit ajusté = Débit de base × Multiplicateur [+ additions spa/NCC]
Étape 4  →  Puissance brute (kW) = (Débit × HMT) / (3600 × Rendement)
             → Arrondie à la puissance standard supérieure : [0.25, 0.33, 0.5, 0.75, 1.1, 1.5, 2.2 kW]
Étape 5  →  Skimmers = max(2, Volume / m3PerSkimmer) [arrondi au supérieur]
Étape 6  →  Refoulements = max(2, Skimmers × 2)
Étape 7  →  Diamètres tuyauterie :
              Débit < 8 m³/h  → Aspiration Ø63 / Refoulement Ø50
              Débit < 15 m³/h → Aspiration Ø75 / Refoulement Ø63
              Débit ≥ 15 m³/h → Aspiration Ø90 / Refoulement Ø75
Étape 8  →  Vannes = Skimmers + 3
Étape 9  →  Surface filtre (m²) = Débit ajusté / Vitesse filtration
             → Diamètre (mm) = ceil(sqrt(Surface / π) × 2 × 1000)
Étape 10 →  Sable (kg) = ceil(Surface filtre × sandPerM2)
```

### Système de surcharges manuelles

Chaque valeur calculée peut être écrasée manuellement par le commercial. L'application mémorise un dictionnaire `overrides: { [key: string]: number }` dans le devis. Lors d'un recalcul (modification de dimensions), les surcharges sont **réappliquées** — la valeur manuelle est conservée et la valeur calculée est ignorée. Une surcharge est signalée visuellement dans l'interface (badge jaune). Le commercial peut réinitialiser une valeur individuelle ou toutes les surcharges d'un coup.

---

## 4. Base de données & modèles

La base de données **PostgreSQL** est gérée via **Prisma ORM** (sans migrations — utilise `prisma db push`). Le schéma est défini dans `backend/prisma/schema.prisma`.

### Énums

| Nom               | Valeurs                                                      |
| :---------------- | :----------------------------------------------------------- |
| `Role`            | `ADMIN`, `COMMERCIAL`                                        |
| `ProductCategory` | `PUMP`, `FILTER`, `SKIMMER`, `VALVE`, `PIPE`, `NOZZLE`, `SAND`, `OTHER` |
| `QuoteStatus`     | `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`                      |
| `PoolShape`       | `RECTANGULAR`, `ROUND`, `OVAL`, `L_SHAPE`, `FREEFORM`       |

### Modèles principaux

#### `User` — Utilisateurs
| Champ          | Type     | Description                              |
| :------------- | :------- | :--------------------------------------- |
| `id`           | UUID     | Identifiant unique                       |
| `email`        | String   | Email de connexion (unique)              |
| `passwordHash` | String   | Mot de passe haché avec bcrypt           |
| `role`         | Enum     | `ADMIN` ou `COMMERCIAL`                  |
| `createdAt`    | DateTime | Date de création                         |
| `updatedAt`    | DateTime | Date de dernière modification            |

#### `Product` — Catalogue produits
| Champ           | Type            | Description                              |
| :-------------- | :-------------- | :--------------------------------------- |
| `sageRef`       | String (unique) | Référence produit Sage (identifiant métier) |
| `name`          | String          | Nom commercial du produit                |
| `brand`         | String          | Marque                                   |
| `category`      | Enum            | `PUMP`, `FILTER`, `SKIMMER`, `VALVE`, `PIPE`, `NOZZLE`, `SAND`, `OTHER` |
| `technicalSpecs`| JSON?           | Specs techniques (puissance, diamètre…)  |
| `purchasePrice` | Float           | Prix d'achat HT                          |
| `sellPrice`     | Float           | Prix de vente HT                         |
| `unit`          | String          | Unité (défaut: "unit")                   |
| `stock`         | Int             | Stock disponible                         |
| `photoUrl`      | String?         | URL de la photo produit                  |
| `active`        | Boolean         | `true` = produit actif dans le catalogue |

#### `Quote` — Devis
| Champ               | Type        | Description                                       |
| :------------------ | :---------- | :------------------------------------------------ |
| `reference`         | String      | Référence auto-générée (ex: `Q-2026-0001`)        |
| `status`            | Enum        | `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`           |
| `shape`             | Enum        | Forme de la piscine (`RECTANGULAR` par défaut)    |
| `shapeParams`       | JSON?       | Paramètres dimensionnels spécifiques à la forme   |
| `poolData`          | JSON        | Saisie utilisateur brute (inclut shape + shapeParams) |
| `calcParams`        | JSON        | Paramètres de calcul utilisés à la création       |
| `calculationResult` | JSON        | Résultats hydrauliques complets + overrides       |
| `clientName`        | String      | Nom du client                                     |
| `clientEmail`       | String?     | Email du client (optionnel)                       |
| `internalNotes`     | String?     | Notes internes (non affichées sur le PDF client)  |
| `createdById`       | UUID        | Référence à l'utilisateur créateur                |
| `lines`             | QuoteLine[] | Lignes de matériel du devis                       |
| `createdAt`         | DateTime    | Date de création                                  |
| `updatedAt`         | DateTime    | Date de dernière modification                     |

#### `QuoteLine` — Lignes de devis
| Champ              | Type     | Description                                      |
| :----------------- | :------- | :----------------------------------------------- |
| `productId`        | UUID     | Référence au produit du catalogue                |
| `quantity`         | Float    | Quantité                                         |
| `unitPrice`        | Float    | Prix unitaire HT (peut différer du prix catalogue) |
| `discount`         | Float    | Remise en % (0 par défaut)                       |
| `visible`          | Boolean  | Si `false`, la ligne n'apparaît pas sur le PDF client |
| `isManuallyAdded`  | Boolean  | Ligne ajoutée à la main (hors calcul automatique)|
| `isManuallyEdited` | Boolean  | Ligne dont le prix/quantité a été modifié manuellement |
| `notes`            | String?  | Notes sur la ligne                               |

#### `CalcSettings` — Paramètres de calcul
Valeurs globales modifiables par l'administrateur, utilisées par le moteur hydraulique. Liées à l'utilisateur qui a fait la dernière modification (`updatedById`).

#### `Settings` — Paramètres société
| Champ         | Type   | Défaut       | Description                     |
| :------------ | :----- | :----------- | :------------------------------ |
| `companyName` | String | "ETS Maria"  | Nom de la société               |
| `address`     | String | ""           | Adresse                         |
| `siret`       | String | ""           | Numéro SIRET                    |
| `currency`    | String | "EUR"        | Devise                          |
| `lang`        | String | "fr"         | Langue                          |

---

## 5. API Backend (routes disponibles)

Le backend expose une API REST JSON sur le port `3001`. Toutes les routes (sauf `/auth/login`) requièrent un token JWT valide dans le header `Authorization: Bearer <token>`.

### Authentification
| Méthode | Route          | Limiteur              | Description                    |
| :------ | :------------- | :-------------------- | :----------------------------- |
| `POST`  | `/auth/login`  | 5 req/15 min          | Connexion, retourne un JWT     |

### Utilisateurs
| Méthode  | Route                       | Droits     | Description                        |
| :------- | :-------------------------- | :--------- | :--------------------------------- |
| `GET`    | `/users`                    | Auth       | Liste tous les utilisateurs        |
| `POST`   | `/users`                    | Admin      | Crée un utilisateur                |
| `PUT`    | `/users/:id`                | Auth       | Modifie un utilisateur             |
| `DELETE` | `/users/:id`                | Auth       | Supprime un utilisateur            |
| `PUT`    | `/users/:id/password`       | Auth       | Change le mot de passe             |

### Devis
| Méthode  | Route                                  | Description                                        |
| :------- | :------------------------------------- | :------------------------------------------------- |
| `GET`    | `/quotes`                              | Liste tous les devis (triés par date)              |
| `POST`   | `/quotes`                              | Crée un nouveau devis                              |
| `GET`    | `/quotes/:id`                          | Retourne un devis complet avec ses lignes          |
| `PUT`    | `/quotes/:id`                          | Met à jour un devis (données, lignes, statut)      |
| `DELETE` | `/quotes/:id`                          | Supprime un devis                                  |
| `GET`    | `/quotes/:id/plan?format=svg\|dxf`    | Génère le plan 2D (SVG par défaut, DXF sur demande)|

### Calcul
| Méthode | Route        | Limiteur    | Description                                             |
| :------ | :----------- | :---------- | :------------------------------------------------------ |
| `POST`  | `/calculate` | 30 req/min  | Exécute le moteur hydraulique et retourne les résultats |

### Catalogue produits
| Méthode  | Route              | Droits     | Description                              |
| :------- | :----------------- | :--------- | :--------------------------------------- |
| `GET`    | `/catalog`         | Auth       | Liste tous les produits actifs           |
| `POST`   | `/catalog/import`  | Admin      | Import CSV de produits (limité à 5 req/min) |

### Paramètres
| Méthode | Route        | Description                            |
| :------ | :----------- | :------------------------------------- |
| `GET`   | `/settings`  | Retourne les paramètres de calcul + société |
| `PUT`   | `/settings`  | Met à jour les paramètres              |

---

## 6. Frontend (pages & flux utilisateur)

Le frontend est une **SPA React** avec React Router. Il communique avec le backend via Axios (`frontend/src/services/api.ts`). Le token JWT est stocké dans `localStorage` ; un intercepteur Axios redirige vers `/login` en cas de 401.

### Pages

| Route            | Page           | Description |
| :--------------- | :------------- | :---------- |
| `/login`         | `Login`        | Formulaire d'authentification |
| `/`              | `Dashboard`    | Accueil avec vue d'ensemble des devis récents |
| `/quotes`        | `Quotes`       | Liste complète des devis avec recherche et filtres |
| `/quote/new`     | `NewQuote`     | Assistant de création en 4 étapes |
| `/quote/:id`     | `QuoteDetail`  | Détail complet d'un devis avec édition |
| `/catalog`       | `Catalog`      | Gestion du catalogue produits |
| `/users`         | `Users`        | Gestion des utilisateurs (admin) |
| `/settings`      | `Settings`     | Paramètres de calcul et société (admin) |

#### `/quote/new` — Assistant de création (4 étapes)

1. **`Step1_Client`** — Saisie du nom et email du client
2. **`Step2_Dimensions`** — Sélection de la forme (`PoolShapeSelector` avec rendu 2D `PoolShape2D`) et saisie des dimensions
3. **`Step3_Options`** — Options (chauffage, spa, nage à contre-courant, éclairage)
4. **`Step4_Summary`** — Récapitulatif et création du devis

Le calcul hydraulique est déclenché automatiquement à chaque modification via un **debounce de 500ms** (hook `useCalculate`).

#### `/quote/:id` — Détail d'un devis

Interface complète avec :
- **Recalcul live** : les dimensions restent éditables, le moteur recalcule en temps réel
- **Tableau des lignes** (`QuoteTable`) : édition inline quantité / prix / remise / visibilité
- **Plan 2D** (`HydraulicPlan`) : visualisation SVG du plan d'installation avec mode plein écran
- **Aperçu visuel 3D** (`PoolVisual`) : rendu généré par l'IA Gemini (si configurée)
- **Résultats hydrauliques** (`HydraulicResultsCard`) : affichage des valeurs calculées avec indication des surcharges
- **Notes internes** : champ texte libre non visible sur le PDF client
- **Actions** (`QuoteActions`) : changement de statut, export PDF interne, export PDF client
- **Sauvegarde automatique** : l'état du devis est sauvegardé avec un debounce de 1 seconde (indicateur animé en cas de modifications non sauvegardées) via le hook `useQuote`

### Hooks React clés

| Hook            | Rôle                                                                 |
| :-------------- | :------------------------------------------------------------------- |
| `useCalculate`  | Appelle `/calculate` avec debounce 500ms, gère les overrides manuelles |
| `useQuote`      | Charge, met à jour et sauvegarde un devis avec auto-save debounce 1s |

### Composants UI réutilisables

| Composant              | Rôle                                              |
| :--------------------- | :------------------------------------------------ |
| `Button`               | Bouton (primary/secondary/danger/ghost/outline)   |
| `Input`                | Champ de saisie avec état d'override              |
| `Card`                 | Conteneur de carte                                |
| `Badge`                | Badge de statut                                   |
| `Select`               | Select (wrapper HeroUI)                           |
| `Modal`                | Fenêtre modale                                    |

---

## 7. Sécurité

| Protection                | Implémentation                                               |
| :------------------------ | :----------------------------------------------------------- |
| Rate limiting             | Login: 5 req/15min, Calcul: 30 req/min, Import: 5 req/min   |
| CORS restrictif           | Uniquement origins configurées (localhost/réseau local)      |
| Taille maximale du body   | 1 Mo (prévention DoS)                                        |
| Upload fichiers           | 5 Mo max, filtre MIME (CSV uniquement)                       |
| Authentification          | JWT 8h, bcrypt pour les mots de passe                       |
| RBAC                      | Deux rôles (ADMIN/COMMERCIAL) avec accès différenciés       |
| Graceful shutdown         | Déconnexion Prisma propre sur SIGTERM/SIGINT                 |

---

## 8. Installation & démarrage

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et en cours d'exécution

### Première installation

```bash
# 1. Copier le fichier de configuration
cp .env.example .env

# 2. Remplir les valeurs dans .env (voir section 9)

# 3. Démarrer l'application (build + lancement de tous les services)
docker-compose up --build
```

Au premier démarrage, le backend exécute automatiquement :
1. `prisma db push` — crée toutes les tables en base
2. `ts-node prisma/seed.ts` — insère l'utilisateur admin initial et les paramètres par défaut

### PowerShell helper

```powershell
# Démarrer en arrière-plan
.\peep.ps1 start

# Reconstruire et lancer
.\peep.ps1 build

# Arrêter
.\peep.ps1 stop

# Supprimer conteneurs + réseaux
.\peep.ps1 clean

# Supprimer TOUT (conteneurs + volumes DB + images)
.\peep.ps1 flush

# Logs en direct
.\peep.ps1 logs
```

### Commandes Docker

```bash
# Démarrer en arrière-plan
docker-compose up -d

# Arrêter proprement
docker-compose down

# Redémarrer après une modification du code
docker-compose up --build

# Consulter les logs en temps réel
docker-compose logs -f

# Logs d'un seul service
docker-compose logs -f backend
```

---

## 9. Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# URL de connexion à la base de données PostgreSQL
DATABASE_URL=postgresql://peep:peep_password@postgres:5432/peep_db

# Clé API Google Gemini (obligatoire pour la génération d'aperçu visuel)
GEMINI_API_KEY=your_gemini_api_key_here

# Clé secrète pour la signature des tokens JWT (changer en production)
JWT_SECRET=un_secret_long_et_aleatoire
```

---

## 10. Données initiales (seed)

Au premier démarrage, le fichier `backend/prisma/seed.ts` crée automatiquement un compte administrateur :

| Champ        | Valeur              |
| :----------- | :------------------ |
| Email        | `admin@peep.local`  |
| Mot de passe | `password123`       |
| Rôle         | `ADMIN`             |

Des paramètres de calcul par défaut sont également créés (voir section 3).

> ⚠️ **Changez ce mot de passe immédiatement** après la première connexion en production.

---

## 11. Gestion des utilisateurs & rôles

Peep dispose de deux rôles :

| Rôle         | Permissions                                                                              |
| :----------- | :--------------------------------------------------------------------------------------- |
| `ADMIN`      | Accès total : gestion des utilisateurs, du catalogue produits, des paramètres de calcul et société |
| `COMMERCIAL` | Création et gestion de ses devis, lecture du catalogue                                   |

La gestion des comptes (création, modification, suppression, réinitialisation de mot de passe) se fait via l'interface `/users`, accessible avec un compte `ADMIN`.

---

*Document technique — usage interne ETS Maria*  
*Version 2.0 — Mise à jour : Mai 2026*
