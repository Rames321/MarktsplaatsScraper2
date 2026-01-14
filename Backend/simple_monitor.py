"""
Simple Monitoring Script - Werkt met alle Python versies!
Geen Discord nodig - print notificaties direct in terminal
"""
from scraper import MarktplaatsScraper
import json
import time
from datetime import datetime
import os

def load_config():
    """Laad zoektermen configuratie"""
    if os.path.exists('search_config.json'):
        with open('search_config.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"search_terms": []}

def clear_screen():
    """Clear terminal (optioneel)"""
    os.system('cls' if os.name == 'nt' else 'clear')

def print_banner():
    """Print banner"""
    print("=" * 70)
    print("🔍  MARKTPLAATS MONITOR  🔍".center(70))
    print("=" * 70)

def main():
    scraper = MarktplaatsScraper()
    config = load_config()
    
    print_banner()
    
    search_terms = [t for t in config.get('search_terms', []) if t.get('enabled', True)]
    
    if not search_terms:
        print("\n⚠️  Geen actieve zoektermen gevonden!")
        print("Bewerk search_config.json om zoektermen toe te voegen.\n")
        return
    
    print(f"\n✅ Monitoring {len(search_terms)} zoekterm(en):")
    for term in search_terms:
        price_info = ""
        if term.get('max_price', 0) > 0:
            price_info = f" (max €{term['max_price']})"
        print(f"   • {term['query']}{price_info}")
    
    print(f"\n⏰ Check interval: elke 5 minuten")
    print(f"🔔 Je krijgt een melding bij nieuwe advertenties\n")
    print("-" * 70)
    
    check_count = 0
    
    try:
        while True:
            check_count += 1
            timestamp = datetime.now().strftime('%H:%M:%S')
            
            print(f"\n[{timestamp}] 🔍 Check #{check_count} gestart...")
            
            total_new_ads = 0
            
            for term in search_terms:
                query = term['query']
                max_price = term.get('max_price')
                min_price = term.get('min_price')
                
                try:
                    new_ads = scraper.get_new_ads(query, max_price, min_price)
                    
                    if new_ads:
                        total_new_ads += len(new_ads)
                        print(f"\n🎉 {len(new_ads)} NIEUWE ADVERTENTIE(S) voor '{query}'!")
                        print("-" * 70)
                        
                        for ad in new_ads:
                            print(f"\n📦 {ad['title']}")
                            print(f"   💰 {ad['price']}")
                            print(f"   📍 {ad['location']} | 📅 {ad['date']}")
                            print(f"   🔗 {ad['link']}")
                        
                        print("-" * 70)
                    else:
                        print(f"   ✓ '{query}' - geen nieuwe advertenties")
                    
                    # Kleine pauze tussen zoektermen
                    time.sleep(2)
                    
                except Exception as e:
                    print(f"   ✗ Error bij '{query}': {e}")
            
            if total_new_ads > 0:
                print(f"\n✨ Totaal {total_new_ads} nieuwe advertentie(s) gevonden!")
            else:
                print(f"\n✓ Check compleet - geen nieuwe advertenties")
            
            print(f"\n💤 Wachten 5 minuten tot volgende check...")
            print(f"   (Volgende check om {datetime.now().replace(second=0, microsecond=0).replace(minute=(datetime.now().minute + 5) % 60).strftime('%H:%M')})")
            print("-" * 70)
            
            # Wacht 5 minuten (300 seconden)
            time.sleep(300)
            
    except KeyboardInterrupt:
        print("\n\n👋 Monitoring gestopt door gebruiker")
        print(f"Totaal aantal checks uitgevoerd: {check_count}")
        print("\nTot ziens! 🎈\n")

if __name__ == "__main__":
    main()
