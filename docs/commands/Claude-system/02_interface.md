# Agent 02: Interface & UI Specification

> **Ce face**: Creează specificații detaliate pentru componentele UI ale unei feature.
> **Când îl folosești**: Când un plan indică "Are UI = Da".
> **Rezultat**: `docs/features/NNNN_UI_SPEC.md`

---

## Cum Îl Folosești

```bash
@02_interface.md @docs/features/NNNN_PLAN.md
```

**Exemplu:**
```bash
@02_interface.md @docs/features/0014_PLAN.md
```

---

## Cerințe Prealabile

- Plan există (`docs/features/NNNN_PLAN.md`)
- `app_truth.md` există cu §9 standarde UI/UX
- Sistem de design tokens setat (sau va fi creat)

---

## Ce Face Acest Agent (Pentru AI)

### Pas 1: Revizuiește Contextul

1. **Citește planul** - Înțelege ce UI e necesar
2. **Verifică `app_truth.md` §9** - Standarde UI/UX
3. **Verifică `docs/DESIGN_SYSTEM.md`** - Dacă există, revizuiește pattern-urile
4. **Verifică `src/theme/tokens.ts`** - Design tokens disponibile

### Pas 2: Identifică Componentele UI

Din plan, listează:

1. **Pagini** - Pagini/rute noi necesare
2. **Componente** - Componente reutilizabile
3. **Layout-uri** - Modificări de layout
4. **Modale/Dialogs** - Componente overlay
5. **Formulare** - Formulare de input
6. **Display Date** - Tabele, liste, carduri

### Pas 3: Verifică Componente Existente

Înainte să designezi componente noi:

1. **Caută componente similare** în codebase
2. **Verifică component library** (`src/components/common/` sau similar)
3. **Notează pattern-uri reutilizabile** - Nu reinventa

### Pas 4: Creează Specificația UI

Scrie în `docs/features/NNNN_UI_SPEC.md`:

```markdown
# Specificație UI: [Nume Feature]

> **Plan**: NNNN_PLAN.md
> **Creat**: [Data]

---

## Overview

[Descriere scurtă a UI-ului care se creează]

---

## Conformitate Design System

### Tokens Folosite

| Categorie | Token | Valoare | Utilizare |
|-----------|-------|---------|-----------|
| Culoare | `primary-500` | #10b981 | Butoane acțiuni principale |
| Culoare | `surface` | var(--bg-surface) | Background carduri |
| Spacing | `space-4` | 1rem | Padding componente |
| Radius | `radius-xl` | 1rem | Colțuri butoane |

### Tokens Noi Necesare

[Dacă sunt - acestea trebuie adăugate în tokens.ts mai întâi]

| Token | Valoare | Scop |
|-------|---------|------|
| `color-new` | #xxx | [De ce e necesar] |

---

## Pagini

### [Nume Pagină]

**Rută**: `/path/to/page`

**Layout**:
```
┌─────────────────────────────────────────────────┐
│ Header                                          │
├─────────────────────────────────────────────────┤
│ ┌─────────┐ ┌─────────────────────────────────┐ │
│ │ Sidebar │ │ Main Content                    │ │
│ │         │ │                                 │ │
│ │         │ │ ┌─────────────────────────────┐ │ │
│ │         │ │ │ Component A                 │ │ │
│ │         │ │ └─────────────────────────────┘ │ │
│ │         │ │                                 │ │
│ │         │ │ ┌─────────────────────────────┐ │ │
│ │         │ │ │ Component B                 │ │ │
│ │         │ │ └─────────────────────────────┘ │ │
│ └─────────┘ └─────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Comportament**:
- [Interacțiune 1]
- [Interacțiune 2]

**Stări**:
- Loading: [Descriere - skeleton/spinner]
- Empty: [Descriere - mesaj și CTA]
- Error: [Descriere - mesaj eroare]
- Success: [Descriere - starea normală]

---

## Componente

### [Nume Component]

**Scop**: [Ce face]

**Locație**: `src/components/[path]/[ComponentName].tsx`

**Props**:
```typescript
interface [ComponentName]Props {
  // Props obligatorii
  requiredProp: string;

  // Props opționale
  optionalProp?: number;

  // Callbacks
  onAction: () => void;
  onChange?: (value: string) => void;
}
```

**Variante**:
- **Default**: [Descriere și când se folosește]
- **Active**: [Descriere]
- **Disabled**: [Descriere]
- **Loading**: [Descriere]

**Comportament Responsiv**:
- Mobile (< 640px): [Comportament]
- Tablet (640-1024px): [Comportament]
- Desktop (> 1024px): [Comportament]

**Accesibilitate**:
- Role: [ARIA role]
- Keyboard: [Interacțiuni tastatura]
- Screen reader: [Ce se anunță]

**Exemplu Utilizare**:
```tsx
<[ComponentName]
  requiredProp="value"
  optionalProp={42}
  onAction={() => handleAction()}
/>
```

---

## Formulare

### [Nume Formular]

**Câmpuri**:

| Câmp | Tip | Validare | Obligatoriu |
|------|-----|----------|-------------|
| email | email | Format email valid | Da |
| amount | number | > 0, max 2 zecimale | Da |
| description | textarea | Max 500 caractere | Nu |

**Submit**:
- Endpoint: `POST /api/v1/...`
- Success: [Ce se întâmplă - redirect/toast/close]
- Error: [Cum se afișează erorile]

**Stări Formular**:
- Initial: Formular gol
- Validating: Validare inline la blur
- Submitting: Button disabled, loading spinner
- Success: Mesaj succes, acțiune (redirect/close)
- Error: Mesaj eroare, formular editabil

---

## Modale/Dialogs

### [Nume Modal]

**Trigger**: [Ce deschide modalul]

**Dimensiune**: sm / md / lg / xl / full

**Conținut**:
- Header: [Titlu]
- Body: [Ce conține]
- Footer: [Butoane]

**Acțiuni**:
- Primary: [Label buton] → [Acțiune]
- Secondary: [Label buton] → [Acțiune]
- Close: Click outside, X button, Escape key

**Layout**:
```
┌─────────────────────────────────┐
│ ✕  Titlu Modal                  │
├─────────────────────────────────┤
│                                 │
│  [Conținut modal]               │
│                                 │
├─────────────────────────────────┤
│           [Cancel] [Confirm]    │
└─────────────────────────────────┘
```

---

## Afișare Date

### [Nume Tabel/Listă]

**Coloane/Câmpuri**:

| Coloană | Sursă | Format | Sortabil |
|---------|-------|--------|----------|
| Nume | `data.name` | Text | Da |
| Sumă | `data.amount` | Currency (€) | Da |
| Data | `data.created_at` | Relative time | Da |

**Interacțiuni**:
- Click row: [Acțiune]
- Hover: [Schimbare vizuală]
- Actions: [Butoane pe row]

**Empty State**:
- Mesaj: "[Mesaj când nu sunt date]"
- Acțiune: [CTA opțional]

**Paginare**: [Da/Nu - dacă da, câte per pagină]

---

## Animații

### Tranziții

| Element | Trigger | Animație | Durată |
|---------|---------|----------|--------|
| Modal | Open | Fade + scale | 200ms |
| Card | Hover | Elevation | 150ms |
| Button | Click | Scale down | 100ms |
| Toast | Show/Hide | Slide + fade | 300ms |

---

## Suport Teme

Toate componentele trebuie să suporte:
- [x] Light mode
- [x] Dark mode

Mapare culori:
| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `--color-surface` | `--color-surface` |
| Text | `--color-text-primary` | `--color-text-primary` |
| Border | `--color-border` | `--color-border` |

---

## Note Implementare

### Componente Existente de Folosit
- `Button` din `src/components/common/Button`
- `Card` din `src/components/common/Card`
- `Input` din `src/components/common/Input`
- [Altele...]

### Componente Noi de Creat
1. `[ComponentA]` - [Scop scurt]
2. `[ComponentB]` - [Scop scurt]

### Abordare Stilizare
- Folosește clase Tailwind utility
- Folosește design tokens prin variabile CSS
- FĂRĂ culori sau spacing hardcodate

---

## Checklist Înainte de Implementare

- [ ] Toate componentele folosesc design tokens
- [ ] Dark mode considerat pentru toate elementele
- [ ] Breakpoint-uri responsive definite
- [ ] Cerințe accesibilitate notate
- [ ] Stări loading/empty/error definite
- [ ] Animații specificate
```

### Pas 5: Verifică Nevoia de Tokens Noi

Dacă sunt necesare tokens noi:

```
⚠️ Tokens noi necesare:

Următoarele tokens trebuie adăugate înainte de implementare:
- --color-[name]: [value]
- --space-[name]: [value]

Rulează @07_theme.md pentru a adăuga aceste tokens mai întâi.
```

### Pas 6: Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                   SPECIFICAȚIE UI COMPLETĂ
═══════════════════════════════════════════════════════════════

Feature: [Nume Feature]
UI Spec: docs/features/NNNN_UI_SPEC.md

Componente:
  Pagini: N
  Componente: M
  Modale: K
  Formulare: L

Tokens noi necesare: [Da/Nu]
Componente existente reutilizate: [Lista]

Următorul pas:
  → @07_theme.md (dacă sunt tokens noi)
  → @03_implement.md (dacă nu sunt tokens noi)

═══════════════════════════════════════════════════════════════
```

---

## Reguli

1. **Folosește design tokens** - Niciodată culori/spacing hardcodate în spec
2. **Reutilizează componente existente** - Verifică înainte să creezi noi
3. **Consideră toate stările** - Loading, empty, error, success
4. **Accesibilitate obligatorie** - ARIA, keyboard, screen readers
5. **Responsive obligatoriu** - Mobile, tablet, desktop
6. **Ambele teme** - Light și dark mode support

---

## Output

| Fișier | Scop |
|--------|------|
| `docs/features/NNNN_UI_SPEC.md` | Specificație UI/UX |

---

## Următorul Agent

→ `@07_theme.md` - Dacă sunt tokens noi necesare
→ `@03_implement.md` - Dacă e gata pentru implementare
