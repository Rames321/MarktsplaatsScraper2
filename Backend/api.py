from flask import Flask, jsonify, request
from flask_cors import CORS
from scraper import MarktplaatsScraper
import json
import os

app = Flask(__name__)
CORS(app)

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
    return jsonify({'results': results, 'count': len(results)})

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
    """Verwijder zoekterm"""
    config = load_config()
    original_length = len(config.get('search_terms', []))
    
    config['search_terms'] = [
        t for t in config.get('search_terms', []) 
        if t['id'] != term_id
    ]
    
    if len(config['search_terms']) < original_length:
        save_config(config)
        return jsonify({'success': True})
    
    return jsonify({'error': 'Zoekterm niet gevonden'}), 404

@app.route('/api/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({'status': 'ok', 'service': 'Marktplaats Scraper API'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
