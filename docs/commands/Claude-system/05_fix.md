# Agent 05: Fix Issues

> **Ce face**: Rezolvă toate problemele identificate în code review.
> **Când îl folosești**: După ce code review-ul a găsit probleme.
> **Rezultat**: Cod corectat gata pentru re-review.

---

## Cum Îl Folosești

```bash
@05_fix.md @docs/features/NNNN_REVIEW.md
```

---

## Cerințe Prealabile

- Document de review există cu lista de probleme
- Plan original disponibil pentru referință
- Înțelegere a contextului codebase

---

## Ce Face Acest Agent (Pentru AI)

### Pas 1: Parsează Documentul de Review

1. **Citește `NNNN_REVIEW.md`**
2. **Extrage toate problemele** în categorii:
   - Critical: [Lista cu referințe fișier/linie]
   - Major: [Lista cu referințe fișier/linie]
   - Minor: [Lista cu referințe fișier/linie]
   - Recomandări: [Lista]

3. **Numără problemele**:
   ```
   CRITICAL_COUNT = X
   MAJOR_COUNT = Y
   MINOR_COUNT = Z
   TOTAL_ISSUES = X + Y + Z
   ```

### Pas 2: Rezolvă în Ordine de Prioritate

**Ordinea contează.** Rezolvă în această secvență:

```
1. Toate problemele Critical (OBLIGATORIU toate)
       ↓
2. Toate problemele Major (OBLIGATORIU toate)
       ↓
3. Toate problemele Minor (AR TREBUI toate)
       ↓
4. Recomandări (dacă e timp)
```

### Pas 3: Rezolvă Fiecare Problemă

Pentru fiecare problemă:

1. **Localizează fișierul și linia** din review
2. **Înțelege problema** - Citește secțiunea "Problema"
3. **Aplică fix-ul** - Urmează indicațiile din "Fix" sau "Cod așteptat"
4. **Verifică fix-ul**:
   - Compilează/lint-ează?
   - Strică altceva?
   - Urmează pattern-urile proiectului?

**Template pentru fiecare fix:**

```
═══════════════════════════════════════════════════════════════
Rezolvând [C1/M1/m1]: [Titlu Problemă]
═══════════════════════════════════════════════════════════════

Fișier: path/to/file.ts
Linia: 42

Înainte:
```typescript
// codul problematic
```

După:
```typescript
// codul corectat
```

Verificare:
  ✓ TypeScript: compilează
  ✓ Lint: fără erori
  ✓ Teste relacionate: pass
═══════════════════════════════════════════════════════════════
```

### Pas 4: Verifică Lipsa Regresiilor

După toate fix-urile:

1. **Rulează linter**
   ```bash
   npm run lint      # Frontend
   ruff check .      # Backend (Python)
   ```

2. **Rulează type check**
   ```bash
   npm run typecheck  # sau tsc --noEmit
   ```

3. **Rulează testele** (dacă există)
   ```bash
   npm run test
   pytest
   ```

4. **Test manual smoke**
   - Testează că feature-ul funcționează end-to-end
   - Testează că features adiacente nu s-au stricat

### Pas 5: Actualizează Documentul de Review

Adaugă o secțiune în `NNNN_REVIEW.md`:

```markdown
---

## Ciclu Fix #1

**Data**: [Data]
**Rezolvat de**: AI Agent

### Probleme Rezolvate

| ID | Problemă | Status |
|----|----------|--------|
| C1 | [Titlu] | ✓ Rezolvat |
| M1 | [Titlu] | ✓ Rezolvat |
| M2 | [Titlu] | ✓ Rezolvat |
| m1 | [Titlu] | ✓ Rezolvat |

### Verificare

- Linter: PASS
- Type check: PASS
- Teste: PASS
- Test manual: PASS

### Note

[Orice note relevante despre fix-uri]

---
```

### Pas 6: Determină Următorul Pas

**Logică decizie:**

```
DACĂ (toate Critical + Major + Minor rezolvate cu succes):
    → Cere re-review pentru verificare
    → Următorul: @04_review.md (mod re-review)

DACĂ (unele probleme nu au putut fi rezolvate):
    → Documentează de ce
    → Raportează humanului pentru decizie
    → PAUZĂ pentru input human
```

### Pas 7: Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                      CICLU FIX COMPLET
═══════════════════════════════════════════════════════════════

Feature: [Nume Feature]
Review: docs/features/NNNN_REVIEW.md
Ciclu fix: #1

Probleme adresate:
  Critical: X/X rezolvate
  Major:    Y/Y rezolvate
  Minor:    Z/Z rezolvate

Verificare:
  Linter:     PASS
  Type check: PASS
  Teste:      PASS
  Manual:     PASS

[Dacă toate rezolvate:]
Gata pentru re-review.
Următorul pas:
  → @04_review.md @docs/features/NNNN_PLAN.md (re-review)

[Dacă unele nu au fost rezolvate:]
⚠️ Unele probleme nu au putut fi rezolvate:
  - [ID problemă]: [De ce]

Este necesară decizie humană.

═══════════════════════════════════════════════════════════════
```

---

## Reguli

1. **Rezolvă în ordine de prioritate** - Critical întâi, întotdeauna
2. **O problemă odată** - Nu amesteca fix-urile
3. **Verifică fiecare fix** - Asigură-te că funcționează înainte să treci mai departe
4. **Nu introduce probleme noi** - Fii atent cu modificările
5. **Documentează totul** - Actualizează fișierul de review
6. **Rămâi în scope** - Rezolvă doar ce e în review

---

## Pattern-uri Comune de Fix

### Lipsă Error Handling

```typescript
// Înainte
const data = await api.getData();

// După
try {
  const data = await api.getData();
  return data;
} catch (error) {
  console.error('Failed to fetch data:', error);
  throw new Error('Unable to load data. Please try again.');
}
```

### Culori Hardcodate

```tsx
// Înainte
<div style={{ backgroundColor: '#10b981' }}>

// După
<div className="bg-emerald-500">
```

### Lipsă Loading State

```tsx
// Înainte
return <DataList data={data} />;

// După
if (isLoading) {
  return <LoadingSpinner />;
}
if (error) {
  return <ErrorMessage error={error} />;
}
if (!data?.length) {
  return <EmptyState message="No data found" />;
}
return <DataList data={data} />;
```

### Type Safety

```typescript
// Înainte
function process(data: any) {
  return data.value * 2;
}

// După
interface ProcessInput {
  value: number;
}

function process(data: ProcessInput): number {
  return data.value * 2;
}
```

### Lipsă ARIA Labels

```tsx
// Înainte
<button onClick={handleClick}>
  <XIcon />
</button>

// După
<button
  onClick={handleClick}
  aria-label="Close dialog"
>
  <XIcon aria-hidden="true" />
</button>
```

### Lipsă Dark Mode Support

```tsx
// Înainte
<div className="bg-white text-gray-900">

// După
<div className="bg-white dark:bg-navy-900 text-gray-900 dark:text-white">
```

### Input Validation Lipsă

```python
# Înainte
@router.post("/users")
async def create_user(email: str, password: str):
    user = create_user_in_db(email, password)
    return user

# După
from pydantic import BaseModel, EmailStr, validator

class CreateUserRequest(BaseModel):
    email: EmailStr
    password: str

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v

@router.post("/users")
async def create_user(request: CreateUserRequest):
    user = create_user_in_db(request.email, request.password)
    return user
```

---

## Output

- Cod actualizat cu toate fix-urile aplicate
- `NNNN_REVIEW.md` actualizat cu documentația ciclului de fix

---

## Următorul Agent

→ `@04_review.md` - Re-review pentru a verifica fix-urile (loop până e curat)
