# 📦 GitHub Desktop Setup

## 🚀 Project op GitHub zetten

### Stap 1: Open GitHub Desktop

1. Open **GitHub Desktop**
2. Als je niet ingelogd bent:
   - Klik **File** → **Options** → **Accounts**
   - Log in met je GitHub account

### Stap 2: Maak Repository

**Optie A: Nieuw Repository**

1. Klik **File** → **New Repository** (of `Ctrl+N`)
2. Vul in:
   - **Name**: `MarktsplaatsScraper2`
   - **Local Path**: `D:\School` (selecteer de parent folder)
   - **Git Ignore**: Python
   - **License**: MIT License (optioneel)
3. Klik **Create Repository**

**Optie B: Bestaande Folder als Repository**

1. Klik **File** → **Add Local Repository** (of `Ctrl+O`)
2. Klik **Choose...**
3. Navigeer naar: `D:\School\MarktsplaatsScraper2`
4. Klik **Add Repository**
5. Als hij zegt "This directory does not appear to be a Git repository":
   - Klik **create a repository**

### Stap 3: Check wat wordt toegevoegd

In GitHub Desktop zie je nu alle bestanden. **BELANGRIJKE CHECK:**

✅ **Moet NIET zichtbaar zijn:**
- ❌ `Backend/.env` (bevat je Discord token!)
- ❌ `Backend/venv/` folder
- ❌ `Backend/data/` folder
- ❌ `Frontend/node_modules/` folder

✅ **Moet WEL zichtbaar zijn:**
- ✅ `Backend/.env.example`
- ✅ Alle `.py` bestanden
- ✅ `README.md`
- ✅ Frontend source files

**Als .env WEL zichtbaar is:**
- De .gitignore werkt nog niet
- Commit nog NIET!
- Check of `.gitignore` in de root staat

### Stap 4: Eerste Commit

1. In GitHub Desktop zie je alle nieuwe bestanden links
2. Onderaan links bij "Summary":
   - Vul in: `Initial commit - Marktplaats Scraper`
3. Bij "Description" (optioneel):
   ```
   - Discord bot voor Marktplaats monitoring
   - React frontend
   - REST API backend
   - Automatische notificaties voor nieuwe advertenties
   ```
4. Klik **Commit to main**

### Stap 5: Publish naar GitHub

1. Klik bovenaan op **Publish repository**
2. Vul in:
   - **Name**: `MarktsplaatsScraper2`
   - **Description**: `Marktplaats scraper met Discord bot en web interface`
   - **Keep this code private**: ✅ **AAN** (BELANGRIJK voor tokens!)
3. Klik **Publish Repository**

✅ **Klaar!** Je project staat nu op GitHub!

---

## 🔄 Later: Wijzigingen Uploaden

Wanneer je code aanpast:

1. Open GitHub Desktop
2. Selecteer je repository links
3. Je ziet alle wijzigingen (changed files)
4. Vul commit message in:
   - Bijvoorbeeld: `Added new search feature` of `Fixed Discord bot bug`
5. Klik **Commit to main**
6. Klik **Push origin** (rechtsboven)

---

## 🌿 Branches (Optioneel)

Voor grote features kun je branches maken:

1. Klik **Current Branch** → **New Branch**
2. Geef naam: bijvoorbeeld `feature/webhook-support`
3. Werk aan je feature
4. Commit changes
5. Als klaar: **Create Pull Request**
6. Merge branch naar main

---

## ⚠️ BELANGRIJK: Security

### Voordat je pusht naar GitHub:

✅ **Check deze bestanden:**

**Backend/.gitignore** bestaat en bevat:
```
.env
data/
venv/
```

**Root .gitignore** bestaat en bevat:
```
.env
*.env
!.env.example
Backend/venv/
Backend/data/
Frontend/node_modules/
```

### Als je per ongeluk .env hebt gecommit:

**STOP! Niet pushen!**

1. GitHub Desktop → **Repository** → **Repository Settings**
2. Open terminal: **Repository** → **Open in Terminal**
3. Run:
   ```bash
   git rm --cached Backend/.env
   git commit -m "Remove .env file"
   ```
4. Maak nieuwe Discord bot token (oude is gecompromitteerd!)

---

## 📋 Command Line Alternative

Als GitHub Desktop niet werkt, via terminal:

```powershell
cd D:\School\MarktsplaatsScraper2

# Initialiseer Git
git init

# Voeg alles toe
git add .

# Eerste commit
git commit -m "Initial commit - Marktplaats Scraper"

# Maak repository op GitHub.com
# Kopieer de URL van je nieuwe repo

# Link en push
git remote add origin https://github.com/USERNAME/MarktsplaatsScraper2.git
git branch -M main
git push -u origin main
```

---

## 🔍 Je Repository Bekijken

Na publish:

1. In GitHub Desktop: **Repository** → **View on GitHub**
2. Of ga naar: `https://github.com/JOUW_USERNAME/MarktsplaatsScraper2`

---

## 📖 README.md

Je README.md wordt automatisch getoond op GitHub. Deze bevat al:
- ✅ Project beschrijving
- ✅ Installatie instructies
- ✅ Gebruik voorbeelden
- ✅ Bot commands

---

## 🤝 Delen met anderen

Als iemand je project wil gebruiken:

```bash
git clone https://github.com/JOUW_USERNAME/MarktsplaatsScraper2.git
cd MarktsplaatsScraper2/Backend
cp .env.example .env
# Edit .env met eigen Discord tokens
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

Ze moeten hun EIGEN Discord bot token aanmaken!

---

## 💡 Tips

- **Commit vaak**: Kleine commits zijn beter dan grote
- **Duidelijke messages**: "Fixed bug" → "Fixed Discord channel ID validation bug"
- **Private repo**: Houd de repo private vanwege Discord tokens
- **Branch protection**: Overweeg branch protection rules voor main
- **.gitignore**: Update deze als je nieuwe gevoelige files toevoegt

---

## 🆘 Problemen?

**"Failed to push":**
- Check internetverbinding
- Check of je ingelogd bent in GitHub Desktop

**"Merge conflicts":**
- Werk vanuit één computer
- Of gebruik branches

**".env file in commits":**
- Zie security sectie hierboven
- GENEREER NIEUWE TOKENS!
