"""
Simpel script om database inhoud te bekijken
"""
import database
from datetime import datetime

def show_database_info():
    """Toon informatie over de database"""
    print("\n" + "="*60)
    print("📊 MARKTPLAATS SCRAPER DATABASE")
    print("="*60)
    
    # Statistieken
    stats = database.get_statistics()
    print(f"\n📈 Statistieken (laatste 7 dagen):")
    print(f"   Totaal monitor resultaten: {stats['total_monitor_results']}")
    
    if stats['results_per_term']:
        print(f"\n   Per zoekterm:")
        for item in stats['results_per_term']:
            print(f"   - {item['term']}: {item['count']} resultaten")
    
    # Recente monitor resultaten
    print(f"\n🔔 Recente Monitor Resultaten:")
    results = database.get_all_monitor_results(days=7)
    
    if not results:
        print("   Geen resultaten gevonden")
    else:
        print(f"   Totaal: {len(results)} advertenties\n")
        for i, result in enumerate(results[:10], 1):
            print(f"\n   [{i}] {result['title'][:60]}")
            print(f"       Monitor: {result['monitor_term']}")
            print(f"       Prijs: {result['price']}")
            print(f"       Locatie: {result['location']}")
            print(f"       Gevonden: {result['found_at']}")
            print(f"       Link: {result['link'][:70]}...")
        
        if len(results) > 10:
            print(f"\n   ... en nog {len(results) - 10} resultaten meer")
    
    print("\n" + "="*60)
    print(f"Database bestand: marktplaats_scraper.db")
    print("="*60 + "\n")

if __name__ == '__main__':
    show_database_info()
