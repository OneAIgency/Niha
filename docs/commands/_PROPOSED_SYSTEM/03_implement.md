# Agent 03: Implement Feature

> **Purpose**: Build the feature according to the plan and UI specification.

## When to Use

- Plan is complete (`docs/features/NNNN_PLAN.md`)
- UI spec is complete (if applicable)
- Ready to write code

## Usage

```bash
@03_implement.md @docs/features/NNNN_PLAN.md
```

**With UI spec:**
```bash
@03_implement.md @docs/features/NNNN_PLAN.md @docs/features/NNNN_UI_SPEC.md
```

## Prerequisites

- Plan document exists
- UI spec exists (if feature has UI)
- `app_truth.md` reviewed
- Design tokens exist (if UI requires them)

## Instructions for AI Agent

### Step 1: Review All Documentation

1. **Read the plan completely** - Understand every requirement
2. **Read UI spec** (if exists) - Component details, states, interactions
3. **Check `app_truth.md`**:
   - §2: Technology stack versions
   - §5: Project structure
   - §6: Coding standards
   - §7: API conventions
   - §8: Database conventions
   - §9: UI/UX standards

### Step 2: Implementation Order

Follow this order strictly:

```
1. Types/Interfaces    (define data shapes first)
        ↓
2. Database           (migrations, models)
        ↓
3. Backend/API        (endpoints, services)
        ↓
4. Frontend           (components, pages)
        ↓
5. Integration        (connect frontend to backend)
```

### Step 3: Implement Types/Interfaces

**Always start with types.** This catches errors early.

```typescript
// Example: Define types before any implementation
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

interface CreateUserRequest {
  email: string;
  password: string;
}

interface CreateUserResponse {
  data: User;
}
```

### Step 4: Implement Database Layer

If plan includes database changes:

1. **Create migration file**
   - Follow naming convention from `app_truth.md`
   - Include both up and down migrations

2. **Create/update models**
   - Match types defined in Step 3
   - Follow existing model patterns

3. **Run migration**
   - Verify schema is correct

### Step 5: Implement Backend/API

For each endpoint in the plan:

1. **Create route handler**
   ```python
   # Follow existing patterns
   @router.post("/resource")
   async def create_resource(
       request: CreateResourceRequest,
       db: AsyncSession = Depends(get_db)
   ) -> ResourceResponse:
       # Implementation
   ```

2. **Add validation**
   - Input validation
   - Business logic validation

3. **Add error handling**
   ```python
   try:
       # Operation
   except SomeError as e:
       raise HTTPException(status_code=400, detail=str(e))
   ```

4. **Test endpoint manually**
   - Use curl, Postman, or similar
   - Verify request/response matches plan

### Step 6: Implement Frontend

For each component in UI spec:

1. **Create component file**
   ```tsx
   // src/components/[path]/ComponentName.tsx
   
   interface ComponentNameProps {
     // From UI spec
   }
   
   export function ComponentName({ prop1, prop2 }: ComponentNameProps) {
     // Implementation
   }
   ```

2. **Use design tokens**
   ```tsx
   // ✅ Correct - uses design tokens
   <div className="bg-surface text-primary p-4 rounded-xl">
   
   // ❌ Wrong - hard-coded values
   <div style={{ backgroundColor: '#fff', padding: '16px' }}>
   ```

3. **Handle all states**
   ```tsx
   if (isLoading) return <LoadingSpinner />;
   if (error) return <ErrorMessage error={error} />;
   if (!data.length) return <EmptyState />;
   return <ActualContent data={data} />;
   ```

4. **Support dark mode**
   ```tsx
   // Use dark: variants
   <div className="bg-white dark:bg-navy-800">
   ```

5. **Make responsive**
   ```tsx
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
   ```

### Step 7: Integration

1. **Connect frontend to API**
   ```tsx
   const { data, error, isLoading } = useQuery({
     queryKey: ['resource'],
     queryFn: () => api.getResource()
   });
   ```

2. **Add proper error handling**
   - Network errors
   - API errors
   - Validation errors

3. **Test full flow**
   - Create → Read → Update → Delete
   - Error scenarios
   - Edge cases from plan

### Step 8: Self-Verification

Before marking complete, verify:

**General:**
- [ ] All plan requirements implemented
- [ ] Types match between frontend and backend
- [ ] No TypeScript errors
- [ ] No linter errors
- [ ] No console errors in browser

**Backend:**
- [ ] All endpoints return correct responses
- [ ] Error handling for all failure cases
- [ ] Input validation working
- [ ] Database operations correct

**Frontend (if applicable):**
- [ ] All components render correctly
- [ ] Loading states show appropriately
- [ ] Error states display correctly
- [ ] Empty states handled
- [ ] Dark mode works
- [ ] Responsive on mobile/tablet/desktop
- [ ] No hard-coded colors/spacing

### Step 9: Output Summary

```
═══════════════════════════════════════════════════════════════
                   IMPLEMENTATION COMPLETE
═══════════════════════════════════════════════════════════════

Feature: [Feature Name]
Plan: docs/features/NNNN_PLAN.md

Files created:
  ✓ [path/to/file1.ts]
  ✓ [path/to/file2.tsx]
  ✓ [path/to/file3.py]

Files modified:
  ✓ [path/to/existing1.ts]
  ✓ [path/to/existing2.py]

Database migrations:
  ✓ [migration_name]

Self-verification:
  ✓ All plan requirements: PASS
  ✓ TypeScript/Linter: PASS
  ✓ Manual testing: PASS

Next step:
  → @04_review.md @docs/features/NNNN_PLAN.md

═══════════════════════════════════════════════════════════════
```

## Rules

1. **Follow the plan exactly** - Don't add unrequested features
2. **Types first** - Define interfaces before implementation
3. **No mock data** - Use real data from start
4. **No hard-coded values** - Use tokens, config, env vars
5. **Handle all states** - Loading, error, empty, success
6. **Match existing patterns** - Check similar code in codebase
7. **Test as you go** - Don't wait until the end

## Common Mistakes to Avoid

```typescript
// ❌ Hard-coded color
<div style={{ color: '#10b981' }}>

// ✅ Design token
<div className="text-emerald-500">

// ❌ No error handling
const data = await api.getData();

// ✅ Proper error handling
try {
  const data = await api.getData();
} catch (error) {
  handleError(error);
}

// ❌ No loading state
return <DataList data={data} />;

// ✅ All states handled
if (isLoading) return <Spinner />;
if (error) return <Error message={error} />;
if (!data.length) return <Empty />;
return <DataList data={data} />;
```

## Output

Working implementation ready for code review.

## Next Agent

→ `@04_review.md` - Code review
