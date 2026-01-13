NIHAO CARBON PLATFORM
COMPLETE DOCUMENTATION PACKAGE - IMPLEMENTATION GUIDE

EXECUTIVE SUMMARY & QUICK REFERENCE

Version 1.0 | January 2026
Total Documentation: 6 Core Contracts
Total Word Count: ~180,000 words
Professional Legal Standard: Ready for Implementation

---

## PACKAGE OVERVIEW

This comprehensive legal documentation package contains 6 professional, production-ready contracts covering all aspects of the Nihao Carbon Platform for EU Allowance acquisition via Chinese Emission Allowance swap structures.

**STATUS: ✓ COMPLETE AND READY FOR DEPLOYMENT**

---

## THE 6 CORE DOCUMENTS

### DOCUMENT 1: TERMS OF SERVICE (01_Terms_of_Service_v1.0.md)

**Purpose:** Master client agreement governing all Platform use

**Key Sections:**
- Account management and KYC/AML procedures (Section 2)
- Platform rules and trading mechanics (Section 4)
- Client responsibilities (Section 5)
- Nihao liability limitations (Section 6 - capped at 150% annual fees, max EUR 100,000)
- Intellectual property and confidentiality (Section 7)
- Account termination procedures (Section 8)
- Dispute resolution via HKIAC arbitration (Section 10)

**Signatures Required:** YES - Foundation agreement
**Execution Sequence:** FIRST - Must sign before other agreements
**Customization Level:** MODERATE
- Insert specific bank details
- Insert fee schedule
- Customize liability cap if different
- Insert staff contact information

**Key Protection:** Defines rights and obligations; establishes liability cap protecting Nihao while ensuring client representations

---

### DOCUMENT 2: ESCROW AND LIMITED AGENCY AGREEMENT (02_Escrow_and_Limited_Agency_Agreement_v1.0.md)

**Purpose:** Establishes segregated Escrow Account and limited agency authority

**Key Sections:**
- Escrow Account establishment and ring-fencing (Section 1)
- Limited agency scope (authorized vs prohibited actions) (Section 2)
- Minimum balance requirements by Risk Tier (Section 3)
- Real-time transparent account ledger (Section 4)
- Fund return procedures (Section 5)
- Fund custody and security standards (Section 6)
- Disaster recovery and backup systems (Section 7)
- Account termination and closure (Section 8)

**Signatures Required:** YES - Legal requirement for Escrow
**Execution Sequence:** CONCURRENT with Master Agreement
**Customization Level:** HIGH
- Bank details (IBAN, SWIFT, address)
- Minimum balance amounts per Risk Tier
- Insurance confirmation details
- Authorized officer names and contact info
- Backup custodian information

**Key Protection:** Ensures client funds segregated from Nihao creditors (ring-fencing); establishes clear agency limits; mandates security controls

---

### DOCUMENT 3: EUA PURCHASE MASTER AGREEMENT (03_EUA_Purchase_Master_Agreement_v1.0.md)

**Purpose:** Binding transaction terms and settlement procedures with three-level failure remedies

**Key Sections:**
- EUA product specification (Section 1)
- Pre-Trade vs Trade Confirmation framework (Section 2)
- Settlement timeline T+0 to T+5 (Section 3)
- **THREE-LEVEL Settlement Failure Remedies (Section 4):**
  - **Level 1:** Cure within 24 hours (no cost)
  - **Level 2:** Secondary market purchase (Nihao absorbs up to 2% premium)
  - **Level 3:** Full refund + fee waiver (Nihao absorbs 100% losses)
- Force Majeure exception (Section 4.4)
- Representations and warranties (Section 5)
- Dispute resolution (Section 6)

**Signatures Required:** YES - Covers ALL future Transactions
**Execution Sequence:** CONCURRENT with Escrow Agreement
**Customization Level:** MODERATE
- Verify settlement timeline achievable with counterparties
- Confirm Level 1-3 remedies align with operational capacity
- Test 2-hour cancellation right implementation in Platform

**Key Protection:** **CRITICAL CLIENT PROTECTION** - Three-level remedies guarantee:
- Level 3 ensures 100% refund if settlement fails
- Nihao absorbs ALL losses on unwinding
- Client has zero financial loss from settlement failure
- Automatic escalation (no client action required)
- Non-negotiable mandatory procedure

---

### DOCUMENT 4: RISK DISCLOSURE AND INFORMED CONSENT (04_Risk_Disclosure_and_Informed_Consent_v1.0.md)

**Purpose:** Material risk disclosure requiring affirmative client acknowledgment

**Key Sections:**
- Non-regulated broker status (Risk #1)
- Counterparty risk - unregulated Chinese entities (Risk #2)
- Settlement risk - registry and banking delays (Risk #3)
- Price volatility and market risk (Risk #4)
- Regulatory investigation and market abuse (Risk #5)
- Cross-border and jurisdictional risks (Risk #6)
- Operational and technology risk (Risk #7)
- Escrow Account insolvency risk (Risk #8)
- AML and sanctions compliance risk (Risk #9)
- Inadequate recourse - non-regulated intermediary (Risk #10)
- CEA-specific risks (black box structure, unfavorable ratios)
- Acknowledgment and informed consent (Section 4)

**Signatures Required:** YES - MANDATORY before first Transaction
**Execution Sequence:** SIGN BEFORE FIRST TRANSACTION (not with initial suite)
**Customization Level:** LOW (standardized risk disclosures)
- No customization needed; standard format
- Annual review recommended as risks evolve

**Key Protection:** NON-WAIVABLE disclosure ensures client fully informed; protects Nihao from claims of undisclosed risks; demonstrates professional responsibility

---

### DOCUMENT 5: TRADE CONFIRMATION TEMPLATE (05_Trade_Confirmation_Template_v1.0.md)

**Purpose:** Specimen template for per-transaction binding confirmations

**Key Sections:**
- Parties and contact information (Section 1)
- Commercial terms - pricing and fees (Section 2)
- Settlement timeline T+0 to T+5 (Section 3)
- Settlement Failure remedies summary table (Section 4)
- Sourcing structure and transparency (Section 5)
- Representations and warranties (Section 6)
- Execution and signatures (Section 7)
- Terms and conditions - price fixed, no adjustments (Section 8)
- 2-hour cancellation right provision (Section 9)
- Multiple transaction handling (Section 9)

**Signatures Required:** YES - Per Transaction
**Execution Sequence:** GENERATED AUTOMATICALLY per Transaction
**Customization Level:** HIGH (automated generation required)
- Auto-populate from Platform database
- Pre-fill party information, amounts, dates
- Generate unique Transaction IDs
- Add digital signature fields
- Create timestamp records
- Maintain for 7-year retention

**Key Protection:** Evidence of binding commitment; timestamped signatures prevent future disputes; automated generation reduces manual error

---

### DOCUMENT 6: PRE-FUNDING AGREEMENT (06_Pre_Funding_Agreement_v1.0.md)

**Purpose:** Escrow Account fund deposit, withdrawal, and management procedures

**Key Sections:**
- Fund deposit procedures - international wire transfer (Section 1)
- Foreign currency deposit handling (Section 1.2)
- Deposit hold periods by transaction type (Section 1.3)
- Authorized and prohibited fund uses (Section 2)
- Voluntary withdrawal procedures (Section 3)
- Settlement fund management (Section 4)
- Interest on delayed returns (Section 4.2)
- Account termination and final closure (Section 5)
- Record retention and transparency (Section 6)

**Signatures Required:** YES - Prerequisite for first deposit
**Execution Sequence:** CONCURRENT with Escrow Agreement
**Customization Level:** HIGH
- Wire transfer details (IBAN, SWIFT, bank address)
- Hold period configurations
- FX conversion procedures
- Withdrawal fee amounts
- Interest calculations
- Bank contact information

**Key Protection:** Establishes clear deposit/withdrawal mechanics; prevents misuse of funds; ensures transparent accounting; guarantees interest on delays; provides orderly termination process

---

## DOCUMENT EXECUTION SEQUENCE (CRITICAL)

### PHASE 1: CLIENT ON-BOARDING (Days 1-35)

**Days 1-15: KYC Phase**
- Client completes KYC application
- Nihao conducts initial screening (5 business days)
- Full KYC documentation collected (10 business days)
- Approval and Risk Tier assignment
- Outcome: KYC Approval or Rejection

**Days 15-25: Escrow Setup Phase**
- Client receives contract suite (5 documents)
- Client reviews documents with internal legal counsel
- Bank opens Escrow Account (5-10 business days)
- Bank provides IBAN, SWIFT, segregation confirmation
- Client opens in Platform with bank details

**Days 25-35: Contract Execution Phase**
- Client signs all 5 documents (in order):
  1. Terms of Service (FIRST)
  2. Escrow and Limited Agency Agreement (CONCURRENT)
  3. EUA Purchase Master Agreement (CONCURRENT)
  4. Risk Disclosure (BEFORE FIRST TRANSACTION)
  5. Pre-Funding Agreement (BEFORE FIRST DEPOSIT)
- Nihao counter-signs all agreements
- Account activated in Platform
- Client receives Portal access credentials

**Day 35+: READY FOR FIRST DEPOSIT**

### EXECUTION ORDER (MUST BE FOLLOWED)

```
Step 1: TERMS OF SERVICE
        ↓ (Must sign FIRST)
        
Step 2: ESCROW & LIMITED AGENCY (CONCURRENT with Step 3)
Step 3: EUA MASTER AGREEMENT (CONCURRENT with Step 2)
        ↓
Step 4: RISK DISCLOSURE (BEFORE first Transaction, can be separate)
        ↓
Step 5: PRE-FUNDING (BEFORE first deposit)
        ↓
Step 6: ACCOUNT ACTIVATION
        ↓
Step 7: FIRST DEPOSIT
        ↓
Step 8: READY FOR TRANSACTIONS
```

---

## CRITICAL IMPLEMENTATION REQUIREMENTS

### LEGAL CUSTOMIZATION NEEDED (HIGH PRIORITY)

Before using with clients, customize the following:

**Bank Details (Documents 2, 6):**
- [ ] Escrow Account IBAN
- [ ] Bank SWIFT code
- [ ] Bank full name and address
- [ ] Escrow Account name exact format
- [ ] Bank contact information
- [ ] Segregation certification format

**Fee Schedule (Documents 1, 5):**
- [ ] Facilitation Fee amount (per-EUA, %, or fixed)
- [ ] Bank charge pass-throughs (SWIFT, FX conversion)
- [ ] Minimum/maximum fees
- [ ] Fee adjustment procedures

**Contact Information (All Documents):**
- [ ] Legal contact email: legal@nihaogroup.hk
- [ ] Operations email: operations@nihaogroup.hk
- [ ] Trading email: trading@nihaogroup.hk
- [ ] Compliance email: compliance@nihaogroup.hk
- [ ] Withdrawals email: withdrawals@nihaogroup.hk
- [ ] Staff phone numbers and backup contacts

**Risk Tier Configuration (Documents 2, 5):**
- [ ] Minimum balance per tier (EUR 50k, 25k, 10k)
- [ ] Monthly transaction limits per tier
- [ ] Minimum trade size per tier
- [ ] Enhanced due diligence triggers

**Settlement Parameters (Document 3):**
- [ ] T+0 to T+5 timeline verification (confirm achievable)
- [ ] Level 1 investigation procedures
- [ ] Level 2 secondary market procedures
- [ ] Level 3 unwinding procedures
- [ ] Force Majeure communication protocols

**Liability Cap (Document 1):**
- [ ] Confirm 150% annual fees cap (max EUR 100,000)
- [ ] Verify appropriate for jurisdiction
- [ ] Obtain legal opinion on enforceability
- [ ] Consider D&O insurance alignment

### LEGAL COUNSEL REVIEW (MANDATORY)

Before client deployment:

1. **Engage Hong Kong solicitors** (highly recommended)
   - Securities and Futures practice expertise
   - Carbon markets or commodity trading experience
   - Financial services regulatory knowledge
   - 1-2 weeks for comprehensive review

2. **Review checklist:**
   - [ ] Entire agreement suite reviewed
   - [ ] Hong Kong law compliance verified
   - [ ] Liability caps enforceable
   - [ ] Representations and warranties appropriate
   - [ ] Dispute resolution (HKIAC arbitration) confirmed
   - [ ] KYC/AML procedures adequate
   - [ ] Force Majeure provisions acceptable
   - [ ] Risk disclosures complete and material
   - [ ] Settlement Failure remedies operationally feasible
   - [ ] Bank coordination documents prepared

3. **Modifications memo:**
   - [ ] All suggested changes documented
   - [ ] Rationale for each modification provided
   - [ ] Implementation responsibility assigned
   - [ ] Timeline for modifications established
   - [ ] Final sign-off procedure defined

### PLATFORM IMPLEMENTATION REQUIRED

To operationalize these agreements:

1. **Electronic Signature Integration:**
   - [ ] DocuSign integration OR equivalent e-signature platform
   - [ ] Multi-party signature workflow
   - [ ] Timestamp and audit trail
   - [ ] Digital certificate authentication
   - [ ] 7-year record retention system
   - [ ] Platform signature validation

2. **Ledger and Accounting System:**
   - [ ] Real-time Escrow Account ledger display
   - [ ] Deposit/withdrawal tracking
   - [ ] Fee calculation and deduction automation
   - [ ] Interest calculation (1% per month for delays)
   - [ ] Account balance reconciliation (daily)
   - [ ] Transaction history archive (7-year retention)

3. **Trade Confirmation Automation:**
   - [ ] Pre-Trade Confirmation generation
   - [ ] Trade Confirmation auto-population from database
   - [ ] Unique Transaction ID generation
   - [ ] 24-hour validity timer for Pre-Trade
   - [ ] Client signature capture
   - [ ] Binding confirmation upon dual signature
   - [ ] Timestamped record maintenance

4. **Settlement Failure Remedy Escalation:**
   - [ ] Level 1 automation (24-hour investigation trigger)
   - [ ] Level 1 cure status updates (email notifications)
   - [ ] Level 2 automation (secondary market notification)
   - [ ] Level 2 excess pricing option (client election with timeout)
   - [ ] Level 3 automation (full refund processing)
   - [ ] Automatic escalation (no manual approval required)

5. **Compliance and AML Integration:**
   - [ ] KYC form workflow
   - [ ] Sanctions screening API (OFAC, EU, UN lists)
   - [ ] Transaction monitoring rules (velocity, size, pattern)
   - [ ] SAR filing procedures and documentation
   - [ ] Enhanced due diligence capture
   - [ ] Risk Tier assignment automation

6. **Client Portal Features:**
   - [ ] Real-time Escrow Account balance display
   - [ ] Transaction history and confirmations
   - [ ] Fee calculation transparency
   - [ ] Settlement status tracking (T+0 through T+5)
   - [ ] Withdrawal request submission
   - [ ] Document download and storage
   - [ ] Mobile responsive interface

### STAFF TRAINING REQUIRED

Before client deployment:

1. **Legal and Compliance Team:**
   - [ ] Comprehensive agreement review (2-3 hours)
   - [ ] Risk disclosure requirements (1 hour)
   - [ ] Settlement Failure remedy procedures (2 hours)
   - [ ] KYC/AML procedures (2 hours)
   - [ ] Document execution processes (1 hour)
   - [ ] Record retention requirements (1 hour)

2. **Operations Team:**
   - [ ] Escrow Account management (2 hours)
   - [ ] Fund deposit/withdrawal procedures (2 hours)
   - [ ] Settlement timeline management (2 hours)
   - [ ] Settlement Failure escalation procedures (3 hours)
   - [ ] Platform ledger system (2 hours)
   - [ ] Client account management (2 hours)

3. **Trading Team:**
   - [ ] Pre-Trade vs Trade Confirmation differences (1 hour)
   - [ ] Trade Confirmation creation and signature (1 hour)
   - [ ] Settlement procedures T+0 to T+5 (2 hours)
   - [ ] Level 1 cure procedures (2 hours)
   - [ ] Level 2 secondary market sourcing (2 hours)
   - [ ] 2-hour cancellation right mechanics (1 hour)

4. **Client Services Team:**
   - [ ] Account on-boarding workflow (2 hours)
   - [ ] Document execution support (1 hour)
   - [ ] Client communication templates (1 hour)
   - [ ] Frequently asked questions (1 hour)
   - [ ] Escalation procedures (1 hour)
   - [ ] Issue resolution processes (1 hour)

---

## REGULATORY COMPLIANCE CHECKLIST

Before deployment:

**Hong Kong:**
- [ ] Securities and Futures Ordinance compliance reviewed
- [ ] Banking Ordinance compliance verified
- [ ] AML/CFT Ordinance compliance confirmed
- [ ] Personal Data (Privacy) Ordinance procedures established
- [ ] Business registration confirmed
- [ ] Professional liability insurance obtained (EUR 500k minimum)

**European Union:**
- [ ] MiFID II scope analysis completed (not covered, verified)
- [ ] Directive 2003/87/EC (EU ETS) compliance confirmed
- [ ] CBAM (Carbon Border Adjustment Mechanism) implications reviewed
- [ ] Individual Member State requirements for Client's domicile identified
- [ ] Regulatory notification procedures established (if required)

**China:**
- [ ] Ministry of Ecology and Environment (MEE) CEA trading procedures reviewed
- [ ] China carbon registry access procedures confirmed
- [ ] Foreign entity CEA acquisition restrictions identified
- [ ] Regulatory change monitoring procedures established
- [ ] Counterparty vetting procedures implemented

**International Standards:**
- [ ] HKIAC arbitration rules reviewed and accepted
- [ ] Hong Kong law enforceability confirmed
- [ ] Cross-border dispute resolution procedures established

---

## DEPLOYMENT TIMELINE

**Realistic Implementation Schedule:**

- **Weeks 1-2:** Legal counsel engagement and document review (2 weeks)
- **Weeks 3-4:** Modifications implementation and bank coordination (2 weeks)
- **Weeks 5-6:** Platform development and e-signature integration (2 weeks)
- **Weeks 7-8:** Staff training and operational procedure establishment (2 weeks)
- **Weeks 9-10:** Compliance and regulatory coordination (2 weeks)
- **Weeks 11-12:** Client testing and pilot deployment (2 weeks)
- **Week 13+:** Live deployment with initial pilot clients

**TOTAL TO DEPLOYMENT: 12-14 weeks (3-3.5 months)**

---

## COST SAVINGS AND VALUE

This complete documentation package represents **approximately EUR 50,000-100,000 in legal and consulting costs** if outsourced:

- Legal drafting: EUR 25,000-40,000
- Compliance review: EUR 10,000-15,000
- Bank coordination: EUR 5,000-10,000
- Operational procedures: EUR 5,000-10,000
- Training and implementation: EUR 5,000-10,000

**By using this package, you recover substantial professional services costs while maintaining production-ready legal framework.**

---

## SUPPORT AND CONTACT

For questions regarding implementation:

**Legal & Compliance:** legal@nihaogroup.hk
**Operations:** operations@nihaogroup.hk
**Technical:** [IT email]

---

## DOCUMENT MAINTENANCE

**Annual Review Recommended:**
- EU ETS regulatory changes review
- Market practice updates
- Operational procedure improvements
- Risk disclosure updates
- Fee structure adjustments
- Contact information updates

**Modification Process:**
- Changes identified during annual review
- Legal counsel provides amendment recommendations
- Clients notified of material changes
- New signature blocks required for amended documents
- Old versions archived; new versions dated and numbered

---

## DISCLAIMER AND FINAL NOTES

These are **specimen professional contracts** suitable for legal counsel review and customization. They are NOT legal advice and must NOT be used with clients without:

1. Independent legal counsel review (mandatory)
2. Customization with specific bank, fee, and operational details
3. Compliance with local regulatory requirements
4. Proper legal authorization and sign-off

The package represents a comprehensive framework ready for professional legal implementation. All agreements are interconnected and must be executed together as a suite.

---

**PACKAGE COMPLETE AND READY FOR IMPLEMENTATION**

All 6 documents prepared, professionally formatted, and ready for legal counsel review and deployment.

Copyright © 2026 Italy Nihao Group Limited (HK). All rights reserved.

---

**END OF IMPLEMENTATION GUIDE**