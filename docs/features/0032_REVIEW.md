# Code Review: 0032 – Pagină Introducer, rol INTRODUCER, conținut simplificat

**Plan:** [docs/features/0032_PLAN.md](0032_PLAN.md)

Review efectuat față de checklist-ul din plan. Ordine: Backend (modele, contact, admin, security, migrații) → Frontend (tipuri, pagini, API, rute, redirect, dashboard, roleBadge) → Backoffice → Documentație.

---

## 1. Backend

### 1.1 UserRole.INTRODUCER și migrație enum ✅

- **models.py**: `UserRole.INTRODUCER = "INTRODUCER"` prezent.
- **schemas.py**: `UserRole.INTRODUCER` în enum Pydantic.
- **Migrație** `2026_02_13_introducer_role_and_request_flow.py`: adaugă valoarea `INTRODUCER` la tipul PostgreSQL `userrole` (DO $$ ... ADD VALUE 'INTRODUCER' ... $$).
- **Verdict**: Făcut.

### 1.2 ContactRequest.request_flow și migrație ✅

- **models.py**: coloană `request_flow = Column(String(32), default="buyer", nullable=False)`.
- **schemas.py**: `request_flow: str = "buyer"` în schema de contact.
- **Migrație**: `op.add_column("contact_requests", sa.Column("request_flow", sa.String(32), nullable=False, server_default="buyer"))`.
- **Verdict**: Făcut.

### 1.3 POST /contact/introducer-nda-request ✅

- **contact.py**: endpoint `@router.post("/introducer-nda-request", response_model=ContactRequestResponse)`; același payload ca nda-request (entity_name, contact_email, contact_first_name, contact_last_name, position, file); creează `ContactRequest` cu `request_flow="introducer"`, `user_role=NDA`; broadcast WebSocket; trimite email follow-up.
- **Verdict**: Făcut.

### 1.4 create-from-request cu target_role INTRODUCER ✅

- **admin.py**: parametru `target_role: Optional[str] = Query("KYC", ...)`; când `target_role == "INTRODUCER"`: user creat cu `UserRole.INTRODUCER`, `entity_id=null`, fără creare Entity.
- **Verdict**: Făcut.

### 1.5 get_introducer_user dependency ✅

- **security.py**: `async def get_introducer_user(current_user=Depends(get_current_user))`; permite doar `UserRole.ADMIN` sau `UserRole.INTRODUCER`; altfel 403.
- **Verdict**: Făcut.

### 1.6 Listă contact requests cu filter request_flow ✅

- **admin.py**: list contact requests acceptă `request_flow: Optional[str] = Query(None, ...)`; filtrare `query.where(ContactRequest.request_flow == request_flow)`; răspunsul include câmpul `request_flow`.
- **Verdict**: Făcut.

---

## 2. Frontend

### 2.1 UserRole 'INTRODUCER', USER_ROLES ✅

- **types/index.ts**: `UserRole` include `'INTRODUCER'`.
- **effectiveRole.ts**: `USER_ROLES` include `'INTRODUCER'`.
- **Verdict**: Făcut.

### 2.2 IntroducerPage (ENTER + NDA) ✅

- **IntroducerPage.tsx**: pagină nouă; moduri `initial` | `enter` | `nda`; ENTER → login email/parolă → setAuth → redirect prin getPostLoginRedirect; NDA → formular entity, email, first/last name, position, PDF → `contactApi.submitIntroducerNDARequest`; mesaj succes „Request Submitted”; animație ambient după 5s (NDASuccessAmbient); redirect când user deja INTRODUCER la `/introducer/dashboard` (useEffect + navigate).
- Reutilizează componente din LoginPageAnimations (DiffuseLogo, FloatingPrices, NDASuccessAmbient, ParticleField); nu modifică LoginPage (frozen).
- **Verdict**: Făcut.

### 2.3 contactApi.submitIntroducerNDARequest ✅

- **api.ts**: `submitIntroducerNDARequest` cu payload entity_name, contact_email, contact_first_name, contact_last_name, position, nda_file; POST `/contact/introducer-nda-request` (FormData).
- **Verdict**: Făcut.

### 2.4 Rute /introducer, /introducer/dashboard ✅

- **App.tsx**: `<Route path="/introducer" element={<LoginRoute><IntroducerPage /></LoginRoute>} />`; `<Route path="/introducer/dashboard" element={<RoleProtectedRoute allowedRoles={['INTRODUCER', 'ADMIN']} redirectTo="/introducer"><IntroducerDashboardPage /></RoleProtectedRoute>} />`.
- **Verdict**: Făcut.

### 2.5 getPostLoginRedirect pentru INTRODUCER ✅

- **redirect.ts**: `if (role === 'INTRODUCER') return '/introducer/dashboard';`.
- **Verdict**: Făcut.

### 2.6 IntroducerDashboardPage (conținut simplificat) ✅

- **IntroducerDashboardPage.tsx**: conținut minimalist (fără cash market, swap, funding, settlements, balanțe); Layout implicit prin parent; design discret, token-uri navy; welcome + text de prezentare.
- **Verdict**: Făcut.

### 2.7 roleBadge pentru INTRODUCER ✅

- **roleBadge.ts**: `clientStatusVariant('INTRODUCER')` → `'info'`.
- **Verdict**: Făcut.

### 2.8 CatchAllRedirect pentru INTRODUCER ✅

- **App.tsx**: `CatchAllRedirect` folosește `getPostLoginRedirect({ ...user, role: roleForRedirect })`; INTRODUCER primește `/introducer/dashboard`.
- **Verdict**: Făcut.

---

## 3. Backoffice

### 3.1 Filtrare / tab cereri introducer ✅

- **BackofficeOnboardingPage.tsx**: subpagini includ `introducer`; `introducerRequests = contactRequests.filter(r => r.requestFlow === 'introducer')`; tab „Introducer” cu count `introducerRequests.length`; la `activeSubpage === 'introducer'` se randează `<ContactRequestsTab contactRequests={introducerRequests} ... />`.
- **Verdict**: Făcut.

### 3.2 Approve cu target_role INTRODUCER ✅

- **ApproveInviteModal.tsx**: la submit `createUserFromRequest`, trimite `target_role: contactRequest.requestFlow === 'introducer' ? 'INTRODUCER' : undefined`.
- **Verdict**: Făcut.

---

## 4. Documentație

### 4.1 docs/ROLE_TRANSITIONS.md ✅

- Tranziția **NDA (introducer) → INTRODUCER** documentată; condiție: Approve & Create User cu `target_role=INTRODUCER`; `request_flow='introducer'`; secțiune Implicații actualizată pentru INTRODUCER.
- **Verdict**: Făcut.

### 4.2 app_truth.md ✅

- §8 (sau secțiunile relevante): NDA/KYC onboarding menționează INTRODUCER (post-login redirect `/introducer/dashboard`, acces doar `/introducer` și `/introducer/dashboard`); AuthGuard; Default view Backoffice cu tab Introducer și `request_flow='introducer'`, `target_role=INTRODUCER`.
- **Verdict**: Făcut.

---

## 5. Reguli și constrângeri

- **Frozen files**: LoginPage, LoginPageAnimations, Onboarding1Page nemodificate; IntroducerPage este pagină nouă.
- **Design system**: Token-uri navy; componente comune.
- **Client state**: User state din `User.role`; ContactRequest din `user_role` și `request_flow`.

---

## 6. Summary

| Item (plan checklist) | Status | Note |
|------------------------|--------|------|
| Backend: UserRole.INTRODUCER, migrație enum | ✅ | models, schemas, migrație |
| Backend: ContactRequest.request_flow, migrație | ✅ | coloană + migrație |
| Backend: POST /contact/introducer-nda-request | ✅ | contact.py |
| Backend: create-from-request cu target_role INTRODUCER | ✅ | admin.py |
| Backend: get_introducer_user dependency | ✅ | security.py |
| Frontend: UserRole 'INTRODUCER', USER_ROLES | ✅ | types, effectiveRole |
| Frontend: IntroducerPage (ENTER + NDA) | ✅ | + redirect dacă deja INTRODUCER |
| Frontend: contactApi.submitIntroducerNDARequest | ✅ | api.ts |
| Frontend: rute /introducer, /introducer/dashboard | ✅ | App.tsx |
| Frontend: getPostLoginRedirect pentru INTRODUCER | ✅ | redirect.ts |
| Frontend: IntroducerDashboardPage | ✅ | conținut simplificat |
| Frontend: roleBadge pentru INTRODUCER | ✅ | roleBadge.ts |
| Backoffice: filtrare/tab cereri introducer, Approve cu target_role | ✅ | BackofficeOnboardingPage, ApproveInviteModal |
| docs/ROLE_TRANSITIONS.md | ✅ | NDA (introducer) → INTRODUCER |
| app_truth.md | ✅ | §8 routing, roluri, backoffice Introducer |

---

## 7. Action item aplicat în timpul review-ului

1. **Frontend – IntroducerPage redirect** ✅  
   Când utilizatorul este deja autentificat cu rol INTRODUCER și accesează `/introducer`, trebuie redirecționat la `/introducer/dashboard` (conform planului §3.1).  
   **Implementat**: În `IntroducerPage.tsx` a fost adăugat `useEffect` care, după hidratare, dacă `user?.role === 'INTRODUCER'`, face `navigate('/introducer/dashboard', { replace: true })`.

---

**Review încheiat.** Implementarea 0032 este completă și aliniată la plan.
