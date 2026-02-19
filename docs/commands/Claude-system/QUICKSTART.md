# Ghid Rapid - Începe în 5 Minute

> Acest ghid te ia de la zero și te duce la prima ta aplicație funcțională.

---

## Pasul 1: Copiază Sistemul (o singură dată)

Când începi un proiect nou, copiază folderul `docs/commands/` în proiectul tău:

```bash
# Creează folderul pentru proiectul nou
mkdir noul-meu-proiect
cd noul-meu-proiect

# Copiază sistemul de comenzi (ajustează calea)
cp -r /cale/către/docs/commands ./docs/commands
```

**Sau** cere AI-ului:
```
Copiază sistemul de comenzi din [proiect-sursă] în acest proiect
```

---

## Pasul 2: Pornește un Proiect Nou

### Opțiunea A: Automatizat (Recomandat pentru începători)

Scrie în chat:
```
@auto_project.md "Descrierea aplicației tale"
```

**Exemplu real:**
```
@auto_project.md "O aplicație de gestionare a cheltuielilor personale.
Utilizatorii pot adăuga cheltuieli cu categorie, sumă și dată.
Pot vedea un sumar lunar și grafice simple.
Vreau să funcționeze pe web, cu React și un backend simplu în Python."
```

**Ce se întâmplă:**
1. AI-ul te întreabă clarificări (dacă e nevoie)
2. Creează structura proiectului
3. Creează fișierul `app_truth.md`
4. Setează sistemul de design
5. Implementează prima funcționalitate de bază
6. Verifică și documentează

**Durată:** 10-30 minute (depinde de complexitate)

### Opțiunea B: Pas cu Pas (Pentru mai mult control)

```
# 1. Creează brief-ul
@00_brief.md "Descrierea aplicației"

# 2. Verifică și ajustează app_truth.md dacă e nevoie

# 3. Setează tema (dacă are interfață)
@07_theme.md "Setează tema inițială"

# 4. Planifică prima feature
@01_plan.md "Prima funcționalitate de bază"

# 5. Continuă cu restul...
```

---

## Pasul 3: Adaugă Feature-uri Noi

După ce ai proiectul de bază, adaugi funcționalități:

```
@auto_feature.md "Descrierea feature-ului"
```

**Exemple:**
```
@auto_feature.md "Adaugă autentificare cu email și parolă"

@auto_feature.md "Adaugă posibilitatea de a edita și șterge cheltuieli"

@auto_feature.md "Adaugă un grafic cu cheltuielile pe categorii"

@auto_feature.md "Adaugă export în CSV"
```

**Sfat:** O feature = o funcționalitate. Nu combina multe lucruri.

---

## Pasul 4: Verifică Periodic

La fiecare câteva feature-uri, sau săptămânal:

```
@auto_audit.md
```

Asta verifică:
- Cod nefolosit
- Inconsistențe
- Probleme de design
- Documentație lipsă

Pentru a repara automat ce se poate:
```
@auto_audit.md --fix
```

---

## Exemple Complete

### Exemplul 1: Blog Personal

```
# Proiect nou
@auto_project.md "Un blog personal unde pot scrie articole.
Vreau să pot crea, edita și șterge articole.
Fiecare articol are titlu, conținut și data publicării.
Vizitatorii pot citi articolele, dar doar eu pot edita.
React frontend, Node.js backend, bază de date PostgreSQL."

# După ce e gata, adaugi feature-uri
@auto_feature.md "Adaugă categorii pentru articole"
@auto_feature.md "Adaugă căutare în articole"
@auto_feature.md "Adaugă comentarii pentru vizitatori"
```

### Exemplul 2: To-Do List

```
# Proiect nou
@auto_project.md "O aplicație simplă de to-do list.
Pot adăuga task-uri cu titlu și deadline.
Pot marca task-uri ca complete.
Pot șterge task-uri.
Vreau să fie doar frontend, fără backend, date salvate local."

# Feature-uri adiționale
@auto_feature.md "Adaugă priorități pentru task-uri (low, medium, high)"
@auto_feature.md "Adaugă filtrare după prioritate și status"
@auto_feature.md "Adaugă notificări pentru deadline-uri apropiate"
```

### Exemplul 3: Portfolio

```
# Proiect nou
@auto_project.md "Un site de portfolio pentru a-mi arăta proiectele.
Pagini: Home, About, Projects, Contact.
Fiecare proiect are: titlu, descriere, imagine, link.
Design modern, dark mode.
Site static, fără backend."

# Feature-uri adiționale
@auto_feature.md "Adaugă formular de contact care trimite email"
@auto_feature.md "Adaugă animații la scroll"
@auto_feature.md "Adaugă filtrare proiecte după tehnologie"
```

---

## Comenzi Rapide (Cheat Sheet)

| Ce vrei | Comandă |
|---------|---------|
| Proiect nou complet | `@auto_project.md "descriere"` |
| Feature nouă | `@auto_feature.md "descriere"` |
| Verificare proiect | `@auto_audit.md` |
| Verificare + reparare | `@auto_audit.md --fix` |
| Schimbare design/culori | `@auto_theme.md "ce vrei să schimbi"` |

### Comenzi Individuale (pentru control fin)

| Ce vrei | Comandă |
|---------|---------|
| Doar brief/setup | `@00_brief.md "descriere"` |
| Doar planificare | `@01_plan.md "descriere feature"` |
| Doar UI spec | `@02_interface.md @docs/features/NNNN_PLAN.md` |
| Doar implementare | `@03_implement.md @docs/features/NNNN_PLAN.md` |
| Doar review | `@04_review.md @docs/features/NNNN_PLAN.md` |
| Doar fix | `@05_fix.md @docs/features/NNNN_REVIEW.md` |
| Doar docs | `@06_docs.md @docs/features/NNNN_PLAN.md` |
| Doar teme | `@07_theme.md "modificări"` |
| Doar audit | `@08_audit.md` |

---

## Sfaturi Pentru Succes

### DO ✅

1. **Descrie clar și specific**
   ```
   ✅ "Un buton albastru în colțul din dreapta sus care
       deschide un dropdown cu: Profil, Setări, Logout"
   ```

2. **O feature la un moment dat**
   ```
   ✅ Prima: "Adaugă login"
   ✅ Apoi: "Adaugă register"
   ✅ Apoi: "Adaugă forgot password"
   ```

3. **Răspunde la întrebările AI-ului**
   ```
   AI: "Vrei autentificare cu email sau cu OAuth?"
   ✅ Tu: "Cu email. Mai târziu poate adaug și Google login."
   ```

4. **Verifică rezultatele**
   ```
   ✅ După fiecare feature, testează în browser că merge
   ```

### DON'T ❌

1. **Nu fi vag**
   ```
   ❌ "Fă un sistem de useri"
   ```

2. **Nu cere totul odată**
   ```
   ❌ "Fă login, register, profile, dashboard, settings,
       admin panel și rapoarte"
   ```

3. **Nu ignora întrebările**
   ```
   ❌ AI întreabă ceva, tu spui "nu contează, fă cum vrei"
   ```

4. **Nu sări pașii**
   ```
   ❌ "Sari direct la implementare, nu mai face plan"
   ```

---

## Probleme Comune și Soluții

### "AI-ul nu înțelege ce vreau"

**Soluție:** Reformulează mai specific
```
Înainte: "Fă un formular"
După: "Fă un formular de contact cu câmpuri:
       Nume (text, obligatoriu),
       Email (email, obligatoriu),
       Mesaj (textarea, obligatoriu),
       și un buton Submit care trimite datele la /api/contact"
```

### "Codul generat are erori"

**Soluție:** Raportează eroarea
```
"Am eroarea: [copiază eroarea exactă]
Apare când [ce făceai când a apărut]"
```

### "Vreau să schimb ceva ce e deja făcut"

**Soluție:** Descrie modificarea
```
"În componenta UserProfile, schimbă butonul de Save
din verde în albastru și mută-l în dreapta"
```

### "Nu știu ce feature să fac următoare"

**Soluție:** Cere sugestii
```
"Ce feature-uri ar trebui să adaug pentru [tipul aplicației]?
Dă-mi o listă prioritizată."
```

---

## Următorii Pași

1. ✅ Ai citit QUICKSTART (ești aici)
2. ⬜ Citește [ADAPTATION.md](./ADAPTATION.md) pentru personalizare
3. ⬜ Încearcă primul tău proiect
4. ⬜ Experimentează cu comenzi individuale

---

## Gata? Hai să începem!

Copiază și adaptează:

```
@auto_project.md "Descrie aici aplicația ta:
ce face, pentru cine, ce tehnologii vrei să folosești"
```

🚀 **Succes!**
