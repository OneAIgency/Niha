# Orchestrator: Auto-Audit

> **Ce face**: Audit complet de proiect cu opțiune de cleanup automat al problemelor identificate.
> **Când îl folosești**: Periodic pentru mentenanță, înainte de release, când preia un proiect.
> **Rezultat**: Raport audit + opțional fix-uri automate aplicate.

---

## Cum Îl Folosești

```bash
@auto_audit.md
```

**Cu cleanup automat:**
```bash
@auto_audit.md --fix
```

**Focus pe arii specifice:**
```bash
@auto_audit.md --focus=docs,theme
@auto_audit.md --focus=code --fix
```

---

## Ce Face

```
┌─────────────────────────────────────────────────────────────┐
│                    SECVENȚĂ AUTO-AUDIT                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FAZA 1: AUDIT                                          │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  08_audit    Analiză comprehensivă proiect            │ │
│  │              → Generează AUDIT_REPORT_[DATA].md       │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FAZA 2: CLEANUP (dacă flag --fix)                      │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Șterge fișiere învechite                             │ │
│  │  Actualizează docs outdated                           │ │
│  │  Repară violări design tokens                         │ │
│  │  Sincronizează app_truth.md                           │ │
│  │  Elimină dependențe nefolosite                        │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                          ↓                                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ FAZA 3: VERIFICARE                                     │ │
│  ├────────────────────────────────────────────────────────┤ │
│  │                                                        │ │
│  │  Re-audit pentru confirmare fix-uri                   │ │
│  │  Generează comparație before/after                    │ │
│  │  Actualizează documentație                            │ │
│  │                                                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Instrucțiuni Pentru AI Agent

---

### FAZA 1: AUDIT COMPREHENSIV

**Execută**: `@08_audit.md`

**Acțiuni**:
1. Rulează toate cele 7 categorii audit
2. Generează raport detaliat
3. Categorizează problemele pe severitate și tip

**Output**:
- `AUDIT_REPORT` = `docs/AUDIT_REPORT_[DATA].md`
- `CRITICAL_ISSUES` = [listă]
- `MAJOR_ISSUES` = [listă]
- `MINOR_ISSUES` = [listă]
- `SAFE_TO_DELETE` = [listă fișiere]
- `NEEDS_UPDATE` = [listă fișiere]
- `HEALTH_SCORE` = X/100

**Prezintă sumar utilizatorului:**

```
═══════════════════════════════════════════════════════════════
                    SUMAR REZULTATE AUDIT
═══════════════════════════════════════════════════════════════

Scor Sănătate: [XX/100]

Probleme pe Categorie:
  Documentație:    X probleme (Y rezolvabile automat)
  Consistență Cod: X probleme (Y rezolvabile automat)
  Design System:   X probleme (Y rezolvabile automat)
  Dependențe:      X probleme (Y rezolvabile automat)
  Configurație:    X probleme (Y rezolvabile automat)
  Igienă Fișiere:  X probleme (Y rezolvabile automat)
  Sync App Truth:  X probleme (Y rezolvabile automat)

Fix-uri Automate Disponibile:
  ✓ Șterge N fișiere învechite/nefolosite
  ✓ Repară M valori design hardcodate
  ✓ Actualizează K referințe documentație
  ✓ Elimină L dependențe nefolosite
  ✓ Sincronizează app_truth.md (P secțiuni)

Review Manual Necesar:
  ⚠ X decizii arhitecturale
  ⚠ Y concerns securitate
  ⚠ Z breaking changes

Raport complet: docs/AUDIT_REPORT_[DATA].md

═══════════════════════════════════════════════════════════════
```

**Dacă flag `--fix` NU e prezent:**
```
Pentru a aplica fix-uri automate, rulează:
  @auto_audit.md --fix

Sau rezolvă manual folosind raportul ca ghid.
```
**OPREȘTE AICI dacă nu e flag --fix**

---

### FAZA 2: CLEANUP AUTOMAT (dacă --fix)

Execută fix-uri în ordine sigură:

#### Pas 2.1: Cleanup Fișiere (Cel Mai Sigur)

**Șterge fișiere identificate ca:**
- Fișiere backup (*.bak, *.old, *.tmp)
- Fișiere OS (.DS_Store, Thumbs.db)
- Fișiere orfane (niciodată importate/folosite)

**Înainte de a șterge fiecare fișier:**
```
Log: "Șterg [fișier]: [motiv]"
```

**Sari dacă:**
- Fișier modificat în ultimele 7 zile (poate fi work in progress)
- Fișier are comentarii TODO/FIXME (placeholder intenționat)

#### Pas 2.2: Fix-uri Design Tokens

**Pentru fiecare valoare hardcodată găsită:**

1. **Culori:**
   ```tsx
   // Înainte
   style={{ color: '#10b981' }}

   // După
   className="text-emerald-500"
   ```

2. **Spacing:**
   ```tsx
   // Înainte
   style={{ padding: '16px' }}

   // După
   className="p-4"
   ```

3. **Clase deprecate:**
   ```tsx
   // Înainte
   className="bg-slate-500"

   // După
   className="bg-navy-500"
   ```

**Verifică fiecare fix:**
- TypeScript încă compilează
- Fără regresie vizuală (log pentru verificare manuală)

#### Pas 2.3: Update-uri Documentație

**Repară referințe învechite:**
- Actualizează numere versiuni
- Repară link-uri interne moarte
- Elimină referințe la fișiere șterse
- Actualizează căi de fișiere schimbate

**Sincronizează app_truth.md:**
- Actualizează §2 versiuni din package.json
- Actualizează §3 porturi din docker-compose.yml
- Actualizează §5 structură din directoare actuale
- Adaugă endpoint-uri documentate lipsă în §7

#### Pas 2.4: Cleanup Dependențe

**Pentru dependențe nefolosite:**
```bash
npm uninstall [pachet]  # sau
pip uninstall [pachet]
```

**Loghează fiecare eliminare:**
```
Eliminat: lodash (nefolosit - niciun import găsit)
Eliminat: moment (deprecat - migrat la date-fns)
```

**Sari dacă:**
- Dependența e peer dependency
- Dependența e folosită în fișiere config
- Dependența e folosită în scripturi

#### Pas 2.5: Sync Configurație

**Actualizează .env.example:**
- Adaugă variabile lipsă găsite în cod
- Elimină variabile nemai folosite
- Adaugă comentarii pentru claritate

---

### FAZA 3: VERIFICARE

**Re-rulează audit pentru a verifica fix-urile:**

```bash
@08_audit.md --quick
```

**Compară rezultatele:**
```
Înainte de Fix:
  Scor Sănătate: 45/100
  Critical: 3
  Major: 12
  Minor: 28

După Fix:
  Scor Sănătate: 78/100  (+33)
  Critical: 0  (-3)
  Major: 4  (-8)
  Minor: 15  (-13)

Problemele rămase necesită atenție manuală.
```

**Generează sumar cleanup:**

```
═══════════════════════════════════════════════════════════════
                    AUTO-CLEANUP COMPLET
═══════════════════════════════════════════════════════════════

Scor Sănătate: 45/100 → 78/100 (+33 îmbunătățire)

Acțiuni Efectuate:

  Fișiere Șterse: 12
    - src/components/OldButton.tsx (orfan)
    - src/utils/helper.bak (backup)
    - ...

  Fix-uri Design: 24
    - Reparat 18 culori hardcodate
    - Reparat 4 spacing hardcodate
    - Înlocuit 2 clase deprecate

  Update-uri Documentație: 8
    - Actualizat app_truth.md (3 secțiuni)
    - Reparat 5 link-uri moarte

  Dependențe Eliminate: 3
    - lodash (nefolosit)
    - moment (deprecat)
    - query-string (nefolosit)

  Update-uri Configurație: 2
    - Adăugat 4 vars în .env.example
    - Eliminat 2 vars învechite

Probleme Rămase (Manual Necesar):

  🟠 Major: 4
    - [Problemă ce necesită decizie humană]
    - [Alegere arhitecturală necesară]

  🟡 Minor: 15
    - [Lista probleme minor]

Rapoarte:
  - Audit complet: docs/AUDIT_REPORT_[DATA].md
  - Log cleanup: docs/CLEANUP_LOG_[DATA].md

═══════════════════════════════════════════════════════════════
```

---

## Puncte de Intervenție Human

**Se oprește întotdeauna pentru:**

1. **Înainte de a șterge orice fișier** (în batch):
   ```
   Urmează să șterg 12 fișiere. Revizuiești lista?
   [Arată lista]
   Continui? (da/nu/revizuiesc fiecare)
   ```

2. **Probleme securitate găsite:**
   ```
   ⚠️ SECURITATE: Găsit potențial secret în config.ts
   Necesită review manual imediat.
   ```

3. **Breaking changes:**
   ```
   ⚠️ Acest fix poate strica: [component/feature]
   Continui oricum? (da/nu/sari)
   ```

4. **Convenții conflictuale:**
   ```
   Găsite 2 pattern-uri diferite de naming:
   - camelCase (23 fișiere)
   - kebab-case (15 fișiere)
   Care ar trebui să fie standard? (camel/kebab/sari)
   ```

---

## Reguli de Siguranță

1. **Niciodată nu șterge fără confirmare** (confirmare batch OK)
2. **Niciodată nu modifica fișiere în .git/**
3. **Niciodată nu elimina dependențe folosite în cod producție**
4. **Întotdeauna creează backup înainte de modificări bulk** (git stash sau branch)
5. **Oprește imediat dacă build-ul se strică**

---

## Flags

```bash
# Doar audit, fără fix-uri
@auto_audit.md

# Audit + fix-uri automate
@auto_audit.md --fix

# Focus pe arii specifice
@auto_audit.md --focus=docs
@auto_audit.md --focus=theme
@auto_audit.md --focus=code
@auto_audit.md --focus=deps
@auto_audit.md --focus=all --fix

# Cleanup agresiv (mai puține confirmări)
@auto_audit.md --fix --aggressive

# Dry run (arată ce s-ar face)
@auto_audit.md --fix --dry-run

# Generează task-uri în loc să repari
@auto_audit.md --generate-tasks
```

---

## Integrare cu Development Features

**Workflow recomandat:**

```bash
# Înainte de a începe feature nouă
@auto_audit.md --quick

# Dacă sunt probleme
@auto_audit.md --fix

# Apoi continuă cu feature
@auto_feature.md "Feature nouă"
```

---

## Program Audit Recomandat

| Frecvență | Tip Audit | Comandă |
|-----------|-----------|---------|
| Săptămânal | Rapid (doar critical) | `@auto_audit.md --quick` |
| Lunar | Audit complet | `@auto_audit.md` |
| Trimestrial | Complet + cleanup | `@auto_audit.md --fix` |
| Înainte release | Audit complet | `@auto_audit.md` |
| După feature major | Focalizat | `@auto_audit.md --focus=code,docs` |
