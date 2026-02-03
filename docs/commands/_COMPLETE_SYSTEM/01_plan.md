# Agent 01: Plan Feature

> **Ce face**: Creează un plan tehnic detaliat pentru o funcționalitate nouă.
> **Când îl folosești**: Când vrei să adaugi o feature și ai nevoie de un plan clar.
> **Rezultat**: `docs/features/NNNN_PLAN.md`

---

## Cum Îl Folosești

```bash
@01_plan.md "Descrierea funcționalității"
```

**Exemplu:**
```bash
@01_plan.md "Adaugă autentificare cu email și parolă,
incluzând înregistrare, login, logout și forgot password"
```

---

## Cerințe Prealabile

- Trebuie să existe `app_truth.md` (rulează `@00_brief.md` dacă nu există)

---

## Ce Face Acest Agent (Pentru AI)

### Pas 1: Înțelege Feature-ul

Din descriere, identifică:

1. **Scope** - Ce exact trebuie construit?
2. **Dependențe** - Ce cod existent e afectat?
3. **Tip** - Backend-only, frontend-only, sau full-stack?
4. **Are UI** - Are componente vizuale?

### Pas 2: Cercetează Codebase-ul

1. **Verifică `app_truth.md`**:
   - Stack tehnologic și versiuni
   - Convenții și pattern-uri existente
   - Structura API
   - Convenții database
   - Standarde UI/UX (§9)

2. **Găsește fișiere relevante**:
   - Features similare existente
   - Utilități partajate
   - Componente reutilizabile
   - Modele database

3. **Identifică puncte de integrare**:
   - Ce fișiere trebuie modificate?
   - Ce fișiere noi trebuie create?
   - Sunt breaking changes?

### Pas 3: Clarifică Dacă E Nevoie

Dacă cerințele sunt neclare, întreabă **maximum 5 întrebări**:

```
Înainte să creez planul, am nevoie de clarificări:

1. [Întrebare specifică despre scope]
2. [Întrebare specifică despre comportament]
3. [Întrebare despre edge cases]
...

Te rog răspunde, și voi continua cu planul.
```

**NU continua** până nu primești răspunsuri.

### Pas 4: Determină Numărul Feature-ului

```
Listează docs/features/*.md
Extrage cel mai mare număr NNNN
FEATURE_NUM = cel mai mare + 1 (sau 0001 dacă nu există)
```

### Pas 5: Scrie Planul

Scrie în `docs/features/[FEATURE_NUM]_PLAN.md`:

```markdown
# Feature: [Nume Feature]

> **Plan ID**: [NNNN]
> **Creat**: [Data]
> **Status**: Draft

---

## Descriere

[2-3 propoziții despre ce face această feature și de ce]

---

## Cerințe

Din request-ul utilizatorului:
- [Cerință 1]
- [Cerință 2]
- [Cerință 3]

---

## Abordare Tehnică

### Decizie Arhitecturală

[Explicație scurtă a abordării alese și de ce]

### Are Componente UI: [Da/Nu]

[Dacă Da, menționează că UI spec va fi creat de 02_interface.md]

---

## Detalii Implementare

### Fișiere de Creat

| Fișier | Scop |
|--------|------|
| `path/to/file.ts` | [Ce face] |
| `path/to/file.tsx` | [Ce face] |

### Fișiere de Modificat

| Fișier | Modificări |
|--------|------------|
| `path/to/existing.ts` | [Ce se schimbă] |
| `path/to/existing.tsx` | [Ce se schimbă] |

### Modificări Database

[Dacă e cazul]

**Tabele Noi:**
```sql
CREATE TABLE [table_name] (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  [field] [type] [constraints],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Migrații:**
- Nume: `YYYY_MM_DD_descriere`
- Modificări: [descriere]

### Endpoint-uri API

[Dacă e cazul]

| Metodă | Endpoint | Scop |
|--------|----------|------|
| POST | /api/v1/[resource] | Creează [resource] |
| GET | /api/v1/[resource]/:id | Obține [resource] |
| PUT | /api/v1/[resource]/:id | Actualizează [resource] |
| DELETE | /api/v1/[resource]/:id | Șterge [resource] |

**Exemple Request/Response:**

```json
// POST /api/v1/[resource]
// Request
{
  "field": "value"
}

// Response (201)
{
  "data": {
    "id": "uuid",
    "field": "value",
    "created_at": "2024-01-15T..."
  }
}
```

### Algoritmi Cheie

[Dacă există logică complexă, explică pas cu pas]

1. Pasul unu
2. Pasul doi
3. Pasul trei

---

## Faze de Implementare

[Doar pentru features mari]

### Faza 1: Data Layer
- [ ] Creează tipuri/interfaces
- [ ] Creează migrații database
- [ ] Creează modele

### Faza 2A: Backend (poate rula paralel cu 2B)
- [ ] Creează endpoint-uri API
- [ ] Adaugă validare
- [ ] Adaugă error handling

### Faza 2B: Frontend (poate rula paralel cu 2A)
- [ ] Creează componente
- [ ] Adaugă state management
- [ ] Conectează la API

### Faza 3: Integrare
- [ ] Teste end-to-end
- [ ] Verificare error handling

---

## Dependențe

### Pachete Externe
- [package-name]: [de ce e necesar]

### Dependențe Interne
- [file/module]: [de ce e necesar]

---

## Edge Cases

- [Edge case 1]: [Cum se tratează]
- [Edge case 2]: [Cum se tratează]
- [Edge case 3]: [Cum se tratează]

---

## Considerații de Securitate

[Dacă e cazul]

- [Concern securitate]: [Cum se mitigă]

---

## În Afara Scope-ului

[Lista explicită cu ce NU include această feature]

- [Thing 1]
- [Thing 2]

---

## Checklist Înainte de Implementare

- [ ] Plan revizuit
- [ ] `app_truth.md` consultat
- [ ] Fără conflicte cu features existente
- [ ] UI spec creat (dacă Are UI = Da)
```

### Pas 6: Determină Următorul Pas

**Dacă Are UI = Da:**
```
Plan complet. Feature-ul are componente UI.
→ Următorul: @02_interface.md va crea specificația UI
```

**Dacă Are UI = Nu:**
```
Plan complet. Nu sunt componente UI.
→ Următorul: @03_implement.md va implementa feature-ul
```

### Pas 7: Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                      PLAN COMPLET
═══════════════════════════════════════════════════════════════

Feature: [Nume Feature]
Plan: docs/features/[NNNN]_PLAN.md
Are UI: [Da/Nu]

Fișiere de creat: N
Fișiere de modificat: M
Modificări database: [Da/Nu]
Endpoint-uri API: K

Următorul pas:
  → @02_interface.md (dacă are UI)
  → @03_implement.md (dacă nu are UI)

═══════════════════════════════════════════════════════════════
```

---

## Reguli

1. **Fii precis** - Căi specifice de fișiere, funcții specifice
2. **Fără cod în plan** - Descrie CE trebuie făcut, nu CUM să codezi
3. **Verifică pattern-uri existente** - Respectă convențiile proiectului
4. **Fără date mock** - Planifică pentru date reale de la început
5. **Faze doar pentru features mari** - Nu complica inutil
6. **Notează dependențele** - Atât externe cât și interne

---

## Output

| Fișier | Scop |
|--------|------|
| `docs/features/NNNN_PLAN.md` | Plan tehnic de implementare |

---

## Următorul Agent

→ `@02_interface.md` - Dacă feature-ul are componente UI
→ `@03_implement.md` - Dacă feature-ul nu are UI
