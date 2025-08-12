import React, { useState, useEffect, useRef, useCallback } from 'react';
// Helper to scroll to a list item
function scrollToListItem(el: HTMLDivElement | null) {
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocation } from '../context/LocationContext';
import { BathroomService } from '../services/bathroomService';
import { Bathroom, SearchFilters } from '../types/bathroom';
// Web map imports
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
// Custom icon for user location (blue dot)
const userIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

// Button to recenter map on user location
function LocateButton({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  return (
    <button
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 1000,
        background: '#fff',
        border: '1px solid #4A90E2',
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
        fontWeight: 600,
        color: '#4A90E2',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}
      onClick={() => map.setView([lat, lng], 15)}
      title="Center on your location"
    >
      📍 My Location
    </button>
  );
}
import 'leaflet/dist/leaflet.css';


  type FetchState = 'idle' | 'loading' | 'error';
  const listRefs = useRef<{ [id: string]: HTMLDivElement | null }>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [filteredBathrooms, setFilteredBathrooms] = useState<Bathroom[]>([]);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  // Force browser scroll on body for web
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      document.body.style.overflowY = 'scroll';
    }
    return () => {
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        document.body.style.overflowY = '';
      }
    };
  }, []);
  const { location } = useLocation();
  // Remove duplicate state
  const [filters, setFilters] = useState<SearchFilters>({
    maxDistance: 5000, // 5km
    isFree: false,
    isAccessible: false,
    hasChangingTable: false,
    isOpen: true,
    minRating: 0,
  });

  // Fetch bathrooms
  const searchBathrooms = useCallback(async () => {
    if (!location) return;
    setFetchState('loading');
    setErrorMsg('');
    try {
      const results = await BathroomService.searchNearby(
        location.coords.latitude,
        location.coords.longitude,
        filters
      );
      setBathrooms(results);
      setFetchState('idle');
    } catch (err) {
      setFetchState('error');
      setErrorMsg('Failed to fetch bathrooms. Please try again.');
    }
  }, [location, filters]);

  useEffect(() => {
    if (location) {
      searchBathrooms();
    }
  }, [location, filters, searchBathrooms]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      if (!search.trim()) {
        setFilteredBathrooms(bathrooms);
      } else {
        const q = search.toLowerCase();
        setFilteredBathrooms(
          bathrooms.filter(b =>
            b.name.toLowerCase().includes(q) ||
            b.address.toLowerCase().includes(q)
          )
        );
      }
      setPage(1);
    }, 350);
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [search, bathrooms]);

  // Pagination
  const PAGE_SIZE = 5;
  const pagedBathrooms = filteredBathrooms.slice(0, page * PAGE_SIZE);
  const hasMore = pagedBathrooms.length < filteredBathrooms.length;

  const onLoadMore = () => {
    if (hasMore) setPage(p => p + 1);
  };

  const toggleFilter = (key: keyof SearchFilters) => {
    if (key === 'maxDistance') return;
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const updateDistance = (distance: number) => {
    setFilters(prev => ({
      ...prev,
      maxDistance: distance,
    }));
  };

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location not available</Text>
      </View>
    );
  }

  // Fallback: If location is present but map doesn't render, show debug info
  if (!location.coords || typeof location.coords.latitude !== 'number' || typeof location.coords.longitude !== 'number') {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location data is invalid or unavailable.</Text>
        <Text selectable style={{ color: '#333', marginTop: 10, fontSize: 12 }}>
          {JSON.stringify(location, null, 2)}
        </Text>
      </View>
    );
  }

  const filtersUI = (
    <div style={{ background: 'white', padding: 16, borderBottom: '1px solid #E0E0E0' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: 12, marginBottom: 12, overflowX: 'auto' }}>
        <button
          style={{
            display: 'flex', alignItems: 'center', background: filters.isFree ? '#4A90E2' : '#F0F0F0', color: filters.isFree ? 'white' : '#666', border: 'none', borderRadius: 20, padding: '8px 16px', fontWeight: 500, cursor: 'pointer', marginRight: 8
          }}
          onClick={() => toggleFilter('isFree')}
        >
          <Ionicons name="card" size={16} color={filters.isFree ? 'white' : '#4A90E2'} />
          <span style={{ marginLeft: 6 }}>Free</span>
        </button>
        <button
          style={{
            display: 'flex', alignItems: 'center', background: filters.isAccessible ? '#4A90E2' : '#F0F0F0', color: filters.isAccessible ? 'white' : '#666', border: 'none', borderRadius: 20, padding: '8px 16px', fontWeight: 500, cursor: 'pointer', marginRight: 8
          }}
          onClick={() => toggleFilter('isAccessible')}
        >
          <Ionicons name="accessibility" size={16} color={filters.isAccessible ? 'white' : '#4A90E2'} />
          <span style={{ marginLeft: 6 }}>Accessible</span>
        </button>
        <button
          style={{
            display: 'flex', alignItems: 'center', background: filters.hasChangingTable ? '#4A90E2' : '#F0F0F0', color: filters.hasChangingTable ? 'white' : '#666', border: 'none', borderRadius: 20, padding: '8px 16px', fontWeight: 500, cursor: 'pointer', marginRight: 8
          }}
          onClick={() => toggleFilter('hasChangingTable')}
        >
          <Ionicons name="woman" size={16} color={filters.hasChangingTable ? 'white' : '#4A90E2'} />
          <span style={{ marginLeft: 6 }}>Changing Table</span>
        </button>
        <button
          style={{
            display: 'flex', alignItems: 'center', background: filters.isOpen ? '#4A90E2' : '#F0F0F0', color: filters.isOpen ? 'white' : '#666', border: 'none', borderRadius: 20, padding: '8px 16px', fontWeight: 500, cursor: 'pointer', marginRight: 8
          }}
          onClick={() => toggleFilter('isOpen')}
        >
          <Ionicons name="time" size={16} color={filters.isOpen ? 'white' : '#4A90E2'} />
          <span style={{ marginLeft: 6 }}>Open Now</span>
        </button>
      </div>
      <div style={{ marginTop: 16 }}>
        <span style={{ fontSize: 14, color: '#666', marginBottom: 8, display: 'block' }}>Max Distance: {filters.maxDistance / 1000}km</span>
        <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
          {[1, 2, 5, 10].map((km) => (
            <button
              key={km}
              style={{
                padding: '8px 16px', borderRadius: 16, background: filters.maxDistance === km * 1000 ? '#4A90E2' : '#F0F0F0', color: filters.maxDistance === km * 1000 ? 'white' : '#666', border: 'none', fontWeight: 500, cursor: 'pointer'
              }}
              onClick={() => updateDistance(km * 1000)}
            >
              {km}km
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const resultsInfo = (
    <div style={{
      position: 'absolute',
      bottom: 20,
      left: 20,
      right: 20,
      background: 'white',
      padding: 16,
      borderRadius: 12,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      textAlign: 'center',
      fontSize: 16,
      fontWeight: 600,
      color: '#333',
      zIndex: 1000
    }}>
      Found {filteredBathrooms.length} bathroom{filteredBathrooms.length !== 1 ? 's' : ''}
    </div>
  );

  const loadingOverlay = fetchState === 'loading' && (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255,255,255,0.8)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000
    }}>
      <div style={{ marginBottom: 12 }}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </div>
      <div style={{ fontSize: 16, color: '#666' }}>Searching for bathrooms...</div>
    </div>
  );

  const errorOverlay = fetchState === 'error' && (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(255,255,255,0.9)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2100
    }}>
      <div style={{ color: '#d32f2f', fontSize: 18, marginBottom: 12 }}>{errorMsg}</div>
      <button onClick={searchBathrooms} style={{ background: '#4A90E2', color: 'white', border: 'none', borderRadius: 8, padding: '8px 24px', fontWeight: 600, cursor: 'pointer' }}>Retry</button>
    </div>
  );

  // Inject style for layout before rendering
  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    let style = document.querySelector('style[data-map-global]');
    if (!style) {
      style = document.createElement('style');
      style.setAttribute('data-map-global', 'true');
      style.innerHTML = `
        html, body, #root { width: 100% !important; min-height: 100% !important; height: auto !important; box-sizing: border-box; }
        body { background: #F5F5F5 !important; }
      `;
      document.head.appendChild(style);
    }
  }
  return (
    <div style={{ width: '100%', height: '100vh', overflowY: 'auto', background: '#F5F5F5', display: 'flex', flexDirection: 'column' }}>
      {filtersUI}
      <div style={{ width: '100%', minHeight: 400, position: 'relative', marginBottom: 0 }}>
        <MapContainer
          center={[location.coords.latitude, location.coords.longitude]}
          zoom={15}
          style={{ height: '400px', width: '100%', borderRadius: 16 }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {/* User location marker */}
          <Marker
            position={[location.coords.latitude, location.coords.longitude]}
            icon={userIcon}
          >
            <Popup>You are here</Popup>
          </Marker>
          {/* Bathroom markers */}
          {bathrooms.length === 0 && (
            <Popup position={[location.coords.latitude, location.coords.longitude]}>
              <div>No bathrooms found nearby.</div>
            </Popup>
          )}
          {bathrooms.map((bathroom) => (
            <Marker
              key={bathroom.id}
              position={[bathroom.latitude, bathroom.longitude]}
              eventHandlers={{
                click: () => {
                  setSelectedId(bathroom.id);
                  setTimeout(() => scrollToListItem(listRefs.current[bathroom.id] || null), 100);
                },
              }}
            >
              <Popup>
                <div>
                  <strong>{bathroom.name}</strong><br />
                  {bathroom.address}<br />
                  Rating: {bathroom.rating?.toFixed(1) || 'N/A'}<br />
                  Distance: {(bathroom.distance || 0) / 1000}km<br />
                  {bathroom.isFree && <span>Free<br /></span>}
                  {bathroom.isAccessible && <span>Accessible<br /></span>}
                  {bathroom.hasChangingTable && <span>Changing Table<br /></span>}
                </div>
              </Popup>
            </Marker>
          ))}
          {/* Locate button overlays the map */}
          <LocateButton lat={location.coords.latitude} lng={location.coords.longitude} />
        </MapContainer>
      </div>
      {/* Search bar and scrollable bathroom list */}
      <div style={{ flex: 1, overflowY: 'auto', background: '#fff', borderTop: '1px solid #eee', padding: 0 }}>
        <div style={{ maxWidth: 600, margin: '0 auto', padding: 16 }}>
          <input
            type="text"
            placeholder="Search bathrooms..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 20,
              border: '1px solid #E0E0E0',
              fontSize: 16,
              marginBottom: 16,
              outline: 'none',
            }}
          />
          {fetchState === 'idle' && pagedBathrooms.length === 0 && (
            <div style={{ color: '#888', textAlign: 'center', marginTop: 32 }}>No bathrooms found.</div>
          )}
          {pagedBathrooms.map((bathroom) => (
            <div
              key={bathroom.id}
              ref={(el) => {
                listRefs.current[bathroom.id] = el;
              }}
              onClick={() => {
                setSelectedId(bathroom.id);
              }}
              style={{
                border: selectedId === bathroom.id ? '2px solid #4A90E2' : '1px solid #eee',
                borderRadius: 12,
                marginBottom: 16,
                padding: 16,
                background: selectedId === bathroom.id ? 'rgba(74,144,226,0.08)' : '#fafbfc',
                boxShadow: selectedId === bathroom.id ? '0 2px 8px rgba(74,144,226,0.08)' : '0 1px 2px rgba(0,0,0,0.03)',
                cursor: 'pointer',
                transition: 'border 0.2s, background 0.2s',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{bathroom.name}</div>
              <div style={{ color: '#666', fontSize: 14, marginBottom: 4 }}>{bathroom.address}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#444', marginBottom: 4 }}>
                <span>Rating: {bathroom.rating?.toFixed(1) || 'N/A'}</span>
                <span>Distance: {(bathroom.distance || 0) / 1000}km</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {bathroom.isFree && <span style={{ background: '#e3f7e1', color: '#2e7d32', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>Free</span>}
                {bathroom.isAccessible && <span style={{ background: '#e1eaf7', color: '#1565c0', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>Accessible</span>}
                {bathroom.hasChangingTable && <span style={{ background: '#f7e1f0', color: '#ad1457', borderRadius: 8, padding: '2px 8px', fontSize: 12 }}>Changing Table</span>}
              </div>
            </div>
          ))}
          {hasMore && fetchState === 'idle' && (
            <div style={{ textAlign: 'center', marginTop: 8 }}>
              <button
                onClick={onLoadMore}
                style={{
                  background: '#4A90E2', color: 'white', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 600, cursor: 'pointer', fontSize: 16
                }}
              >
                Load More
              </button>
            </div>
          )}
        </div>
      </div>
      {errorOverlay}
      {loadingOverlay}
      {resultsInfo}
    </div>
  );
}


