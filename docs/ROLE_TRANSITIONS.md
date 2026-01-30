# Reguli de tranziție: De la → La (role / status)

**Sursă unică de adevăr.** Platforma folosește DOAR aceste tranziții. Nu există schimbări arbitrare de role; fiecare tranziție este declanșată de acțiunea indicată.

| De la → La | Condiție / acțiune |
|------------|--------------------|
| **NDA → KYC** | Backoffice: Approve & Create User → `user.role = KYC`, `contact_request.user_role = KYC`. |
| **KYC → REJECTED** | Backoffice: Reject KYC (apel `reject_user`). |
| **KYC → APPROVED** | Backoffice: Approve KYC (apel `approve_user`); `entity.kyc_status = APPROVED`. |
| **APPROVED → FUNDING** | La primul `announce_deposit` reușit pentru entity (în `deposit_service`). |
| **FUNDING → AML** | Backoffice confirmă primirea fondurilor: apel `confirm_deposit` (în `deposit_service`). |
| **AML → CEA** | Backoffice execută `clear_deposit` (AML cleared, entity credited). |
| **FUNDING / AML → REJECTED** | Backoffice apel `reject_deposit` (AML reject). |
| **CEA → CEA_SETTLE** | După debit EUR (ex. achiziție CEA), când `entity EUR balance = 0` (în `role_transitions`). |
| **CEA_SETTLE → SWAP** | Toate batch-urile `CEA_PURCHASE` pentru entity sunt `SETTLED` (în `transition_cea_settle_to_swap_if_all_cea_settled`). |
| **SWAP → EUA_SETTLE** | `Balance CEA = 0` (în `transition_swap_to_eua_settle_if_cea_zero`). |
| **EUA_SETTLE → EUA** | Toate batch-urile `SWAP_CEA_TO_EUA` pentru entity sunt `SETTLED` (în `transition_eua_settle_to_eua_if_all_swap_settled`). |

## Implicații

- **MM (Market Maker)**: Rol creat și gestionat strict de admin. Nu trece prin cereri de contact sau aprobări. Admin creează useri MM din Users (Create User, rol MM) și poate modifica rolul lor (Edit User) sau orice alt câmp.
- **Contact request**: Starea se citește din `contact_request.user_role` (NDA, KYC, REJECTED). PUT contact-requests permite actualizarea `user_role`; când se setează REJECTED, userul legat (dacă există) devine REJECTED. Badge-ul în listă folosește `contact_request.user_role`.
- **User role**: Nu există endpoint pentru schimbare arbitrară de role pentru userii din flow (NDA → EUA). Tranzițiile se fac doar prin: create-from-request, approve_user, reject_user, announce_deposit, confirm_deposit, clear_deposit, reject_deposit, și funcțiile din `role_transitions`. Pentru MM, admin poate seta sau schimba rolul direct (PUT /admin/users/{id}).
- **APPROVED → FUNDING**: Doar prin primul `announce_deposit` reușit; nu există „fund user” manual.
