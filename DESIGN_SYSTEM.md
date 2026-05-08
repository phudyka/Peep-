# Design System — Peep by ETS Maria
> SaaS interne de devis hydraulique piscine · Dark mode unique · Version 2.0

---

## Identité visuelle

Peep est l'outil de confiance des commerciaux ETS Maria (depuis 1937). L'interface doit refléter **expertise technique**, **clarté opérationnelle** et **modernité sobre** — un SaaS métier qui inspire confiance, pas un dashboard générique.

**Références visuelles** : logos Peep & ETS Maria — grenouille bleu-vert, dégradé bleu→vert, courbe verte.

---

## Palette de couleurs

### Principes

- **Fond très sombre** comme base absolue (quasi-noir bleuté)
- **Vert** comme couleur principale (action, succès, brand)
- **Bleu** comme couleur secondaire (navigation, information, liens)
- **Jaune/ambre** comme accent fonctionnel (overrides, warnings) — jamais décoratif
- Contraste minimum **4.5:1** sur tout texte

### Tokens CSS (à définir dans `tailwind.config.cjs`)

```css
:root {
  /* === Fonds === */
  --color-bg-base:       #07090f;   /* Fond application principal */
  --color-bg-surface:    #0d1117;   /* Cartes, panneaux */
  --color-bg-elevated:   #161b25;   /* Éléments surélevés, dropdowns */
  --color-bg-overlay:    #1e2535;   /* Hover, sélection */
  --color-bg-subtle:     #252d3d;   /* Séparateurs visibles, inputs */

  /* === Bordures === */
  --color-border-base:   #1e2a3a;   /* Bordure standard */
  --color-border-strong: #2a3a50;   /* Bordure visible (focus ring off) */
  --color-border-focus:  #22c55e;   /* Focus ring (vert) */

  /* === Vert — Couleur principale (brand) === */
  --color-green-400:     #4ade80;
  --color-green-500:     #22c55e;   /* Action principale */
  --color-green-600:     #16a34a;   /* Hover principal */
  --color-green-700:     #15803d;   /* Pressed */
  --color-green-900:     #052e16;   /* Fond badge success */

  /* === Bleu — Couleur secondaire === */
  --color-blue-400:      #60a5fa;
  --color-blue-500:      #3b82f6;   /* Liens, info, statut ENVOYÉ */
  --color-blue-600:      #2563eb;   /* Hover lien */
  --color-blue-900:      #1e3a5f;   /* Fond badge info */

  /* === Jaune/Ambre — Accent fonctionnel === */
  --color-amber-400:     #fbbf24;
  --color-amber-500:     #f59e0b;   /* Overrides, BROUILLON */
  --color-amber-600:     #d97706;   /* Hover warning */
  --color-amber-900:     #451a03;   /* Fond badge warning */

  /* === Rouge — Danger === */
  --color-red-400:       #f87171;
  --color-red-500:       #ef4444;
  --color-red-600:       #dc2626;
  --color-red-900:       #450a0a;   /* Fond badge danger */

  /* === Texte === */
  --color-text-primary:  #f1f5f9;   /* Texte principal */
  --color-text-secondary:#94a3b8;   /* Texte secondaire, labels */
  --color-text-muted:    #64748b;   /* Placeholders, métadonnées */
  --color-text-disabled: #374151;   /* Désactivé */
  --color-text-inverse:  #07090f;   /* Texte sur fond vert/clair */

  /* === Dégradé brand === */
  --gradient-brand: linear-gradient(135deg, #2563eb 0%, #22c55e 100%);
  --gradient-brand-subtle: linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(34,197,94,0.15) 100%);
}
```

### Mapping HeroUI (`tailwind.config.cjs`)

```js
colors: {
  primary: {
    DEFAULT: '#22c55e',
    foreground: '#07090f',
    50:  '#052e16',
    100: '#064e1f',
    200: '#0a6627',
    300: '#16803d',
    400: '#22c55e',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
  },
  secondary: {
    DEFAULT: '#3b82f6',
    foreground: '#f1f5f9',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
  },
  background: '#07090f',
  foreground: '#f1f5f9',
  default: {
    100: '#0d1117',
    200: '#161b25',
    300: '#1e2535',
    400: '#252d3d',
    500: '#374151',
    600: '#64748b',
    700: '#94a3b8',
  },
  success:  { DEFAULT: '#22c55e', foreground: '#07090f' },
  warning:  { DEFAULT: '#f59e0b', foreground: '#07090f' },
  danger:   { DEFAULT: '#ef4444', foreground: '#f1f5f9' },
  focus:    '#22c55e',
}
```

---

## Typographie

### Polices

```html
<!-- Dans index.html -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
```

| Rôle | Police | Fallback |
|------|--------|----------|
| Interface / corps | `DM Sans` | `ui-sans-serif, system-ui` |
| Données / code / refs | `JetBrains Mono` | `ui-monospace, monospace` |

```js
// tailwind.config.cjs
fontFamily: {
  sans: ['DM Sans', 'ui-sans-serif', 'system-ui'],
  mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
}
```

### Échelle typographique

| Token | Taille | Graisse | Line-height | Usage |
|-------|--------|---------|-------------|-------|
| `text-xs` | 11px | 400 | 1.5 | Métadonnées, badges |
| `text-sm` | 13px | 400–500 | 1.5 | Corps secondaire, inputs, labels |
| `text-base` | 15px | 400 | 1.6 | Corps principal |
| `text-lg` | 17px | 600 | 1.4 | En-têtes section |
| `text-xl` | 20px | 700 | 1.3 | Titres carte |
| `text-2xl` | 24px | 700 | 1.2 | Titres page |
| `text-3xl` | 30px | 800 | 1.1 | Titre login |

**Règles** :
- `font-medium` (500) pour labels et éléments d'interface
- `font-semibold` (600) pour en-têtes de section, colonnes tableau
- `font-bold` (700) pour titres de page
- `font-mono` pour : références devis (`DEV-2025-042`), valeurs numériques de calcul, prix

---

## Composants UI

### Button

**Architecture** : toujours `inline-flex items-center gap-2`, hauteur fixe, `font-medium text-sm`, transitions systématiques.

```tsx
// Variants
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'
```

| Variant | Fond | Texte | Hover | Border |
|---------|------|-------|-------|--------|
| `primary` | `bg-green-500` | `text-[#07090f]` | `bg-green-600` | — |
| `secondary` | `bg-[#161b25]` | `text-slate-200` | `bg-[#1e2535]` | `border border-[#1e2a3a]` |
| `danger` | `bg-red-600` | `text-white` | `bg-red-700` | — |
| `ghost` | `transparent` | `text-slate-400` | `bg-[#161b25] text-slate-200` | — |
| `outline` | `transparent` | `text-green-400` | `bg-green-500/10` | `border border-green-500/40` |

| Size | Height | Padding | Text |
|------|--------|---------|------|
| `xs` | `h-7` | `px-2.5` | `text-xs` |
| `sm` | `h-8` | `px-3` | `text-sm` |
| `md` | `h-9` | `px-4` | `text-sm` |
| `lg` | `h-11` | `px-6` | `text-base` |

```tsx
// Exemple classes complètes — variant primary, size md
className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-green-500 text-[#07090f] text-sm font-medium hover:bg-green-600 active:bg-green-700 transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
```

### Input

```tsx
// Base
className="h-9 w-full rounded-lg bg-[#0d1117] border border-[#1e2a3a] px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500/30 transition-all duration-150"

// État overridé (valeur manuelle)
className="h-9 w-full rounded-lg bg-amber-950/30 border border-amber-500/60 px-3 text-sm text-amber-300 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all duration-150"
```

**Label** : `text-xs font-medium text-slate-400 uppercase tracking-wider mb-1.5`

**Helper** : `text-xs text-slate-500 mt-1`

**Erreur** : `text-xs text-red-400 mt-1` + border `border-red-500/60`

### Card

Unité de base de composition. Toujours `rounded-xl`, fond `bg-[#0d1117]`, bordure subtile.

```tsx
// Card standard
<div className="rounded-xl bg-[#0d1117] border border-[#1e2a3a] p-5">

// Card avec header
<div className="rounded-xl bg-[#0d1117] border border-[#1e2a3a] overflow-hidden">
  <div className="px-5 py-4 border-b border-[#1e2a3a] flex items-center justify-between">
    <h3 className="text-sm font-semibold text-slate-200">Titre</h3>
  </div>
  <div className="p-5">...</div>
</div>

// Card accent (avec bord coloré)
<div className="rounded-xl bg-[#0d1117] border border-[#1e2a3a] border-l-2 border-l-green-500 p-5">
```

### Badge / Chip de statut

Système de badges pour les statuts devis. `rounded-full`, `text-xs font-medium`, `px-2.5 py-0.5`.

```tsx
const statusConfig = {
  DRAFT:    { label: 'BROUILLON', classes: 'bg-amber-900/40 text-amber-400 border border-amber-500/30' },
  SENT:     { label: 'ENVOYÉ',    classes: 'bg-blue-900/40  text-blue-400  border border-blue-500/30' },
  ACCEPTED: { label: 'ACCEPTÉ',   classes: 'bg-green-900/40 text-green-400 border border-green-500/30' },
  REJECTED: { label: 'REFUSÉ',    classes: 'bg-red-900/40   text-red-400   border border-red-500/30' },
}
```

### Badge override (champ manuel)

Indicateur d'une valeur surchargée manuellement.

```tsx
// Point jaune positionné en haut à droite du champ
<div className="relative">
  <input className="... border-amber-500/60 bg-amber-950/20 text-amber-300" />
  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#07090f]" />
</div>
```

```css
/* index.css — classe utilitaire globale */
.field-overridden {
  @apply border-amber-500/60 bg-amber-950/20 text-amber-300;
}
.field-overridden-dot::after {
  content: '';
  @apply absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400;
  box-shadow: 0 0 0 2px #07090f;
}
```

### Table

```tsx
// Wrapper
<div className="rounded-xl border border-[#1e2a3a] overflow-hidden">

// Header
<thead>
  <tr className="bg-[#0d1117] border-b border-[#1e2a3a]">
    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">

// Row
<tr className="border-b border-[#1e2a3a]/60 hover:bg-[#161b25] transition-colors duration-100">
  <td className="px-4 py-3 text-sm text-slate-300">

// Row sélectionnée
<tr className="border-b border-[#1e2a3a]/60 bg-green-500/5 border-l-2 border-l-green-500">
```

**Valeurs numériques dans les tables** : toujours `font-mono text-sm`.

**Ligne masquée** : `opacity-40 line-through text-slate-500`

### Modal

```tsx
// Overlay
<div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">

// Conteneur
<div className="relative w-full max-w-lg rounded-2xl bg-[#0d1117] border border-[#1e2a3a] shadow-2xl shadow-black/50 p-6">

// Header modal
<div className="flex items-start justify-between mb-6">
  <h2 className="text-lg font-bold text-slate-100">Titre</h2>
  <button className="p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-[#161b25] transition-colors">
    <X size={18} />
  </button>
</div>

// Footer modal
<div className="flex justify-end gap-3 mt-6 pt-5 border-t border-[#1e2a3a]">
  <Button variant="ghost">Annuler</Button>
  <Button variant="primary">Confirmer</Button>
</div>
```

### Tooltip

```tsx
// Wrapper HeroUI avec style custom
<Tooltip
  content="Valeur surchargée manuellement"
  classNames={{
    content: "bg-[#1e2535] text-slate-200 text-xs border border-[#2a3a50] rounded-lg shadow-xl px-3 py-1.5"
  }}
>
```

### Select

```tsx
<Select
  classNames={{
    trigger: "bg-[#0d1117] border-[#1e2a3a] hover:border-[#2a3a50] data-[focus=true]:border-green-500",
    value: "text-slate-200 text-sm",
    popoverContent: "bg-[#0d1117] border border-[#1e2a3a] rounded-xl shadow-2xl",
  }}
>
```

---

## Layout & Navigation

### Structure principale

```
┌─────────────────────────────────────────────────────┐
│ SIDEBAR (240px fixe desktop)  │  MAIN CONTENT       │
│ bg-[#0d1117]                  │  bg-[#07090f]       │
│ border-r border-[#1e2a3a]     │  flex-1             │
│                               │                     │
│  Logo + Brand                 │  TopBar (optionnel) │
│  ──────────────               │  ─────────────────  │
│  Navigation items             │                     │
│  ──────────────               │  Page content       │
│  User info (bas)              │  p-6                │
└─────────────────────────────────────────────────────┘
```

**Mobile** : Drawer (panneau latéral) déclenché par hamburger dans un topbar pleine largeur.

### Sidebar

```tsx
// Container
<aside className="hidden md:flex flex-col w-60 h-screen bg-[#0d1117] border-r border-[#1e2a3a] flex-shrink-0">

// Logo zone
<div className="px-5 py-5 border-b border-[#1e2a3a]">
  <img src={peepLogo} alt="Peep" className="h-8" />
</div>

// Section label
<p className="px-4 pt-5 pb-2 text-xs font-semibold text-slate-600 uppercase tracking-widest">
  Navigation
</p>

// Nav item — inactif
<a className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-200 hover:bg-[#161b25] transition-colors duration-150">
  <Icon size={16} className="flex-shrink-0" />
  Libellé
</a>

// Nav item — actif
<a className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-sm font-medium text-green-400 bg-green-500/10 border border-green-500/20">
  <Icon size={16} className="flex-shrink-0 text-green-400" />
  Libellé
</a>

// User info (bas de sidebar)
<div className="mt-auto border-t border-[#1e2a3a] p-4">
  <div className="flex items-center gap-3">
    <Avatar className="w-8 h-8 text-xs bg-green-900 text-green-300" name="JD" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-200 truncate">Jean Dupont</p>
      <p className="text-xs text-slate-500 truncate">Commercial</p>
    </div>
    <button className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors">
      <LogOut size={15} />
    </button>
  </div>
</div>
```

### TopBar de page

```tsx
<div className="flex items-center justify-between px-6 py-4 border-b border-[#1e2a3a]">
  <div>
    <h1 className="text-xl font-bold text-slate-100">Titre de page</h1>
    <p className="text-sm text-slate-500 mt-0.5">Sous-titre ou breadcrumb</p>
  </div>
  <div className="flex items-center gap-2">
    {/* Actions de page */}
  </div>
</div>
```

### Grille responsive

```tsx
// Dashboard — liste devis
<div className="grid grid-cols-1 gap-3">  {/* Table complète */}

// Formulaire nouveau devis — 3 colonnes
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-1 space-y-4">  {/* Infos + dimensions */}
  <div className="lg:col-span-2 space-y-4">  {/* Résultats calcul */}

// Paramètres — 2 colonnes
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
```

---

## Page de connexion

```tsx
// Full-screen centered
<div className="min-h-screen bg-[#07090f] flex items-center justify-center p-6">

  {/* Halo décoratif fond */}
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-green-500/5 blur-3xl" />
  </div>

  {/* Card login */}
  <div className="relative w-full max-w-sm">

    {/* Logo */}
    <div className="text-center mb-8">
      <img src={peepLogo} alt="Peep" className="h-12 mx-auto mb-3" />
      <p className="text-sm text-slate-500">Outil de devis ETS Maria</p>
    </div>

    <div className="rounded-2xl bg-[#0d1117] border border-[#1e2a3a] p-8 shadow-2xl shadow-black/50">
      <h2 className="text-xl font-bold text-slate-100 mb-6">Connexion</h2>
      {/* Form fields */}
    </div>

    <p className="text-center text-xs text-slate-600 mt-6">
      ETS Maria © {new Date().getFullYear()} · Depuis 1937
    </p>
  </div>
</div>
```

---

## Barre de progression (wizard)

Pour le flux de création de devis en étapes :

```tsx
<div className="flex items-center gap-0">
  {steps.map((step, i) => (
    <div key={i} className="flex items-center">
      {/* Cercle étape */}
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all",
        isComplete ? "bg-green-500 border-green-500 text-[#07090f]"    : "",
        isCurrent  ? "bg-transparent border-green-500 text-green-400"  : "",
        isPending  ? "bg-transparent border-[#1e2a3a] text-slate-600"  : "",
      )}>
        {isComplete ? <Check size={14} /> : i + 1}
      </div>
      {/* Connecteur */}
      {i < steps.length - 1 && (
        <div className={cn(
          "h-0.5 w-16 transition-colors",
          isComplete ? "bg-green-500" : "bg-[#1e2a3a]"
        )} />
      )}
    </div>
  ))}
</div>
```

---

## Indicateur de sauvegarde automatique

```tsx
// Sauvegarde en cours
<div className="flex items-center gap-1.5 text-xs text-slate-500">
  <RefreshCw size={12} className="animate-spin" />
  Enregistrement…
</div>

// Sauvegardé
<div className="flex items-center gap-1.5 text-xs text-green-500">
  <Check size={12} />
  Enregistré
</div>

// Non sauvegardé (modifications en attente)
<div className="flex items-center gap-1.5 text-xs text-amber-500">
  <AlertCircle size={12} />
  Modifications non sauvegardées
</div>
```

---

## Effets visuels

### Border radius

| Classe | Usage |
|--------|-------|
| `rounded-lg` (8px) | Inputs, boutons, badges |
| `rounded-xl` (12px) | Cartes, dropdowns |
| `rounded-2xl` (16px) | Modales, page login |
| `rounded-full` | Avatars, dots, pills |

### Ombres

```css
/* Carte standard */
box-shadow: 0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3);

/* Modale / Dropdown */
box-shadow: 0 25px 50px rgba(0,0,0,0.6), 0 12px 24px rgba(0,0,0,0.4);

/* Bouton primary (glow vert subtil) */
box-shadow: 0 0 12px rgba(34,197,94,0.25);
```

### Transitions standard

```css
/* Couleurs & fond — interactions rapides */
transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease;

/* Tous — éléments composites */
transition: all 200ms ease;

/* Opacité — fade in/out */
transition: opacity 250ms ease;
```

### Glassmorphism (usage limité)

Réservé aux éléments superposés (tooltips, toasts) :
```css
background: rgba(13,17,23,0.85);
backdrop-filter: blur(12px);
border: 1px solid rgba(255,255,255,0.06);
```

### Halo de fond décoratif

Pour les pages importantes (login, onboarding) — ne jamais abuser :
```tsx
<div className="absolute top-0 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />
<div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
```

---

## Icônes

**Librairie** : Lucide React v0.368.0

**Tailles standard** :

| Contexte | Taille |
|----------|--------|
| Navigation sidebar | `size={16}` |
| Boutons avec texte | `size={15}` |
| Actions inline (table) | `size={14}` |
| Icônes décoratives / section | `size={20}` |
| Icône hero (login, états vides) | `size={40}` |

**Couleurs** : toujours héritées via `currentColor`, jamais codées en dur dans la prop.

| Icône | Usage |
|-------|-------|
| `Home` | Dashboard |
| `FileText` | Devis |
| `Settings` | Paramètres |
| `Users` | Utilisateurs |
| `BookOpen` | Catalogue |
| `LogOut` | Déconnexion |
| `Menu` | Hamburger mobile |
| `Plus` | Créer |
| `Eye` / `EyeOff` | Visibilité ligne devis / mot de passe |
| `Trash2` | Supprimer |
| `RefreshCw` | Recalculer / chargement |
| `Download` | Export PDF |
| `ArrowLeft` | Retour navigation |
| `AlertCircle` | Avertissement |
| `Check` | Confirmation, succès |
| `ChevronDown` | Select, accordéon |
| `Pencil` | Modifier inline |
| `X` | Fermer modal |
| `Waves` | Option piscine spa |
| `Flame` | Option chauffage |
| `Wind` | Nage contre-courant |
| `Lightbulb` | Option éclairage |
| `Droplet` | Branding hydraulique |

---

## États et feedback

### Empty state

```tsx
<div className="flex flex-col items-center justify-center py-16 text-center">
  <div className="w-16 h-16 rounded-2xl bg-[#161b25] border border-[#1e2a3a] flex items-center justify-center mb-4">
    <FileText size={28} className="text-slate-600" />
  </div>
  <h3 className="text-base font-semibold text-slate-300 mb-1">Aucun devis</h3>
  <p className="text-sm text-slate-500 mb-5 max-w-xs">
    Créez votre premier devis pour commencer.
  </p>
  <Button variant="primary" size="sm">
    <Plus size={15} /> Nouveau devis
  </Button>
</div>
```

### Loading skeleton

```tsx
// Barre squelette animée
<div className="h-4 bg-[#161b25] rounded animate-pulse" />

// Pattern carte skeleton
<div className="rounded-xl bg-[#0d1117] border border-[#1e2a3a] p-5 space-y-3">
  <div className="h-4 w-1/3 bg-[#161b25] rounded animate-pulse" />
  <div className="h-3 w-2/3 bg-[#161b25] rounded animate-pulse" />
  <div className="h-3 w-1/2 bg-[#161b25] rounded animate-pulse" />
</div>
```

### Toast / Notification

```tsx
// Succès
<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-green-900/40 border border-green-500/30 text-green-300 text-sm">
  <Check size={16} className="flex-shrink-0" />
  Devis enregistré avec succès
</div>

// Erreur
<div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-900/40 border border-red-500/30 text-red-300 text-sm">
  <AlertCircle size={16} className="flex-shrink-0" />
  Une erreur est survenue
</div>
```

---

## Règles d'application (DO / DON'T)

### ✅ À faire

- Fond `#07090f` pour l'app entière, `#0d1117` pour les surfaces
- Vert `#22c55e` pour toutes les actions primaires et états actifs
- Bleu `#3b82f6` pour les liens, informations et statut ENVOYÉ
- Jaune/ambre `#f59e0b` **uniquement** pour signaler des overrides et états d'alerte
- `font-mono` pour toutes les valeurs numériques de calcul et références
- Bordures subtiles `border-[#1e2a3a]` systématiquement sur les cartes/inputs
- `rounded-xl` pour les cartes, `rounded-lg` pour les inputs/boutons

### ❌ À éviter

- Fond blanc ou gris clair — **dark mode permanent, aucune exception**
- Utiliser le jaune comme couleur décorative ou de branding
- `border-radius` inférieurs à `rounded-lg` sur les éléments interactifs
- Texte `text-white` pur — préférer `text-slate-100` / `text-slate-200`
- Animations de plus de `300ms` sur des interactions fréquentes
- Ombres colorées autres que le glow vert sur le bouton primary
- Plus de 2 couleurs sémantiques différentes sur le même écran
- Polices génériques (Inter, Roboto, Arial) — utiliser `DM Sans` + `JetBrains Mono`

---

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `frontend/tailwind.config.cjs` | Tokens couleurs, polices, theme HeroUI |
| `frontend/src/index.css` | Variables CSS, `.field-overridden`, reset |
| `frontend/src/main.tsx` | Provider HeroUI, classe `dark` |
| `frontend/src/components/ui/Button.tsx` | Variants boutons |
| `frontend/src/components/ui/Input.tsx` | Input + état overridé |
| `frontend/src/components/ui/Modal.tsx` | Modale standard |
| `frontend/src/components/ui/Card.tsx` | Wrapper carte réutilisable |
| `frontend/src/components/shared/StatusChip.tsx` | Badge statut devis |
| `frontend/src/components/shared/SaveIndicator.tsx` | Indicateur auto-save |
| `frontend/src/components/layout/AppLayout.tsx` | Layout sidebar + main |
| `public/peep-logo.png` | Logo Peep |
| `public/maria-logo.png` | Logo ETS Maria (PDF, footer) |

---

*Design System Peep v2.0 — ETS Maria · Usage interne uniquement*
