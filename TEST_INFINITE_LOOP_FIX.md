# Test Guide: Infinite Loop Fix

## Quick Start Testing

### 1. Pregătire

```bash
# Clear browser storage complet
# DevTools → Application → Storage → Clear All Site Data

# Sau din consolă:
sessionStorage.clear();
localStorage.clear();
```

### 2. Pornește aplicația cu logging activ

```bash
cd frontend
npm run dev
```

### 3. Deschide Console (DevTools)

```bash
# Chrome/Edge: Ctrl+Shift+J (Windows) / Cmd+Option+J (Mac)
# Firefox: Ctrl+Shift+K (Windows) / Cmd+Option+K (Mac)
```

### 4. Filtrează log-urile

În consolă, caută după:
- `[LoginRoute]` - Vezi flow-ul de navigare
- `[AuthStore]` - Vezi când se setează autentificarea
- `[LoginPage]` - Vezi procesul de login
- `[NavigationGuard]` - Vezi când se activează/dezactivează guard-ul

## Scenarii de Test

### Scenariu 1: Login Normal (Password)

**Pași:**
1. Navighează la `http://localhost:5173/login`
2. Introdu credentials valide
3. Click pe "CONTINUE"
4. **Verifică**: Redirect la `/dashboard` (sau alt target pe baza rolului)
5. **Verifică**: NU există refresh rapid sau loop

**Output așteptat în consolă:**
```
[LoginPage] Attempting password login for: user@example.com
[AuthStore] setAuth called
[LoginRoute] 🔄 Performing navigation to: /dashboard
[LoginRoute] ✓ Already on target path, no navigation needed
```

**✅ SUCCESS**: Dacă vezi UN SINGUR mesaj `🔄 Performing navigation`
**❌ FAIL**: Dacă vezi MULTIPLE mesaje `🔄 Performing navigation` (indica loop)

### Scenariu 2: Magic Link Verification

**Pași:**
1. Accesează URL cu token: `http://localhost:5173/login?token=...`
2. **Verifică**: Redirect automat la target page
3. **Verifică**: NU există refresh loop

**Output așteptat:**
```
[LoginPage] Verifying magic link token
[AuthStore] setAuth called
[LoginRoute] 🔄 Performing navigation to: /dashboard
```

### Scenariu 3: Setup Password (Invitation)

**Pași:**
1. Accesează invitation URL: `http://localhost:5173/setup-password?token=...`
2. Setează parola
3. Click "Set Password"
4. **Verifică**: Redirect la target page (ex: `/onboarding` pentru PENDING users)
5. **Verifică**: NU există loop

**Output așteptat:**
```
[SetupPasswordPage] Setting up password for token
[AuthStore] setAuth called
[LoginRoute] 🔄 Performing navigation to: /onboarding
```

### Scenariu 4: Refresh După Login

**Pași:**
1. Login cu success
2. **Refresh page** (F5 sau Cmd+R)
3. **Verifică**: Rămâi pe pagina curentă
4. **Verifică**: NU ești redirectat la login

**Output așteptat:**
```
[AuthStore] Starting rehydration from sessionStorage
[AuthStore] Rehydration complete
[LoginRoute] ✓ Already on target path, no navigation needed
```

### Scenariu 5: Multiple User Roles

Testează cu utilizatori cu roluri diferite:

**PENDING User:**
- **Target**: `/onboarding`
- Verifică redirect corect

**APPROVED User:**
- **Target**: `/funding`
- Verifică redirect corect

**FUNDED User:**
- **Target**: `/dashboard`
- Verifică redirect corect

**ADMIN User:**
- **Target**: `/dashboard`
- Verifică redirect corect

## Indicatori de Succes

### ✅ Fix funcționează dacă:

1. **UN SINGUR redirect** după login
2. **NU vezi flashing/blinking** între pagini
3. **Console logs arată** `hasNavigated: true` după prima navigare
4. **Nu vezi multiple** `🔄 Performing navigation` messages
5. **Refresh funcționează** fără să te redirecteze la login

### ❌ Fix NU funcționează dacă:

1. **Pagina face refresh continuu** între login și dashboard
2. **Vezi multiple** `🔄 Performing navigation` în consolă
3. **`hasNavigated` rămâne `false`** chiar după navigare
4. **`navInProgress` nu se resetează** după 150ms
5. **Erori în consolă** legate de React hooks sau state

## Debugging Output Detailed

### Normal Flow (Success):

```
T=0ms:    [LoginPage] Attempting password login
T=10ms:   [AuthStore] setAuth called: {email: "user@test.com", role: "FUNDED"}
T=11ms:   [AuthStore] Token stored in sessionStorage
T=12ms:   [AuthStore] Auth state updated, isAuthenticated=true

T=15ms:   [LoginRoute] Render state: {
            _hasHydrated: false,
            isAuthenticated: true,
            userEmail: "user@test.com",
            currentPath: "/login",
            hasNavigated: false,
            navInProgress: false
          }
T=15ms:   [LoginRoute] Waiting for rehydration, showing children

T=20ms:   [AuthStore] Rehydration complete, state: {isAuthenticated: true, ...}
T=21ms:   [AuthStore] Setting _hasHydrated=true

T=25ms:   [LoginRoute] Render state: {
            _hasHydrated: true,
            isAuthenticated: true,
            userEmail: "user@test.com",
            currentPath: "/login",
            hasNavigated: false,
            navInProgress: false
          }
T=26ms:   [LoginRoute] Authenticated user, checking navigation: {
            targetPath: "/dashboard",
            currentPath: "/login",
            shouldNavigate: true
          }
T=27ms:   [LoginRoute] 🔄 Performing navigation to: /dashboard
T=28ms:   [NavigationGuard] Setting navigation in progress

T=100ms:  [LoginRoute] Render state: {
            _hasHydrated: true,
            isAuthenticated: true,
            userEmail: "user@test.com",
            currentPath: "/dashboard",
            hasNavigated: true,     <-- ✅ NOW TRUE
            navInProgress: true
          }
T=101ms:  [LoginRoute] ✓ Already on target path, no navigation needed
T=102ms:  [LoginRoute] Showing children (no navigation)

T=180ms:  [NavigationGuard] Navigation timeout elapsed, resetting flag
```

### Loop Detected (Failure):

```
T=0ms:    [LoginRoute] 🔄 Performing navigation to: /dashboard
T=150ms:  [LoginRoute] 🔄 Performing navigation to: /dashboard  <-- ❌ DUPLICATE!
T=300ms:  [LoginRoute] 🔄 Performing navigation to: /dashboard  <-- ❌ LOOP!
T=450ms:  [LoginRoute] 🔄 Performing navigation to: /dashboard  <-- ❌ CONTINUES!
```

**Dacă vezi asta:**
1. Screenshot console output
2. Check `hasNavigated` flag - ar trebui să devină `true`
3. Raportează issue cu console logs

## Common Issues & Solutions

### Issue: "hasNavigated rămâne false"

**Cauză**: useRef nu se actualizează corect
**Soluție**:
```typescript
// Verifică în App.tsx că există:
hasNavigatedRef.current = true;  // Linia care setează flag-ul
```

### Issue: "Multiple navigations după 150ms"

**Cauză**: Navigation guard timeout prea mic
**Soluție**: Verifică că location.pathname se actualizează corect

### Issue: "Console plin de log-uri"

**Normal**: Fix-ul include logging verbose pentru debugging
**Soluție**: După ce fix-ul este verificat, vei primi instrucțiuni pentru a reduce logging-ul

## Contact & Raportare

**Dacă fix-ul NU funcționează:**

1. **Salvează console logs**:
   - Right-click în consolă → Save as...

2. **Screenshot**:
   - DevTools cu console logs
   - Application tab → Session Storage

3. **Raportează** cu:
   - User role folosit pentru test
   - Browser și versiune
   - Pași exacti pentru reproducere
   - Console logs salvate

---

**Fix implementat**: 2026-01-26
**Status**: Testare activă
**Documentație completă**: `docs/fixes/2026-01-26-infinite-refresh-loop-fix.md`
