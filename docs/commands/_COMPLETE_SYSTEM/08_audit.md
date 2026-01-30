# Agent 08: Audit Project

> **Ce face**: Audit complet al codebase-ului și documentației pentru a identifica inconsistențe, conflicte, fișiere învechite și technical debt.
> **Când îl folosești**: Periodic pentru mentenanță, înainte de release, când preia un proiect.
> **Rezultat**: `docs/AUDIT_REPORT_[DATA].md` cu probleme și acțiuni prioritizate.

---

## Cum Îl Folosești

```bash
@08_audit.md
```

**Cu focus specific:**
```bash
@08_audit.md --focus=docs     # Doar documentație
@08_audit.md --focus=theme    # Doar design system
@08_audit.md --focus=code     # Doar cod
@08_audit.md --focus=deps     # Doar dependențe
```

---

## Ce Auditează

```
┌─────────────────────────────────────────────────────────────┐
│                    CATEGORII AUDIT                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. DOCUMENTAȚIE      Docs învechite, conflicte, gaps      │
│  2. CONSISTENȚĂ COD   Pattern-uri, naming, structură       │
│  3. DESIGN SYSTEM     Folosire tokens, valori hardcodate   │
│  4. DEPENDENȚE        Nefolosite, învechite, duplicate     │
│  5. CONFIGURAȚIE      Env vars, configs, secrets           │
│  6. IGIENĂ FIȘIERE    Cod mort, fișiere nefolosite         │
│  7. SYNC APP_TRUTH    Realitate vs stare documentată       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Ce Face Acest Agent (Pentru AI)

### FAZA 1: AUDIT DOCUMENTAȚIE

**Verifică că aceste fișiere există și sunt curente:**

```
Fișiere necesare:
├── app_truth.md              # Sursă unică de adevăr
├── README.md                 # Overview proiect
├── docs/
│   ├── PRODUCT_BRIEF.md      # Descriere produs
│   ├── DESIGN_SYSTEM.md      # Documentație design
│   └── features/             # Istoric features
└── .env.example              # Template environment
```

**Pentru fiecare fișier de documentație, verifică:**

1. **Indicatori de învechire:**
   - Data ultimei modificări vs modificări cod
   - Referințe la features șterse
   - Numere de versiune învechite
   - Link-uri moarte (interne și externe)
   - Referințe la fișiere/funcții inexistente

2. **Conflicte:**
   - Contradicții între docuri
   - Mai multe docs descriind același lucru diferit
   - `app_truth.md` vs implementare actuală

3. **Gaps:**
   - Features nedocumentate
   - Documentație API lipsă
   - Instrucțiuni setup lipsă

---

### FAZA 2: AUDIT CONSISTENȚĂ COD

**Verifică pentru violări de pattern-uri:**

1. **Convenții naming** (din `app_truth.md` §6):
   - Nume fișiere inconsistente
   - Nume funcții inconsistente
   - Nume componente inconsistente

2. **Violări structură proiect:**
   - Fișiere în directoare greșite
   - Directoare neașteptate
   - Directoare așteptate lipsă

3. **Inconsistențe pattern cod:**
   - Pattern-uri diferite de error handling
   - Pattern-uri diferite de API calls
   - Abordări diferite de state management

4. **Cod duplicat:**
   - Funcții similare în fișiere diferite
   - Componente copy-paste cu modificări minore

---

### FAZA 3: AUDIT DESIGN SYSTEM

**Verifică conformitate design tokens:**

1. **Scanare valori hardcodate:**
   ```
   Caută în toate fișierele frontend:
   - Culori hex (#xxx, #xxxxxx)
   - Valori RGB/RGBA
   - Pixeli hardcodați pentru spacing
   - Font sizes hardcodate
   - Inline styles cu valori de design
   ```

2. **Folosire tokens deprecate:**
   - Nume vechi de tokens
   - Tokens șterse
   - Clase Tailwind non-standard (slate-*, gray-*)

3. **Probleme definiție tokens:**
   - Tokens definite dar niciodată folosite
   - Tokens folosite dar nedefinite
   - Definiții token duplicate

4. **Suport teme:**
   - Componente fără suport dark mode
   - Valori hardcodate specifice temei

---

### FAZA 4: AUDIT DEPENDENȚE

**Verifică sănătatea pachetelor:**

1. **Dependențe nefolosite:**
   ```
   Pentru fiecare dependență din package.json/requirements.txt:
   - Caută imports în codebase
   - Flag dacă niciodată importat
   ```

2. **Dependențe învechite:**
   ```
   Rulează:
   - npm outdated (frontend)
   - pip list --outdated (backend)

   Flag:
   - Major version în urmă
   - Vulnerabilități securitate
   ```

3. **Duplicate/conflicte:**
   - Pachete multiple făcând același lucru
   - Versiuni conflictuale
   - Warnings peer dependency

---

### FAZA 5: AUDIT CONFIGURAȚIE

**Verifică igiena configurației:**

1. **Variabile de mediu:**
   - .env.example vs folosire actuală în cod
   - Env vars documentate vs folosite
   - Valori sensibile comise accidental

2. **Consistență fișiere config:**
   - tsconfig.json settings
   - eslint/prettier configs
   - tailwind.config.js
   - docker-compose.yml

3. **Detecție secrets:**
   ```
   Scanează pentru comise accidental:
   - API keys
   - Credențiale database
   - JWT secrets
   - Private keys
   ```

---

### FAZA 6: AUDIT IGIENĂ FIȘIERE

**Găsește fișiere moarte/nefolosite:**

1. **Fișiere orfane:**
   - Componente niciodată importate
   - Utilități nefolosite
   - Stiluri neaplicate
   - Teste pentru cod șters

2. **Fișiere backup/temp:**
   - *.bak, *.old, *.tmp
   - .DS_Store, Thumbs.db

3. **Fișiere generate în git:**
   - node_modules comis accidental
   - Artefacte build
   - CSS/JS generat ce ar trebui gitignored

---

### FAZA 7: AUDIT SYNC APP_TRUTH

**Verifică că app_truth.md match-uiește realitatea:**

**§2 Stack Tehnologic:**
- Versiuni match-uiesc package.json/requirements.txt?

**§3 Infrastructură & Porturi:**
- Porturi match-uiesc docker-compose.yml?

**§5 Structura Proiect:**
- Structura directoare match-uiește realitatea?

**§7 Convenții API:**
- Endpoint-urile documentate există?

**§9 Standarde UI/UX:**
- Locație design tokens corectă?

---

### FAZA 8: GENEREAZĂ RAPORT

Scrie în `docs/AUDIT_REPORT_[DATA].md`:

```markdown
# Raport Audit Proiect

> **Data**: [Data]
> **Proiect**: [Nume din app_truth.md]
> **Auditat de**: AI Agent

---

## Sumar Executiv

| Categorie | Probleme | Critical | Major | Minor |
|-----------|----------|----------|-------|-------|
| Documentație | X | - | Y | Z |
| Consistență Cod | X | - | Y | Z |
| Design System | X | - | Y | Z |
| Dependențe | X | A | Y | Z |
| Configurație | X | B | Y | Z |
| Igienă Fișiere | X | - | Y | Z |
| Sync App Truth | X | - | Y | Z |
| **TOTAL** | **XX** | **C** | **YY** | **ZZ** |

### Scor Sănătate: [X/100]

```
████████████░░░░░░░░ 60/100 - Necesită Atenție
```

---

## Probleme Critical (Rezolvă Imediat)

[Lista toate problemele critical cu căi fișiere și fix-uri specifice]

---

## Probleme Major (Rezolvă Curând)

[Lista toate problemele major organizate pe categorie]

---

## Probleme Minor (Rezolvă Când E Posibil)

[Lista toate problemele minor]

---

## Acțiuni Recomandate

### Imediat (Acest Sprint)
1. [ ] [Acțiune 1]
2. [ ] [Acțiune 2]

### Pe Termen Scurt (Această Lună)
1. [ ] [Acțiune 1]
2. [ ] [Acțiune 2]

### Pe Termen Lung (Acest Trimestru)
1. [ ] [Acțiune 1]
2. [ ] [Acțiune 2]

---

## Fișiere de Șters

```
[Lista fișiere sigure de șters]
```

---

## Fișiere de Actualizat

```
[Lista fișiere ce necesită update cu modificări specifice]
```

---

## Gaps Documentație de Completat

```
[Lista documentație lipsă]
```

---

## Constatări Detaliate

### 1. Audit Documentație
[Constatări detaliate...]

### 2. Audit Consistență Cod
[Constatări detaliate...]

[...etc pentru fiecare categorie...]
```

---

### Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                      AUDIT COMPLET
═══════════════════════════════════════════════════════════════

Proiect: [Nume]
Data Audit: [Data]

Scor Sănătate: [XX/100]

Probleme Găsite:
  🔴 Critical:  X (rezolvă imediat)
  🟠 Major:     Y (rezolvă curând)
  🟡 Minor:     Z (rezolvă când e posibil)

Top 5 Acțiuni Prioritare:
  1. [Cea mai critică acțiune]
  2. [A doua prioritate]
  3. [A treia prioritate]
  4. [A patra prioritate]
  5. [A cincea prioritate]

Fișiere de șters: N
Fișiere de actualizat: M
Gaps documentație: K

Raport complet: docs/AUDIT_REPORT_[DATA].md

Pași următori:
  → Revizuiește raportul
  → Creează task-uri de cleanup
  → Rulează @auto_audit.md --fix pentru rezolvări automate

═══════════════════════════════════════════════════════════════
```

---

## Puncte de Intervenție Human

**Se oprește pentru:**
1. **Secrets găsite** - Concern securitate imediat
2. **Probleme structurale majore** - Necesită decizii arhitecturale
3. **Convenții conflictuale** - Trebuie ales care se păstrează

---

## Flags

```bash
# Focus pe arie specifică
@08_audit.md --focus=docs
@08_audit.md --focus=theme
@08_audit.md --focus=code
@08_audit.md --focus=deps

# Audit rapid (doar critical)
@08_audit.md --quick

# Generează task-uri automat
@08_audit.md --generate-tasks
```

---

## Recomandare Program Audit

| Frecvență | Tip Audit | Comandă |
|-----------|-----------|---------|
| Săptămânal | Rapid (doar critical) | `@08_audit.md --quick` |
| Lunar | Audit complet | `@08_audit.md` |
| Trimestrial | Complet + comparație | `@08_audit.md --compare=...` |
| Înainte release | Audit complet | `@08_audit.md` |
| După feature major | Focalizat | `@08_audit.md --focus=code,docs` |
