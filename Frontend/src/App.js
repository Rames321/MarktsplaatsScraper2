import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [searchTerms, setSearchTerms] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  
  // Form states
  const [newQuery, setNewQuery] = useState('');
  const [newMaxPrice, setNewMaxPrice] = useState('');
  const [newMinPrice, setNewMinPrice] = useState('');
  
  // Direct search state
  const [directQuery, setDirectQuery] = useState('');

  useEffect(() => {
    loadSearchTerms();
  }, []);

  const loadSearchTerms = async () => {
    try {
      const response = await axios.get(`${API_URL}/search-terms`);
      setSearchTerms(response.data.search_terms || []);
    } catch (error) {
      console.error('Error loading search terms:', error);
    }
  };

  const handleDirectSearch = async (e) => {
    e.preventDefault();
    if (!directQuery.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/search`, {
        query: directQuery
      });
      setSearchResults(response.data.results || []);
      setActiveTab('results');
    } catch (error) {
      console.error('Error searching:', error);
      alert('Fout bij zoeken');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSearchTerm = async (e) => {
    e.preventDefault();
    if (!newQuery.trim()) return;

    try {
      await axios.post(`${API_URL}/search-terms`, {
        query: newQuery,
        max_price: newMaxPrice ? parseInt(newMaxPrice) : 0,
        min_price: newMinPrice ? parseInt(newMinPrice) : 0,
        enabled: true
      });
      
      setNewQuery('');
      setNewMaxPrice('');
      setNewMinPrice('');
      loadSearchTerms();
      alert('✓ Zoekterm toegevoegd!');
    } catch (error) {
      console.error('Error adding search term:', error);
      alert('Fout bij toevoegen zoekterm');
    }
  };

  const handleDeleteSearchTerm = async (id) => {
    if (!window.confirm('Weet je zeker dat je deze zoekterm wilt verwijderen?')) return;

    try {
      await axios.delete(`${API_URL}/search-terms/${id}`);
      loadSearchTerms();
    } catch (error) {
      console.error('Error deleting search term:', error);
      alert('Fout bij verwijderen zoekterm');
    }
  };

  const handleToggleEnabled = async (term) => {
    try {
      await axios.put(`${API_URL}/search-terms/${term.id}`, {
        ...term,
        enabled: !term.enabled
      });
      loadSearchTerms();
    } catch (error) {
      console.error('Error updating search term:', error);
      alert('Fout bij updaten zoekterm');
    }
  };

  return (
    <div className="App">
      <div className="container">
        <header className="header">
          <h1>🔍 Marktplaats Scraper</h1>
          <p>Zoek advertenties en ontvang Discord notificaties voor nieuwe items</p>
        </header>

        <div className="tabs">
          <button 
            className={activeTab === 'search' ? 'active' : ''} 
            onClick={() => setActiveTab('search')}
          >
            Direct Zoeken
          </button>
          <button 
            className={activeTab === 'monitor' ? 'active' : ''} 
            onClick={() => setActiveTab('monitor')}
          >
            Monitoring
          </button>
          <button 
            className={activeTab === 'results' ? 'active' : ''} 
            onClick={() => setActiveTab('results')}
          >
            Resultaten ({searchResults.length})
          </button>
        </div>

        {activeTab === 'search' && (
          <div className="tab-content">
            <div className="card">
              <h2>🔎 Direct Zoeken</h2>
              <form onSubmit={handleDirectSearch}>
                <input
                  type="text"
                  placeholder="Zoekterm (bijv. 'iphone 15')"
                  value={directQuery}
                  onChange={(e) => setDirectQuery(e.target.value)}
                  className="input"
                />
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Zoeken...' : 'Zoeken'}
                </button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'monitor' && (
          <div className="tab-content">
            <div className="card">
              <h2>➕ Voeg Zoekterm Toe</h2>
              <form onSubmit={handleAddSearchTerm}>
                <input
                  type="text"
                  placeholder="Zoekterm"
                  value={newQuery}
                  onChange={(e) => setNewQuery(e.target.value)}
                  className="input"
                  required
                />
                <div className="price-inputs">
                  <input
                    type="number"
                    placeholder="Min prijs (€)"
                    value={newMinPrice}
                    onChange={(e) => setNewMinPrice(e.target.value)}
                    className="input"
                  />
                  <input
                    type="number"
                    placeholder="Max prijs (€)"
                    value={newMaxPrice}
                    onChange={(e) => setNewMaxPrice(e.target.value)}
                    className="input"
                  />
                </div>
                <button type="submit" className="btn btn-primary">
                  Toevoegen
                </button>
              </form>
            </div>

            <div className="card">
              <h2>📋 Actieve Zoektermen ({searchTerms.length})</h2>
              {searchTerms.length === 0 ? (
                <p className="empty-state">Geen zoektermen toegevoegd</p>
              ) : (
                <div className="search-terms-list">
                  {searchTerms.map((term) => (
                    <div key={term.id} className="search-term-item">
                      <div className="search-term-info">
                        <h3>{term.query}</h3>
                        {(term.max_price > 0 || term.min_price > 0) && (
                          <p className="price-range">
                            {term.min_price > 0 && `Min: €${term.min_price}`}
                            {term.min_price > 0 && term.max_price > 0 && ' - '}
                            {term.max_price > 0 && `Max: €${term.max_price}`}
                          </p>
                        )}
                      </div>
                      <div className="search-term-actions">
                        <button
                          onClick={() => handleToggleEnabled(term)}
                          className={`btn btn-toggle ${term.enabled ? 'enabled' : 'disabled'}`}
                        >
                          {term.enabled ? '✅ Actief' : '⏸️ Gepauzeerd'}
                        </button>
                        <button
                          onClick={() => handleDeleteSearchTerm(term.id)}
                          className="btn btn-danger"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="tab-content">
            <div className="card">
              <h2>📦 Zoekresultaten</h2>
              {searchResults.length === 0 ? (
                <p className="empty-state">Geen resultaten. Gebruik de zoekfunctie!</p>
              ) : (
                <div className="results-grid">
                  {searchResults.map((ad, index) => (
                    <div key={index} className="ad-card">
                      {ad.image_url && (
                        <img src={ad.image_url} alt={ad.title} className="ad-image" />
                      )}
                      <div className="ad-content">
                        <h3>{ad.title}</h3>
                        <div className="ad-meta">
                          <span className="price">{ad.price}</span>
                          <span className="location">📍 {ad.location}</span>
                          <span className="date">📅 {ad.date}</span>
                        </div>
                        <a 
                          href={ad.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-small"
                        >
                          Bekijk op Marktplaats →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
