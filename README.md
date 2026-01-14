# 🔍 Marktplaats Scraper

Een complete scraper voor Marktplaats met Discord notificaties en web interface.

## ✨ Features

- 🔎 **Direct zoeken** - Zoek advertenties in real-time
- 🔔 **Discord notificaties** - Automatische meldingen voor nieuwe advertenties
- 📋 **Monitoring** - Configureer zoektermen met prijsfilters
- 🌐 **Web interface** - Gebruiksvriendelijke React applicatie
- 🤖 **Discord bot commands** - Beheer alles vanuit Discord
- ⏰ **Automatische checks** - Periodieke controle op nieuwe advertenties

## 📁 Project Structuur

```
MarktsplaatsScraper2/
├── Backend/                 # Python backend
│   ├── scraper.py          # Marktplaats scraper logica
│   ├── discord_bot.py      # Discord bot met notificaties
│   ├── api.py              # REST API voor frontend
│   ├── search_config.json  # Zoektermen configuratie
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Omgevingsvariabelen
└── Frontend/               # React frontend
    ├── src/
    │   ├── App.js          # Hoofd component
    │   └── App.css         # Styling
    └── package.json        # NPM dependencies
```

## 🚀 Installatie

### 1. Backend Setup

```powershell
cd Backend

# Maak een virtual environment
python -m venv venv
.\venv\Scripts\activate

# Installeer dependencies
pip install -r requirements.txt
```

### 2. Discord Bot Setup

1. Ga naar [Discord Developer Portal](https://discord.com/developers/applications)
2. Klik op "New Application"
3. Geef je bot een naam en klik "Create"
4. Ga naar "Bot" in het linker menu
5. Klik "Reset Token" en kopieer de token
6. Schakel onder "Privileged Gateway Intents" de volgende aan:
   - Message Content Intent
   - Server Members Intent (optioneel)
7. Ga naar "OAuth2" → "URL Generator"
8. Selecteer:
   - **Scopes**: `bot`
   - **Bot Permissions**: `Send Messages`, `Embed Links`, `Read Message History`
9. Kopieer de URL en open deze in je browser om de bot toe te voegen

### 3. Discord Channel ID ophalen

1. Open Discord
2. Ga naar User Settings → Advanced
3. Schakel "Developer Mode" in
4. Rechtermuisklik op het kanaal waar je notificaties wilt
5. Klik "Copy Channel ID"

### 4. Environment Configuratie

Kopieer `.env.example` naar `.env`:

```powershell
cp .env.example .env
```

Bewerk `.env` en vul in:

```env
DISCORD_BOT_TOKEN=jouw_discord_bot_token
DISCORD_CHANNEL_ID=jouw_channel_id
CHECK_INTERVAL_MINUTES=5
```

### 5. Frontend Setup

```powershell
cd ../Frontend

# Installeer dependencies
npm install
```

## 🎮 Gebruik

### Backend starten

**Optie 1: Discord Bot (met automatische monitoring)**
```powershell
cd Backend
.\venv\Scripts\activate
python discord_bot.py
```

**Optie 2: REST API (voor frontend)**
```powershell
cd Backend
.\venv\Scripts\activate
python api.py
```

**Optie 3: Scraper testen**
```powershell
cd Backend
.\venv\Scripts\activate
python scraper.py
```

### Frontend starten

```powershell
cd Frontend
npm start
```

De frontend opent automatisch op `http://localhost:3000`

## 🤖 Discord Bot Commands

| Command | Beschrijving | Voorbeeld |
|---------|--------------|-----------|
| `!zoek <term>` | Zoek direct naar advertenties | `!zoek iphone 15` |
| `!add <term>` | Voeg zoekterm toe aan monitoring | `!add playstation 5` |
| `!remove <term>` | Verwijder zoekterm | `!remove iphone 15` |
| `!list` | Toon alle actieve zoektermen | `!list` |
| `!help_scraper` | Toon help informatie | `!help_scraper` |

## 📝 Zoektermen Configuratie

Bewerk `Backend/search_config.json` om zoektermen aan te passen:

```json
{
  "search_terms": [
    {
      "id": "1",
      "query": "playstation 5",
      "enabled": true,
      "max_price": 500,
      "min_price": 0
    },
    {
      "id": "2",
      "query": "iphone 15",
      "enabled": true,
      "max_price": 1000,
      "min_price": 0
    }
  ]
}
```

- `query`: De zoekterm
- `enabled`: True/false om monitoring aan/uit te zetten
- `max_price`: Maximale prijs filter (0 = geen limiet)
- `min_price`: Minimale prijs filter (0 = geen limiet)

## 🌐 Web Interface

De web interface biedt:

1. **Direct Zoeken** - Zoek onmiddellijk naar advertenties
2. **Monitoring** - Beheer zoektermen voor automatische checks
3. **Resultaten** - Bekijk gevonden advertenties met afbeeldingen

## 🔧 API Endpoints

| Endpoint | Method | Beschrijving |
|----------|--------|--------------|
| `/api/search` | POST | Zoek advertenties |
| `/api/search-terms` | GET | Haal alle zoektermen op |
| `/api/search-terms` | POST | Voeg zoekterm toe |
| `/api/search-terms/<id>` | PUT | Update zoekterm |
| `/api/search-terms/<id>` | DELETE | Verwijder zoekterm |
| `/api/health` | GET | Health check |

### Voorbeeld API Request

```javascript
// Zoek advertenties
fetch('http://localhost:5000/api/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query: 'iphone 15',
    max_price: 1000,
    min_price: 0
  })
})
```

## 🛡️ Belangrijke Opmerkingen

### Rate Limiting
- Marktplaats heeft rate limiting. Gebruik niet te korte check intervals
- Aanbevolen: minimaal 5 minuten tussen checks
- Bij te veel requests kan je tijdelijk geblokkeerd worden

### Legaal Gebruik
- Deze scraper is alleen voor **persoonlijk gebruik**
- Respecteer de terms of service van Marktplaats
- Gebruik geen scraper voor commerciële doeleinden
- Overlaad de website niet met requests

### Privacy
- Sla geen persoonlijke data langdurig op
- Gebruik de scraper ethisch en verantwoord

## 🐛 Troubleshooting

### Bot start niet
- Controleer of `DISCORD_BOT_TOKEN` correct is in `.env`
- Controleer of de bot uitgenodigd is in je server
- Controleer of Message Content Intent aanstaat

### Geen advertenties gevonden
- Marktplaats kan de HTML structuur wijzigen
- Check of de website bereikbaar is
- Probeer een andere zoekterm

### Frontend kan niet verbinden met API
- Controleer of de backend API draait op port 5000
- Check CORS instellingen in `api.py`
- Controleer firewall instellingen

## 📊 Data Opslag

- `data/seen_ads.json` - Opgeslagen advertentie IDs om duplicaten te voorkomen
- `search_config.json` - Configuratie van zoektermen

## 🔄 Updates

Om de scraper te updaten:

```powershell
# Backend dependencies
cd Backend
.\venv\Scripts\activate
pip install -r requirements.txt --upgrade

# Frontend dependencies
cd ../Frontend
npm update
```

## 📝 TODO / Future Features

- [ ] Email notificaties
- [ ] Telegram bot integratie
- [ ] Meer geavanceerde filters (categorie, verkoper rating)
- [ ] Grafische weergave van prijstrends
- [ ] Database integratie voor geschiedenis
- [ ] Docker containerizatie

## 🤝 Contributing

Voel je vrij om issues te openen of pull requests in te dienen!

## 📄 License

Dit project is voor educatieve doeleinden. Gebruik op eigen risico.

## ⚠️ Disclaimer

Deze tool is gemaakt voor educatieve doeleinden. De maker is niet verantwoordelijk voor misbruik van deze tool. Gebruik altijd ethisch en binnen de wettelijke grenzen.
