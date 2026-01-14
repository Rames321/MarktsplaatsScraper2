import sqlite3
import json
from datetime import datetime, timedelta
from contextlib import contextmanager

DATABASE_PATH = 'marktplaats_scraper.db'

@contextmanager
def get_db():
    """Context manager voor database connectie"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()

def init_database():
    """Initialiseer database en maak tabellen aan"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Tabel voor monitor resultaten
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS monitor_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ad_id TEXT NOT NULL,
                monitor_term TEXT NOT NULL,
                title TEXT NOT NULL,
                price TEXT,
                location TEXT,
                date TEXT,
                link TEXT NOT NULL,
                image_url TEXT,
                description TEXT,
                found_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                notified INTEGER DEFAULT 0,
                UNIQUE(ad_id, monitor_term)
            )
        ''')
        
        # Tabel voor zoek resultaten (tijdelijk voor sessie)
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS search_results (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ad_id TEXT NOT NULL,
                search_query TEXT NOT NULL,
                title TEXT NOT NULL,
                price TEXT,
                location TEXT,
                date TEXT,
                link TEXT NOT NULL,
                image_url TEXT,
                description TEXT,
                searched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(ad_id, search_query)
            )
        ''')
        
        # Index voor snellere queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_monitor_term ON monitor_results(monitor_term)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_found_at ON monitor_results(found_at)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_search_query ON search_results(search_query)')
        
        print("✓ Database geïnitialiseerd")

def add_monitor_result(ad, monitor_term):
    """Voeg een monitor resultaat toe aan de database"""
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO monitor_results 
                (ad_id, monitor_term, title, price, location, date, link, image_url, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                ad.get('id'),
                monitor_term,
                ad.get('title'),
                ad.get('price'),
                ad.get('location'),
                ad.get('date'),
                ad.get('link'),
                ad.get('image_url'),
                ad.get('description', '')
            ))
            return True
        except sqlite3.IntegrityError:
            # Advertentie bestaat al voor deze monitor term
            return False

def get_monitor_results(monitor_term=None, limit=100, days=7):
    """Haal monitor resultaten op uit de database"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        if monitor_term:
            cursor.execute('''
                SELECT * FROM monitor_results 
                WHERE monitor_term = ? AND found_at > ?
                ORDER BY found_at DESC 
                LIMIT ?
            ''', (monitor_term, cutoff_date, limit))
        else:
            cursor.execute('''
                SELECT * FROM monitor_results 
                WHERE found_at > ?
                ORDER BY found_at DESC 
                LIMIT ?
            ''', (cutoff_date, limit))
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def get_all_monitor_results(days=7):
    """Haal alle monitor resultaten op (voor website)"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        cursor.execute('''
            SELECT * FROM monitor_results 
            WHERE found_at > ?
            ORDER BY found_at DESC
        ''', (cutoff_date,))
        
        rows = cursor.fetchall()
        results = []
        for row in rows:
            result = dict(row)
            # Converteer naar frontend formaat
            result['monitorTerm'] = result['monitor_term']
            result['image'] = result['image_url']
            results.append(result)
        
        return results

def mark_as_notified(ad_id, monitor_term):
    """Markeer een resultaat als notified"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE monitor_results 
            SET notified = 1 
            WHERE ad_id = ? AND monitor_term = ?
        ''', (ad_id, monitor_term))

def add_search_result(ad, search_query):
    """Voeg een zoek resultaat toe (tijdelijk)"""
    with get_db() as conn:
        cursor = conn.cursor()
        try:
            cursor.execute('''
                INSERT INTO search_results 
                (ad_id, search_query, title, price, location, date, link, image_url, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                ad.get('id'),
                search_query,
                ad.get('title'),
                ad.get('price'),
                ad.get('location'),
                ad.get('date'),
                ad.get('link'),
                ad.get('image_url'),
                ad.get('description', '')
            ))
            return True
        except sqlite3.IntegrityError:
            return False

def get_search_results(search_query, hours=24):
    """Haal recente zoek resultaten op"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        cutoff_time = datetime.now() - timedelta(hours=hours)
        
        cursor.execute('''
            SELECT * FROM search_results 
            WHERE search_query = ? AND searched_at > ?
            ORDER BY searched_at DESC
        ''', (search_query, cutoff_time))
        
        rows = cursor.fetchall()
        return [dict(row) for row in rows]

def cleanup_old_results(days=30):
    """Verwijder oude resultaten"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        cursor.execute('DELETE FROM monitor_results WHERE found_at < ?', (cutoff_date,))
        monitor_deleted = cursor.rowcount
        
        cursor.execute('DELETE FROM search_results WHERE searched_at < ?', (cutoff_date,))
        search_deleted = cursor.rowcount
        
        print(f"✓ Cleanup: {monitor_deleted} monitor results en {search_deleted} search results verwijderd")

def delete_monitor_results_by_term(monitor_term):
    """Verwijder alle resultaten voor een specifieke monitor term"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM monitor_results WHERE monitor_term = ?', (monitor_term,))
        deleted_count = cursor.rowcount
        print(f"✓ {deleted_count} resultaten verwijderd voor monitor term: {monitor_term}")
        return deleted_count

def delete_monitor_result_by_id(ad_id, monitor_term):
    """Verwijder een specifiek monitor resultaat"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('DELETE FROM monitor_results WHERE ad_id = ? AND monitor_term = ?', (ad_id, monitor_term))
        deleted_count = cursor.rowcount
        return deleted_count > 0

def get_statistics():
    """Haal statistieken op"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Totaal aantal monitor resultaten (laatste 7 dagen)
        cutoff_date = datetime.now() - timedelta(days=7)
        cursor.execute('SELECT COUNT(*) FROM monitor_results WHERE found_at > ?', (cutoff_date,))
        total_monitor = cursor.fetchone()[0]
        
        # Per monitor term
        cursor.execute('''
            SELECT monitor_term, COUNT(*) as count 
            FROM monitor_results 
            WHERE found_at > ?
            GROUP BY monitor_term
        ''', (cutoff_date,))
        per_term = cursor.fetchall()
        
        return {
            'total_monitor_results': total_monitor,
            'results_per_term': [{'term': row[0], 'count': row[1]} for row in per_term]
        }

if __name__ == '__main__':
    # Test de database
    print("Initializing database...")
    init_database()
    
    # Toon statistieken
    stats = get_statistics()
    print(f"\nStatistieken:")
    print(f"Totaal monitor resultaten (7 dagen): {stats['total_monitor_results']}")
    print(f"Per term: {stats['results_per_term']}")
