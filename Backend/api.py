from flask import Flask, jsonify, request
from flask_cors import CORS
from scraper import MarktplaatsScraper
import database
import json
import os

app = Flask(__name__)
CORS(app)

# Initialize database
database.init_database()

scraper = MarktplaatsScraper()

def load_config():
    """Laad configuratie"""
    if os.path.exists('search_config.json'):
        with open('search_config.json', 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"search_terms": []}

def save_config(config):
    """Sla configuratie op"""
    with open('search_config.json', 'w', encoding='utf-8') as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

@app.route('/api/search', methods=['POST'])
def search():
    """Zoek advertenties"""
    data = request.json
    query = data.get('query', '')
    max_price = data.get('max_price')
    min_price = data.get('min_price')
    
    if not query:
        return jsonify({'error': 'Query is verplicht'}), 400
    
    results = scraper.search(query, max_price, min_price)
    
    # Sla resultaten ook op in database voor cache
    for ad in results:
        database.add_search_result(ad, query)
    
    return jsonify({'results': results, 'count': len(results)})

@app.route('/api/monitor-results', methods=['GET'])
def get_monitor_results():
    """Haal alle monitor resultaten op uit database"""
    days = request.args.get('days', 7, type=int)
    results = database.get_all_monitor_results(days=days)
    return jsonify({'results': results, 'count': len(results)})

@app.route('/api/delete-monitor-result', methods=['POST'])
def delete_monitor_result():
    """Verwijder een specifiek monitor resultaat"""
    data = request.json
    ad_id = data.get('ad_id')
    monitor_term = data.get('monitor_term')
    
    if not ad_id or not monitor_term:
        return jsonify({'error': 'ad_id en monitor_term zijn verplicht'}), 400
    
    success = database.delete_monitor_result_by_id(ad_id, monitor_term)
    
    if success:
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Resultaat niet gevonden'}), 404

@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """Haal statistieken op"""
    stats = database.get_statistics()
    return jsonify(stats)

@app.route('/api/search-terms', methods=['GET'])
def get_search_terms():
    """Haal alle zoektermen op"""
    config = load_config()
    return jsonify(config)

@app.route('/api/search-terms', methods=['POST'])
def add_search_term():
    """Voeg zoekterm toe"""
    data = request.json
    config = load_config()
    
    new_id = str(len(config.get('search_terms', [])) + 1)
    new_term = {
        'id': new_id,
        'query': data.get('query', ''),
        'enabled': data.get('enabled', True),
        'max_price': data.get('max_price', 0),
        'min_price': data.get('min_price', 0)
    }
    
    config.setdefault('search_terms', []).append(new_term)
    save_config(config)
    
    return jsonify(new_term), 201

@app.route('/api/search-terms/<term_id>', methods=['PUT'])
def update_search_term(term_id):
    """Update zoekterm"""
    data = request.json
    config = load_config()
    
    for term in config.get('search_terms', []):
        if term['id'] == term_id:
            term.update({
                'query': data.get('query', term['query']),
                'enabled': data.get('enabled', term['enabled']),
                'max_price': data.get('max_price', term.get('max_price', 0)),
                'min_price': data.get('min_price', term.get('min_price', 0))
            })
            save_config(config)
            return jsonify(term)
    
    return jsonify({'error': 'Zoekterm niet gevonden'}), 404

@app.route('/api/search-terms/<term_id>', methods=['DELETE'])
def delete_search_term(term_id):
    """Verwijder zoekterm en alle bijbehorende resultaten"""
    config = load_config()
    
    # Find the term to get its query
    term_to_delete = None
    for term in config.get('search_terms', []):
        if term['id'] == term_id:
            term_to_delete = term
            break
    
    if not term_to_delete:
        return jsonify({'error': 'Zoekterm niet gevonden'}), 404
    
    # Remove the term from config
    config['search_terms'] = [
        t for t in config.get('search_terms', []) 
        if t['id'] != term_id
    ]
    save_config(config)
    
    # Delete all monitor results from database for this term
    database.delete_monitor_results_by_term(term_to_delete['query'])
    
    return jsonify({'success': True})

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({'status': 'ok', 'service': 'Marktplaats Scraper API'})

if __name__ == '__main__':
    # use_reloader=False voorkomt crashes bij file changes
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)
