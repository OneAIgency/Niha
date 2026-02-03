# Tema grafică – hub central

**Toate caracteristicile temei grafice sunt tratate din acest loc.** Acest README este punctul unic de intrare: unde este definită fiecare parte a temei și cum o modifici.

---

## 1. Unde este definită tema

| Ce modifici | Fișier | Rol |
|--------------|--------|-----|
| **Variabile CSS** (culori, spațieri, raze, umbre, tipografie, z-index, subheader, onboarding) | `src/styles/design-tokens.css` | Sursa canonică pentru `var(--...)`. Folosit de componente, override-uri și clase din `index.css`. |
| **Paletă Tailwind** (navy, emerald, primary) + fonturi, animații, keyframes, backgroundImage | `tailwind.config.js` | Sursa pentru clase utilitare (`bg-navy-800`, `text-emerald-500`, etc.). Păstrează paleta aliniată cu valorile din `design-tokens.css` (vezi comentariile din config). |
| **Clase de componentă** (content_wrapper_last, page-container, butoane, tabele, badge-uri, etc.) | `src/index.css` | `@layer components`: folosesc atât variabile CSS cât și clase Tailwind. Importă `design-tokens.css` la început. |
| **Mod light/dark** + override-uri pentru tokeni | `src/stores/useStore.ts` | `useUIStore`: `theme`, `setTheme`, `toggleTheme`. `useThemeTokenStore`: override-uri persistente pentru variabile CSS. |
| **Aplicarea override-urilor** | `src/components/theme/ThemeTokenOverridesStyle.tsx` | Injectează override-urile din store ca proprietăți CSS pe `:root`. |
| **Lista de tokeni** (nume variabile, grupuri pentru UI override) | `src/theme/tokens.ts` | Exportă chei de variabile CSS; folosit de Theme Containers și pentru consistență. |
| **Documentație design** | `frontend/docs/DESIGN_SYSTEM.md` | Ghid complet; secțiunea „Page Section Headers” și altele se bazează pe tokenii de aici. |
| **Showcase temă** | `/theme` (ThemeLayout), `/theme/sample`, `/theme/containers` | Previzualizare și editare tokeni în UI. |

---

## 2. Cum modifici tema eficient

### Schimbare culoare / spațiere / rază folosită peste tot (token)

1. Deschide **`src/styles/design-tokens.css`**.
2. Modifică variabila în `:root` (și în `.dark` dacă e cazul).
3. Dacă folosești și clasa Tailwind echivalentă (ex. `bg-navy-800`), actualizează **`tailwind.config.js`** la aceeași valoare (paleta `navy`, `emerald`, etc.), ca să rămână în sync.

### Schimbare doar în Tailwind (utilitare)

- Modifici **`tailwind.config.js`** (theme.extend.colors, fontFamily, animation, etc.). Nu e nevoie să atingi `design-tokens.css` decât dacă vrei și variabile CSS pentru acel lucru.

### Override-uri din UI (Theme / Containers)

- Pagina **Theme → Containers** folosește `useThemeTokenStore` și **`src/theme/tokens.ts`** (`THEME_ELEMENT_CONFIG`). Variabilele override sunt cele din `design-tokens.css`; valorile sunt persistate și aplicate prin `ThemeTokenOverridesStyle`.

### Documentare

- Orice token nou important: adaugă-l în `design-tokens.css`, eventual în `tokens.ts` dacă intră la override, și actualizează **`frontend/docs/DESIGN_SYSTEM.md`** unde e cazul.

---

## 3. Fluxul temei

```
design-tokens.css (:root + .dark)
       │
       ├── index.css @import + @layer components (clase care folosesc var(...) și Tailwind)
       ├── Componente (className cu Tailwind + unele var(...))
       ├── ThemeTokenOverridesStyle (override-uri din store pe :root)
       └── tailwind.config.js (paletă aliniată pentru bg-*, text-*, etc.)

useUIStore (theme: light | dark) → class "dark" pe <html>
useThemeTokenStore (overrides) → ThemeTokenOverridesStyle
```

---

## 4. Reguli

- **Un singur loc pentru valorile tokenilor:** `design-tokens.css` pentru variabile CSS; `tailwind.config.js` pentru utilități Tailwind – păstrează-le aliniate.
- **Fără culori / spațieri hardcodate** în componente: folosește tokeni (variabile sau clase Tailwind din theme).
- **Pentru orice întrebare „unde schimb X?”** → acest README și apoi fișierul indicat în tabelul de mai sus.
