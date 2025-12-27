import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocation } from '../context/LocationContext';
import { BathroomService } from '../services/bathroomService';
import { Bathroom, SearchFilters } from '../types/bathroom';

export default function MapScreenWeb(): React.ReactElement {
  const { location } = useLocation();
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBathrooms = async () => {
      if (!location) return;
      
      setLoading(true);
      try {
        const filters: SearchFilters = {
          maxDistance: 5000,
          isFree: false,
          isAccessible: false,
          hasChangingTable: false,
          isOpen: true,
          minRating: 0,
        };
        
        const results = await BathroomService.searchBathrooms(
          location.coords.latitude,
          location.coords.longitude,
          filters
        );
        setBathrooms(results);
      } catch (error) {
        console.error('Failed to fetch bathrooms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBathrooms();
  }, [location]);

  if (!location) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Getting your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚽 Bathroom Finder - Web Version</Text>
        <Text style={styles.subtitle}>
          Your location: {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
        </Text>
      </View>
      
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>
          📍 Interactive Map View
        </Text>
        <Text style={styles.mapSubtext}>
          Map functionality is optimized for mobile apps.
          {loading ? ' Loading bathrooms...' : ` Found ${bathrooms.length} bathrooms nearby.`}
        </Text>
      </View>

      <View style={styles.list}>
        <Text style={styles.listTitle}>Nearby Bathrooms:</Text>
        {bathrooms.slice(0, 5).map((bathroom, index) => (
          <View key={bathroom.id} style={styles.bathroomItem}>
            <Text style={styles.bathroomName}>{bathroom.name}</Text>
            <Text style={styles.bathroomAddress}>{bathroom.address}</Text>
            <Text style={styles.bathroomDistance}>
              {(bathroom.distance / 1000).toFixed(1)} km away
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  mapPlaceholder: {
    margin: 20,
    padding: 40,
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#BBDEFB',
    borderStyle: 'dashed',
  },
  mapText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1976D2',
    marginBottom: 8,
  },
  mapSubtext: {
    fontSize: 14,
    color: '#424242',
    textAlign: 'center',
  },
  list: {
    flex: 1,
    margin: 20,
    marginTop: 0,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  bathroomItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bathroomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bathroomAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  bathroomDistance: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '500',
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
