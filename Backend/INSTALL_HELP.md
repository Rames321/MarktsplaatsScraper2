# 🔧 Installatie Troubleshooting

## ❌ Probleem: PowerShell Scripts Geblokkeerd

**Error:**
```
.\venv\Scripts\activate : File ... cannot be loaded because running scripts is disabled
```

**Oplossing 1 (Aanbevolen):**
```powershell
# Tijdelijk toestaan voor deze sessie
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Dan activeer venv
.\venv\Scripts\activate
```

**Oplossing 2 (Zonder virtual environment):**
```powershell
# Installeer direct in systeem Python
pip install -r requirements.txt
```

**Oplossing 3 (CMD gebruiken i.p.v. PowerShell):**
```cmd
cmd
venv\Scripts\activate.bat
```

---

## ❌ Probleem: lxml Build Error

**Error:**
```
error: Microsoft Visual C++ 14.0 or greater is required
```

**Oplossing:** lxml is optioneel! BeautifulSoup werkt prima zonder lxml.

De requirements zijn al aangepast. Als je toch lxml wilt:

**Optie 1 - Pre-compiled wheel installeren:**
```powershell
pip install lxml --only-binary :all:
```

**Optie 2 - Visual C++ Build Tools installeren:**
1. Download: https://visualstudio.microsoft.com/visual-cpp-build-tools/
2. Installeer "Desktop development with C++"
3. Herstart en probeer opnieuw

**Optie 3 - Skip lxml:**
BeautifulSoup gebruikt automatisch html.parser (ingebouwd in Python).

---

## ✅ Complete Werkende Installatie

```powershell
# Stap 1: Fix PowerShell policy
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Stap 2: Maak virtual environment
python -m venv venv

# Stap 3: Activeer venv
.\venv\Scripts\activate

# Stap 4: Update pip
python -m pip install --upgrade pip

# Stap 5: Installeer packages (zonder lxml)
pip install -r requirements.txt

# Stap 6: Test installatie
python -c "import requests, bs4, discord; print('✓ Alle packages geïnstalleerd!')"
```

---

## 🚀 Snelste Weg (Zonder Virtual Environment)

Als je problemen blijft hebben met venv:

```powershell
# Installeer direct
pip install requests beautifulsoup4 discord.py python-dotenv schedule flask flask-cors

# Test
python scraper.py
```

---

## 🐍 Python Versie Check

```powershell
python --version
```

**Aanbevolen:** Python 3.9 - 3.12
**Let op:** Python 3.13 is zeer nieuw en sommige packages hebben nog geen wheels

Als je Python 3.13 hebt, overweeg:
```powershell
# Installeer oudere Python versie naast 3.13
# Download Python 3.12 van python.org
```

---

## ✅ Test of Scraper Werkt

```powershell
# Test scraper zonder Discord
python scraper.py

# Als dit werkt, zijn de belangrijkste dependencies OK!
```

---

## 🆘 Nog Steeds Problemen?

1. **Verwijder venv en probeer opnieuw:**
   ```powershell
   Remove-Item -Recurse -Force venv
   python -m venv venv
   ```

2. **Check Python installatie:**
   ```powershell
   python --version
   pip --version
   ```

3. **Gebruik CMD in plaats van PowerShell:**
   - Open CMD
   - Navigeer naar Backend folder
   - Run: `venv\Scripts\activate.bat`

4. **Installeer zonder venv:**
   - Gewoon `pip install -r requirements.txt` in normale PowerShell
