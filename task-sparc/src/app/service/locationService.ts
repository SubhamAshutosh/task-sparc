import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:5656/api'; 

// Define types
interface Point {
  type: string;
  coordinates: [number, number];
}

interface PlaceRequest {
  name: string;
  type: string;
  location: Point;
}

interface PlaceResponse {
  id: number;
  name: string;
  type: string;
  lat: number;
  lon: number;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  distance?: number;
}

// List of common place types
const PLACE_TYPES = [
  'Restaurant', 'Cafe', 'Park', 'School', 'Hospital', 
  'Shopping Mall', 'Library', 'Office Building', 'Museum',
  'Theater', 'Gym', 'Hotel', 'Gas Station', 'Bank', 'Pharmacy'
];

// Function to get a random place type
const getRandomPlaceType = (): string => {
  const randomIndex = Math.floor(Math.random() * PLACE_TYPES.length);
  return PLACE_TYPES[randomIndex];
};

// Function to generate a realistic place name based on type
const generatePlaceName = (type: string, lat: number, lon: number): string => {
  // Use last digits of coordinates to create some uniqueness
  const latDigit = Math.abs(Math.floor(lat * 100) % 100);
  const lonDigit = Math.abs(Math.floor(lon * 100) % 100);
  const locationCode = `${latDigit}${lonDigit}`;
  
  switch(type) {
    case 'Restaurant':
      const restaurantNames = ['Golden Dragon', 'Spice Avenue', 'Olive Garden', 'Blue Plate', 'Sunset Grill'];
      return `${restaurantNames[lonDigit % restaurantNames.length]} #${locationCode}`;
    case 'Cafe':
      const cafeNames = ['Morning Brew', 'Coffee Haven', 'Espresso Lane', 'Bean There', 'The Daily Grind'];
      return `${cafeNames[lonDigit % cafeNames.length]} #${locationCode}`;
    case 'Park':
      const parkNames = ['Greenfield', 'Riverside', 'Central', 'Meadows', 'Sunset'];
      return `${parkNames[lonDigit % parkNames.length]} Park #${locationCode}`;
    case 'School':
      const schoolNames = ['Washington', 'Lincoln', 'Jefferson', 'Roosevelt', 'Kennedy'];
      return `${schoolNames[lonDigit % schoolNames.length]} School #${locationCode}`;
    case 'Hospital':
      const hospitalNames = ['Mercy', 'Providence', 'General', 'Memorial', 'Community'];
      return `${hospitalNames[lonDigit % hospitalNames.length]} Hospital #${locationCode}`;
    case 'Shopping Mall':
      const mallNames = ['Grand Plaza', 'City Center', 'Metro Mall', 'Gallery', 'Promenade'];
      return `${mallNames[lonDigit % mallNames.length]} #${locationCode}`;
    default:
      const genericNames = ['Downtown', 'Uptown', 'Westside', 'Eastside', 'Northpoint', 'Southgate'];
      return `${genericNames[lonDigit % genericNames.length]} ${type} #${locationCode}`;
  }
};

// Function to suggest place name and type based on location
export const suggestPlaceInfo = (lat: number, lon: number): { name: string, type: string } => {
  const type = getRandomPlaceType();
  const name = generatePlaceName(type, lat, lon);
  return { name, type };
};

// Function to add a new place with improved naming
export const addPlace = async (lat: number, lon: number, name?: string, type?: string): Promise<PlaceResponse> => {
  try {
    // If name or type not provided, generate them
    const placeInfo = name && type ? { name, type } : suggestPlaceInfo(lat, lon);
    
    const placeRequest: PlaceRequest = {
      name: placeInfo.name,
      type: placeInfo.type,
      location: {
        type: "Point",
        coordinates: [lon, lat]
      }
    };
    
    const response = await axios.post(`${API_BASE_URL}/places`, placeRequest);
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Error adding place: ' + (error.response ? error.response.data : error.message));
  }
};

// Function to get nearby places based on a radius
export const getNearbyPlaces = async (latitude: number, longitude: number, radiusKm: number): Promise<PlaceResponse[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/places/nearby`, {
      params: { latitude, longitude, radiusKm },
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Error fetching nearby places: ' + (error.response ? error.response.data : error.message));
  }
};

// Function to get the nearest place to a given location
export const getNearestPlace = async (latitude: number, longitude: number): Promise<PlaceResponse> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/places/nearest`, {
      params: { latitude, longitude },
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Error fetching nearest place: ' + (error.response ? error.response.data : error.message));
  }
};

// Function to calculate distance between two places
export const calculateDistance = async (id1: number, id2: number): Promise<number> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/places/distance`, {
      params: { id1, id2 },
    });
    return response.data;
  } catch (error: any) {
    console.error('API Error:', error.response ? error.response.data : error.message);
    throw new Error('Error calculating distance: ' + (error.response ? error.response.data : error.message));
  }
};

// Function to calculate distance between coordinates using Haversine formula
export const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const earthRadius = 6371; // Radius of the earth in km
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return earthRadius * c;
};

// Helper function to convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};