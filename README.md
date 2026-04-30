# 🐸 Peep — Outil Interne de Devis d'Installations de Piscines

**Peep** est une application web **full-stack** conçue pour les commerciaux d'ETS Maria. Elle automatise le dimensionnement hydraulique d'une piscine à partir de ses dimensions, puis génère un devis d'équipement complet, modifiable, et exportable en PDF — le tout en quelques secondes.

---

## Table des matières

1. [Ce que fait l'application](#1-ce-que-fait-lapplication)
2. [Architecture technique](#2-architecture-technique)
3. [Le moteur de calcul hydraulique](#3-le-moteur-de-calcul-hydraulique)
4. [Base de données & modèles](#4-base-de-données--modèles)
5. [API Backend (routes disponibles)](#5-api-backend-routes-disponibles)
6. [Frontend (pages & flux utilisateur)](#6-frontend-pages--flux-utilisateur)
7. [Installation & démarrage](#7-installation--démarrage)
8. [Variables d'environnement](#8-variables-denvironnement)
9. [Données initiales (seed)](#9-données-initiales-seed)
10. [Gestion des utilisateurs & rôles](#10-gestion-des-utilisateurs--rôles)

---

## 1. Ce que fait l'application

Un commercial saisit les caractéristiques d'une piscine (dimensions, type de débordement, options). Peep exécute alors une **chaîne de calcul hydraulique en 10 étapes** pour déterminer automatiquement :

- Le volume de la piscine
- Le débit de filtration nécessaire
- La puissance de la pompe (normalisée sur les puissances standard du marché)
- Le nombre de skimmers et de refoulements
- Les diamètres de tuyauterie (aspiration & refoulement)
- Le nombre de vannes
- La surface et le diamètre du filtre à sable
- La quantité de sable nécessaire

À partir de ces résultats, l'application **associe automatiquement les produits du catalogue** (référencés dans la base de données avec leurs prix Sage) pour constituer la liste de matériel du devis. Le commercial peut ensuite :

- **Surcharger manuellement** n'importe quelle valeur calculée (la valeur est alors marquée comme « manuelle »)
- Ajuster les quantités, prix, et remises ligne par ligne
- Ajouter ou masquer des lignes du devis
- Laisser des notes internes (invisibles sur le PDF client)
- Exporter deux versions PDF : une **fiche interne** (avec prix d'achat et marges) et un **devis client** (épuré, avec uniquement les prix de vente)
- Changer le statut du devis : `BROUILLON → ENVOYÉ → ACCEPTÉ / REFUSÉ`

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
| Frontend   | React 18, Vite, TypeScript, TailwindCSS, Axios   | 80   |
| Backend    | Node.js, Express, TypeScript, Prisma ORM         | 3001 |
| Base de données | PostgreSQL 15                              | 5432 |
| PDF        | pdfmake                                         | —    |
| IA (optionnel) | Google Gemini API (`@google/generative-ai`) | —    |

Le frontend est construit en production (`npm run build`) et servi statiquement par **Nginx**. Nginx proxifie également les requêtes `/api/*` vers le backend.

---

## 3. Le moteur de calcul hydraulique

Le cœur de Peep est le fichier `backend/src/services/hydraulicEngine.ts`. Il implémente une **chaîne de 10 calculs séquentiels**, chacun pouvant être surchargé manuellement par l'utilisateur.

### Paramètres d'entrée (`PoolInput`)

| Paramètre      | Type                                  | Description                          |
| :------------- | :------------------------------------ | :----------------------------------- |
| `length`       | `number`                              | Longueur de la piscine (m)           |
| `width`        | `number`                              | Largeur (m)                          |
| `depthShallow` | `number`                              | Profondeur côté plage (m)            |
| `depthDeep`    | `number`                              | Profondeur côté plongeoir (m)        |
| `type`         | `SKIMMER \| OVERFLOW \| ROMAN`        | Type de système de débordement       |
| `usage`        | `RESIDENTIAL \| PUBLIC`               | Usage résidentiel ou public          |
| `options`      | `{ heating, spa, counterCurrent, lighting }` | Options activées             |

### Paramètres de calcul (`CalcSettings` — stockés en BDD)

Ces valeurs sont modifiables par un administrateur et servent de référentiel pour tous les calculs :

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
Étape 5  →  Skimmers = max(2, Volume / m3PerSkimmer)  [arrondi au supérieur]
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

La base de données **PostgreSQL** est gérée via **Prisma ORM**. Le schéma est défini dans `backend/prisma/schema.prisma`.

### Modèles principaux

#### `User` — Utilisateurs
| Champ          | Type     | Description                              |
| :------------- | :------- | :--------------------------------------- |
| `id`           | UUID     | Identifiant unique                       |
| `email`        | String   | Email de connexion (unique)              |
| `passwordHash` | String   | Mot de passe haché avec bcrypt           |
| `role`         | Enum     | `ADMIN` ou `COMMERCIAL`                  |

#### `Product` — Catalogue produits
| Champ           | Type            | Description                              |
| :-------------- | :-------------- | :--------------------------------------- |
| `sageRef`       | String (unique) | Référence produit Sage (identifiant métier) |
| `name`          | String          | Nom commercial du produit                |
| `brand`         | String          | Marque                                   |
| `category`      | Enum            | `PUMP`, `FILTER`, `SKIMMER`, `VALVE`, `PIPE`, `NOZZLE`, `SAND`, `OTHER` |
| `technicalSpecs`| JSON            | Specs techniques (puissance, diamètre…)  |
| `purchasePrice` | Float           | Prix d'achat HT                          |
| `sellPrice`     | Float           | Prix de vente HT                         |
| `stock`         | Int             | Stock disponible                         |
| `photoUrl`      | String?         | URL de la photo produit                  |

#### `Quote` — Devis
| Champ               | Type        | Description                                       |
| :------------------ | :---------- | :------------------------------------------------ |
| `reference`         | String      | Référence auto-générée (ex: `PEEP-2026-0042`)     |
| `status`            | Enum        | `DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`           |
| `poolData`          | JSON        | Saisie utilisateur brute (dimensions, options)    |
| `calcParams`        | JSON        | Paramètres de calcul utilisés à la création       |
| `calculationResult` | JSON        | Résultats hydrauliques complets + overrides       |
| `clientName`        | String      | Nom du client                                     |
| `clientEmail`       | String?     | Email du client (optionnel)                       |
| `internalNotes`     | String?     | Notes internes (non affichées sur le PDF client)  |
| `lines`             | QuoteLine[] | Lignes de matériel du devis                       |

#### `QuoteLine` — Lignes de devis
| Champ             | Type    | Description                                      |
| :---------------- | :------ | :----------------------------------------------- |
| `productId`       | UUID    | Référence au produit du catalogue                |
| `quantity`        | Float   | Quantité                                         |
| `unitPrice`       | Float   | Prix unitaire HT (peut différer du prix catalogue) |
| `discount`        | Float   | Remise en % (0 par défaut)                       |
| `visible`         | Boolean | Si `false`, la ligne n'apparaît pas sur le PDF client |
| `isManuallyAdded` | Boolean | Ligne ajoutée à la main (hors calcul automatique) |
| `isManuallyEdited`| Boolean | Ligne dont le prix/quantité a été modifié manuellement |

#### `CalcSettings` — Paramètres de calcul
Valeurs globales modifiables par l'administrateur, utilisées par le moteur hydraulique. Une seule instance par utilisateur admin.

---

## 5. API Backend (routes disponibles)

Le backend expose une API REST JSON sur le port `3001`. Toutes les routes (sauf `/auth/login`) requièrent un token JWT valide dans le header `Authorization: Bearer <token>`.

### Authentification
| Méthode | Route          | Description                        |
| :------ | :------------- | :--------------------------------- |
| `POST`  | `/auth/login`  | Connexion, retourne un JWT         |
| `GET`   | `/auth/me`     | Retourne l'utilisateur courant     |

### Devis
| Méthode  | Route                      | Description                                        |
| :------- | :------------------------- | :------------------------------------------------- |
| `GET`    | `/quotes`                  | Liste tous les devis (triés par date)              |
| `POST`   | `/quotes`                  | Crée un nouveau devis                              |
| `GET`    | `/quotes/:id`              | Retourne un devis complet avec ses lignes          |
| `PUT`    | `/quotes/:id`              | Met à jour un devis (données, lignes, statut)      |
| `DELETE` | `/quotes/:id`              | Supprime un devis                                  |
| `GET`    | `/quotes/:id/pdf?type=internal\|client` | Génère et télécharge le PDF        |

### Calcul
| Méthode | Route          | Description                                                |
| :------ | :------------- | :--------------------------------------------------------- |
| `POST`  | `/calculate`   | Exécute le moteur hydraulique et retourne les résultats    |

### Catalogue produits
| Méthode  | Route             | Description                              |
| :------- | :---------------- | :--------------------------------------- |
| `GET`    | `/catalog`        | Liste tous les produits actifs           |
| `POST`   | `/catalog`        | Crée un produit (ADMIN)                  |
| `PUT`    | `/catalog/:id`    | Met à jour un produit (ADMIN)            |
| `POST`   | `/catalog/import` | Import CSV de produits (ADMIN)           |

---

## 6. Frontend (pages & flux utilisateur)

Le frontend est une **SPA React** avec React Router. Il communique avec le backend via Axios (`frontend/src/services/api.ts`).

### Pages

#### `/login` — Connexion
Formulaire d'authentification. Le token JWT est stocké dans `localStorage`. Toute route non authentifiée redirige ici.

#### `/` — Dashboard
Liste de tous les devis avec leur référence, client, statut, et date. Bouton de création d'un nouveau devis.

#### `/quote/new` — Création d'un devis
Interface en **3 colonnes** :
1. **Colonne gauche** : saisie du client + dimensions piscine (`Step1_PoolDimensions`) + options (`Step2_PoolOptions`)
2. **Colonne droite (×2)** : résultats du moteur hydraulique en temps réel (`Step3_Results`)

Le calcul est déclenché automatiquement à chaque modification via un **debounce de 300ms** (hook `useCalculate`). Dès qu'un résultat est disponible et que le nom du client est renseigné, le commercial peut créer le devis en brouillon.

#### `/quote/:id` — Détail d'un devis
Interface complète avec :
- **Recalcul live** : les dimensions restent éditables, le moteur recalcule en temps réel
- **Tableau des lignes** (`QuoteTable`) : édition inline quantité / prix / remise / visibilité
- **Aperçu visuel 3D** (`PoolVisual`) : rendu généré par l'IA Gemini
- **Notes internes** : champ texte libre non visible sur le PDF client
- **Actions** (`QuoteActions`) : changement de statut, export PDF interne, export PDF client
- **Sauvegarde automatique** : l'état du devis est sauvegardé avec un debounce (indicateur animé en cas de modifications non sauvegardées)

### Hooks React clés

| Hook            | Rôle                                                                 |
| :-------------- | :------------------------------------------------------------------- |
| `useCalculate`  | Appelle `/calculate`, gère les overrides manuelles et le debounce   |
| `useQuote`      | Charge, met à jour et sauvegarde un devis avec auto-save debounced  |
| `useAuth`       | Gère l'état de connexion et le token JWT                            |

---

## 7. Installation & démarrage

### Prérequis
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé et en cours d'exécution

### Première installation

```bash
# 1. Copier le fichier de configuration
cp .env.example .env

# 2. Remplir les valeurs dans .env (voir section 8)
# Obligatoire : GEMINI_API_KEY

# 3. Démarrer l'application (build + lancement de tous les services)
docker-compose up --build
```

Au premier démarrage, le backend exécute automatiquement :
1. `prisma db push` — crée toutes les tables en base
2. `ts-node prisma/seed.ts` — insère l'utilisateur admin initial

### Commandes utiles

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

## 8. Variables d'environnement

Créer un fichier `.env` à la racine du projet :

```env
# Clé API Google Gemini (obligatoire pour la génération d'aperçu visuel)
GEMINI_API_KEY=your_gemini_api_key_here

# Clé secrète pour la signature des tokens JWT (changer en production)
JWT_SECRET=un_secret_long_et_aleatoire
```

> **Note :** La `DATABASE_URL` est gérée directement dans `docker-compose.yml` et ne nécessite pas d'être définie dans `.env`.

---

## 9. Données initiales (seed)

Au premier démarrage, le fichier `backend/prisma/seed.ts` crée automatiquement un compte administrateur :

| Champ    | Valeur              |
| :------- | :------------------ |
| Email    | `admin@peep.local`  |
| Mot de passe | `password123`   |
| Rôle     | `ADMIN`             |

> ⚠️ **Changez ce mot de passe immédiatement** après la première connexion en production.

---

## 10. Gestion des utilisateurs & rôles

Peep dispose de deux rôles :

| Rôle         | Permissions                                                                              |
| :----------- | :--------------------------------------------------------------------------------------- |
| `ADMIN`      | Accès total : gestion des utilisateurs, du catalogue produits, des paramètres de calcul |
| `COMMERCIAL` | Création et gestion de ses devis, lecture du catalogue                                   |

La gestion des comptes (création, réinitialisation de mot de passe) se fait via l'interface admin, accessible depuis le tableau de bord avec un compte `ADMIN`.

---

*Document technique — usage interne ETS Maria*  
*Version 1.0 — Mise à jour : Avril 2026*
