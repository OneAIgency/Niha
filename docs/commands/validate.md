# Validate — Post-Implementation Quality Agent

> **Un singur agent. Rulează OBLIGATORIU după orice modificare de cod. Fără excepții.**

---

## Când rulează

ÎNTOTDEAUNA după ce s-a modificat/creat/șters cod — indiferent de:
- Mediu (Cursor, Claude Desktop, Claude Code CLI, Claude.ai, terminal, orice)
- Dimensiune (un rând sau o feature întreagă)
- Metodă (prin plan_feature.md, ad-hoc, fix rapid, refactor)

## Când NU rulează

- Modificări DOAR în fișiere .md (documentație pură, fără cod)
- Modificări DOAR în comentarii din cod
- Actualizări dependențe fără schimbări de cod

---

## Procesul (3 faze secvențiale, automate)

```
MODIFICARE COD FINALIZATĂ
         │
         ▼
┌─ FAZA 1: CODE REVIEW ──────────────────────────┐
│  Execută: docs/commands/code_review.md          │
│  Pe: toate fișierele modificate/create recent   │
│  Output: docs/features/<N>_REVIEW.md            │
│  → Trece AUTOMAT la Faza 2                      │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─ FAZA 2: FIX ALL ISSUES ───────────────────────┐
│  Citește review-ul din Faza 1                   │
│  Rezolvă: TOATE problemele Critical + Major     │
│  Minor: fix dacă e simplu, altfel TODO          │
│  Verifică: fix-urile nu introduc probleme noi   │
│  → Trece AUTOMAT la Faza 3                      │
└─────────────────────────────────────────────────┘
         │
         ▼
┌─ FAZA 3: WRITE DOCS ───────────────────────────┐
│  Execută: docs/commands/write_docs.md           │
│  Actualizează: app_truth.md (dacă e cazul)      │
│  Actualizează: design system (dacă UI modificat)│
│  Actualizează: README / alte docs principale    │
└─────────────────────────────────────────────────┘
         │
         ▼
   ✅ TASK COMPLET
```

**Regula de aur**: Nicio implementare nu este DONE până nu apare:
```
✅ POST-IMPLEMENTATION PIPELINE COMPLET
```

---

## Instrucțiuni pentru AI

Ești agentul de validare. După ce orice implementare se termină:

### Faza 1 — Code Review
1. Identifică TOATE fișierele modificate (git diff, sau lista din conversație)
2. Citește `docs/commands/code_review.md` și execută review-ul complet
3. Dacă există plan (`docs/features/<N>_PLAN.md`), verifică implementarea contra plan
4. Dacă nu există plan, review-ul se face pe calitatea codului pur
5. Scrie review-ul în `docs/features/<N>_REVIEW.md`
6. **NU AȘTEPTA input utilizator** → treci direct la Faza 2

### Faza 2 — Fix All Issues  
1. Citește review-ul tocmai generat
2. Rezolvă problemele în ordine: Critical → Major → Minor
3. Pentru fiecare fix, verifică că nu strică altceva
4. Dacă un fix ar necesita refactoring masiv → oprește-te și raportează
5. **NU AȘTEPTA input utilizator** → treci direct la Faza 3

### Faza 3 — Write Documentation
1. Citește `docs/commands/write_docs.md` și execută
2. Codul este sursa de adevăr (nu planul, nu review-ul)
3. Actualizează doar ce e relevant, nu inventa documentație inutilă
4. Respectă stilul și structura documentației existente

### Raport Final
```
═══════════════════════════════════════════════════
  ✅ POST-IMPLEMENTATION PIPELINE COMPLET
═══════════════════════════════════════════════════
Implementare: [ce s-a făcut]

📋 Review: X issues (Y Critical, Z Major, W Minor)
🔧 Fixed: X/Y issues | Rămase: Z (Minor/TODO)
📝 Docs: [fișierele actualizate]

Status: COMPLET
═══════════════════════════════════════════════════
```

---

## Utilizare directă (opțional)

Dacă vrei să-l declanșezi explicit:
```
@validate.md
```

Dar în mod normal rulează AUTOMAT — nu trebuie să-l chemi manual.
