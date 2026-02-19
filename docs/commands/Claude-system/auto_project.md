# Orchestrator: Auto-Project

> **Ce face**: Pornește un proiect nou de la zero și implementează prima funcționalitate automat.
> **Când îl folosești**: Când începi o aplicație complet nouă.
> **Rezultat**: Proiect complet setat cu prima feature funcțională.

---

## Cum Îl Folosești

```bash
@auto_project.md "Descriere completă a aplicației tale"
```

**Exemplu:**
```bash
@auto_project.md "O aplicație de management al task-urilor cu proiecte, task-uri, deadlines și colaborare în echipă. Utilizatorii pot crea proiecte, adăuga task-uri cu priorități, asigna la membri echipei și urmări progresul. Necesită autentificare și update-uri în timp real. Stack: React + FastAPI + PostgreSQL."
```

---

## Ce Face

```
┌─────────────────────────────────────────────────────────────┐
│                    SECVENȚĂ AUTO-PROJECT                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FAZA 1: SETUP PROIECT                                  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  00_brief     Creează brief produs & app_truth.md     │ │
│  │      ↓                                                 │ │
│  │  07_theme     Setează sistem design tokens            │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FAZA 2: PRIMA FEATURE                                  │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  01_plan      Planifică feature core                  │ │
│  │      ↓                                                 │ │
│  │  02_interface Creează specificație UI (dacă e nevoie) │ │
│  │      ↓                                                 │ │
│  │  03_implement Construiește feature                    │ │
│  │      ↓                                                 │ │
│  │  04_review    Code review                             │ │
│  │      ↓                                                 │ │
│  │  05_fix       Rezolvă probleme (loop până e curat)    │ │
│  │      ↓                                                 │ │
│  │  06_docs      Documentează totul                      │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│                    PROIECT GATA                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Instrucțiuni Pentru AI Agent

Execută pașii următori **în ordine**, **fără a te opri** pentru input utilizator decât dacă e explicit necesar.

---

## FAZA 1: SETUP PROIECT

### Pas 1.1: Creează Brief Proiect

**Execută**: `@00_brief.md` cu descrierea utilizatorului

**Acțiuni**:
1. Parsează descrierea aplicației
2. Întreabă până la 5 întrebări clarificatoare dacă e nevoie (PAUZĂ pentru răspunsuri)
3. Determină stack tehnologic
4. Creează `docs/PRODUCT_BRIEF.md`
5. Creează `app_truth.md`
6. Creează structura de directoare

**Variabile output**:
- `PROJECT_NAME` = extras din brief
- `HAS_FRONTEND` = true/false
- `HAS_BACKEND` = true/false
- `TECH_STACK` = { frontend, backend, database }

**Continuă imediat la Pas 1.2**

---

### Pas 1.2: Setează Design System (dacă frontend)

**Condiție**: Doar dacă `HAS_FRONTEND = true`

**Execută**: `@07_theme.md "Setează design tokens inițiale pentru [PROJECT_NAME]"`

**Acțiuni**:
1. Creează `src/theme/tokens.ts` cu structură completă tokens
2. Creează `src/theme/scripts/generate.ts`
3. Generează fișiere CSS și Tailwind inițiale
4. Creează template `docs/DESIGN_SYSTEM.md`

**Continuă imediat la Faza 2**

---

## FAZA 2: PRIMA FEATURE

### Pas 2.1: Identifică Feature Core

Din product brief, identifică **cea mai esențială funcționalitate** de implementat prima.

**Ordine prioritate**:
1. Autentificare (dacă e menționată)
2. CRUD model de date principal (entitatea principală)
3. Workflow primar utilizator

**Setează**: `FIRST_FEATURE` = "[Descriere feature]"

---

### Pas 2.2: Planifică Feature

**Execută**: `@01_plan.md "[FIRST_FEATURE]"`

**Acțiuni**:
1. Creează plan tehnic
2. Identifică dacă feature are UI
3. Scrie `docs/features/0001_PLAN.md`

**Variabile output**:
- `PLAN_FILE` = `docs/features/0001_PLAN.md`
- `FEATURE_HAS_UI` = true/false

**Continuă imediat la Pas 2.3**

---

### Pas 2.3: Creează Specificație UI (dacă e nevoie)

**Condiție**: Doar dacă `FEATURE_HAS_UI = true`

**Execută**: `@02_interface.md @docs/features/0001_PLAN.md`

**Acțiuni**:
1. Creează specificație UI
2. Identifică design tokens necesare
3. Scrie `docs/features/0001_UI_SPEC.md`

**Variabile output**:
- `UI_SPEC_FILE` = `docs/features/0001_UI_SPEC.md`
- `NEW_TOKENS_NEEDED` = true/false

**Dacă `NEW_TOKENS_NEEDED = true`**:
- Execută `@07_theme.md` pentru a adăuga tokens necesare
- Apoi continuă

**Continuă imediat la Pas 2.4**

---

### Pas 2.4: Implementează Feature

**Execută**: `@03_implement.md @docs/features/0001_PLAN.md`

(Include și UI spec dacă există)

**Acțiuni**:
1. Implementează tipuri/interfaces
2. Implementează database layer (dacă e cazul)
3. Implementează backend/API (dacă e cazul)
4. Implementează frontend (dacă e cazul)
5. Auto-verifică implementarea

**Continuă imediat la Pas 2.5**

---

### Pas 2.5: Code Review

**Execută**: `@04_review.md @docs/features/0001_PLAN.md`

**Acțiuni**:
1. Revizuiește tot codul contra planului
2. Verifică conformitate `app_truth.md`
3. Verifică conformitate UI (dacă e cazul)
4. Scrie `docs/features/0001_REVIEW.md`

**Variabile output**:
- `REVIEW_FILE` = `docs/features/0001_REVIEW.md`
- `CRITICAL_ISSUES` = count
- `MAJOR_ISSUES` = count
- `MINOR_ISSUES` = count
- `TOTAL_ISSUES` = sum

**Decizie**:
- Dacă `TOTAL_ISSUES > 0`: Continuă la Pas 2.6
- Dacă `TOTAL_ISSUES = 0`: Sari la Pas 2.7

---

### Pas 2.6: Rezolvă Probleme (Loop)

**Execută**: `@05_fix.md @docs/features/0001_REVIEW.md`

**Acțiuni**:
1. Rezolvă toate problemele Critical
2. Rezolvă toate problemele Major
3. Rezolvă toate problemele Minor
4. Verifică fix-urile

**După fix, re-rulează review**:
- Execută `@04_review.md` din nou (mod re-review)
- Actualizează contoarele de probleme

**Logică loop**:
```
FIX_CYCLE = 1

CÂT TIMP TOTAL_ISSUES > 0 ȘI FIX_CYCLE <= 3:
    Execută @05_fix.md
    Execută @04_review.md (re-review)
    FIX_CYCLE += 1

DACĂ FIX_CYCLE > 3 ȘI TOTAL_ISSUES > 0:
    PAUZĂ - Raportează humanului:
    "După 3 cicluri de fix, X probleme rămân. Review human necesar."
```

**Continuă la Pas 2.7 când TOTAL_ISSUES = 0**

---

### Pas 2.7: Scrie Documentație

**Execută**: `@06_docs.md @docs/features/0001_PLAN.md @docs/features/0001_REVIEW.md`

**Acțiuni**:
1. Actualizează `app_truth.md` cu detalii feature
2. Actualizează `docs/DESIGN_SYSTEM.md` (dacă UI)
3. Adaugă comentarii cod unde e nevoie
4. Actualizează README dacă e user-facing

---

## FINALIZARE

**Afișează sumar final**:

```
═══════════════════════════════════════════════════════════════
                    AUTO-PROJECT COMPLET
═══════════════════════════════════════════════════════════════

Proiect: [PROJECT_NAME]
Stack: [TECH_STACK]

Fișiere proiect create:
  ✓ app_truth.md (Sursă Unică de Adevăr)
  ✓ docs/PRODUCT_BRIEF.md
  ✓ docs/DESIGN_SYSTEM.md
  ✓ src/theme/ (Sistem design tokens)

Prima feature implementată:
  ✓ Feature: [FIRST_FEATURE]
  ✓ Plan: docs/features/0001_PLAN.md
  ✓ UI Spec: docs/features/0001_UI_SPEC.md (dacă e cazul)
  ✓ Review: docs/features/0001_REVIEW.md
  ✓ Cicluri review: [FIX_CYCLE]
  ✓ Total probleme rezolvate: [count]

Fișiere implementare:
  ✓ [Lista toate fișierele create/modificate]

Pentru a porni development server:
  [Comenzi bazate pe stack]

Pentru a adăuga mai multe features:
  @auto_feature.md "Descriere feature"

═══════════════════════════════════════════════════════════════
```

---

## Puncte de Intervenție Human

Orchestratorul se **oprește** doar pentru:

1. **Întrebări clarificatoare** (Pas 1.1) - Dacă descrierea e ambiguă
2. **Alegere tehnologie** (Pas 1.1) - Dacă există multiple opțiuni valide
3. **După 3 cicluri fix** (Pas 2.6) - Dacă problemele persistă
4. **Decizii securitate** - Dacă pattern-uri auth necesită aprobare humană

---

## Flags

```bash
# Sari setup frontend/tema
@auto_project.md --backend-only "Descriere proiect doar API"

# Sari prima feature, doar setup
@auto_project.md --setup-only "Descriere proiect"

# Output verbose
@auto_project.md --verbose "Descriere proiect"
```

---

## Recuperare Erori

Dacă orice pas eșuează:

1. Loghează eroarea cu context complet
2. Salvează tot progresul (fișiere parțiale)
3. Raportează ce pas a eșuat
4. Oferă instrucțiuni recuperare manuală:
   ```
   Pentru a continua manual:
   1. Rezolvă eroarea în [fișier]
   2. Rulează @[next_agent].md pentru a continua
   ```
