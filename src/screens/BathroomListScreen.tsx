// ...existing code up to the first closing brace of styles...
import React, { useEffect, useState } from 'react';
import { Platform, View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { BathroomService } from '../services/bathroomService';
import type { Bathroom, SearchFilters } from '../types/bathroom';

const MAP_HEIGHT = 300;

let MapView: any, Marker: any;
if (Platform.OS !== 'web') {
  // @ts-ignore
  const rnMaps = require('react-native-maps');
  MapView = rnMaps.MapView;
  Marker = rnMaps.Marker;
}

export default function BathroomListScreen() {
  const [bathrooms, setBathrooms] = useState<Bathroom[]>([]);
  const userLocation = { latitude: 37.7749, longitude: -122.4194 };

  useEffect(() => {
    const fetchBathrooms = async () => {
      const filters: SearchFilters = {
        maxDistance: 5000, // meters
        isFree: false,
        isAccessible: false,
        hasChangingTable: false,
        isOpen: false,
        minRating: 0,
      };
      const results = await BathroomService.searchNearbyFirestore(
        userLocation.latitude,
        userLocation.longitude,
        filters
      );
      setBathrooms(results);
    };
    fetchBathrooms();
  }, []);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Nearby Bathrooms</Text>
      {/* List of bathrooms sorted by distance */}
      <View style={styles.listContainer}>
        {bathrooms.map(bathroom => (
          <View key={bathroom.id} style={styles.bathroomCard}>
            <Text style={styles.bathroomName}>{bathroom.name}</Text>
            <Text style={styles.bathroomAddress}>{bathroom.address}</Text>
            {bathroom.distance !== undefined && (
              <Text style={styles.bathroomDistance}>
                {bathroom.distance.toFixed(2)} meters away
              </Text>
            )}
          </View>
        ))}
      </View>
      {/* Map showing bathrooms */}
      {Platform.OS !== 'web' && MapView ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          showsUserLocation
        >
          {bathrooms.map(bathroom => (
            <Marker
              key={bathroom.id}
              coordinate={{ latitude: bathroom.latitude, longitude: bathroom.longitude }}
              title={bathroom.name}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.webMapContainer}>
          <GoogleMapWeb userLocation={userLocation} bathrooms={bathrooms} />
        </View>
      )}
    </ScrollView>
  );
}

// ...existing code...

type GoogleMapWebProps = {
  userLocation: { latitude: number; longitude: number };
  bathrooms: Bathroom[];
};

function GoogleMapWeb({ userLocation, bathrooms }: GoogleMapWebProps) {
  // Only import on web
  const { GoogleMap, Marker, useJsApiLoader } = require('@react-google-maps/api');
  const mapContainerStyle = {
    width: '100%',
    height: MAP_HEIGHT,
    borderRadius: 16,
  };
  const center = {
    lat: userLocation.latitude,
    lng: userLocation.longitude,
  };
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'YOUR_GOOGLE_MAPS_API_KEY', // <-- Replace with your API key
  });
  if (!isLoaded) return <Text>Loading map...</Text>;
  return (
    <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={15}>
      {bathrooms.map((bathroom: Bathroom) => (
        <Marker
          key={bathroom.id}
          position={{ lat: bathroom.latitude, lng: bathroom.longitude }}
          title={bathroom.name}
        />
      ))}
    </GoogleMap>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingTop: 40,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  listContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  bathroomCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bathroomName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  bathroomAddress: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  bathroomDistance: {
    fontSize: 14,
    color: '#007AFF',
  },
  map: {
    width: Dimensions.get('window').width - 32,
    height: MAP_HEIGHT,
    borderRadius: 16,
    marginBottom: 24,
  },
  webMapContainer: {
    width: Dimensions.get('window').width - 32,
    height: MAP_HEIGHT,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  webMapText: {
    color: '#666',
    fontSize: 18,
  },
});