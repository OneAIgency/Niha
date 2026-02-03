# Agent Development System - Ghid Complet

> **Pentru cine este**: Oricine vrea să dezvolte aplicații cu ajutorul AI, fără a fi expert tehnic.
> **Ce face**: Automatizează dezvoltarea de la idee la cod funcțional, cu verificări și documentație.

---

## Ce Este Acest Sistem?

Imaginează-ți că ai un **asistent de programare** care știe exact ce să facă în fiecare etapă:

```
Tu: "Vreau o aplicație de gestionare a task-urilor"
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMUL FACE AUTOMAT:                    │
│                                                              │
│   1. Înțelege ce vrei      → Creează brief-ul proiectului   │
│   2. Planifică             → Scrie planul tehnic            │
│   3. Desenează interfața   → Creează specificații UI        │
│   4. Construiește          → Scrie codul                    │
│   5. Verifică              → Găsește probleme               │
│   6. Repară                → Rezolvă problemele             │
│   7. Documentează          → Actualizează documentația      │
│                                                              │
│   Rezultat: Cod funcțional, testat, documentat              │
└─────────────────────────────────────────────────────────────┘
```

---

## De Ce Ai Nevoie De Acest Sistem?

### Fără sistem:
- AI-ul face ce crede el că vrei
- Codul e inconsistent
- Problemele rămân nedetectate
- Documentația lipsește
- Fiecare feature e diferită

### Cu sistem:
- AI-ul urmează un proces clar
- Codul respectă standarde
- Problemele sunt găsite și reparate
- Documentația se actualizează automat
- Toate feature-urile sunt consistente

---

## Cum Funcționează?

### Concepte Cheie (explicații simple):

| Termen | Ce înseamnă | Analogie |
|--------|-------------|----------|
| **Agent** | Un "specialist" care face o singură treabă foarte bine | Un electrician vs un instalator |
| **Orchestrator** | Un "manager" care coordonează mai mulți agenți | Șeful de șantier |
| **app_truth.md** | Fișierul cu TOATE regulile proiectului | "Legea" proiectului |
| **Design Tokens** | Culorile și spațierile definite într-un singur loc | Paleta de culori a designerului |
| **Plan** | Documentul care spune CE trebuie făcut | Rețeta de gătit |
| **Review** | Verificarea că totul e corect | Controlul de calitate |

---

## Structura Sistemului

```
docs/commands/
│
├── 📖 README.md          ← Ești aici
├── 📖 QUICKSTART.md      ← Cum să începi rapid
├── 📖 ADAPTATION.md      ← Cum să personalizezi
│
├── 🤖 AGENȚI (specialiști)
│   ├── 00_brief.md       → Definește proiectul
│   ├── 01_plan.md        → Planifică o feature
│   ├── 02_interface.md   → Desenează UI
│   ├── 03_implement.md   → Scrie cod
│   ├── 04_review.md      → Verifică codul
│   ├── 05_fix.md         → Repară problemele
│   ├── 06_docs.md        → Documentează
│   ├── 07_theme.md       → Gestionează designul
│   ├── 08_audit.md       → Audit complet
│   └── 09_ui_expert.md   → Expert UI/UX (nou!)
│
└── 🎭 ORCHESTRATORI (manageri)
    ├── auto_project.md   → Proiect nou de la zero
    ├── auto_feature.md   → Adaugă o feature
    ├── auto_theme.md     → Modifică designul
    └── auto_audit.md     → Curăță proiectul
```

---

## Când Folosești Ce?

### Scenariul 1: Proiect Nou
```
"Vreau să fac o aplicație de..."

→ Folosește: @auto_project.md "descrierea aplicației"
```

### Scenariul 2: Feature Nouă
```
"Vreau să adaug funcționalitatea de..."

→ Folosește: @auto_feature.md "descrierea feature-ului"
```

### Scenariul 3: Verificare Periodică
```
"Vreau să verific că totul e ok"

→ Folosește: @auto_audit.md
```

### Scenariul 4: Schimbare Design
```
"Vreau să schimb culorile/tema"

→ Folosește: @auto_theme.md "ce vrei să schimbi"
```

---

## Flux Vizual - Cum Decurge Totul

```
                    ┌─────────────────┐
                    │   TU DESCRII    │
                    │   CE VREI       │
                    └────────┬────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  BRIEF (00)          "Ce facem și de ce"                  │
│      │                                                     │
│      ▼                                                     │
│  PLAN (01)           "Cum facem tehnic"                   │
│      │                                                     │
│      ├──────────────┐                                      │
│      ▼              ▼                                      │
│  INTERFACE (02)  THEME (07)                               │
│  "Cum arată"     "Cu ce culori"                           │
│      │              │                                      │
│      └──────┬───────┘                                      │
│             ▼                                              │
│      IMPLEMENT (03)  "Scriem codul"                       │
│             │                                              │
│             ▼                                              │
│      REVIEW (04)     "Verificăm"                          │
│             │                                              │
│        ┌────┴────┐                                         │
│        │ Probleme?│                                        │
│        └────┬────┘                                         │
│       DA   │   NU                                          │
│        │   │    │                                          │
│        ▼   │    │                                          │
│    FIX (05)│    │                                          │
│        │   │    │                                          │
│        └───┘    │                                          │
│                 ▼                                          │
│          DOCS (06)    "Documentăm"                        │
│                 │                                          │
│                 ▼                                          │
│           ✅ GATA!                                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## Reguli Importante (de reținut)

### 1. Descrie clar ce vrei
```
❌ "Fă un buton"
✅ "Adaugă un buton verde în header care să deschidă un meniu cu opțiuni de utilizator"
```

### 2. Un lucru odată
```
❌ "Fă login, register, profile și dashboard"
✅ "Fă sistemul de login cu email și parolă"
   Apoi: "Adaugă înregistrare"
   Apoi: "Adaugă pagina de profil"
```

### 3. Lasă sistemul să termine
```
❌ Întrerupi la jumătate
✅ Aștepți până vezi "✓ COMPLETE" sau "⚠️ HUMAN INTERVENTION REQUIRED"
```

### 4. Răspunde la întrebări
```
Când AI-ul întreabă ceva, răspunde clar:
- "Da" sau "Nu" pentru alegeri
- "Opțiunea A" pentru selecții
- Detalii concrete când ți se cer
```

---

## Ce Faci Când...

### ...AI-ul se oprește și așteaptă?
Citește mesajul. De obicei:
- Întreabă clarificări → Răspunde la întrebări
- Raportează probleme → Decide dacă continui sau repari manual

### ...ceva nu merge?
1. Citește eroarea
2. Descrie problema: "Am primit eroarea X când am încercat Y"
3. AI-ul va propune soluții

### ...vrei să anulezi?
Scrie: "Oprește și anulează ce faci"

### ...vrei să schimbi ceva la jumătate?
Scrie: "Stop. Vreau să schimb X în Y. Continuă de aici."

---

## Fișiere Generate De Sistem

După ce folosești sistemul, vei avea:

```
proiectul-tău/
│
├── app_truth.md                    ← "Biblia" proiectului
│
├── docs/
│   ├── PRODUCT_BRIEF.md           ← Descrierea produsului
│   ├── DESIGN_SYSTEM.md           ← Sistemul de design
│   │
│   └── features/                   ← Istoricul feature-urilor
│       ├── 0001_PLAN.md           ← Plan feature 1
│       ├── 0001_UI_SPEC.md        ← Specificații UI feature 1
│       ├── 0001_REVIEW.md         ← Review feature 1
│       ├── 0002_PLAN.md           ← Plan feature 2
│       └── ...
│
└── src/
    └── theme/                      ← Sistemul de teme
        ├── tokens.ts              ← Definițiile (editezi aici)
        └── generated/             ← Fișiere generate (NU edita)
```

---

## Întrebări Frecvente

### "Trebuie să știu să programez?"
Nu pentru a folosi sistemul. Dar e util să înțelegi bazele pentru a verifica rezultatele.

### "Pot să modific codul generat?"
Da, dar e recomandat să faci modificări prin sistem (să ceri AI-ului) pentru a menține consistența.

### "Ce fac dacă AI-ul generează ceva greșit?"
Descrie ce e greșit: "Butonul ar trebui să fie roșu, nu verde". AI-ul va corecta.

### "Pot să folosesc sistemul pentru orice limbaj/framework?"
Da. La începutul fiecărui proiect, specifici tehnologiile și AI-ul se adaptează.

### "Cât durează o feature?"
Depinde de complexitate. O feature simplă: 5-15 minute. Una complexă: 30-60 minute.

---

## Pași Următori

1. **Citește** [QUICKSTART.md](./QUICKSTART.md) - Începe în 5 minute
2. **Citește** [ADAPTATION.md](./ADAPTATION.md) - Personalizează pentru proiectul tău
3. **Încearcă** - `@auto_project.md "o aplicație simplă de notițe"`

---

## Suport

Dacă ceva nu e clar:
1. Întreabă AI-ul: "Explică-mi cum funcționează X"
2. Recitește documentația relevantă
3. Încearcă cu un exemplu simplu mai întâi

---

> **Sfat**: Sistemul e construit să te ghideze. Nu trebuie să memorezi totul.
> Spune ce vrei și sistemul îți va spune ce să faci.
