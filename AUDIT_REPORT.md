# NIHA Carbon Trading Platform - Code Audit Report

**Data Auditului:** 2026-01-08
**Versiune:** 1.0
**Status:** DRAFT - Pentru completare cu specificații

---

## 1. SUMAR EXECUTIV

Niha este o platformă de tranzacționare OTC pentru certificate de carbon (EUA - European Union Allowances și CEA - China Emission Allowances). Aplicația este construită ca un sistem full-stack cu:
- **Backend:** FastAPI (Python 3.11) cu PostgreSQL și Redis
- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Deployment:** Docker Compose

### 1.1 Puncte Forte
- Arhitectură modernă și scalabilă
- Sistem de autentificare robust (JWT + Magic Links)
- Workflow KYC complet implementat
- Separare clară între roluri (ADMIN, PENDING, APPROVED, FUNDED)
- API RESTful bine structurat
- Simulare realistă de date pentru marketplace

### 1.2 Puncte Slabe Identificate
- Marketplace-ul folosește doar date simulate (nu există listing-uri reale)
- Sistemul de trading nu este implementat (doar vizualizare)
- Swap-urile sunt doar calculate, nu executate
- Lipsește sistemul de plăți/deposit-uri
- Lipsesc notificări în timp real (doar prețuri via WebSocket)

---

## 2. PROBLEME DE SECURITATE

### 2.1 CRITICE

| ID | Problemă | Fișier | Linie | Severitate |
|----|----------|--------|-------|------------|
| SEC-001 | **Auto-creare utilizator la magic-link** - Oricine poate crea un cont doar trimițând un email | `backend/app/api/v1/auth.py` | 43-47 | CRITICĂ |
| SEC-002 | **Logout nu invalidează token-ul** - JWT-ul rămâne valid după logout | `backend/app/api/v1/auth.py` | 153-161 | MEDIE |
| SEC-003 | **OnboardingRoute dezactivat** - Verificarea rolului PENDING este comentată | `frontend/src/App.tsx` | 64-74 | CRITICĂ |

### 2.2 MEDII

| ID | Problemă | Fișier | Impact |
|----|----------|--------|--------|
| SEC-004 | Token JWT stocat în localStorage - vulnerabil la XSS | `frontend/src/stores/useStore.ts` | Furt de sesiune |
| SEC-005 | Lipsă rate limiting pe autentificare | `backend/app/api/v1/auth.py` | Brute force |
| SEC-006 | Lipsă validare MIME type la upload | `backend/app/api/v1/onboarding.py` | File injection |
| SEC-007 | Path traversal potențial la upload | `backend/app/api/v1/onboarding.py:151` | Acces neautorizat |

### 2.3 Recomandări Securitate
1. Implementare whitelist de domenii email pentru înregistrare
2. Token blacklist în Redis pentru logout
3. Rate limiting cu Redis (ex: 5 încercări / 15 min)
4. Validare magic bytes pentru fișiere
5. Sanitizare nume fișier la upload

---

## 3. PROBLEME DE LOGICĂ / ARHITECTURĂ

### 3.1 Marketplace (Date Simulate vs Reale)

**Status Actual:** Toate listările din marketplace sunt generate aleatoriu la fiecare request.

```python
# backend/app/services/simulation.py
def generate_cea_sellers(self, count: int = 50) -> List[Dict]:
    # Generează vânzători simulați - datele NU sunt persistate
```

**Probleme:**
- Nu există Certificate reale în baza de date (modelul există, dar nu e populat)
- Căutarea unui listing după `anonymous_code` generează date noi la fiecare request
- Nu există funcționalitate de a crea listing-uri de vânzare
- Statisticile de piață sunt calculate pe date fictive

**Necesar pentru producție:**
- API endpoint pentru crearea listing-urilor de către utilizatori FUNDED
- Persistare certificate în tabelul `certificates`
- Logică de matching buyer-seller
- Sistem de rezervare/blocare certificate

### 3.2 Sistem de Trading (NEIMPLEMENTAT)

**Status Actual:** Nu există niciun endpoint pentru a executa un trade.

**Modelul Trade există dar nu e folosit:**
```python
# backend/app/models/models.py
class Trade(Base):
    __tablename__ = "trades"
    # ... definit dar niciodată creat
```

**Lipsesc:**
- `POST /api/v1/trades` - Inițiere tranzacție
- `PUT /api/v1/trades/{id}/confirm` - Confirmare
- `PUT /api/v1/trades/{id}/complete` - Finalizare
- Workflow de settlement (decontare)
- Notificări email la fiecare etapă

### 3.3 Sistem de Swap (PARȚIAL IMPLEMENTAT)

**Status Actual:** Calculatorul de swap funcționează, dar nu se pot crea/executa swap-uri.

**Implementat:**
- `GET /swaps/available` - Listare (date simulate)
- `GET /swaps/rate` - Rată de schimb curentă
- `GET /swaps/calculator` - Calculator

**Lipsesc:**
- `POST /api/v1/swaps` - Creare cerere swap
- `PUT /api/v1/swaps/{id}/accept` - Acceptare swap
- `PUT /api/v1/swaps/{id}/cancel` - Anulare
- Sistem de matching automat
- Execuția efectivă a swap-ului

### 3.4 Sistem de Fonduri / Balanțe (NEIMPLEMENTAT)

**Status Actual:** Rolul FUNDED există dar nu are funcționalitate asociată.

**Lipsesc complet:**
- Model `Wallet` sau `Balance` pentru utilizatori
- Model `Deposit` pentru depozite
- Model `Withdrawal` pentru retrageri
- Integrare gateway de plăți
- Tracking balanță per tip certificat

### 3.5 Prețuri și Scraping

**Status Actual:** Scraper-ul returnează prețuri hardcodate cu varianță aleatorie.

```python
# backend/app/services/price_scraper.py
EUA_BASE_PRICE = 75.0  # EUR
CEA_BASE_PRICE = 100.0  # CNY
```

**Probleme:**
- Nu există surse de scraping configurate implicit
- Tabelul `ScrapingSource` este gol
- Metodele de scraping (Selenium, Playwright) sunt placeholder

---

## 4. API ENDPOINTS - STATUS IMPLEMENTARE

### 4.1 Complet Implementate ✅

| Modul | Endpoint | Status |
|-------|----------|--------|
| Auth | `POST /auth/magic-link` | ✅ Funcțional |
| Auth | `POST /auth/verify` | ✅ Funcțional |
| Auth | `POST /auth/login` | ✅ Funcțional |
| Contact | `POST /contact/request` | ✅ Funcțional |
| Prices | `GET /prices/current` | ✅ (date simulate) |
| Prices | `WebSocket /prices/ws` | ✅ Funcțional |
| Onboarding | `GET /onboarding/status` | ✅ Funcțional |
| Onboarding | `POST /onboarding/documents` | ✅ Funcțional |
| Onboarding | `POST /onboarding/submit` | ✅ Funcțional |
| Admin | `GET /admin/users` | ✅ Funcțional |
| Admin | `POST /admin/users` | ✅ Funcțional |
| Backoffice | `PUT /backoffice/users/{id}/approve` | ✅ Funcțional |
| Backoffice | `PUT /backoffice/users/{id}/fund` | ✅ Funcțional |

### 4.2 Parțial Implementate ⚠️

| Modul | Endpoint | Problemă |
|-------|----------|----------|
| Marketplace | `GET /marketplace/cea` | Date simulate, nu reale |
| Marketplace | `GET /marketplace/eua` | Date simulate, nu reale |
| Marketplace | `GET /marketplace/listing/{code}` | Listing-ul se regenerează |
| Swaps | `GET /swaps/available` | Date simulate |
| Swaps | `GET /swaps/calculator` | Doar calcul, nu execuție |
| Prices | `GET /prices/history` | Date hardcodate |

### 4.3 Lipsă / Neimplementate ❌

| Modul | Endpoint Necesar | Prioritate |
|-------|------------------|------------|
| Certificates | `POST /certificates` - Creare listing | CRITICĂ |
| Certificates | `PUT /certificates/{id}` - Actualizare | CRITICĂ |
| Certificates | `DELETE /certificates/{id}` - Ștergere | CRITICĂ |
| Certificates | `GET /certificates/my` - Certificatele mele | CRITICĂ |
| Trading | `POST /trades` - Inițiere trade | CRITICĂ |
| Trading | `PUT /trades/{id}/confirm` | CRITICĂ |
| Trading | `PUT /trades/{id}/complete` | CRITICĂ |
| Trading | `GET /trades/my` - Tranzacțiile mele | ÎNALTĂ |
| Swaps | `POST /swaps` - Creare cerere swap | CRITICĂ |
| Swaps | `PUT /swaps/{id}/accept` | CRITICĂ |
| Swaps | `PUT /swaps/{id}/cancel` | MEDIE |
| Wallet | `GET /wallet/balance` | CRITICĂ |
| Wallet | `POST /wallet/deposit` | CRITICĂ |
| Wallet | `POST /wallet/withdraw` | ÎNALTĂ |
| Notifications | `GET /notifications` | MEDIE |
| Notifications | `WebSocket /notifications/ws` | MEDIE |

---

## 5. MODELE DE DATE - ANALIZĂ

### 5.1 Modele Existente și Status

| Model | Status | Utilizare |
|-------|--------|-----------|
| `User` | ✅ Complet | Folosit activ |
| `Entity` | ✅ Complet | Folosit parțial |
| `ContactRequest` | ✅ Complet | Folosit activ |
| `Certificate` | ⚠️ Definit | NU este populat/folosit |
| `Trade` | ⚠️ Definit | NU este creat niciodată |
| `SwapRequest` | ⚠️ Definit | NU este creat niciodată |
| `PriceHistory` | ⚠️ Definit | NU este populat |
| `ActivityLog` | ✅ Complet | Folosit activ |
| `KYCDocument` | ✅ Complet | Folosit activ |
| `ScrapingSource` | ⚠️ Definit | Tabel gol |
| `UserSession` | ⚠️ Definit | NU este creat la login |

### 5.2 Modele Lipsă (Recomandate)

```python
# Modele necesare pentru funcționalitate completă

class Wallet(Base):
    """Portofel utilizator pentru balanțe"""
    __tablename__ = "wallets"

    id = Column(UUID, primary_key=True)
    entity_id = Column(UUID, ForeignKey("entities.id"))
    currency = Column(String(3))  # EUR, USD, CNY
    balance = Column(Numeric(18, 4))
    available_balance = Column(Numeric(18, 4))
    locked_balance = Column(Numeric(18, 4))


class CertificateHolding(Base):
    """Dețineri certificate per entity"""
    __tablename__ = "certificate_holdings"

    id = Column(UUID, primary_key=True)
    entity_id = Column(UUID, ForeignKey("entities.id"))
    certificate_type = Column(Enum(CertificateType))
    quantity = Column(Numeric(18, 2))
    available_quantity = Column(Numeric(18, 2))
    locked_quantity = Column(Numeric(18, 2))


class Deposit(Base):
    """Depozite fonduri"""
    __tablename__ = "deposits"

    id = Column(UUID, primary_key=True)
    entity_id = Column(UUID, ForeignKey("entities.id"))
    amount = Column(Numeric(18, 4))
    currency = Column(String(3))
    status = Column(Enum(DepositStatus))
    payment_reference = Column(String(100))


class Notification(Base):
    """Notificări utilizator"""
    __tablename__ = "notifications"

    id = Column(UUID, primary_key=True)
    user_id = Column(UUID, ForeignKey("users.id"))
    type = Column(String(50))  # trade, kyc, deposit, etc.
    title = Column(String(255))
    message = Column(Text)
    is_read = Column(Boolean, default=False)
    data = Column(JSON)
```

---

## 6. FRONTEND - ANALIZĂ

### 6.1 Pagini și Status

| Pagină | Rută | Status | Probleme |
|--------|------|--------|----------|
| Login | `/login` | ✅ OK | - |
| Onboarding | `/onboarding` | ⚠️ Parțial | Protecția de rol dezactivată |
| Dashboard | `/dashboard` | ⚠️ Parțial | Statistici simulate |
| Marketplace | `/marketplace` | ⚠️ Parțial | Nu se poate cumpăra |
| Swap | `/swap` | ⚠️ Parțial | Nu se poate executa swap |
| Profile | `/profile` | ✅ OK | - |
| Backoffice | `/backoffice` | ✅ OK | - |
| Users | `/users` | ✅ OK | - |
| Settings | `/settings` | ⚠️ Placeholder | Funcționalitate limitată |

### 6.2 Componente Lipsă

- `TradeModal` - Modal pentru inițiere trade
- `SwapModal` - Modal pentru creare cerere swap
- `WalletWidget` - Afișare balanță
- `NotificationBell` - Indicator notificări
- `TradeHistory` - Istoric tranzacții
- `CertificateCard` - Card pentru certificatele proprii

### 6.3 State Management (Zustand)

**Store-uri existente:**
- `useAuthStore` - ✅ Complet
- `usePricesStore` - ✅ Complet
- `useMarketStore` - ⚠️ Doar statistici
- `useUIStore` - ✅ Complet

**Store-uri necesare:**
- `useWalletStore` - Balanțe și tranzacții
- `useNotificationStore` - Notificări
- `useTradeStore` - Trade-uri în desfășurare

---

## 7. WORKFLOW-URI DE BUSINESS

### 7.1 Workflow KYC (IMPLEMENTAT ✅)

```
[Utilizator nou]
    → Magic Link → Login
    → PENDING role
    → Upload 7 documente KYC
    → Submit pentru review

[Admin Backoffice]
    → Revizuire documente
    → Approve/Reject fiecare document
    → Approve utilizator → APPROVED role

[Admin]
    → Fund utilizator → FUNDED role
    → Acces complet marketplace
```

### 7.2 Workflow Trading (DE IMPLEMENTAT ❌)

```
[Vânzător FUNDED]
    → Creare listing certificate
    → Setare cantitate + preț
    → Listare în marketplace

[Cumpărător FUNDED]
    → Vizualizare marketplace
    → Selectare listing
    → Inițiere trade
    → Confirmare (ambele părți)
    → Settlement (transfer certificate + fonduri)
    → Completare trade
```

### 7.3 Workflow Swap (DE IMPLEMENTAT ❌)

```
[Utilizator A - FUNDED]
    → Creare cerere swap (EUA → CEA)
    → Specificare cantitate + rată dorită
    → Listare în swap center

[Utilizator B - FUNDED]
    → Vizualizare cereri swap
    → Acceptare cerere compatibilă
    → Matching automat sau manual
    → Execuție swap
    → Actualizare balanțe certificate
```

---

## 8. PRIORITĂȚI DE IMPLEMENTARE

### Fază 1 - Core Trading (CRITIC)
1. Model `Wallet` și `CertificateHolding`
2. API pentru listing certificate (`POST /certificates`)
3. API pentru trading (`POST /trades`, confirm, complete)
4. Persistare certificate reale în DB
5. Frontend: Modal de trade, afișare balanțe

### Fază 2 - Swap System (ÎNALT)
1. API pentru swap (`POST /swaps`, accept, cancel)
2. Algoritm de matching
3. Frontend: Modal swap, status tracking

### Fază 3 - Payments (ÎNALT)
1. Model `Deposit` și `Withdrawal`
2. Integrare payment gateway
3. Frontend: Pagină wallet, istoric

### Fază 4 - Polish (MEDIU)
1. Notificări real-time
2. Scraping prețuri real
3. Rapoarte și export
4. Email templates pentru toate acțiunile

---

## 9. SPAȚIU PENTRU SPECIFICAȚII

> **NOTĂ:** Această secțiune este rezervată pentru specificațiile și documentația pe care dorești să le adaugi. După ce le completezi, voi putea analiza cerințele și te voi ajuta să finalizezi implementarea.

### 9.1 Specificații Business (DE COMPLETAT)

```
[Adaugă aici specificațiile de business]
- Reguli de trading
- Comisioane
- Limite tranzacții
- Etc.
```

### 9.2 Specificații Tehnice (DE COMPLETAT)

```
[Adaugă aici specificațiile tehnice]
- Integrări externe
- API-uri terțe
- Cerințe de performanță
- Etc.
```

### 9.3 Workflow-uri Specifice (DE COMPLETAT)

```
[Adaugă aici workflow-urile detaliate]
- Proces de onboarding complet
- Proces de trading
- Proces de settlement
- Etc.
```

---

## 10. CONCLUZII

### Ce funcționează bine:
- Autentificare (Magic Link + Password)
- Sistem KYC complet
- Admin panel funcțional
- Backoffice pentru aprobare utilizatori
- Structura de cod curată și modernă

### Ce trebuie implementat:
- **CRITIC:** Sistemul de trading real
- **CRITIC:** Persistare certificate în DB
- **ÎNALT:** Sistemul de swap funcțional
- **ÎNALT:** Wallet și balanțe
- **MEDIU:** Notificări
- **MEDIU:** Prețuri din surse reale

### Estimare efort:
- Fază 1 (Core Trading): ~40-60 ore dezvoltare
- Fază 2 (Swap): ~20-30 ore
- Fază 3 (Payments): ~30-40 ore (depinde de gateway)
- Fază 4 (Polish): ~20-30 ore

---

**Următorii pași:** Completează secțiunea 9 cu specificațiile tale, apoi putem începe implementarea în ordinea priorităților.
