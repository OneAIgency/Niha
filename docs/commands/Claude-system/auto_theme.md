# Orchestrator: Auto-Theme

> **Ce face**: Gestionează modificări de design system cu regenerare automată și verificare.
> **Când îl folosești**: Când vrei să schimbi culori, spacing, tipografie sau alte aspecte vizuale.
> **Rezultat**: Design tokens actualizate, fișiere regenerate, documentație actualizată.

---

## Cum Îl Folosești

```bash
@auto_theme.md "Descrierea modificărilor de design"
```

**Exemple:**
```bash
@auto_theme.md "Schimbă culoarea primară din verde în albastru"
@auto_theme.md "Adaugă o paletă de culori pentru avertizări"
@auto_theme.md "Mărește border radius-ul default la 12px"
@auto_theme.md "Adaugă suport pentru o temă high-contrast"
```

---

## Ce Face

```
┌─────────────────────────────────────────────────────────────┐
│                    SECVENȚĂ AUTO-THEME                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FAZA 1: ANALIZĂ                                        │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Citește tokens.ts curent                             │ │
│  │  Identifică ce trebuie schimbat                       │ │
│  │  Verifică impact asupra componentelor                 │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FAZA 2: MODIFICARE                                     │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  07_theme     Actualizează tokens.ts                  │ │
│  │               Regenerează CSS și Tailwind             │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FAZA 3: VERIFICARE                                     │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Verifică că build-ul trece                           │ │
│  │  Listează componente afectate                         │ │
│  │  Actualizează documentația                            │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Instrucțiuni Pentru AI Agent

---

### FAZA 1: ANALIZĂ

#### Pas 1.1: Înțelege Cererea

Parsează ce modificări de design sunt cerute:
- Schimbare culori existente?
- Adăugare culori/tokens noi?
- Modificare spacing/tipografie?
- Adăugare temă nouă?

#### Pas 1.2: Verifică Starea Curentă

1. **Citește `src/theme/tokens.ts`** - Tokens curente
2. **Citește `docs/DESIGN_SYSTEM.md`** - Documentație design
3. **Verifică `app_truth.md` §9** - Standarde UI/UX

#### Pas 1.3: Analiză Impact

**Găsește componente afectate:**
```
Caută în codebase pentru folosiri ale tokenilor ce vor fi modificați:
- className-uri cu tokenii respectivi
- Variabile CSS cu tokenii respectivi
- Referințe directe la tokens.ts
```

**Output:**
- `AFFECTED_FILES` = [listă fișiere]
- `AFFECTED_COMPONENTS` = [listă componente]
- `BREAKING_CHANGES` = true/false

**Dacă `BREAKING_CHANGES = true`:**
```
⚠️ Această modificare va afecta următoarele componente:
  - [Component1.tsx] - folosește [token]
  - [Component2.tsx] - folosește [token]

Continui? (da/nu)
```
**AȘTEAPTĂ confirmare**

---

### FAZA 2: MODIFICARE

**Execută**: `@07_theme.md` cu descrierea modificărilor

**Acțiuni**:
1. Modifică `src/theme/tokens.ts`
2. Rulează scriptul de generare
3. Verifică că fișierele sunt generate corect

**Output**:
- `tokens.ts` actualizat
- `design-tokens.css` regenerat
- `tailwind.theme.js` regenerat

---

### FAZA 3: VERIFICARE

#### Pas 3.1: Verifică Build

```bash
npm run build
# sau
npm run typecheck
```

**Dacă build eșuează:**
```
✗ Build-ul a eșuat după modificările de theme.

Erori:
  [lista erori]

Acțiuni posibile:
  1. Revert modificările
  2. Rezolvă erorile manual
  3. Ajustează tokenii

Ce prefer? (revert/fix/ajustează)
```

#### Pas 3.2: Listează Componente Afectate

```
Componente ce folosesc tokenii modificați:

  Culoare primară:
    - Button.tsx (bg-primary-500)
    - Header.tsx (text-primary-600)
    - Link.tsx (text-primary-500 hover:text-primary-600)

  Spacing modificat:
    - Card.tsx (p-4)
    - Modal.tsx (p-6)

Recomandare: Verifică vizual aceste componente.
```

#### Pas 3.3: Actualizează Documentația

**Actualizează `docs/DESIGN_SYSTEM.md`:**
```markdown
## Changelog Design System

### [Data] - [Descriere modificare]
- Schimbat culoarea primară de la #10b981 la #3b82f6
- Adăugat paletă de culori warning
- ...
```

**Actualizează `app_truth.md` §9 dacă e necesar.**

---

### FINALIZARE

```
═══════════════════════════════════════════════════════════════
                    AUTO-THEME COMPLET
═══════════════════════════════════════════════════════════════

Modificări efectuate:
  ✓ src/theme/tokens.ts
      - [Descriere modificare 1]
      - [Descriere modificare 2]

Fișiere regenerate:
  ✓ src/theme/generated/design-tokens.css
  ✓ src/theme/generated/tailwind.theme.js

Verificări:
  ✓ Build: PASS
  ✓ TypeScript: PASS

Documentație actualizată:
  ✓ docs/DESIGN_SYSTEM.md

Componente afectate (verifică vizual):
  - Button.tsx
  - Header.tsx
  - Card.tsx

Pentru a folosi noii tokeni:
  CSS:      var(--color-[token])
  Tailwind: bg-[token]-500
  TS:       tokens.colors.[token]

═══════════════════════════════════════════════════════════════
```

---

## Tipuri de Modificări Suportate

### 1. Schimbare Culoare Existentă

```bash
@auto_theme.md "Schimbă culoarea primară din verde (#10b981) în albastru (#3b82f6)"
```

**Ce face:**
- Actualizează toate shade-urile din paleta primară
- Regenerează fișierele
- Listează componentele afectate

### 2. Adăugare Paletă Nouă

```bash
@auto_theme.md "Adaugă o paletă de culori 'brand' cu nuanțe de violet"
```

**Ce face:**
- Creează noua paletă cu toate shade-urile (50-900)
- Adaugă variante light/dark dacă e necesar
- Actualizează documentația

### 3. Modificare Spacing

```bash
@auto_theme.md "Adaugă spacing de 18px (4.5) și 28px (7)"
```

**Ce face:**
- Adaugă noile valori în scala de spacing
- Regenerează utilitățile CSS/Tailwind

### 4. Modificare Tipografie

```bash
@auto_theme.md "Schimbă fontul principal în Poppins și adaugă un font pentru headings (Playfair Display)"
```

**Ce face:**
- Actualizează fontFamily în tokens
- Adaugă instrucțiuni pentru import fonturi

### 5. Adăugare Temă

```bash
@auto_theme.md "Adaugă o temă high-contrast pentru accesibilitate"
```

**Ce face:**
- Creează noi variabile pentru tema high-contrast
- Actualizează generatorul CSS
- Documentează cum se activează tema

---

## Flags

```bash
# Preview modificări fără a le aplica
@auto_theme.md --preview "Descriere modificări"

# Forțează modificările fără confirmare
@auto_theme.md --force "Descriere modificări"

# Doar regenerează fișierele (fără modificări tokens)
@auto_theme.md --regenerate

# Verifică consistența temei curente
@auto_theme.md --check
```

---

## Puncte de Intervenție Human

**Se oprește pentru:**

1. **Breaking changes detectate** - Când modificarea afectează multe componente
2. **Build eșuat** - Când modificarea strică ceva
3. **Alegeri de design** - Când sunt multiple opțiuni valide

---

## Exemple Detaliate

### Exemplu 1: Rebranding Complet

```bash
@auto_theme.md "Rebranding complet:
- Culoare primară: de la verde (#10b981) la portocaliu (#f97316)
- Culoare secundară: de la albastru la teal (#14b8a6)
- Border radius: de la rotunjit la mai pătrat (de la 1rem la 0.5rem)
- Font: de la Inter la DM Sans"
```

### Exemplu 2: Dark Mode Improvements

```bash
@auto_theme.md "Îmbunătățește contrastul în dark mode:
- Surface mai închis pentru carduri
- Text secondary mai vizibil
- Borduri mai subtile"
```

### Exemplu 3: Adăugare Semantic Colors

```bash
@auto_theme.md "Adaugă culori semantice pentru trading:
- bid (verde pentru cumpărare)
- ask (roșu pentru vânzare)
- neutral (gri pentru pending)"
```

---

## Output

- `tokens.ts` actualizat
- Fișiere CSS/Tailwind regenerate
- Documentație actualizată
- Lista componente de verificat vizual
