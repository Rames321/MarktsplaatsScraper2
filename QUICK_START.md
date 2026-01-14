# Quick Start Guide

## ⚡ Snelle Setup (5 minuten)

### 1️⃣ Backend Installeren

```powershell
cd Backend
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 2️⃣ Discord Bot Maken

1. Ga naar: https://discord.com/developers/applications
2. Klik "New Application" → geef een naam → "Create"
3. Ga naar "Bot" → klik "Reset Token" → **kopieer token**
4. Schakel "Message Content Intent" aan
5. Ga naar "OAuth2" → "URL Generator"
   - Selecteer: `bot`
   - Permissions: `Send Messages`, `Embed Links`
6. Kopieer URL en open in browser om bot toe te voegen

### 3️⃣ Channel ID Ophalen

1. Discord → User Settings → Advanced → "Developer Mode" AAN
2. Rechtermuisklik op kanaal → "Copy Channel ID"

### 4️⃣ .env File Aanmaken

```powershell
cd Backend
cp .env.example .env
notepad .env
```

Vul in:
```env
DISCORD_BOT_TOKEN=jouw_bot_token_hier
DISCORD_CHANNEL_ID=jouw_channel_id_hier
CHECK_INTERVAL_MINUTES=5
```

### 5️⃣ Bot Starten

```powershell
cd Backend
.\venv\Scripts\activate
python discord_bot.py
```

✅ **Klaar!** De bot controleert nu elke 5 minuten op nieuwe advertenties.

## 🎮 Discord Commando's

```
!zoek iphone 15          # Direct zoeken
!add playstation 5       # Voeg toe aan monitoring
!list                    # Toon alle zoektermen
!remove iphone 15        # Verwijder zoekterm
!help_scraper           # Help info
```

## 🌐 Frontend Starten (Optioneel)

**Terminal 1 - API:**
```powershell
cd Backend
.\venv\Scripts\activate
python api.py
```

**Terminal 2 - Frontend:**
```powershell
cd Frontend
npm install
npm start
```

Open: http://localhost:3000

## 🔧 Zoektermen Aanpassen

Bewerk `Backend/search_config.json`:

```json
{
  "search_terms": [
    {
      "id": "1",
      "query": "iphone 15",
      "enabled": true,
      "max_price": 800,
      "min_price": 0
    }
  ]
}
```

## ⚠️ Tips

- **Check interval**: Gebruik minimaal 5 minuten om geblokkeerd te worden
- **Rate limiting**: Niet te veel zoektermen tegelijk
- **Eerst testen**: Gebruik `python scraper.py` om te testen
- **Legaal gebruik**: Alleen voor persoonlijk gebruik!

## 🆘 Problemen?

**Bot start niet:**
- Check of token correct is
- Bot uitgenodigd in server?
- Message Content Intent aan?

**Geen advertenties:**
- Test met: `python scraper.py`
- Probeer andere zoekterm
- Marktplaats kan offline zijn

**Frontend werkt niet:**
- Is API gestart? (python api.py)
- Check http://localhost:5000/api/health
