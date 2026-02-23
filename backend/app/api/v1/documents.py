"""
Document Library API — serves platform legal documents based on user role.

Each document is mapped to a phase in the user journey (F0–F7).
The endpoint filters documents by the authenticated user's current role,
returning only the documents they are entitled to see at their stage.

Phase mapping:
  F0 (Internal/Admin)    → ADMIN only
  F1 (PRE_NDA → NDA)     → NDA+ (first client document)
  F2 (KYC → APPROVED)    → KYC+
  F3 (APPROVED)           → APPROVED+
  F4 (FUNDING → CEA)      → FUNDING+
  F5 (CEA → EUA)          → CEA+
  F6 (Ongoing/Periodic)   → CEA+ (reports)
  F7 (Reference/Internal) → ADMIN only
"""

import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_current_user
from ...models.models import UserRole

router = APIRouter(prefix="/documents", tags=["documents"])

# ---------------------------------------------------------------------------
# Role hierarchy for progressive access
# ---------------------------------------------------------------------------

ROLE_ORDER = [
    UserRole.PRE_NDA,
    UserRole.NDA,
    UserRole.KYC,
    UserRole.APPROVED,
    UserRole.FUNDING,
    UserRole.AML,
    UserRole.CEA,
    UserRole.CEA_SETTLE,
    UserRole.SWAP,
    UserRole.EUA_SETTLE,
    UserRole.EUA,
]

def role_index(role: UserRole) -> int:
    """Return the numeric index of a role in the onboarding flow. -1 for non-flow roles."""
    try:
        return ROLE_ORDER.index(role)
    except ValueError:
        return -1


def user_has_min_role(user_role: UserRole, min_role: UserRole) -> bool:
    """Check if user_role is at least min_role in the onboarding flow."""
    if user_role == UserRole.ADMIN:
        return True
    if user_role == UserRole.MM:
        # MM has same access as EUA for trading documents
        return role_index(min_role) <= role_index(UserRole.EUA)
    idx = role_index(user_role)
    min_idx = role_index(min_role)
    if idx == -1 or min_idx == -1:
        return False
    return idx >= min_idx


# ---------------------------------------------------------------------------
# Document catalog — Single Source of Truth for all 29 platform documents
# ---------------------------------------------------------------------------

class PlatformDocument(BaseModel):
    """A document in the NIHA platform document library."""
    id: str
    title: str
    title_ro: str  # Romanian title
    filename: str
    phase: str  # F0–F7
    phase_name: str
    category: str  # 'legal', 'compliance', 'operational', 'trading', 'reporting', 'internal'
    description: str
    description_ro: str
    min_role: str  # Minimum role required to access
    admin_only: bool
    trigger: str  # When this document becomes relevant
    audience: str  # Who the document is for


# The complete catalog of 29 documents + Document Plan
DOCUMENT_CATALOG: list[dict] = [
    # =========================================================================
    # F0 — Internal / Pre-Contact (ADMIN only)
    # =========================================================================
    {
        "id": "board_resolution",
        "title": "Board Resolution — Carbon Trading Authorization",
        "title_ro": "Rezoluția Consiliului — Autorizare Tranzacționare Carbon",
        "filename": "NIHA_Board_Resolution_Carbon_Trading.pdf",
        "phase": "F0",
        "phase_name": "Internal / Pre-Contact",
        "category": "legal",
        "description": "Board resolution authorizing NIHA to conduct carbon credit trading activities",
        "description_ro": "Rezoluția consiliului care autorizează NIHA să desfășoare activități de tranzacționare a creditelor de carbon",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Platform setup — before any client onboarding",
        "audience": "Board of Directors, Compliance Officer",
    },
    {
        "id": "compliance_policy",
        "title": "Compliance Policy Manual",
        "title_ro": "Manual de Politici de Conformitate",
        "filename": "NIHA_Compliance_Policy_Manual.pdf",
        "phase": "F0",
        "phase_name": "Internal / Pre-Contact",
        "category": "compliance",
        "description": "Internal AML/KYC compliance policies and procedures",
        "description_ro": "Politici și proceduri interne de conformitate AML/KYC",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Platform setup — governs all compliance workflows",
        "audience": "Compliance team, Backoffice operators",
    },
    {
        "id": "legal_framework",
        "title": "Legal & Regulatory Framework",
        "title_ro": "Cadrul Legal și Reglementar",
        "filename": "NIHA_Legal_Regulatory_Framework.pdf",
        "phase": "F0",
        "phase_name": "Internal / Pre-Contact",
        "category": "legal",
        "description": "Comprehensive legal framework for cross-border carbon trading (HK-EU-PRC)",
        "description_ro": "Cadrul legal comprehensiv pentru tranzacționarea transfrontalieră de carbon (HK-UE-PRC)",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Platform setup — legal foundation",
        "audience": "Legal counsel, Compliance Officer",
    },
    {
        "id": "regulatory_position",
        "title": "Regulatory Position Memorandum",
        "title_ro": "Memorandum de Poziție Reglementară",
        "filename": "NIHA_Regulatory_Position_Memorandum.pdf",
        "phase": "F0",
        "phase_name": "Internal / Pre-Contact",
        "category": "legal",
        "description": "NIHA's regulatory position as facilitator/intermediary, not market maker",
        "description_ro": "Poziția reglementară a NIHA ca facilitator/intermediar, nu market maker",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Platform setup — regulatory justification",
        "audience": "Legal counsel, Regulators (upon request)",
    },
    {
        "id": "legal_opinion",
        "title": "Independent Legal Opinion",
        "title_ro": "Opinie Juridică Independentă",
        "filename": "NIHA_Independent_Legal_Opinion.pdf",
        "phase": "F0",
        "phase_name": "Internal / Pre-Contact",
        "category": "legal",
        "description": "Independent legal opinion on NIHA's operating structure and compliance",
        "description_ro": "Opinie juridică independentă privind structura operațională și conformitatea NIHA",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Platform setup — external legal validation",
        "audience": "Board, Legal counsel, Auditors",
    },
    {
        "id": "bcp",
        "title": "Business Continuity Plan",
        "title_ro": "Planul de Continuitate a Afacerii",
        "filename": "NIHA_Business_Continuity_Plan.pdf",
        "phase": "F0",
        "phase_name": "Internal / Pre-Contact",
        "category": "operational",
        "description": "Disaster recovery and business continuity procedures",
        "description_ro": "Proceduri de recuperare în caz de dezastru și continuitate a afacerii",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Platform setup — operational resilience",
        "audience": "Operations team, IT, Management",
    },
    {
        "id": "insurance",
        "title": "Insurance Certificate (PI & Crime)",
        "title_ro": "Certificat de Asigurare (PI & Crime)",
        "filename": "NIHA_Insurance_Certificate_PI_Crime.pdf",
        "phase": "F0",
        "phase_name": "Internal / Pre-Contact",
        "category": "operational",
        "description": "Professional indemnity and crime insurance coverage details",
        "description_ro": "Detalii privind acoperirea asigurării profesionale și împotriva criminalității",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Platform setup — risk mitigation",
        "audience": "Management, Legal counsel, Clients (upon request)",
    },
    {
        "id": "trade_execution_policy",
        "title": "Trade Execution Policy",
        "title_ro": "Politica de Execuție a Tranzacțiilor",
        "filename": "NIHA_Trade_Execution_Policy.pdf",
        "phase": "F0",
        "phase_name": "Internal / Pre-Contact",
        "category": "operational",
        "description": "Best execution policy for carbon credit trading",
        "description_ro": "Politica de execuție optimă pentru tranzacționarea creditelor de carbon",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Platform setup — governs trade execution",
        "audience": "Trading team, Compliance, Clients (summary)",
    },

    # =========================================================================
    # F1 — PRE_NDA → NDA (First client touchpoint)
    # =========================================================================
    {
        "id": "nda",
        "title": "Non-Disclosure Agreement",
        "title_ro": "Acord de Confidențialitate (NDA)",
        "filename": "Nihao_Group_NDA.pdf",
        "phase": "F1",
        "phase_name": "Onboarding — NDA",
        "category": "legal",
        "description": "Mutual NDA — first document signed by the client. Required before any business information is shared.",
        "description_ro": "NDA mutual — primul document semnat de client. Necesar înainte de partajarea oricărei informații de afaceri.",
        "min_role": "NDA",
        "admin_only": False,
        "trigger": "PRE_NDA → NDA: Client uploads signed NDA at /pre-nda or /onboarding",
        "audience": "Client (signatory), NIHA (counter-signatory)",
    },

    # =========================================================================
    # F2 — KYC → APPROVED (Due diligence phase)
    # =========================================================================
    {
        "id": "kyc_form",
        "title": "Client Onboarding & KYC Form",
        "title_ro": "Formular de Onboarding și KYC",
        "filename": "Nihao_Group_KYC_Application.pdf",
        "phase": "F2",
        "phase_name": "Onboarding — KYC",
        "category": "compliance",
        "description": "Know Your Customer form — entity information, beneficial ownership, source of funds",
        "description_ro": "Formular KYC — informații entitate, beneficiar real, sursa fondurilor",
        "min_role": "KYC",
        "admin_only": False,
        "trigger": "NDA → KYC: Admin approves NDA and creates user",
        "audience": "Client (submitter), Compliance team (reviewer)",
    },
    {
        "id": "cdd_report",
        "title": "Client Due Diligence Report",
        "title_ro": "Raport de Due Diligence al Clientului",
        "filename": "NIHA_Client_Due_Diligence_Report.pdf",
        "phase": "F2",
        "phase_name": "Onboarding — KYC",
        "category": "compliance",
        "description": "Internal CDD assessment template — risk scoring, PEP checks, sanctions screening",
        "description_ro": "Șablon intern de evaluare CDD — scor de risc, verificări PEP, screening sancțiuni",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "KYC submission — admin performs due diligence",
        "audience": "Compliance team (internal only)",
    },
    {
        "id": "counterparty_risk",
        "title": "Counterparty Risk Assessment Framework",
        "title_ro": "Cadrul de Evaluare a Riscului de Contraparte",
        "filename": "NIHA_Counterparty_Risk_Assessment_Framework.pdf",
        "phase": "F2",
        "phase_name": "Onboarding — KYC",
        "category": "compliance",
        "description": "Risk assessment methodology for evaluating new counterparties",
        "description_ro": "Metodologia de evaluare a riscului pentru evaluarea noilor contrapărți",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "KYC phase — internal risk assessment",
        "audience": "Risk team, Compliance (internal only)",
    },
    {
        "id": "risk_disclosure",
        "title": "Risk Disclosure Statement",
        "title_ro": "Declarația de Divulgare a Riscurilor",
        "filename": "Nihao_Group_Risk_Disclosure.pdf",
        "phase": "F2",
        "phase_name": "Onboarding — KYC",
        "category": "legal",
        "description": "Comprehensive risk disclosure — market, regulatory, operational, counterparty risks",
        "description_ro": "Divulgare comprehensivă a riscurilor — piață, reglementare, operațional, contraparte",
        "min_role": "KYC",
        "admin_only": False,
        "trigger": "KYC phase — client must acknowledge risks before approval",
        "audience": "Client (must read and acknowledge)",
    },

    # =========================================================================
    # F3 — APPROVED (Contractual framework)
    # =========================================================================
    {
        "id": "msa",
        "title": "Master Service Agreement",
        "title_ro": "Acordul Cadru de Servicii (MSA)",
        "filename": "Nihao_Group_MSA.pdf",
        "phase": "F3",
        "phase_name": "Approved — Contracts",
        "category": "legal",
        "description": "Master agreement governing all NIHA services — fees, settlement, liability, termination",
        "description_ro": "Acordul cadru care guvernează toate serviciile NIHA — comisioane, decontare, răspundere, reziliere",
        "min_role": "APPROVED",
        "admin_only": False,
        "trigger": "KYC → APPROVED: Admin approves KYC",
        "audience": "Client (signatory), NIHA (counter-signatory)",
    },
    {
        "id": "custody",
        "title": "Custody Agreement",
        "title_ro": "Acord de Custodie",
        "filename": "Nihao_Group_Custody_Agreement.pdf",
        "phase": "F3",
        "phase_name": "Approved — Contracts",
        "category": "legal",
        "description": "Asset custody terms — segregation, safekeeping, reporting, insurance",
        "description_ro": "Termeni de custodie a activelor — segregare, păstrare, raportare, asigurare",
        "min_role": "APPROVED",
        "admin_only": False,
        "trigger": "KYC → APPROVED: Signed alongside MSA",
        "audience": "Client (signatory), NIHA (counter-signatory)",
    },
    {
        "id": "fee_schedule",
        "title": "Fee Schedule 2026",
        "title_ro": "Graficul Comisioanelor 2026",
        "filename": "Nihao_Group_Fee_Schedule.pdf",
        "phase": "F3",
        "phase_name": "Approved — Contracts",
        "category": "operational",
        "description": "Complete fee structure — CEA 1.5%, Swap 2.0%, custody, settlement fees",
        "description_ro": "Structura completă a comisioanelor — CEA 1.5%, Swap 2.0%, custodie, decontare",
        "min_role": "APPROVED",
        "admin_only": False,
        "trigger": "KYC → APPROVED: Part of contract package",
        "audience": "Client, Account managers",
    },
    {
        "id": "derivatives",
        "title": "Carbon Derivatives Master Agreement",
        "title_ro": "Acordul Cadru pentru Derivate de Carbon",
        "filename": "Nihao_Group_Derivatives_Agreement.pdf",
        "phase": "F3",
        "phase_name": "Approved — Contracts",
        "category": "legal",
        "description": "Framework for CEA-EUA swap transactions — terms, settlement, netting",
        "description_ro": "Cadrul pentru tranzacții swap CEA-EUA — termeni, decontare, compensare",
        "min_role": "APPROVED",
        "admin_only": False,
        "trigger": "KYC → APPROVED: Required for swap market access",
        "audience": "Client (signatory), NIHA (counter-signatory)",
    },

    # =========================================================================
    # F4 — FUNDING → AML → CEA (Deposit & verification phase)
    # =========================================================================
    {
        "id": "bank_confirmations",
        "title": "Bank Confirmation Letters",
        "title_ro": "Scrisori de Confirmare Bancară",
        "filename": "NIHA_Bank_Confirmation_Letters.pdf",
        "phase": "F4",
        "phase_name": "Funding & Verification",
        "category": "operational",
        "description": "Bank confirmation templates for wire transfers and account verification",
        "description_ro": "Șabloane de confirmare bancară pentru transferuri și verificare cont",
        "min_role": "FUNDING",
        "admin_only": False,
        "trigger": "APPROVED → FUNDING: First announce_deposit triggers role transition",
        "audience": "Client (reference), Banking team",
    },
    {
        "id": "registry_overview",
        "title": "Registry Account Overview",
        "title_ro": "Prezentare Generală Conturi Registru",
        "filename": "NIHA_Registry_Account_Overview.pdf",
        "phase": "F4",
        "phase_name": "Funding & Verification",
        "category": "operational",
        "description": "Overview of carbon registry accounts — CEA (China) and EUA (EU) registries",
        "description_ro": "Prezentarea conturilor de registru carbon — CEA (China) și EUA (UE)",
        "min_role": "FUNDING",
        "admin_only": False,
        "trigger": "FUNDING phase — client understands registry structure",
        "audience": "Client, Operations team",
    },

    # =========================================================================
    # F5 — CEA → EUA (Active trading phase)
    # =========================================================================
    {
        "id": "trade_confirmations",
        "title": "Trade Confirmations (January 2026)",
        "title_ro": "Confirmări de Tranzacții (Ianuarie 2026)",
        "filename": "NIHA_Trade_Confirmations_Jan2026.pdf",
        "phase": "F5",
        "phase_name": "Active Trading",
        "category": "trading",
        "description": "Individual trade confirmation records — CEA purchases and swap transactions",
        "description_ro": "Confirmări individuale de tranzacții — achiziții CEA și tranzacții swap",
        "min_role": "CEA",
        "admin_only": False,
        "trigger": "CEA+: Generated after each trade execution",
        "audience": "Client (confirmation), Compliance (audit trail)",
    },
    {
        "id": "transaction_ledger",
        "title": "Client Transaction Ledger (January 2026)",
        "title_ro": "Registrul Tranzacțiilor Clientului (Ianuarie 2026)",
        "filename": "NIHA_Client_Transaction_Ledger_Jan2026.pdf",
        "phase": "F5",
        "phase_name": "Active Trading",
        "category": "trading",
        "description": "Complete chronological record of all client transactions",
        "description_ro": "Registrul cronologic complet al tuturor tranzacțiilor clientului",
        "min_role": "CEA",
        "admin_only": False,
        "trigger": "CEA+: Updated continuously as trades execute",
        "audience": "Client (portfolio tracking), Compliance",
    },
    {
        "id": "portfolio_statement",
        "title": "Client Portfolio Statement (January 2026)",
        "title_ro": "Extras de Portofoliu al Clientului (Ianuarie 2026)",
        "filename": "NIHA_Client_Portfolio_Statement_Jan2026.pdf",
        "phase": "F5",
        "phase_name": "Active Trading",
        "category": "trading",
        "description": "Monthly portfolio summary — holdings, P&L, asset allocation",
        "description_ro": "Rezumatul lunar al portofoliului — dețineri, P&L, alocarea activelor",
        "min_role": "CEA",
        "admin_only": False,
        "trigger": "CEA+: Monthly statement, available on dashboard",
        "audience": "Client, Account managers",
    },
    {
        "id": "inventory_report",
        "title": "Carbon Credit Inventory Report (January 2026)",
        "title_ro": "Raportul Inventarului de Credite de Carbon (Ianuarie 2026)",
        "filename": "NIHA_Carbon_Credit_Inventory_Report_Jan2026.pdf",
        "phase": "F5",
        "phase_name": "Active Trading",
        "category": "trading",
        "description": "Detailed inventory of carbon credits held — by type, vintage, jurisdiction",
        "description_ro": "Inventarul detaliat al creditelor de carbon deținute — pe tip, vintage, jurisdicție",
        "min_role": "CEA",
        "admin_only": False,
        "trigger": "CEA+: Updated as inventory changes",
        "audience": "Client, Operations, Compliance",
    },

    # =========================================================================
    # F6 — Ongoing / Periodic Reports
    # =========================================================================
    {
        "id": "market_report",
        "title": "Carbon Market Report Q1 2026",
        "title_ro": "Raportul Pieței de Carbon T1 2026",
        "filename": "NIHA_Carbon_Market_Report_Q1_2026.pdf",
        "phase": "F6",
        "phase_name": "Periodic Reports",
        "category": "reporting",
        "description": "Quarterly market analysis — EUA/CEA price trends, regulatory updates, forecasts",
        "description_ro": "Analiză trimestrială de piață — tendințe preț EUA/CEA, actualizări reglementare, previziuni",
        "min_role": "CEA",
        "admin_only": False,
        "trigger": "Quarterly — available to all active trading clients",
        "audience": "All active clients, Management",
    },
    {
        "id": "compliance_report",
        "title": "Annual Compliance Report 2025",
        "title_ro": "Raportul Anual de Conformitate 2025",
        "filename": "NIHA_Annual_Compliance_Report_2025.pdf",
        "phase": "F6",
        "phase_name": "Periodic Reports",
        "category": "reporting",
        "description": "Annual compliance review — AML statistics, training, incident reports",
        "description_ro": "Raportul anual de conformitate — statistici AML, instruire, rapoarte de incidente",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Annual — internal compliance review",
        "audience": "Compliance team, Board, Regulators (upon request)",
    },
    {
        "id": "audit_report",
        "title": "Internal Audit Report 2026",
        "title_ro": "Raportul de Audit Intern 2026",
        "filename": "NIHA_Internal_Audit_Report_2026.pdf",
        "phase": "F6",
        "phase_name": "Periodic Reports",
        "category": "reporting",
        "description": "Internal audit findings — operational effectiveness, risk management, recommendations",
        "description_ro": "Constatări de audit intern — eficiență operațională, managementul riscului, recomandări",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Annual — internal audit cycle",
        "audience": "Board, Audit Committee, Management",
    },

    # =========================================================================
    # F7 — Reference / Internal Tools (ADMIN only)
    # =========================================================================
    {
        "id": "ssot",
        "title": "Single Source of Truth (Platform SSOT)",
        "title_ro": "Sursa Unică de Adevăr (SSOT Platformă)",
        "filename": "NIHA_Single_Source_of_Truth.pdf",
        "phase": "F7",
        "phase_name": "Reference / Internal",
        "category": "internal",
        "description": "Master reference document — all business rules, roles, routes, API endpoints",
        "description_ro": "Documentul de referință principal — toate regulile de business, roluri, rute, endpoint-uri API",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Always available — internal reference",
        "audience": "Development team, Admin, Operations",
    },
    {
        "id": "document_matrix",
        "title": "Document Matrix",
        "title_ro": "Matricea Documentelor",
        "filename": "NIHA_Document_Matrix.pdf",
        "phase": "F7",
        "phase_name": "Reference / Internal",
        "category": "internal",
        "description": "Cross-reference matrix of all platform documents and their relationships",
        "description_ro": "Matricea de referințe încrucișate a tuturor documentelor platformei și relațiilor lor",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "Always available — document management",
        "audience": "Compliance, Legal, Operations",
    },
    {
        "id": "inconsistency_report",
        "title": "Content Inconsistency Report",
        "title_ro": "Raportul de Inconsistențe de Conținut",
        "filename": "NIHA_Content_Inconsistency_Report.pdf",
        "phase": "F7",
        "phase_name": "Reference / Internal",
        "category": "internal",
        "description": "QA report identifying and tracking content inconsistencies across documents",
        "description_ro": "Raport QA care identifică și urmărește inconsistențele de conținut între documente",
        "min_role": "ADMIN",
        "admin_only": True,
        "trigger": "After document updates — QA process",
        "audience": "Legal, Compliance, QA team",
    },
]


def get_documents_for_role(user_role: UserRole) -> list[dict]:
    """Return documents accessible by the given role."""
    results = []
    for doc in DOCUMENT_CATALOG:
        min_role_str = doc["min_role"]

        # Admin-only documents
        if doc["admin_only"]:
            if user_role == UserRole.ADMIN:
                results.append(doc)
            continue

        # Check if user has at least the minimum required role
        try:
            min_role = UserRole(min_role_str)
        except ValueError:
            continue

        if user_has_min_role(user_role, min_role):
            results.append(doc)

    return results


# ---------------------------------------------------------------------------
# Response models
# ---------------------------------------------------------------------------

class DocumentItem(BaseModel):
    id: str
    title: str
    titleRo: str
    filename: str
    phase: str
    phaseName: str
    category: str
    description: str
    descriptionRo: str
    adminOnly: bool
    trigger: str
    audience: str
    downloadUrl: str


class DocumentLibraryResponse(BaseModel):
    documents: list[DocumentItem]
    totalCount: int
    userRole: str
    phases: list[dict]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@router.get("/library", response_model=DocumentLibraryResponse)
async def get_document_library(
    phase: Optional[str] = None,
    category: Optional[str] = None,
    current_user=Depends(get_current_user),
):
    """
    Get the document library filtered by the current user's role.

    Documents are progressively unlocked as the user advances through the
    onboarding flow. Admin users see all documents.

    Optional query params:
      - phase: Filter by phase (F0, F1, F2, F3, F4, F5, F6, F7)
      - category: Filter by category (legal, compliance, operational, trading, reporting, internal)
    """
    user_role = UserRole(current_user.role) if isinstance(current_user.role, str) else current_user.role

    docs = get_documents_for_role(user_role)

    # Apply filters
    if phase:
        docs = [d for d in docs if d["phase"] == phase]
    if category:
        docs = [d for d in docs if d["category"] == category]

    # Build response items
    items = []
    for d in docs:
        items.append(DocumentItem(
            id=d["id"],
            title=d["title"],
            titleRo=d["title_ro"],
            filename=d["filename"],
            phase=d["phase"],
            phaseName=d["phase_name"],
            category=d["category"],
            description=d["description"],
            descriptionRo=d["description_ro"],
            adminOnly=d["admin_only"],
            trigger=d["trigger"],
            audience=d["audience"],
            downloadUrl=f"/api/v1/documents/download/{d['id']}",
        ))

    # Collect unique phases present in results
    seen_phases = {}
    for item in items:
        if item.phase not in seen_phases:
            seen_phases[item.phase] = item.phaseName
    phases = [{"code": k, "name": v} for k, v in seen_phases.items()]

    return DocumentLibraryResponse(
        documents=items,
        totalCount=len(items),
        userRole=user_role.value,
        phases=phases,
    )


@router.get("/download/{document_id}")
async def download_document(
    document_id: str,
    current_user=Depends(get_current_user),
    db: AsyncSession = Depends(get_db),  # noqa: B008
):
    """
    Download a specific document by ID.

    Access is controlled by the user's role — they can only download
    documents available at their current journey stage.
    """
    from fastapi.responses import FileResponse

    user_role = UserRole(current_user.role) if isinstance(current_user.role, str) else current_user.role

    # Find the document
    doc = None
    for d in DOCUMENT_CATALOG:
        if d["id"] == document_id:
            doc = d
            break

    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Check access
    if doc["admin_only"] and user_role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Access denied — admin only document")

    if not doc["admin_only"]:
        try:
            min_role = UserRole(doc["min_role"])
        except ValueError:
            raise HTTPException(status_code=500, detail="Invalid document configuration")

        if not user_has_min_role(user_role, min_role):
            raise HTTPException(
                status_code=403,
                detail=f"Access denied — requires role {doc['min_role']} or higher"
            )

    # ── Dynamic PDF generation for supported documents ──
    # Helper: extract common client data from current_user
    def _client_data():
        entity = current_user.entity if hasattr(current_user, 'entity') else None
        return {
            "client_entity_name": entity.name if entity else None,
            "client_entity_type": entity.entity_type if entity and entity.entity_type else None,
            "client_jurisdiction": entity.jurisdiction.value if entity and entity.jurisdiction else None,
            "client_email": current_user.email,
            "client_representative": (
                f"{current_user.first_name or ''} {current_user.last_name or ''}".strip() or None
            ),
        }

    def _pdf_response(pdf_bytes: bytes, filename: str):
        from io import BytesIO
        from fastapi.responses import StreamingResponse
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Content-Length": str(len(pdf_bytes)),
            },
        )

    # NDA
    if document_id == "nda":
        from app.services.pdf_generator import generate_nda_pdf
        cd = _client_data()
        pdf_bytes = generate_nda_pdf(
            client_entity_name=cd["client_entity_name"],
            client_entity_type=cd["client_entity_type"],
            client_jurisdiction=cd["client_jurisdiction"],
            client_email=cd["client_email"],
            client_representative=cd["client_representative"],
        )
        return _pdf_response(pdf_bytes, "Nihao_Group_NDA.pdf")

    # MSA
    if document_id == "msa":
        from app.services.pdf_generator import generate_msa_pdf
        cd = _client_data()
        pdf_bytes = generate_msa_pdf(
            client_entity_name=cd["client_entity_name"],
            client_entity_type=cd["client_entity_type"],
            client_jurisdiction=cd["client_jurisdiction"],
            client_email=cd["client_email"],
            client_representative=cd["client_representative"],
        )
        return _pdf_response(pdf_bytes, "Nihao_Group_MSA.pdf")

    # Custody Agreement
    if document_id == "custody":
        from app.services.pdf_generator import generate_custody_pdf
        cd = _client_data()
        pdf_bytes = generate_custody_pdf(
            client_entity_name=cd["client_entity_name"],
            client_entity_type=cd["client_entity_type"],
            client_jurisdiction=cd["client_jurisdiction"],
            client_email=cd["client_email"],
            client_representative=cd["client_representative"],
        )
        return _pdf_response(pdf_bytes, "Nihao_Group_Custody_Agreement.pdf")

    # Fee Schedule
    if document_id == "fee_schedule":
        from app.services.pdf_generator import generate_fee_schedule_pdf
        cd = _client_data()
        pdf_bytes = generate_fee_schedule_pdf(
            client_entity_name=cd["client_entity_name"],
            client_representative=cd["client_representative"],
            client_email=cd["client_email"],
        )
        return _pdf_response(pdf_bytes, "Nihao_Group_Fee_Schedule.pdf")

    # Risk Disclosure Statement
    if document_id == "risk_disclosure":
        from app.services.pdf_generator import generate_risk_disclosure_pdf
        cd = _client_data()
        pdf_bytes = generate_risk_disclosure_pdf(
            client_entity_name=cd["client_entity_name"],
            client_entity_type=cd["client_entity_type"],
            client_jurisdiction=cd["client_jurisdiction"],
            client_email=cd["client_email"],
            client_representative=cd["client_representative"],
        )
        return _pdf_response(pdf_bytes, "Nihao_Group_Risk_Disclosure.pdf")

    # KYC / Client Onboarding Application
    if document_id == "kyc_form":
        from app.services.pdf_generator import generate_kyc_pdf
        from sqlalchemy import select as sa_select
        from ...models.models import KYCFormData, KYCDocument as KYCDocModel
        cd = _client_data()

        # Fetch form data if available
        fd_result = await db.execute(
            sa_select(KYCFormData).where(KYCFormData.user_id == current_user.id)
        )
        form_record = fd_result.scalar_one_or_none()
        form_dict = None
        if form_record and form_record.is_submitted:
            form_dict = {
                "pep_declarations": form_record.pep_declarations,
                "has_carbon_experience": form_record.has_carbon_experience,
                "carbon_experience_years": form_record.carbon_experience_years,
                "carbon_credits_traded": form_record.carbon_credits_traded,
                "investment_objectives": form_record.investment_objectives,
                "risk_appetite": form_record.risk_appetite,
                "source_of_funds": form_record.source_of_funds,
                "expected_annual_volume": form_record.expected_annual_volume,
                "intended_use_description": form_record.intended_use_description,
                "tax_residency_country": form_record.tax_residency_country,
                "subject_to_crs": form_record.subject_to_crs,
                "declarations_accepted": form_record.declarations_accepted,
            }

        # Fetch document statuses
        docs_result = await db.execute(
            sa_select(KYCDocModel).where(KYCDocModel.user_id == current_user.id)
        )
        docs_list = [
            {"type": d.document_type.value, "status": d.status.value, "file_name": d.file_name}
            for d in docs_result.scalars().all()
        ]

        pdf_bytes = generate_kyc_pdf(
            client_entity_name=cd["client_entity_name"],
            client_representative=cd["client_representative"],
            client_email=cd["client_email"],
            form_data=form_dict,
            documents_status=docs_list if docs_list else None,
        )
        return _pdf_response(pdf_bytes, "Nihao_Group_KYC_Application.pdf")

    # Carbon Derivatives Master Agreement
    if document_id == "derivatives":
        from app.services.pdf_generator import generate_derivatives_pdf
        cd = _client_data()
        pdf_bytes = generate_derivatives_pdf(
            client_entity_name=cd["client_entity_name"],
            client_entity_type=cd["client_entity_type"],
            client_jurisdiction=cd["client_jurisdiction"],
            client_email=cd["client_email"],
            client_representative=cd["client_representative"],
        )
        return _pdf_response(pdf_bytes, "Nihao_Group_Derivatives_Agreement.pdf")

    # ── Static file fallback for other documents ──
    base_path = os.environ.get("DOCUMENT_BASE_PATH", "/app/documents")
    file_path = os.path.join(base_path, doc["filename"])

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Document file not found on server")

    media_type = (
        "application/pdf"
        if doc["filename"].lower().endswith(".pdf")
        else "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )
    return FileResponse(
        path=file_path,
        filename=doc["filename"],
        media_type=media_type,
    )

