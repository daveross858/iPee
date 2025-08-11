import { Bathroom, SearchFilters } from '../types/bathroom';

// Mock data for demonstration - in a real app, this would come from APIs like:
// - Google Places API
// - OpenStreetMap
// - Refugerestrooms.org API
// - Local government APIs

const mockBathrooms: Bathroom[] = [
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
    name: 'Times Square McDonald\'s',
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
    rating: 4.0,
    hours: '7:00 AM - 11:00 PM',
  },
  {
    id: '4',
    name: 'Grand Central Terminal',
    address: '89 E 42nd St, New York, NY',
    latitude: 40.7527,
    longitude: -73.9772,
    isOpen: true,
    isFree: false,
    isAccessible: true,
    hasChangingTable: true,
    rating: 4.5,
    hours: '5:30 AM - 2:00 AM',
  },
  {
    id: '5',
    name: 'Union Square Park',
    address: 'Union Square, New York, NY',
    latitude: 40.7359,
    longitude: -73.9911,
    isOpen: true,
    isFree: true,
    isAccessible: true,
    hasChangingTable: false,
    rating: 3.9,
    hours: '6:00 AM - 10:00 PM',
  },
];

export class BathroomService {
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
