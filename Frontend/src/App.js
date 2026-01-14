import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import './Results.css';

const API_URL = 'http://127.0.0.1:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('search');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Monitoring state
  const [monitorTerms, setMonitorTerms] = useState([]);
  const [monitorResults, setMonitorResults] = useState([]);
  const [newTerm, setNewTerm] = useState('');
  const [newInterval, setNewInterval] = useState(5);
  const [newMaxPrice, setNewMaxPrice] = useState('');
  const [newMinPrice, setNewMinPrice] = useState('');
  
  // Advanced filter state
  const [filterLocation, setFilterLocation] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  
  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Load monitor terms and results on mount
  useEffect(() => {
    loadMonitorTerms();
    loadMonitorResultsFromDatabase();
  }, []);

  // Apply filters when results or filter settings change
  useEffect(() => {
    applyFilters();
  }, [searchResults, filterLocation, filterMaxPrice, filterMinPrice, sortBy]);

  const applyFilters = () => {
    let filtered = [...searchResults];
    
    // Helper function to parse Dutch price format
    const parsePrice = (priceText) => {
      if (!priceText) return 0;
      const text = priceText.toLowerCase();
      if (text.includes('gratis')) return 0;
      if (text.includes('bieden') || text.includes('vraagprijs')) return null;
      
      // Remove currency symbols and text, keep only numbers, dots and commas
      let numStr = priceText.replace(/[^0-9.,]/g, '');
      // Dutch format: 1.234,56 -> remove dots (thousand separator), replace comma with dot
      numStr = numStr.replace(/\./g, '').replace(',', '.');
      const price = parseFloat(numStr);
      return isNaN(price) ? null : price;
    };
    
    // Location filter
    if (filterLocation) {
      filtered = filtered.filter(result => 
        result.location?.toLowerCase().includes(filterLocation.toLowerCase())
      );
    }
    
    // Price filters
    if (filterMinPrice) {
      const minPrice = parseFloat(filterMinPrice);
      filtered = filtered.filter(result => {
        const price = parsePrice(result.price);
        return price !== null && price >= minPrice;
      });
    }
    
    if (filterMaxPrice) {
      const maxPrice = parseFloat(filterMaxPrice);
      filtered = filtered.filter(result => {
        const price = parsePrice(result.price);
        if (price === null) return false; // Exclude "bieden" items
        return price <= maxPrice;
      });
    }
    
    // Sort results
    filtered.sort((a, b) => {
      if (sortBy === 'price-asc') {
        const priceA = parsePrice(a.price) || 0;
        const priceB = parsePrice(b.price) || 0;
        return priceA - priceB;
      } else if (sortBy === 'price-desc') {
        const priceA = parsePrice(a.price) || 0;
        const priceB = parsePrice(b.price) || 0;
        return priceB - priceA;
      }
      return 0; // default: date (already sorted)
    });
    
    setFilteredResults(filtered);
  };

  const clearFilters = () => {
    setFilterLocation('');
    setFilterMaxPrice('');
    setFilterMinPrice('');
    setSortBy('date');
  };

  const loadMonitorTerms = async () => {
    try {
      const response = await axios.get(`${API_URL}/search-terms`);
      setMonitorTerms(response.data.search_terms || []);
    } catch (error) {
      console.error('Failed to load monitor terms:', error);
    }
  };

  const fetchMonitorResults = async (term) => {
    try {
      const response = await axios.post(`${API_URL}/search`, {
        query: term.query,
        max_price: term.max_price,
        min_price: term.min_price
      });
      const results = (response.data.results || []).map(result => ({
        ...result,
        image: result.image_url,
        monitorTerm: term.query
      }));
      // Add results to monitor results without duplicates
      setMonitorResults(prev => {
        const newResults = results.filter(r => 
          !prev.some(p => p.link === r.link)
        );
        return [...newResults, ...prev];
      });
    } catch (error) {
      console.error('Failed to fetch monitor results:', error);
    }
  };

  const loadMonitorResultsFromDatabase = async () => {
    try {
      // Get current monitor terms
      const termsResponse = await axios.get(`${API_URL}/search-terms`);
      const activeTerms = termsResponse.data.search_terms || [];
      
      // Get all results from database
      const resultsResponse = await axios.get(`${API_URL}/monitor-results?days=7`);
      const allResults = resultsResponse.data.results || [];
      
      // Filter only results that belong to active monitors
      if (activeTerms.length === 0) {
        setMonitorResults([]);
        return;
      }
      
      const activeQueries = activeTerms.map(t => t.query.toLowerCase());
      const filteredResults = allResults.filter(result => 
        activeQueries.includes(result.monitorTerm.toLowerCase())
      );
      
      setMonitorResults(filteredResults);
    } catch (error) {
      console.error('Failed to load monitor results from database:', error);
    }
  };

  const checkAllMonitors = async () => {
    console.log('checkAllMonitors called');
    console.log('monitorTerms:', monitorTerms);
    
    setLoading(true);
    setMessage('');
    try {
      const activeMonitors = monitorTerms.filter(t => t.enabled);
      console.log('activeMonitors:', activeMonitors);
      
      if (activeMonitors.length === 0) {
        setMessage('⚠ Geen actieve monitors');
        return;
      }
      
      // Clear old results and fetch fresh
      setMonitorResults([]);
      
      for (const term of activeMonitors) {
        console.log('Fetching results for:', term.query);
        await fetchMonitorResults(term);
      }
      
      setMessage(`✓ Check voltooid! ${activeMonitors.length} monitor(s) gecheckt`);
    } catch (error) {
      console.error('Error in checkAllMonitors:', error);
      setMessage('Error bij checking monitors');
    } finally {
      setLoading(false);
    }
  };

  const handleDirectSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      let searchParams = { query: searchTerm };
      
      // Add advanced options if shown
      if (showAdvanced) {
        if (filterLocation) searchParams.location = filterLocation;
        if (filterMinPrice) searchParams.min_price = filterMinPrice;
        if (filterMaxPrice) searchParams.max_price = filterMaxPrice;
      }
      
      const response = await axios.post(`${API_URL}/search`, searchParams);
      const results = (response.data.results || []).map(result => ({
        ...result,
        image: result.image_url // Map image_url to image for consistency
      }));
      setSearchResults(results);
      setActiveTab('results');
    } catch (error) {
      setMessage('Fout bij zoeken: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMonitor = async (e) => {
    e.preventDefault();
    if (!newTerm.trim()) {
      setMessage('Vul een zoekterm in');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await axios.post(`${API_URL}/search-terms`, {
        query: newTerm,
        enabled: true,
        max_price: parseInt(newMaxPrice) || 0,
        min_price: parseInt(newMinPrice) || 0
      });
      setMessage(`Monitor toegevoegd voor "${newTerm}"`);
      setNewTerm('');
      setNewMaxPrice('');
      setNewMinPrice('');
      loadMonitorTerms();
    } catch (error) {
      setMessage('Fout bij toevoegen: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMonitor = async (termId) => {
    try {
      // Find the term being deleted to get its query
      const termToDelete = monitorTerms.find(t => t.id === termId);
      
      await axios.delete(`${API_URL}/search-terms/${termId}`);
      setMessage('Monitor verwijderd');
      
      // Remove results associated with this monitor
      if (termToDelete) {
        setMonitorResults(prev => 
          prev.filter(r => r.monitorTerm !== termToDelete.query)
        );
      }
      
      loadMonitorTerms();
    } catch (error) {
      setMessage('Fout bij verwijderen: ' + (error.response?.data?.error || error.message));
    }
  };

  const removeMonitorResult = (index) => {
    // Just remove from local state - on refresh it won't come back if monitor is deleted
    setMonitorResults(prev => prev.filter((_, i) => i !== index));
  };

  const removeSearchResult = (index) => {
    setSearchResults(prev => prev.filter((_, i) => i !== index));
    // Also update filtered results
    setFilteredResults(prev => prev.filter((_, i) => i !== index));
  };

  const handleToggleMonitor = async (term) => {
    try {
      await axios.put(`${API_URL}/search-terms/${term.id}`, {
        enabled: !term.enabled
      });
      loadMonitorTerms();
    } catch (error) {
      setMessage('Fout bij wijzigen: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="App">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="25" cy="25" r="23" fill="url(#gradient)" stroke="white" strokeWidth="2"/>
              <path d="M25 15L32 22L25 29" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M18 22H32" stroke="white" strokeWidth="3" strokeLinecap="round"/>
              <path d="M20 30H30" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              <defs>
                <linearGradient id="gradient" x1="0" y1="0" x2="50" y2="50">
                  <stop offset="0%" stopColor="#667eea"/>
                  <stop offset="100%" stopColor="#764ba2"/>
                </linearGradient>
              </defs>
            </svg>
            <div className="logo-text">
              <h2>Marktplaats</h2>
              <span>Scraper Pro</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'search' ? 'active' : ''}`}
            onClick={() => setActiveTab('search')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
            </svg>
            <span>Direct Zoeken</span>
          </button>
          <button 
            className={`nav-item ${activeTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setActiveTab('monitor')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
            </svg>
            <span>Monitoring</span>
            {monitorTerms.filter(t => t.enabled).length > 0 && (
              <span className="badge">{monitorTerms.filter(t => t.enabled).length}</span>
            )}
          </button>
          <button 
            className={`nav-item ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
            </svg>
            <span>Resultaten</span>
            {filteredResults.length > 0 && (
              <span className="badge">{filteredResults.length}</span>
            )}
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="stats-card">
            <div className="stat">
              <span className="stat-label">Actieve Monitors</span>
              <span className="stat-value">{monitorTerms.filter(t => t.enabled).length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Totaal Resultaten</span>
              <span className="stat-value">{searchResults.length}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h1>
            {activeTab === 'search' && 'Direct Zoeken'}
            {activeTab === 'monitor' && 'Monitoring Beheer'}
            {activeTab === 'results' && 'Zoekresultaten'}
          </h1>
          <div className="user-section">
            <div className="notification-icon">
              <svg width="24" height="24" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
              </svg>
              {monitorTerms.filter(t => t.enabled).length > 0 && <span className="notification-dot"></span>}
            </div>
          </div>
        </header>

        {message && (
          <div className={`message ${message.includes('Fout') ? 'error' : 'success'}`}>
            {message}
          </div>
        )}

        <div className="content-wrapper">
        {/* Direct Search Tab */}
        {activeTab === 'search' && (
          <div className="tab-content search-tab">
            <div className="panel">
              <div className="panel-header">
                <h2>Nieuwe Zoekopdracht</h2>
                <p>Zoek direct naar advertenties op Marktplaats</p>
              </div>
              
              <form onSubmit={handleDirectSearch} className="search-form">
                <div className="search-box">
                  <svg className="search-icon" width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
                  </svg>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Zoek naar iPhone, PS5, Nintendo Switch..."
                    required
                  />
                  <button type="submit" disabled={loading} className="search-btn">
                    {loading ? 'Bezig...' : 'Zoeken'}
                  </button>
                </div>

                <button 
                  type="button"
                  className="toggle-advanced-btn"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                >
                  <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z"/>
                  </svg>
                  {showAdvanced ? 'Verberg filters' : 'Toon geavanceerde filters'}
                </button>

                {showAdvanced && (
                  <div className="advanced-filters">
                    <div className="filter-grid">
                      <div className="filter-item">
                        <label>
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                          </svg>
                          Locatie
                        </label>
                        <input
                          type="text"
                          value={filterLocation}
                          onChange={(e) => setFilterLocation(e.target.value)}
                          placeholder="Amsterdam, Utrecht..."
                        />
                      </div>

                      <div className="filter-item">
                        <label>
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                          </svg>
                          Min prijs (€)
                        </label>
                        <input
                          type="number"
                          value={filterMinPrice}
                          onChange={(e) => setFilterMinPrice(e.target.value)}
                          placeholder="0"
                        />
                      </div>

                      <div className="filter-item">
                        <label>
                          <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
                          </svg>
                          Max prijs (€)
                        </label>
                        <input
                          type="number"
                          value={filterMaxPrice}
                          onChange={(e) => setFilterMaxPrice(e.target.value)}
                          placeholder="999999"
                        />
                      </div>
                    </div>

                    <button 
                      type="button" 
                      className="clear-filters-btn"
                      onClick={clearFilters}
                    >
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                      </svg>
                      Wis alle filters
                    </button>
                  </div>
                )}
              </form>
            </div>

            <div className="panel info-panel">
              <div className="info-grid">
                <div className="info-card">
                  <div className="info-icon">
                    <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <h3>Snel Zoeken</h3>
                  <p>Vind direct wat je zoekt met realtime resultaten van Marktplaats</p>
                </div>
                <div className="info-card">
                  <div className="info-icon">
                    <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                    </svg>
                  </div>
                  <h3>Geavanceerde Filters</h3>
                  <p>Filter op locatie, prijs en meer om exact te vinden wat je zoekt</p>
                </div>
                <div className="info-card">
                  <div className="info-icon">
                    <svg width="32" height="32" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/>
                    </svg>
                  </div>
                  <h3>Monitor Advertenties</h3>
                  <p>Stel notificaties in en mis nooit meer een nieuwe advertentie</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monitoring Tab */}
        {activeTab === 'monitor' && (
          <div className="tab-content monitor-tab">
            <div className="panel">
              <div className="panel-header">
                <h2>Monitor Toevoegen</h2>
                <p>Krijg notificaties wanneer nieuwe advertenties worden geplaatst</p>
              </div>
              
              <form onSubmit={handleAddMonitor} className="monitor-form">
                <div className="form-row">
                  <div className="form-field">
                    <label>Zoekterm</label>
                    <input
                      type="text"
                      value={newTerm}
                      onChange={(e) => setNewTerm(e.target.value)}
                      placeholder="iPhone 15 Pro, PS5, Nintendo Switch..."
                      required
                    />
                  </div>
                  
                  <div className="form-field">
                    <label>Check interval (minuten)</label>
                    <input
                      type="number"
                      value={newInterval}
                      onChange={(e) => setNewInterval(e.target.value)}
                      min="1"
                      max="60"
                      required
                    />
                  </div>
                  
                  <button type="submit" disabled={loading} className="add-monitor-btn">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/>
                    </svg>
                    {loading ? 'Bezig...' : 'Monitor Toevoegen'}
                  </button>
                </div>
              </form>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h2>Actieve Monitors</h2>
                <span className="count-badge">{monitorTerms.length}</span>
              </div>
              
              {monitorTerms.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                  </svg>
                  <p>Nog geen monitors ingesteld</p>
                  <span>Voeg hierboven je eerste monitor toe</span>
                </div>
              ) : (
                <div className="monitors-grid">
                  {monitorTerms.map((term) => {
                    // Haal laatste 3 resultaten op voor deze zoekterm
                    const termResults = searchResults.filter(r => 
                      r.title && term.query && r.title.toLowerCase().includes(term.query.toLowerCase())
                    ).slice(0, 3);
                    
                    return (
                      <div key={term.id} className={`monitor-card ${term.enabled ? 'enabled' : 'disabled'}`}>
                        <div className="monitor-header">
                          <h3>{term.query}</h3>
                          <div className={`status-badge ${term.enabled ? 'active' : 'inactive'}`}>
                            {term.enabled ? 'Actief' : 'Gepauzeerd'}
                          </div>
                        </div>
                        
                        {termResults.length > 0 && (
                          <div className="monitor-thumbnails">
                            {termResults.map((result, idx) => (
                              <div key={idx} className="monitor-thumb">
                                {result.image ? (
                                  <img src={result.image} alt={result.title} />
                                ) : (
                                  <div className="thumb-placeholder">📦</div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="monitor-meta">
                          <span>
                            <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                            </svg>
                            Check elke 5 min
                          </span>
                          {term.max_price > 0 && (
                            <span>
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                              </svg>
                              Max €{term.max_price}
                            </span>
                          )}
                          {term.min_price > 0 && (
                            <span>
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
                              </svg>
                              Min €{term.min_price}
                            </span>
                          )}
                          {termResults.length > 0 && (
                            <span>
                              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                              </svg>
                              {termResults.length} resultaten
                            </span>
                          )}
                        </div>
                      <div className="monitor-actions">
                        <button
                          onClick={() => handleToggleMonitor(term)}
                          className={`icon-btn ${term.enabled ? 'pause' : 'play'}`}
                        >
                          {term.enabled ? (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                            </svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleRemoveMonitor(term.id)}
                          className="icon-btn delete"
                        >
                          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Monitor Results Section */}
            <div className="panel" style={{marginTop: '25px'}}>
              <div className="panel-header">
                <h2>Monitor Resultaten</h2>
                <span className="count-badge">{monitorResults.length}</span>
                <button 
                  onClick={checkAllMonitors}
                  className="refresh-btn"
                  disabled={loading}
                  style={{marginLeft: 'auto'}}
                >
                  🔄 Check Nu
                </button>
              </div>
              
              {monitorResults.length === 0 ? (
                <div className="empty-state">
                  <svg width="64" height="64" viewBox="0 0 20 20" fill="currentColor" opacity="0.3">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                  </svg>
                  <p>Nog geen resultaten van monitors</p>
                  <span>Klik op "Check Nu" om te zoeken</span>
                </div>
              ) : (
                <div className="results-grid grid">
                  {monitorResults.map((result, index) => (
                    <div key={index} className="result-card monitor-result-card">
                      <button 
                        className="remove-result-btn"
                        onClick={() => removeMonitorResult(index)}
                        title="Verwijder dit resultaat"
                      >
                        ×
                      </button>
                      {result.image && (
                        <div className="result-image">
                          <img src={result.image} alt={result.title} />
                        </div>
                      )}index
                      <div className="result-content">
                        <div className="monitor-tag">
                          🔔 {result.monitorTerm}
                        </div>
                        <h3 className="result-title">{result.title}</h3>
                        <div className="result-details">
                          {result.price && (
                            <span className="result-price">💰 {result.price}</span>
                          )}
                          {result.location && (
                            <span className="result-location">📍 {result.location}</span>
                          )}
                          {result.date && (
                            <span className="result-date">📅 {result.date}</span>
                          )}
                        </div>
                        <a 
                          href={result.link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="result-link"
                        >
                          Bekijk advertentie →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div className="tab-content results-tab">
            <div className="results-header">
              <div className="results-title">
                <h2>Zoekresultaten</h2>
                <span className="result-count">{filteredResults.length} advertenties</span>
              </div>
              
              <div className="results-controls">
                <div className="sort-control">
                  <label>Sorteer:</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="date">📅 Nieuwste eerst</option>
                    <option value="price-asc">💰 Prijs (laag-hoog)</option>
                    <option value="price-desc">💰 Prijs (hoog-laag)</option>
                  </select>
                </div>
                
                <div className="view-toggle">
                  <button 
                    className={viewMode === 'grid' ? 'active' : ''}
                    onClick={() => setViewMode('grid')}
                  >
                    ⊞
                  </button>
                  <button 
                    className={viewMode === 'list' ? 'active' : ''}
                    onClick={() => setViewMode('list')}
                  >
                    ☰
                  </button>
                </div>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="active-filters">
                {filterLocation && (
                  <span className="filter-tag">
                    📍 {filterLocation}
                    <button onClick={() => setFilterLocation('')}>×</button>
                  </span>
                )}
                {filterMinPrice && (
                  <span className="filter-tag">
                    Min: €{filterMinPrice}
                    <button onClick={() => setFilterMinPrice('')}>×</button>
                  </span>
                )}
                {filterMaxPrice && (
                  <span className="filter-tag">
                    Max: €{filterMaxPrice}
                    <button onClick={() => setFilterMaxPrice('')}>×</button>
                  </span>
                )}
                {(filterLocation || filterMinPrice || filterMaxPrice) && (
                  <button className="clear-all-filters" onClick={clearFilters}>
                    Wis alle filters
                  </button>
                )}
              </div>
            )}

            <div className="results-container">
              <aside className="filters-sidebar">
                <h3>Filters</h3>
                
                <div className="filter-section">
                  <label>📍 Locatie</label>
                  <input
                    type="text"
                    value={filterLocation}
                    onChange={(e) => setFilterLocation(e.target.value)}
                    placeholder="Amsterdam, Utrecht..."
                  />
                </div>

                <div className="filter-section">
                  <label>💰 Prijsrange</label>
                  <div className="price-inputs">
                    <input
                      type="number"
                      value={filterMinPrice}
                      onChange={(e) => setFilterMinPrice(e.target.value)}
                      placeholder="Min €"
                    />
                    <span>tot</span>
                    <input
                      type="number"
                      value={filterMaxPrice}
                      onChange={(e) => setFilterMaxPrice(e.target.value)}
                      placeholder="Max €"
                    />
                  </div>
                </div>

                <button className="apply-filters" onClick={applyFilters}>
                  ✓ Pas filters toe
                </button>
                
                <button className="reset-filters" onClick={clearFilters}>
                  ↺ Reset filters
                </button>
              </aside>

              <main className="results-main">
                {filteredResults.length === 0 && searchResults.length > 0 && (
                  <div className="empty-state">
                    <p>Geen resultaten gevonden met deze filters</p>
                    <button onClick={clearFilters}>Wis filters</button>
                  </div>
                )}
                
                {searchResults.length === 0 && (
                  <div className="empty-state">
                    <p>Nog geen zoekresultaten. Start een zoekopdracht om advertenties te vinden.</p>
                  </div>
                )}

                <div className={`results-grid ${viewMode}`}>
                  {filteredResults.map((result, index) => (
                    <div key={index} className="result-card search-result-card">
                      <button 
                        className="remove-result-btn"
                        onClick={() => removeSearchResult(index)}
                        title="Verwijder dit resultaat"
                      >
                        ×
                      </button>
                      {result.image && (
                        <div className="result-image">
                          <img src={result.image} alt={result.title} />
                        </div>
                      )}
                      <div className="result-content">
                        <h3 className="result-title">{result.title}</h3>
                        <div className="result-details">
                          {result.price && (
                            <span className="result-price">💰 {result.price}</span>
                          )}
                          {result.location && (
                            <span className="result-location">📍 {result.location}</span>
                          )}
                          {result.date && (
                            <span className="result-date">📅 {result.date}</span>
                          )}
                        </div>
                        {result.description && (
                          <p className="result-description">{result.description}</p>
                        )}
                        <a 
                          href={result.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="result-link"
                        >
                          Bekijk op Marktplaats →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </main>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}

export default App;
