# 🤖 Discord Bot Setup

## Bot is niet toegevoegd aan een server!

### Stap 1: Voeg de bot toe aan je Discord server

1. Ga naar: https://discord.com/developers/applications
2. Selecteer je "MarktplaatsScraper" applicatie
3. Ga naar **OAuth2** → **URL Generator**
4. Selecteer de volgende **scopes**:
   - ✅ `bot`
5. Selecteer de volgende **Bot Permissions**:
   - ✅ `Send Messages`
   - ✅ `Embed Links`
   - ✅ `Read Message History`
   - ✅ `Read Messages/View Channels`
6. Kopieer de **Generated URL** onderaan
7. Open de URL in je browser
8. Selecteer je Discord server
9. Klik "Authorize"

### Stap 2: Haal het Channel ID op

1. Open Discord desktop/browser (niet mobiel)
2. Ga naar **User Settings** → **Advanced**
3. Schakel **Developer Mode** AAN
4. Rechtermuisklik op het kanaal waar je notificaties wilt
5. Klik **"Copy Channel ID"**

### Stap 3: Update .env file

```env
DISCORD_BOT_TOKEN=MTQ2MDcyNTE2ODcyNzkyMDc4MA.GZL5Bc.-iv_RyeKtOGuMHIZrKRiPSdInlkt9qSVV20xuM
DISCORD_CHANNEL_ID=<plak_hier_je_channel_id>
CHECK_INTERVAL_MINUTES=5
```

### Stap 4: Test of bot toegevoegd is

```powershell
python test_bot.py
```

Dit zou nu alle servers en kanalen moeten tonen!

### Stap 5: Start de echte bot

```powershell
python discord_bot.py
```

---

## 🔗 Snelle Bot Invite Link Template

Vervang `YOUR_CLIENT_ID` met je Application ID:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=51200&scope=bot
```

**Je Client ID vinden:**
1. Discord Developer Portal
2. Je applicatie
3. **General Information** → **Application ID**

---

## ✅ Test Commando's

Als de bot draait, test in Discord:

```
!help_scraper          # Toon help
!zoek iphone          # Test zoeken
!add playstation 5    # Voeg zoekterm toe
!list                 # Toon zoektermen
```

---

## 🐛 Nog steeds problemen?

**Bot reageert niet:**
- Check of bot online is in server members lijst
- Check of bot "Read Messages" permissie heeft in kanaal
- Check of Message Content Intent aanstaat in Developer Portal

**"Kan kanaal niet vinden":**
- Zorg dat bot toegang heeft tot het kanaal
- Check of Channel ID correct is gekopieerd
- Probeer een publiek kanaal in plaats van privé
