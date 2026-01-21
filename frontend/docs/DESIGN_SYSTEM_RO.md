# Sistem de Design Niha Carbon Platform

## 📋 Sumar

Am creat un sistem complet de design standardizat pentru aplicația Niha Carbon Platform care include:

1. **Design Tokens** - Variabile CSS pentru toate elementele vizuale
2. **Pagină Showcase** - Prezentare interactivă a întregului sistem
3. **Documentație Completă** - Ghid detaliat pentru dezvoltatori și designeri

---

## 🎨 Ce Am Creat

### 1. Design Tokens (`src/styles/design-tokens.css`)

Un fișier complet de variabile CSS care standardizează:

#### 🎨 Culori
- **Culori de fundal** (background, surface, elevated, muted)
- **Culori text** (primary, secondary, muted, inverse)
- **Brand Emerald** (primary, hover, active, light)
- **Certificate**
  - EUA (albastru) - European Union Allowances
  - CEA (amber/galben) - China Emissions Allowances
- **Trading**
  - Bid/Buy (verde) - Ordine de cumpărare
  - Ask/Sell (roșu) - Ordine de vânzare
- **Status** (success, warning, error, info)

#### ✍️ Tipografie
- **Familii de fonturi**: Inter (sans-serif), JetBrains Mono (monospace)
- **Dimensiuni**: xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl
- **Greutăți**: normal (400), medium (500), semibold (600), bold (700), extrabold (800)
- **Line heights**: none, tight, snug, normal, relaxed, loose

#### 📏 Spațiere
Sistem bazat pe unitatea de 4px:
- space-0: 0px
- space-1: 4px
- space-2: 8px
- space-3: 12px
- space-4: 16px (unitatea de bază)
- space-5: 20px
- space-6: 24px
- space-8: 32px
- space-10: 40px
- space-12: 48px
- space-16: 64px
- space-20: 80px
- space-24: 96px

#### 🔄 Border Radius
- radius-sm: 6px
- radius-md: 8px
- radius-lg: 12px
- radius-xl: 16px (principal pentru butoane/input-uri)
- radius-2xl: 24px (carduri, modale)
- radius-3xl: 32px
- radius-full: 9999px (circular - badge-uri, pills)

#### 🌑 Umbre (Shadows)
- shadow-xs, sm, md, lg, xl, 2xl (diferite intensități)
- **Glow effects** speciale pentru:
  - Emerald (verde)
  - Blue (albastru)
  - Amber (galben)

#### ⏱️ Tranziții și Animații
- Durate: fast (100ms), normal (200ms), slow (300ms), slower (500ms)
- Easing functions: ease-in, ease-out, ease-in-out

### 2. Pagina Showcase (`src/pages/DesignSystemPage.tsx`)

O pagină interactivă care prezintă **TOT** sistemul de design:

#### 📱 Structură Split-Screen
- **Partea stângă**: Modul Light (tema luminoasă)
- **Partea dreaptă**: Modul Dark (tema întunecată)
- Comparație vizuală side-by-side în timp real!

#### 🎯 Secțiuni Interactive

1. **Colors** - Toate paletele de culori cu swatches vizuale
2. **Typography** - Familii de fonturi, dimensiuni, greutăți cu exemple live
3. **Spacing** - Reprezentare vizuală a scalei de spațiere
4. **Border Radius** - Exemple de toate radiusurile
5. **Shadows** - Toate variantele de umbre inclusiv glow effects
6. **Buttons** - Toate variantele (primary, secondary, outline, ghost) în toate dimensiunile
7. **Inputs** - Text inputs cu iconițe, stări de eroare, stări disabled
8. **Badges** - Toate variantele (status, certificate, trading, count)
9. **Cards** - Carduri default, glass effect, hover variants
10. **Tables** - Exemple de tabele cu toate pattern-urile
11. **Trading UI** - Culori bid/ask, stiluri order book, afișare prețuri
12. **Icons** - Iconițele Lucide React folosite în aplicație
13. **Animations** - Exemple de toate pattern-urile de animație

#### 🎨 Navigare Ușoară
- Sidebar cu navigare între secțiuni
- Fiecare secțiune are header clar
- Code snippets pentru copy-paste
- Butoane interactive (hover states, click handlers)

### 3. Documentație Completă (`docs/DESIGN_SYSTEM.md`)

Ghid exhaustiv de **20+ pagini** care include:

- **Overview** - Prezentare generală și principii de design
- **Design Principles** - Profesional, trustworthy, data-dense, accessible
- **Color System** - Toate culorile cu cod CSS și exemple de utilizare
- **Typography** - Scale complet cu exemple
- **Spacing System** - Sistem bazat pe 4px cu pattern-uri comune
- **Border Radius** - Toate radiusurile și când să le folosești
- **Shadow System** - Toate umbrele inclusiv glow effects
- **Component Library** - Exemple detaliate pentru fiecare component
- **Trading UI Patterns** - Pattern-uri specifice pentru trading
- **Animation Guidelines** - Ghid pentru animații CSS și Framer Motion
- **Implementation Guide** - Cum să folosești design tokens
- **Best Practices** - Do's and Don'ts cu exemple

---

## 🚀 Cum Să Folosești

### Accesează Pagina Showcase

1. **Pornește aplicația**:
```bash
cd frontend
npm run dev
```

2. **Deschide în browser**:
```
http://localhost:5173/design-system
```

3. **Explorează**:
   - Click pe secțiunile din sidebar
   - Compară light/dark mode side-by-side
   - Hover peste elemente pentru efecte interactive
   - Copy code snippets pentru a le folosi în componente

### Folosește Design Tokens în Cod

#### Metodă 1: CSS Variables
```tsx
<div style={{
  backgroundColor: 'var(--color-surface)',
  padding: 'var(--space-6)',
  borderRadius: 'var(--radius-2xl)',
  boxShadow: 'var(--shadow-lg)'
}}>
  Content
</div>
```

#### Metodă 2: Tailwind Classes
```tsx
<div className="bg-white dark:bg-navy-800 p-6 rounded-2xl shadow-lg">
  Content
</div>
```

#### Metodă 3: Utility Classes Predefinite
```tsx
<div className="bg-surface p-6 rounded-2xl shadow-lg">
  <p className="text-primary">Text principal</p>
  <p className="text-secondary">Text secundar</p>
  <p className="text-muted">Text estompat</p>
</div>
```

### Exemple de Componente

#### Buton Primary
```tsx
<button className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:from-emerald-600 hover:to-emerald-700 hover:shadow-xl">
  Acțiune Primară
</button>
```

#### Card
```tsx
<div className="rounded-2xl border border-navy-200 dark:border-navy-700 bg-white dark:bg-navy-800 p-6 shadow-lg transition-all hover:shadow-xl">
  <h3 className="text-lg font-bold text-navy-900 dark:text-white">
    Titlu Card
  </h3>
  <p className="mt-2 text-sm text-navy-600 dark:text-navy-400">
    Conținut card
  </p>
</div>
```

#### Badge Status
```tsx
<span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
  <Check className="h-3 w-3" />
  Success
</span>
```

#### Input cu Icon
```tsx
<div className="relative">
  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy-400" />
  <input
    type="text"
    placeholder="Caută..."
    className="w-full rounded-xl border-2 border-navy-200 dark:border-navy-600 bg-white dark:bg-navy-800 py-3 pl-12 pr-4 text-navy-900 dark:text-white placeholder-navy-400 transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-emerald-500"
  />
</div>
```

---

## 🎯 Principii de Design

### 1. Profesional și De Încredere
Trading-ul cu credite de carbon necesită o interfață profesională. Folosim layout-uri curate, tipografie clară și spațiere consistentă.

### 2. Dense cu Date, Dar Lizibile
Interfețele de trading trebuie să afișeze multe informații fără să copleșească utilizatorul. Folosim ierarhie, culoare și spațiere pentru claritate.

### 3. Color-Coded Trading
- **Verde (Emerald)** - Ordine de cumpărare (BID), mișcări pozitive
- **Roșu** - Ordine de vânzare (ASK), mișcări negative
- **Albastru (EUA)** - Certificate EU Allowance
- **Amber (CEA)** - Certificate China Emissions Allowance

### 4. Accessibility First
- Contrast suficient de culoare (WCAG AA minimum)
- Focus states clare pe toate elementele interactive
- Structură HTML semantică
- Suport pentru navigare cu tastatura

### 5. Optimizat pentru Performanță
- Animații CSS unde este posibil
- Framer Motion pentru interacțiuni complexe
- Rendering optimizat al componentelor
- Bundle size minim

---

## 📚 Resurse

### Fișiere Cheie
- **Design Tokens**: `frontend/src/styles/design-tokens.css`
- **Showcase Page**: `frontend/src/pages/DesignSystemPage.tsx`
- **Documentație EN**: `frontend/docs/DESIGN_SYSTEM.md`
- **Documentație RO**: `frontend/docs/DESIGN_SYSTEM_RO.md` (acest fișier)

### Links Utile
- **Live Showcase**: http://localhost:5173/design-system
- **Lucide Icons**: https://lucide.dev
- **Framer Motion**: https://www.framer.com/motion/
- **Tailwind CSS**: https://tailwindcss.com

---

## 🔥 Highlights

### ✨ Caracteristici Unice

1. **Split-Screen Comparison** - Vezi light și dark mode simultan, side-by-side
2. **Interactive Components** - Hover states, transitions, animații live
3. **Copy-Ready Code** - Snippets gata de copy-paste
4. **Comprehensive Coverage** - FIECARE token, FIECARE component, FIECARE pattern
5. **Trading-Specific** - Pattern-uri specializate pentru order book, price displays, trading badges

### 🎨 Cele Mai Importante Culori

```css
/* Brand Primary - Emerald */
--color-primary: #10b981 (light) / #34d399 (dark)

/* Trading Colors */
--color-bid: #10b981 (verde pentru BUY)
--color-ask: #ef4444 (roșu pentru SELL)

/* Certificate Colors */
--color-eua: #3b82f6 (albastru pentru EUA)
--color-cea: #f59e0b (amber pentru CEA)

/* Status Colors */
--color-success: #10b981
--color-warning: #f59e0b
--color-error: #ef4444
--color-info: #3b82f6
```

### 📏 Spațiere Comună

```css
/* Cards */
p-4  /* Small padding - 16px */
p-6  /* Medium padding - 24px */
p-8  /* Large padding - 32px */

/* Gaps */
gap-2  /* 8px */
gap-4  /* 16px - Most common */
gap-6  /* 24px */

/* Sections */
py-8    /* 32px vertical */
py-10   /* 40px vertical */
```

---

## 🚨 Best Practices

### ✅ DO (Recomandări)

1. **Folosește Design Tokens**
```tsx
// ✅ BINE
<div style={{ padding: 'var(--space-6)' }}>

// ❌ RĂU
<div style={{ padding: '23px' }}>
```

2. **Menține Consistența**
```tsx
// ✅ BINE - Toate butoanele folosesc același border radius
<button className="rounded-xl">Button 1</button>
<button className="rounded-xl">Button 2</button>

// ❌ RĂU - Radiusuri inconsistente
<button className="rounded-lg">Button 1</button>
<button className="rounded-2xl">Button 2</button>
```

3. **Dark Mode Support**
```tsx
// ✅ BINE - Suportă ambele teme
<div className="bg-white dark:bg-navy-800 text-navy-900 dark:text-white">

// ❌ RĂU - Doar light mode
<div className="bg-white text-black">
```

4. **Semantic HTML**
```tsx
// ✅ BINE
<button onClick={handleClick}>Click</button>

// ❌ RĂU
<div onClick={handleClick}>Click</div>
```

### 🎨 Pattern-uri de Culoare pentru Trading

```tsx
// Bid Row (Cumpărare)
<div className="rounded-lg p-3 hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
  <span className="text-emerald-600 dark:text-emerald-400">€99.50</span>
</div>

// Ask Row (Vânzare)
<div className="rounded-lg p-3 hover:bg-red-50 dark:hover:bg-red-500/10">
  <span className="text-red-600 dark:text-red-400">€99.55</span>
</div>

// Spread Indicator
<div className="border-t border-b border-navy-200 dark:border-navy-700 py-3">
  <span className="text-xs text-navy-600 dark:text-navy-400">Spread:</span>
  <span className="font-mono font-bold text-navy-900 dark:text-white">€0.10</span>
</div>
```

---

## 🎓 Tutorial Rapid

### Pas 1: Pornește Aplicația
```bash
cd /Users/victorsafta/work/Niha/frontend
npm run dev
```

### Pas 2: Accesează Design System
Deschide browser: http://localhost:5173/design-system

### Pas 3: Explorează
- Click "Colors" în sidebar → Vezi toate culorile
- Click "Typography" → Vezi toate fonturile
- Click "Buttons" → Vezi toate variantele de butoane
- Click "Trading UI" → Vezi pattern-uri specifice trading

### Pas 4: Copy Code
- Găsește componenta dorită
- Copy codul din showcase
- Paste în componenta ta
- Ajustează după nevoie

### Pas 5: Consultă Documentația
Deschide `frontend/docs/DESIGN_SYSTEM.md` pentru ghid complet cu toate detaliile.

---

## 📝 Changelog

### v1.0.0 (2026-01-22)
- ✅ Design tokens complet (culori, tipografie, spațiere, umbre)
- ✅ Pagină showcase interactivă cu split-screen light/dark
- ✅ 13 secțiuni comprehensive (colors, typography, spacing, etc.)
- ✅ Documentație detaliată în engleză și română
- ✅ Pattern-uri specifice pentru trading UI
- ✅ Exemple de cod ready-to-use
- ✅ Best practices și guidelines

---

## 🤝 Întrebări?

Dacă ai întrebări sau feedback despre design system:
1. Consultă documentația: `docs/DESIGN_SYSTEM.md`
2. Explorează showcase-ul live: http://localhost:5173/design-system
3. Caută exemple în cod: `src/components/common/`

---

**Creat cu ❤️ pentru Niha Carbon Platform**
