# Orchestrator: Auto-Feature

> **Ce face**: Implementează o feature completă de la descriere la documentație, complet automatizat.
> **Când îl folosești**: Când vrei să adaugi o funcționalitate nouă la un proiect existent.
> **Rezultat**: Feature funcțională, review-uită și documentată.

---

## Cum Îl Folosești

```bash
@auto_feature.md "Descrierea funcționalității"
```

**Exemple:**
```bash
@auto_feature.md "Adaugă pagină profil utilizator cu upload avatar, bio și setări"
@auto_feature.md "Implementează order book cu update-uri real-time bid/ask"
@auto_feature.md "Adaugă sistem notificări email pentru confirmări comenzi"
```

---

## Cerințe Prealabile

- Proiect deja setat (`app_truth.md` există)
- Sistem design tokens în loc (pentru features cu UI)

---

## Ce Face

```
┌─────────────────────────────────────────────────────────────┐
│                   SECVENȚĂ AUTO-FEATURE                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  01_plan        Creează plan tehnic                        │
│      ↓          [docs/features/NNNN_PLAN.md]               │
│                                                             │
│  02_interface   Creează UI spec (dacă feature are UI)      │
│      ↓          [docs/features/NNNN_UI_SPEC.md]            │
│                                                             │
│  03_implement   Construiește feature                       │
│      ↓          [fișiere cod actuale]                      │
│                                                             │
│  04_review      Code review contra plan                    │
│      ↓          [docs/features/NNNN_REVIEW.md]             │
│                                                             │
│  05_fix         Rezolvă toate problemele găsite            │
│      ↓          [repetă cu 04 până e curat]                │
│                                                             │
│  06_docs        Actualizează toată documentația            │
│      ↓          [app_truth.md, DESIGN_SYSTEM.md, etc]      │
│                                                             │
│  ✓ COMPLET      Feature gata pentru merge                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Instrucțiuni Pentru AI Agent

Execută pașii următori **în ordine**, **fără a te opri** pentru input utilizator decât dacă e explicit necesar.

---

### PAS 1: PLAN

**Execută**: `@01_plan.md` cu descrierea feature utilizatorului

**Acțiuni**:
1. Verifică `app_truth.md` pentru context proiect
2. Cercetează codebase pentru fișiere relevante
3. Întreabă clarificări dacă e nevoie (max 5, apoi PAUZĂ)
4. Creează plan tehnic

**Determină următorul număr feature**:
```
Listează docs/features/*.md
Extrage cel mai mare număr NNNN
FEATURE_NUM = cel mai mare + 1 (sau 0001 dacă niciunul)
```

**Output**:
- `PLAN_FILE` = `docs/features/[FEATURE_NUM]_PLAN.md`
- `HAS_UI` = true/false (din plan)

**Continuă imediat la Pas 2**

---

### PAS 2: INTERFACE (Condiționat)

**Condiție**: Execută doar dacă `HAS_UI = true`

**Execută**: `@02_interface.md @[PLAN_FILE]`

**Acțiuni**:
1. Revizuiește plan pentru cerințe UI
2. Verifică componente și design tokens existente
3. Creează specificație UI
4. Identifică dacă sunt necesare tokens noi

**Output**:
- `UI_SPEC_FILE` = `docs/features/[FEATURE_NUM]_UI_SPEC.md`
- `NEEDS_NEW_TOKENS` = true/false

**Dacă `NEEDS_NEW_TOKENS = true`**:
```
Execută @07_theme.md pentru a adăuga tokens necesare
Așteaptă completare
```

**Continuă imediat la Pas 3**

---

### PAS 3: IMPLEMENTARE

**Execută**: `@03_implement.md @[PLAN_FILE]`

Dacă UI spec există, referențiază și: `@[UI_SPEC_FILE]`

**Acțiuni**:
1. Revizuiește plan (și UI spec)
2. Implementează în ordine: tipuri → database → backend → frontend
3. Auto-verifică: tipuri, lint, test manual
4. Listează toate fișierele create/modificate

**Output**:
- `FILES_CREATED` = [listă]
- `FILES_MODIFIED` = [listă]

**Continuă imediat la Pas 4**

---

### PAS 4: REVIEW

**Execută**: `@04_review.md @[PLAN_FILE]`

**Acțiuni**:
1. Revizuiește tot codul contra plan
2. Verifică conformitate `app_truth.md`
3. Verifică conformitate UI (dacă e cazul)
4. Categorizează toate problemele găsite

**Output**:
- `REVIEW_FILE` = `docs/features/[FEATURE_NUM]_REVIEW.md`
- `CRITICAL_COUNT` = număr
- `MAJOR_COUNT` = număr
- `MINOR_COUNT` = număr
- `TOTAL_ISSUES` = CRITICAL + MAJOR + MINOR

**Decizie**:
```
DACĂ TOTAL_ISSUES = 0:
    SARI la Pas 6 (documentație)
ALTFEL:
    CONTINUĂ la Pas 5 (fix)
```

---

### PAS 5: FIX + RE-REVIEW (Loop)

**Inițializare**:
```
FIX_CYCLE = 0
MAX_CYCLES = 3
```

**Loop**:
```
CÂT TIMP TOTAL_ISSUES > 0 ȘI FIX_CYCLE < MAX_CYCLES:

    FIX_CYCLE += 1

    # Rezolvă toate problemele
    Execută @05_fix.md @[REVIEW_FILE]

    # Re-review
    Execută @04_review.md @[PLAN_FILE] (mod re-review)

    # Actualizează contoare din noul review
    TOTAL_ISSUES = CRITICAL_COUNT + MAJOR_COUNT + MINOR_COUNT

    # Loghează progres
    Print "Ciclu fix {FIX_CYCLE}: {TOTAL_ISSUES} probleme rămase"

SFÂRȘIT CÂT TIMP
```

**După loop**:
```
DACĂ TOTAL_ISSUES > 0:
    # Încă sunt probleme după cicluri max
    PAUZĂ și raportează:

    "═══════════════════════════════════════════════════════════
     ⚠️  INTERVENȚIE HUMAN NECESARĂ
    ═══════════════════════════════════════════════════════════

    După {MAX_CYCLES} cicluri fix, {TOTAL_ISSUES} probleme rămân:
      Critical: {CRITICAL_COUNT}
      Major: {MAJOR_COUNT}
      Minor: {MINOR_COUNT}

    Fișier review: {REVIEW_FILE}

    Opțiuni:
    1. Rezolvă problemele manual, apoi rulează: @06_docs.md @[PLAN_FILE]
    2. Oferă îndrumare pentru probleme specifice
    3. Acceptă starea curentă și continuă: răspunde 'continuă oricum'

    ═══════════════════════════════════════════════════════════"

    AȘTEAPTĂ răspuns human

ALTFEL:
    CONTINUĂ la Pas 6
```

---

### PAS 6: DOCUMENTAȚIE

**Execută**: `@06_docs.md @[PLAN_FILE] @[REVIEW_FILE]`

**Acțiuni**:
1. Actualizează `app_truth.md` dacă arhitectura a fost afectată
2. Actualizează `docs/DESIGN_SYSTEM.md` dacă s-au adăugat componente UI
3. Adaugă comentarii cod unde e nevoie
4. Actualizează README dacă e feature user-facing

**Continuă imediat la Finalizare**

---

### FINALIZARE

**Afișează sumar final**:

```
═══════════════════════════════════════════════════════════════
                    AUTO-FEATURE COMPLET
═══════════════════════════════════════════════════════════════

Feature: [Descriere feature]

Documentație:
  ✓ Plan:     docs/features/[FEATURE_NUM]_PLAN.md
  ✓ UI Spec:  docs/features/[FEATURE_NUM]_UI_SPEC.md (dacă e cazul)
  ✓ Review:   docs/features/[FEATURE_NUM]_REVIEW.md

Implementare:
  Fișiere create:
    ✓ [path/to/file1]
    ✓ [path/to/file2]

  Fișiere modificate:
    ✓ [path/to/file3]
    ✓ [path/to/file4]

Calitate:
  Cicluri review: [FIX_CYCLE]
  Probleme rezolvate: [total count]
  Status final: CURAT

Documentație actualizată:
  ✓ [lista docs actualizate]

Status: GATA PENTRU MERGE

═══════════════════════════════════════════════════════════════
```

---

## Puncte de Intervenție Human

Orchestratorul se **oprește doar când**:

1. **Întrebări clarificatoare** (Pas 1) - Dacă descrierea feature e ambiguă
2. **După 3 cicluri fix** (Pas 5) - Dacă problemele Critical/Major persistă
3. **Breaking changes detectate** (orice pas) - Dacă feature ar strica funcționalitate existentă
4. **Concerns securitate** (orice pas) - Dacă implementarea implică pattern-uri sensibile

---

## Flags

```bash
# Sari specificație UI
@auto_feature.md --no-ui "Feature doar backend"

# Sari documentație
@auto_feature.md --skip-docs "Prototip, documentează mai târziu"

# Dry run (doar plan)
@auto_feature.md --dry-run "Descriere feature"

# Mod verbose
@auto_feature.md --verbose "Descriere feature"

# Forțează continuare peste probleme review
@auto_feature.md --force "Descriere feature"
```

---

## Tratare Erori

Dacă orice pas eșuează:

1. **Loghează eroarea** cu context complet
2. **Salvează progresul** - Toate fișierele completate rămân
3. **Raportează clar**:
   ```
   ═══════════════════════════════════════════════════════════
   ✗ AUTO-FEATURE EȘUAT LA PAS [N]: [Nume Pas]
   ═══════════════════════════════════════════════════════════

   Eroare: [Mesaj eroare]

   Fișiere create înainte de eșec:
     ✓ [listă]

   Pentru a continua manual:
     1. Rezolvă: [ce trebuie rezolvat]
     2. Rulează: @[next_agent].md [args]

   Pentru a reîncerca acest pas:
     @[current_agent].md [args]
   ═══════════════════════════════════════════════════════════
   ```

---

## Exemplu Rulare

```
User: @auto_feature.md "Adaugă anunț depozit cu sumă și număr referință"

Agent:
═══════════════════════════════════════════════════════════════
                    AUTO-FEATURE PORNIT
═══════════════════════════════════════════════════════════════

[PAS 1/6] Planificare...
  → Citesc app_truth.md...
  → Cercetez codebase...
  → Găsit relevant: deposits.py, FundingPage.tsx
  ✓ Plan: docs/features/0015_PLAN.md
  → Are UI: DA

[PAS 2/6] Creez UI spec...
  → Verific design tokens...
  → Designez componente...
  ✓ UI Spec: docs/features/0015_UI_SPEC.md
  → Tokens noi necesare: NU

[PAS 3/6] Implementare...
  → Creez tipuri...
  → Creez endpoint API...
  → Creez componente UI...
  ✓ Implementare completă
  → Fișiere create: 3
  → Fișiere modificate: 4

[PAS 4/6] Review...
  → Verific conformitate plan...
  → Verific calitate cod...
  → Verific conformitate UI...
  ✓ Review: docs/features/0015_REVIEW.md
  → Probleme: 0 Critical, 1 Major, 2 Minor

[PAS 5/6] Rezolv probleme...
  → Ciclu fix 1...
  → Rezolv M1: Validare lipsă...
  → Rezolv m1: Spacing buton...
  → Rezolv m2: aria-label lipsă...
  ✓ Toate problemele rezolvate

  → Re-review...
  → Probleme: 0 Critical, 0 Major, 0 Minor
  ✓ Review PASSED

[PAS 6/6] Documentare...
  → Actualizez app_truth.md...
  → Adaug comentarii cod...
  ✓ Documentație completă

═══════════════════════════════════════════════════════════════
                    AUTO-FEATURE COMPLET
═══════════════════════════════════════════════════════════════

Feature: Adaugă anunț depozit cu sumă și număr referință

...

Status: GATA PENTRU MERGE

═══════════════════════════════════════════════════════════════
```
