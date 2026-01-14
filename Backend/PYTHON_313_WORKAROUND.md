# 🎯 Alternatieve Start Opties

## ⚠️ Python 3.13 Probleem

Discord.py heeft momenteel problemen met Python 3.13 (audioop module verwijderd).

### ✅ Oplossing 1: Gebruik de REST API + Manual Checks

Start de REST API zonder Discord:

```powershell
cd D:\School\MarktsplaatsScraper2\Backend
D:/School/MarktsplaatsScraper2/Backend/venv/Scripts/python.exe api.py
```

Dan kun je:
- De web interface gebruiken (Frontend)
- Manual searches doen
- Zoektermen beheren via API

### ✅ Oplossing 2: Manual Monitoring Script

Maak een simpel monitoring script zonder Discord:

**simple_monitor.py:**
```python
from scraper import MarktplaatsScraper
import json
import time

scraper = MarktplaatsScraper()

# Laad configuratie
with open('search_config.json', 'r') as f:
    config = json.load(f)

print("🔍 Monitoring gestart...")
print(f"Check interval: elke 5 minuten\n")

while True:
    for term in config['search_terms']:
        if not term.get('enabled', True):
            continue
            
        print(f"\n[{time.strftime('%H:%M:%S')}] Checking: {term['query']}")
        new_ads = scraper.get_new_ads(
            term['query'],
            term.get('max_price'),
            term.get('min_price')
        )
        
        if new_ads:
            for ad in new_ads:
                print(f"  🆕 {ad['title']}")
                print(f"     💰 {ad['price']} | 📍 {ad['location']}")
                print(f"     🔗 {ad['link']}\n")
    
    print("💤 Wachten 5 minuten...")
    time.sleep(300)  # 5 minuten
```

Start met:
```powershell
D:/School/MarktsplaatsScraper2/Backend/venv/Scripts/python.exe simple_monitor.py
```

### ✅ Oplossing 3: Installeer Python 3.12

1. Download Python 3.12 van https://www.python.org/downloads/
2. Installeer naast Python 3.13 (selecteer "Add to PATH" NIET!)
3. Maak nieuwe venv met Python 3.12:

```powershell
# Verwijder oude venv
Remove-Item -Recurse -Force venv

# Maak nieuwe met Python 3.12
py -3.12 -m venv venv

# Activeer en installeer
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process
.\venv\Scripts\activate
pip install -r requirements.txt

# Start Discord bot
python discord_bot.py
```

### ✅ Oplossing 4: Discord Webhooks

In plaats van een bot, gebruik Discord webhooks:

```python
import requests

WEBHOOK_URL = "jouw_webhook_url_hier"

def send_discord_notification(ad):
    data = {
        "embeds": [{
            "title": ad['title'],
            "url": ad['link'],
            "color": 3066993,
            "fields": [
                {"name": "💰 Prijs", "value": ad['price'], "inline": True},
                {"name": "📍 Locatie", "value": ad['location'], "inline": True}
            ],
            "thumbnail": {"url": ad.get('image_url', '')}
        }]
    }
    requests.post(WEBHOOK_URL, json=data)
```

**Webhook maken:**
1. Discord → Server Settings → Integrations → Webhooks
2. "New Webhook" → Kopieer URL
3. Gebruik in monitoring script

### 🎯 Mijn Aanbeveling

**Voor nu:** Gebruik Oplossing 2 (simple_monitor.py)
- Werkt direct zonder extra setup
- Print notificaties in terminal
- Gemakkelijk te debuggen

**Later:** Installeer Python 3.12 voor Discord bot functionaliteit

---

## 🚀 Start Simple Monitor Nu

Ik kan het script voor je maken - wil je dat?
