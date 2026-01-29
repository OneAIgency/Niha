# Niha Development Optimization Guide

## Quick Reference

### Commands
```bash
# Start everything
docker compose up -d

# Full rebuild (when things break)
./rebuild.sh

# Restart only (faster)
./restart.sh

# View logs
docker compose logs backend --tail 50 -f
docker compose logs frontend --tail 50 -f

# Database access
PGPASSWORD=niha_secure_pass_2024 psql -h localhost -p 5433 -U niha_user -d niha_carbon
```

### URLs
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Admin Login**: admin@nihaogroup.com / Admin123!

---

## Development Workflows

### 1. Adding a New API Endpoint (Backend)

**Files to create/modify:**
```
backend/app/
├── api/v1/endpoints/feature.py   # New router
├── api/v1/__init__.py            # Register router
├── schemas/feature.py            # Request/Response models
├── services/feature_service.py   # Business logic
├── models/feature.py             # (if new table) SQLAlchemy model
└── tests/test_feature.py         # Tests
```

**Steps:**
1. Create Pydantic schemas first (`schemas/feature.py`)
2. Create service with business logic (`services/feature_service.py`)
3. Create router with endpoints (`api/v1/endpoints/feature.py`)
4. Register router in `api/v1/__init__.py`
5. Test via `/docs` endpoint

### 2. Adding a New Page (Frontend)

**Files to create/modify:**
```
frontend/src/
├── pages/FeaturePage.tsx         # New page component
├── components/feature/           # Feature-specific components
├── services/featureService.ts    # API calls
├── types/feature.ts              # TypeScript types
└── App.tsx                       # Add route
```

**Steps:**
1. Define TypeScript types (`types/feature.ts`)
2. Create API service (`services/featureService.ts`)
3. Create page component (`pages/FeaturePage.tsx`)
4. Add route in `App.tsx`
5. Add navigation link if needed

### 3. Database Schema Change

**Steps:**
1. Modify model in `backend/app/models/`
2. Create migration (set `down_revision = "2026_01_29_baseline"` in the new file if needed):
   ```bash
   docker compose exec backend alembic revision --autogenerate -m "description"
   ```
3. Review generated migration file
4. Apply migration:
   ```bash
   docker compose exec backend alembic upgrade head
   ```

Current Alembic head is a single baseline (`2026_01_29_baseline`); schema is driven by app startup (`init_db()`). New migrations should use that baseline as `down_revision`.

---

## Cursor AI Tips

### Use Inline Chat (@)
- `@file.py` - Reference specific file
- `@workspace` - Reference entire project
- `@docs` - Reference documentation folder

### Effective Prompts

**For new features:**
```
Create a new API endpoint for [feature] following the patterns in 
backend/app/api/v1/endpoints/market_makers.py. Include:
- Pydantic schemas
- Service class with error handling
- Tests
```

**For frontend components:**
```
Create a React component for [feature] following these rules:
- Use Tailwind classes from our design system (navy-800, navy-700, etc.)
- Include TypeScript interfaces for all props
- Add error handling and loading states
- Use the patterns from components/backoffice/MarketMakerList.tsx
```

**For bug fixes:**
```
This endpoint returns error [error message]. 
Debug by checking:
1. Backend logs
2. Database query
3. Request validation
```

### Multi-file Edits

When making changes across multiple files, tell Cursor:
```
Make changes to these files in order:
1. backend/app/schemas/feature.py - Add new field
2. backend/app/models/feature.py - Add column
3. backend/app/services/feature_service.py - Update logic
4. frontend/src/types/feature.ts - Update TypeScript types
5. frontend/src/components/feature/FeatureForm.tsx - Add field to form
```

---

## Common Patterns to Copy

### Backend Service Method
```python
async def create_item(self, data: ItemCreate, user_id: UUID) -> Item:
    item = Item(**data.model_dump(), created_by=user_id)
    try:
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item
    except Exception as e:
        await self.db.rollback()
        raise handle_database_error(e, "creating item", logger)
```

### Frontend API Call with Error Handling
```tsx
const [data, setData] = useState<Item[]>([]);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  const fetchData = async () => {
    try {
      const result = await itemService.getAll();
      setData(result);
    } catch (err) {
      setError('Failed to load items');
    } finally {
      setIsLoading(false);
    }
  };
  fetchData();
}, []);
```

### Form with Validation
```tsx
const [formData, setFormData] = useState({ name: '', amount: 0 });
const [errors, setErrors] = useState<Record<string, string>>({});

const validate = () => {
  const newErrors: Record<string, string> = {};
  if (!formData.name) newErrors.name = 'Name required';
  if (formData.amount <= 0) newErrors.amount = 'Amount must be positive';
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
```

---

## Troubleshooting

### Backend Not Starting
```bash
docker compose logs backend --tail 100
# Check for database connection, import errors
```

### Frontend Build Errors
```bash
cd frontend && npm run lint
# Fix TypeScript errors first
```

### Database Issues
```bash
# Reset and restart
./rebuild.sh --volumes
```

### Port Already in Use
```bash
lsof -i :5173  # frontend
lsof -i :8000  # backend
lsof -i :5433  # postgres
# kill -9 <PID>
```

---

## Key Files Reference

### Backend
- `app/main.py` - App entry point
- `app/core/database.py` - DB connection
- `app/core/security.py` - Auth/JWT
- `app/core/exceptions.py` - Error handling
- `app/api/v1/__init__.py` - Router registry

### Frontend
- `src/App.tsx` - Routes
- `src/services/api.ts` - API client
- `src/stores/` - Zustand stores
- `src/styles/design-tokens.css` - Design tokens
- `tailwind.config.js` - Tailwind setup

### Documentation
- `docs/WORKFLOW.md` - User journey
- `docs/CODE_QUALITY_STANDARDS.md` - Coding rules
- `frontend/docs/DESIGN_SYSTEM.md` - Design system
- `docs/api/` - API documentation
