import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useLocation } from '../context/LocationContext';
import { BathroomService } from '../services/bathroomService';
import { Bathroom, SearchFilters } from '../types/bathroom';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / 300;
const LATITUDE_DELTA = 0.04;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;
const PAGE_SIZE = 5;

type FetchState = 'idle' | 'loading' | 'error';

const MapScreen: React.FC = () => {
  const { location } = useLocation();
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const [filteredBathrooms, setFilteredBathrooms] = useState<Bathroom[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [fetchState, setFetchState] = useState<FetchState>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const flatListRef = useRef<FlatList<Bathroom>>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [filters] = useState<SearchFilters>({
    maxDistance: 5000,
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
  const pagedBathrooms = filteredBathrooms.slice(0, page * PAGE_SIZE);
  const hasMore = pagedBathrooms.length < filteredBathrooms.length;

  const onEndReached = () => {
    if (hasMore) setPage(p => p + 1);
  };

  const onMarkerPress = (id: string, index: number) => {
    setSelectedId(id);
    flatListRef.current?.scrollToIndex({ index, viewPosition: 0.5 });
  };

  const onListItemPress = (id: string, index: number, bathroom: Bathroom) => {
    setSelectedId(id);
    // Optionally animate map to marker (requires MapView ref)
    // mapRef.current?.animateToRegion({
    //   latitude: bathroom.latitude,
    //   longitude: bathroom.longitude,
    //   latitudeDelta: LATITUDE_DELTA,
    //   longitudeDelta: LONGITUDE_DELTA,
    // });
  };

  if (!location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Location not available</Text>
      </View>
    );
  }

  const initialRegion: Region = {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
      >
        {pagedBathrooms.map((bathroom, idx) => (
          <Marker
            key={bathroom.id}
            coordinate={{ latitude: bathroom.latitude, longitude: bathroom.longitude }}
            pinColor={selectedId === bathroom.id ? '#4A90E2' : 'red'}
            onPress={() => onMarkerPress(bathroom.id, idx)}
          />
        ))}
      </MapView>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search bathrooms..."
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>
      <View style={styles.listContainer}>
        {fetchState === 'loading' && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4A90E2" />
            <Text style={styles.loadingText}>Loading bathrooms...</Text>
          </View>
        )}
        {fetchState === 'error' && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <TouchableOpacity onPress={searchBathrooms} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}
        <FlatList
          ref={flatListRef}
          data={pagedBathrooms}
          keyExtractor={item => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[styles.card, selectedId === item.id && styles.cardSelected]}
              onPress={() => onListItemPress(item.id, index, item)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>{item.name}</Text>
              <Text style={styles.cardAddress}>{item.address}</Text>
              <Text style={styles.cardDetails}>
                {item.rating ? `Rating: ${item.rating.toFixed(1)}  ` : ''}
                {item.isFree ? 'Free' : 'Paid'}
              </Text>
            </TouchableOpacity>
          )}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={() =>
            fetchState === 'idle' ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No bathrooms found.</Text>
              </View>
            ) : null
          }
        />
      </View>
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  map: {
    width: '100%',
    height: height * 0.55,
  },
  searchBarContainer: {
    position: 'absolute',
    top: height * 0.55 + 8,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 2,
  },
  searchBar: {
    backgroundColor: 'white',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: 8,
  },
  listContainer: {
    position: 'absolute',
    top: height * 0.55 + 56,
    left: 0,
    right: 0,
    paddingBottom: 8,
    zIndex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginLeft: 8,
    color: '#4A90E2',
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: 16,
  },
  retryButton: {
    marginTop: 8,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginRight: 12,
    width: width * 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#4A90E2',
    borderWidth: 2,
  },
  cardTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardAddress: {
    color: '#666',
    fontSize: 14,
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 13,
    color: '#444',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
  },
});
