# Plan: Backoffice – conformitate interfață cu tema și design system

## Context

Utilizatorul a verificat în browser `http://localhost:5173/backoffice` și a observat că lipsește header-ul și că interfața trebuie aliniată la cerințele stricte de interfață (componente, stiluri, temă) care standardizează platforma.

## Surse de adevăr

- **Layout backoffice**: `.cursor/rules/backoffice.mdc` – structură cu **Header (global navigation)** apoi Subheader apoi SubSubHeader.
- **Design system**: `frontend/docs/DESIGN_SYSTEM.md` – culori (navy, emerald, amber, blue, red), tipografie (page-title, section-heading, text-value), spacing, border-radius (rounded-xl butoane, rounded-2xl carduri), componente (Button, Input, Card, Badge).
- **Interfață**: `docs/commands/interface.md` – tokeni centralizați, fără culori/spacing hardcodat.
- **App truth**: `app_truth.md` – backoffice fără Layout principal (fără Header/Footer site), dar fiecare pagină folosește BackofficeLayout.

## Ce este implementat acum

- **BackofficeLayout** (`frontend/src/components/layout/BackofficeLayout.tsx`): conține doar **Subheader** (icon, titlu "Backoffice", descriere, nav: Back to site + Market Makers, Market Orders, etc.) și opțional **SubSubHeader**; **nu** conține un rând de tip Header (brand, user, logout).
- **Subheader** (`frontend/src/components/common/Subheader.tsx`): bară cu icon, title, description, children (nav links); stil: `bg-navy-800 border-b border-navy-700 px-6 py-4`.
- **SubSubHeader**: bară sub Subheader pentru acțiuni/filtre; stil: `bg-navy-900/80 border-b border-navy-800 px-6 py-3`.
- **Container**: `min-h-screen bg-navy-950`, conținut în `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8`.

Conform `backoffice.mdc`, structura cerută este:

```
│ Header (global navigation)     │  ← lipsește
├─────────────────────────────────┤
│ Subheader (compact nav)         │  ← există
├─────────────────────────────────┤
│ SubSubHeader (page actions)    │  ← există când e pasat
├─────────────────────────────────┤
│ Main Content                    │
```

## Modificări necesare

### 1. Adăugare Header backoffice (primul rând)

- **Scop**: primul rând vizual cu brand, navigare globală și user (logout), aliniat la tema platformei.
- **Fișiere**: 
  - `frontend/src/components/layout/BackofficeLayout.tsx` – randare Header înainte de Subheader.
  - Nou (opțional): `frontend/src/components/layout/BackofficeHeader.tsx` – componentă dedicată sau încorporare în BackofficeLayout.
- **Comportament**:
  - Stânga: logo/brand (ex. Logo Nihao sau text "Nihao Backoffice") cu link către `/backoffice` sau `/dashboard`.
  - Dreapta: link "Back to site" (către `/dashboard`) și user menu (avatar + dropdown: profil/logout), eventual toggle temă (dacă se folosește în restul app).
- **Stiluri (design system)**:
  - Fundal: `bg-navy-900` sau `bg-navy-800`, `border-b border-navy-700`.
  - Înălțime fixă: `h-16` sau `h-14`, aliniat cu Header-ul site-ului principal (`h-16 md:h-20`).
  - Butoane/linkuri: `rounded-xl`, text `text-sm font-medium`, culori `text-navy-300` / `hover:text-white`, `hover:bg-navy-700`.
  - Fără culori hardcodate (hex/RGB); doar tokeni Tailwind navy/emerald.

### 2. Subheader – aliniere la design system

- **Fișier**: `frontend/src/components/common/Subheader.tsx`.
- **Modificări**:
  - Titlu: folosire clasă tipografie design system (ex. `section-heading` sau `text-xl font-bold`) pentru titlu; păstrare `text-white` în context dark backoffice.
  - Descriere: `text-sm text-navy-400` (deja apropiat; asigurare consistență).
  - Container: păstrare `max-w-7xl mx-auto`; spacing `px-6 py-4` este ok (space-6/4).
- **BackofficeLayout** – linkurile din Subheader (Back to site, Market Makers, etc.):
  - Butoane nav: `rounded-xl` în loc de `rounded-lg` (conform DESIGN_SYSTEM: butoane `rounded-xl`).
  - Clase: `px-4 py-2` sau `px-3 py-2` + `text-sm font-medium`; active: `bg-navy-600 text-white`; inactive: `text-navy-400 hover:bg-navy-700 hover:text-navy-300`.

### 3. SubSubHeader – verificare tokeni

- **Fișier**: `frontend/src/components/common/SubSubHeader.tsx`.
- **Verificare**: deja folosește `bg-navy-900/80`, `border-navy-800`; fără hex. Poate fi lăsat ca atare sau aliniat la aceeași bordură ca Subheader (`border-navy-700`) pentru consistență.

### 4. BackofficeLayout – container și fundal

- **Fișier**: `frontend/src/components/layout/BackofficeLayout.tsx`.
- **Fundal**: `bg-navy-950` este definit în Tailwind (navy.950). Design system folosește pentru dark `navy-900` ca background principal; `navy-950` este acceptabil pentru backoffice (contrast mai puternic). Alternativă: `bg-navy-900` pentru aliniere strictă la tokeni doc.
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8` – corect; spacing conform design system (space-8, padding responsive).

### 5. Pagini backoffice – componente și stiluri

- **Fișiere**: `frontend/src/pages/BackofficePage.tsx`, `BackofficeDepositsPage.tsx`, plus componente din `frontend/src/components/backoffice/`.
- **Verificări**:
  - Butoane: folosire componentă `Button` din `components/common` cu variantele din design system (primary, secondary, outline, ghost); `rounded-xl`, mărimi `size="sm"|"md"|"lg"`.
  - Carduri/tabele: `rounded-2xl` pentru carduri, `rounded-xl` pentru tabele în container; borduri `border-navy-700`; shadow `shadow-lg` unde e cazul.
  - Badge-uri: stiluri din DESIGN_SYSTEM (status, certificate, trading); `rounded-full` + culori emerald/red/amber/blue.
  - Fără culori hardcodate; doar navy, emerald, amber, blue, red din Tailwind.
- **Tabs** (BackofficePage): butoane tab – `rounded-xl`; stiluri active/inactive deja folosesc navy; verificare accesibilitate (aria, focus).

### 6. Rezumat priorități

| Prioritate | Modificare | Fișier(e) |
|------------|------------|-----------|
| 1 | Adăugare Header backoffice (brand + Back to site + user menu) | BackofficeLayout.tsx, eventual BackofficeHeader.tsx |
| 2 | Subheader: butoane nav cu `rounded-xl`, tipografie titlu | Subheader.tsx, BackofficeLayout.tsx |
| 3 | Verificare SubSubHeader și container layout | SubSubHeader.tsx, BackofficeLayout.tsx |
| 4 | Audit pagini/tab-uri backoffice: Button, carduri, badge-uri, fără hex | BackofficePage.tsx, componente backoffice |

## Algoritm / ordine de implementare

1. Creează sau extinde BackofficeLayout cu un rând Header (brand, Back to site, user + logout).
2. Actualizează Subheader și linkurile din BackofficeLayout la `rounded-xl` și clase tipografie.
3. Verifică SubSubHeader și fundal/container BackofficeLayout.
4. Parcurge BackofficePage și componentele backoffice (ContactRequestsTab, PendingDepositsTab, KYCReviewTab, etc.) și înlocuiește orice stiluri care nu respectă design system (butoane, carduri, badge-uri, culori).

## Note

- Backoffice rutează în afara Layout-ului principal; nu se folosește Header-ul site-ului (Layout.tsx). Header-ul nou este **specific backoffice** și trebuie să ofere aceeași senzație de „top bar” (brand + user).
- Dacă utilizatorul nu este autentificat, ruta `/backoffice` este protejată (AdminRoute) și face redirect la login – deci Header-ul backoffice se vede doar pentru admin autentificat.
- Pentru specificații UI detaliate (mockup, spacing exact) se poate folosi `@interface.md` și eventual un fișier `docs/features/0005_UI_SPEC.md`.
