import requests
from bs4 import BeautifulSoup
from urllib.parse import quote
import json
import time
from datetime import datetime
import os

class MarktplaatsScraper:
    def __init__(self):
        self.base_url = "https://www.marktplaats.nl/q/"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'nl,en-US;q=0.7,en;q=0.3',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }
        self.seen_ads_file = 'data/seen_ads.json'
        self.seen_ads = self.load_seen_ads()
        
    def load_seen_ads(self):
        """Laad eerder geziene advertenties"""
        if os.path.exists(self.seen_ads_file):
            with open(self.seen_ads_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}
    
    def save_seen_ads(self):
        """Sla geziene advertenties op"""
        os.makedirs('data', exist_ok=True)
        with open(self.seen_ads_file, 'w', encoding='utf-8') as f:
            json.dump(self.seen_ads, f, ensure_ascii=False, indent=2)
    
    def search(self, query, max_price=None, min_price=None):
        """Zoek advertenties op Marktplaats"""
        encoded_query = quote(query)
        url = f"{self.base_url}{encoded_query}/"
        
        # Voeg prijs filters toe indien opgegeven
        params = []
        if min_price:
            params.append(f"PriceCentsFrom={min_price * 100}")
        if max_price:
            params.append(f"PriceCentsTo={max_price * 100}")
        
        if params:
            url += "?" + "&".join(params)
        
        try:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Zoeken naar: {query}")
            response = requests.get(url, headers=self.headers, timeout=10)
            response.raise_for_status()
            
            # Gebruik html.parser (ingebouwd) in plaats van lxml
            soup = BeautifulSoup(response.content, 'html.parser')
            ads = []
            
            # Marktplaats gebruikt verschillende selectors, we proberen meerdere
            listings = soup.find_all('li', class_='hz-Listing')
            
            if not listings:
                # Probeer alternatieve selector
                listings = soup.find_all('article', {'data-item-id': True})
            
            for listing in listings[:20]:  # Limiteer tot 20 resultaten
                ad = self.parse_listing(listing)
                if ad:
                    ads.append(ad)
            
            print(f"Gevonden: {len(ads)} advertenties")
            return ads
            
        except Exception as e:
            print(f"Error tijdens scrapen: {e}")
            return []
    
    def parse_listing(self, listing):
        """Parse een individuele advertentie"""
        try:
            # Probeer verschillende selectors
            title_elem = listing.find('h3') or listing.find('a', class_='hz-Link')
            link_elem = listing.find('a', href=True)
            price_elem = listing.find('p', class_='hz-Listing-price') or listing.find('span', class_='price')
            location_elem = listing.find('span', class_='hz-Listing-location')
            date_elem = listing.find('span', class_='hz-Listing-date')
            
            if not title_elem or not link_elem:
                return None
            
            title = title_elem.get_text(strip=True)
            link = link_elem['href']
            
            # Zorg voor volledige URL
            if not link.startswith('http'):
                link = f"https://www.marktplaats.nl{link}"
            
            # Extraheer advertentie ID uit URL
            ad_id = link.split('/')[-1].split('.')[0] if '/' in link else None
            
            price = price_elem.get_text(strip=True) if price_elem else "Prijs onbekend"
            location = location_elem.get_text(strip=True) if location_elem else "Locatie onbekend"
            date = date_elem.get_text(strip=True) if date_elem else "Datum onbekend"
            
            # Probeer afbeelding te vinden
            img_elem = listing.find('img')
            image_url = img_elem.get('src') or img_elem.get('data-src') if img_elem else None
            
            return {
                'id': ad_id,
                'title': title,
                'price': price,
                'location': location,
                'date': date,
                'link': link,
                'image_url': image_url,
                'scraped_at': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error bij parsen advertentie: {e}")
            return None
    
    def get_new_ads(self, query, max_price=None, min_price=None):
        """Haal alleen nieuwe advertenties op"""
        all_ads = self.search(query, max_price, min_price)
        
        if query not in self.seen_ads:
            self.seen_ads[query] = []
        
        seen_ids = set(self.seen_ads[query])
        new_ads = []
        
        for ad in all_ads:
            if ad['id'] and ad['id'] not in seen_ids:
                new_ads.append(ad)
                self.seen_ads[query].append(ad['id'])
        
        if new_ads:
            self.save_seen_ads()
            print(f"✓ {len(new_ads)} nieuwe advertentie(s) gevonden voor '{query}'")
        else:
            print(f"Geen nieuwe advertenties voor '{query}'")
        
        return new_ads

if __name__ == "__main__":
    # Test de scraper
    scraper = MarktplaatsScraper()
    results = scraper.search("iphone", max_price=500)
    
    print(f"\n=== Resultaten ===")
    for ad in results[:5]:
        print(f"\nTitel: {ad['title']}")
        print(f"Prijs: {ad['price']}")
        print(f"Locatie: {ad['location']}")
        print(f"Link: {ad['link']}")
