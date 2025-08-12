import { Bathroom, SearchFilters } from '../types/bathroom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';



const mockBathrooms: Bathroom[] = [
  // New York bathrooms
  {
    id: '1',
    name: 'Central Park Public Restroom',
    address: 'Central Park, New York, NY',
    latitude: 40.7829,
    longitude: -73.9654,
    isOpen: true,
    isFree: true,
    isAccessible: true,
    hasChangingTable: true,
    rating: 4.2,
    hours: '6:00 AM - 10:00 PM',
  },
  {
    id: '2',
    name: "Times Square McDonald's",
    address: '1500 Broadway, New York, NY',
    latitude: 40.7580,
    longitude: -73.9855,
    isOpen: true,
    isFree: false,
    isAccessible: true,
    hasChangingTable: true,
    rating: 3.8,
    hours: '24/7',
  },
  {
    id: '3',
    name: 'Bryant Park Restroom',
    address: '42nd St & 5th Ave, New York, NY',
    latitude: 40.7536,
    longitude: -73.9832,
    isOpen: true,
    isFree: true,
    isAccessible: true,
    hasChangingTable: false,
    rating: 4.5,
    hours: '7:00 AM - 11:00 PM',
  },
  // San Francisco bathrooms
  {
    id: '4',
    name: 'San Francisco Ferry Building Restroom',
    address: '1 Ferry Building, San Francisco, CA',
    latitude: 37.7955,
    longitude: -122.3937,
    isOpen: true,
    isFree: true,
    isAccessible: true,
    hasChangingTable: true,
    rating: 4.0,
    hours: '7:00 AM - 9:00 PM',
  },
  {
    id: '6',
    name: 'Golden Gate Park Restroom',
    address: '501 Stanyan St, San Francisco, CA',
    latitude: 37.7694,
    longitude: -122.4862,
    isOpen: true,
    isFree: true,
    isAccessible: true,
    hasChangingTable: true,
    rating: 4.3,
    hours: '6:00 AM - 10:00 PM',
  },
];

export class BathroomService {

  /**
   * Fetch bathrooms from Firestore within a bounding box around the user's location.
   * Firestore does not support true geo-near, so we use a bounding box.
   */
  static async searchNearbyFirestore(
    latitude: number,
    longitude: number,
    filters: SearchFilters
  ): Promise<Bathroom[]> {
    // Calculate bounding box (approximate, in degrees)
    const km = filters.maxDistance / 1000;
    const latDelta = km / 111; // 1 deg latitude ~ 111km
    const lonDelta = km / (111 * Math.cos(latitude * (Math.PI / 180)));
    const minLat = latitude - latDelta;
    const maxLat = latitude + latDelta;
    const minLon = longitude - lonDelta;
    const maxLon = longitude + lonDelta;

    // Query Firestore for bathrooms in bounding box
    const q = query(
      collection(db, 'bathrooms'),
      where('latitude', '>=', minLat),
      where('latitude', '<=', maxLat),
      where('longitude', '>=', minLon),
      where('longitude', '<=', maxLon)
    );
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bathroom));

    // Calculate distance and apply filters
    results = results.map(bathroom => {
      const distance = this.calculateDistance(latitude, longitude, bathroom.latitude, bathroom.longitude);
      return { ...bathroom, distance };
    }).filter(bathroom => {
      if (bathroom.distance && bathroom.distance > filters.maxDistance) return false;
      if (filters.isFree && !bathroom.isFree) return false;
      if (filters.isAccessible && !bathroom.isAccessible) return false;
      if (filters.hasChangingTable && !bathroom.hasChangingTable) return false;
      if (filters.isOpen && !bathroom.isOpen) return false;
      if (bathroom.rating && bathroom.rating < filters.minRating) return false;
      return true;
    });

    // Sort by distance
    return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }
  static async searchNearby(
    latitude: number,
    longitude: number,
    filters: SearchFilters
  ): Promise<Bathroom[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    let results = mockBathrooms.filter(bathroom => {
      // Calculate distance
      const distance = this.calculateDistance(
        latitude,
        longitude,
        bathroom.latitude,
        bathroom.longitude
      );
      
      bathroom.distance = distance;
      
      // Apply filters
      if (distance > filters.maxDistance) return false;
      if (filters.isFree && !bathroom.isFree) return false;
      if (filters.isAccessible && !bathroom.isAccessible) return false;
      if (filters.hasChangingTable && !bathroom.hasChangingTable) return false;
      if (filters.isOpen && !bathroom.isOpen) return false;
      if (bathroom.rating && bathroom.rating < filters.minRating) return false;
      
      return true;
    });
    
    // Sort by distance
    return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  static async searchAlongRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
    filters: SearchFilters
  ): Promise<Bathroom[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Find bathrooms along the route (simplified - in real app would use routing API)
    const routeBathrooms = mockBathrooms.filter(bathroom => {
      const distance = this.calculateDistance(
        startLat,
        startLng,
        bathroom.latitude,
        bathroom.longitude
      );
      
      bathroom.distance = distance;
      
      // Apply filters
      if (distance > filters.maxDistance) return false;
      if (filters.isFree && !bathroom.isFree) return false;
      if (filters.isAccessible && !bathroom.isAccessible) return false;
      if (filters.hasChangingTable && !bathroom.hasChangingTable) return false;
      if (filters.isOpen && !bathroom.isOpen) return false;
      if (bathroom.rating && bathroom.rating < filters.minRating) return false;
      
      return true;
    });
    
    return routeBathrooms.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  static async getBathroomDetails(id: string): Promise<Bathroom | null> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return mockBathrooms.find(bathroom => bathroom.id === id) || null;
  }

  private static calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 1000); // Convert to meters
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}
