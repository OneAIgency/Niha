# Agent 03: Implement Feature

> **Ce face**: Construiește feature-ul conform planului și specificației UI.
> **Când îl folosești**: După ce planul (și opțional UI spec) sunt complete.
> **Rezultat**: Cod funcțional gata pentru review.

---

## Cum Îl Folosești

```bash
@03_implement.md @docs/features/NNNN_PLAN.md
```

**Cu UI spec:**
```bash
@03_implement.md @docs/features/NNNN_PLAN.md @docs/features/NNNN_UI_SPEC.md
```

---

## Cerințe Prealabile

- Plan există și e complet
- UI spec există (dacă feature-ul are UI)
- `app_truth.md` verificat
- Design tokens există (dacă UI necesită)

---

## Ce Face Acest Agent (Pentru AI)

### Pas 1: Revizuiește Toată Documentația

1. **Citește planul complet** - Înțelege fiecare cerință
2. **Citește UI spec** (dacă există) - Detalii componente, stări, interacțiuni
3. **Verifică `app_truth.md`**:
   - §2: Versiuni stack tehnologic
   - §5: Structura proiectului
   - §6: Standarde de cod
   - §7: Convenții API
   - §8: Convenții database
   - §9: Standarde UI/UX

### Pas 2: Ordinea de Implementare

Urmează **STRICT** această ordine:

```
1. Tipuri/Interfaces    (definește shape-urile datelor mai întâi)
        ↓
2. Database            (migrații, modele)
        ↓
3. Backend/API         (endpoints, services)
        ↓
4. Frontend            (componente, pagini)
        ↓
5. Integrare           (conectează frontend la backend)
```

### Pas 3: Implementează Tipuri/Interfaces

**Întotdeauna începe cu tipurile.** Asta prinde erori devreme.

```typescript
// Exemplu: Definește tipuri înainte de orice implementare

// Entitatea de bază
interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Request DTO
interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
}

// Response DTO
interface CreateUserResponse {
  data: User;
}

// Pentru liste cu paginare
interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    perPage: number;
  };
}
```

### Pas 4: Implementează Database Layer

Dacă planul include modificări database:

1. **Creează fișier migrație**
   - Urmează convenția de naming din `app_truth.md`
   - Include atât `up` cât și `down` migration

2. **Creează/actualizează modele**
   - Modelele trebuie să match-uiască tipurile din Pas 3
   - Urmează pattern-urile existente

3. **Rulează migrația**
   - Verifică că schema e corectă

**Exemplu Python/SQLAlchemy:**
```python
# models/user.py
class User(Base):
    __tablename__ = "users"

    id = Column(UUID, primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Pas 5: Implementează Backend/API

Pentru fiecare endpoint din plan:

1. **Creează route handler**
```python
@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    request: CreateUserRequest,
    db: AsyncSession = Depends(get_db)
) -> UserResponse:
    """Creează un utilizator nou."""
    # Verifică dacă email-ul există deja
    existing = await user_service.get_by_email(db, request.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Creează utilizatorul
    user = await user_service.create(db, request)
    return UserResponse(data=user)
```

2. **Adaugă validare**
   - Input validation (Pydantic/Zod)
   - Business logic validation

3. **Adaugă error handling**
```python
try:
    result = await some_operation()
except SpecificError as e:
    logger.error(f"Operation failed: {e}")
    raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
    logger.exception("Unexpected error")
    raise HTTPException(status_code=500, detail="Internal server error")
```

4. **Testează endpoint-ul manual**
   - Folosește curl, Postman, sau similar
   - Verifică că request/response match-uiesc planul

### Pas 6: Implementează Frontend

Pentru fiecare componentă din UI spec:

1. **Creează fișierul componentei**
```tsx
// src/components/[path]/ComponentName.tsx

interface ComponentNameProps {
  // Din UI spec
  title: string;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export function ComponentName({
  title,
  onSubmit,
  isLoading = false
}: ComponentNameProps) {
  // Implementare
}
```

2. **Folosește design tokens**
```tsx
// ✅ Corect - folosește design tokens
<div className="bg-surface text-primary p-4 rounded-xl">
  <h2 className="text-lg font-semibold text-text-primary">
    {title}
  </h2>
</div>

// ❌ Greșit - valori hardcodate
<div style={{ backgroundColor: '#fff', padding: '16px' }}>
  <h2 style={{ fontSize: '18px', color: '#333' }}>
    {title}
  </h2>
</div>
```

3. **Tratează toate stările**
```tsx
export function DataList({ isLoading, error, data, emptyMessage }) {
  // Loading state
  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Error state
  if (error) {
    return <ErrorMessage message={error.message} />;
  }

  // Empty state
  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  // Success state
  return (
    <ul>
      {data.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

4. **Suportă dark mode**
```tsx
// Folosește dark: variants
<div className="bg-white dark:bg-navy-800 text-gray-900 dark:text-white">
  {/* content */}
</div>
```

5. **Fă responsive**
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* content */}
</div>
```

### Pas 7: Integrare

1. **Conectează frontend la API**
```tsx
// Folosind React Query
const { data, error, isLoading } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.getUsers()
});

// Mutations
const createUser = useMutation({
  mutationFn: (data: CreateUserRequest) => api.createUser(data),
  onSuccess: () => {
    queryClient.invalidateQueries(['users']);
    toast.success('User created!');
  },
  onError: (error) => {
    toast.error(error.message);
  }
});
```

2. **Adaugă error handling proper**
   - Network errors
   - API errors
   - Validation errors

3. **Testează flow-ul complet**
   - Create → Read → Update → Delete
   - Error scenarios
   - Edge cases din plan

### Pas 8: Auto-Verificare

Înainte de a marca complet, verifică:

**General:**
- [ ] Toate cerințele din plan implementate
- [ ] Tipurile match-uiesc între frontend și backend
- [ ] Fără erori TypeScript
- [ ] Fără erori de linter
- [ ] Fără erori în consolă (browser)

**Backend:**
- [ ] Toate endpoint-urile returnează răspunsuri corecte
- [ ] Error handling pentru toate cazurile de failure
- [ ] Input validation funcționează
- [ ] Operațiile database sunt corecte

**Frontend (dacă e cazul):**
- [ ] Toate componentele renderează corect
- [ ] Loading states apar adecvat
- [ ] Error states se afișează corect
- [ ] Empty states sunt tratate
- [ ] Dark mode funcționează
- [ ] Responsive pe mobile/tablet/desktop
- [ ] Fără culori/spacing hardcodate

### Pas 9: Afișează Rezultatul

```
═══════════════════════════════════════════════════════════════
                   IMPLEMENTARE COMPLETĂ
═══════════════════════════════════════════════════════════════

Feature: [Nume Feature]
Plan: docs/features/NNNN_PLAN.md

Fișiere create:
  ✓ [path/to/file1.ts]
  ✓ [path/to/file2.tsx]
  ✓ [path/to/file3.py]

Fișiere modificate:
  ✓ [path/to/existing1.ts]
  ✓ [path/to/existing2.py]

Migrații database:
  ✓ [migration_name]

Auto-verificare:
  ✓ Toate cerințele din plan: PASS
  ✓ TypeScript/Linter: PASS
  ✓ Test manual: PASS

Următorul pas:
  → @04_review.md @docs/features/NNNN_PLAN.md

═══════════════════════════════════════════════════════════════
```

---

## Reguli

1. **Urmează planul exact** - Nu adăuga features necerute
2. **Tipuri mai întâi** - Definește interfaces înainte de implementare
3. **Fără date mock** - Folosește date reale de la început
4. **Fără valori hardcodate** - Folosește tokens, config, env vars
5. **Tratează toate stările** - Loading, error, empty, success
6. **Respectă pattern-urile existente** - Verifică cod similar în codebase
7. **Testează pe parcurs** - Nu aștepta până la final

---

## Greșeli Comune de Evitat

```typescript
// ❌ Culoare hardcodată
<div style={{ color: '#10b981' }}>

// ✅ Design token
<div className="text-emerald-500">

// ❌ Fără error handling
const data = await api.getData();

// ✅ Cu error handling
try {
  const data = await api.getData();
} catch (error) {
  handleError(error);
}

// ❌ Fără loading state
return <DataList data={data} />;

// ✅ Cu toate stările
if (isLoading) return <Spinner />;
if (error) return <Error message={error} />;
if (!data.length) return <Empty />;
return <DataList data={data} />;

// ❌ any type
function process(data: any) { ... }

// ✅ Type proper
interface ProcessData {
  id: string;
  value: number;
}
function process(data: ProcessData) { ... }
```

---

## Output

Implementare funcțională gata pentru code review.

---

## Următorul Agent

→ `@04_review.md` - Code review
