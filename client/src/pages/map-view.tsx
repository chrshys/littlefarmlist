import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/layout";
import { Header } from "@/components/layout/header";
import { Listing, Coordinates } from "@/types/listing";
import { formatCurrency } from "@/lib/listings";
import { Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet markers not showing
// We need to manually update the path to marker icons
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom user location marker icon
const UserLocationIcon = L.divIcon({
  className: 'user-location-marker',
  html: '<div class="flex items-center justify-center w-8 h-8 bg-primary-500 rounded-full border-2 border-white shadow-md"><div class="w-2 h-2 bg-white rounded-full"></div></div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Default coordinates for map center (will be updated based on available locations)
const DEFAULT_CENTER: Coordinates = { lat: 40.7128, lng: -74.0060 };
const DEFAULT_ZOOM = 10;
const LOCAL_ZOOM = 14; // Zoom level for local view (approximately 15-20km radius)

// Component to handle location finding and map updates
const LocationFinder = () => {
  const map = useMap();
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userMarker, setUserMarker] = useState<L.Marker | null>(null);

  // Get user's current location and update map view
  useEffect(() => {
    // Check if geolocation is available in the browser
    if (!navigator.geolocation) {
      setLocationError("Your browser doesn't support geolocation");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const userLoc = { lat: latitude, lng: longitude };
        setUserLocation(userLoc);
        
        // Fly to user location with animation
        map.flyTo([userLoc.lat, userLoc.lng], LOCAL_ZOOM, {
          animate: true,
          duration: 1.5
        });

        // Add a marker for user's location
        if (userMarker) {
          userMarker.setLatLng([userLoc.lat, userLoc.lng]);
        } else {
          const marker = L.marker([userLoc.lat, userLoc.lng], { icon: UserLocationIcon })
            .addTo(map)
            .bindPopup("You are here")
            .openPopup();
          setUserMarker(marker);
        }
      },
      (error) => {
        // Handle location errors
        let errorMsg;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMsg = "Location access denied. Please enable location services.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg = "Location request timed out.";
            break;
          default:
            errorMsg = "An unknown error occurred while getting your location.";
        }
        setLocationError(errorMsg);
        console.log("Geolocation error:", errorMsg);
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => {
      // Clean up user marker when component unmounts
      if (userMarker) {
        userMarker.remove();
      }
    };
  }, [map]);

  return locationError ? (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-72 bg-white p-3 rounded-md shadow-md z-[1000] text-sm text-amber-800 border border-amber-200 bg-amber-50">
      <p>{locationError}</p>
      <Button 
        size="sm" 
        variant="outline" 
        className="mt-2 w-full"
        onClick={() => map.setView([DEFAULT_CENTER.lat, DEFAULT_CENTER.lng], DEFAULT_ZOOM)}
      >
        Show All Listings
      </Button>
    </div>
  ) : null;
};

export default function MapView() {
  const [mapCenter, setMapCenter] = useState<Coordinates>(DEFAULT_CENTER);
  const [userLocating, setUserLocating] = useState<boolean>(true);

  // Fetch all listings
  const { data: listings = [], isLoading, error } = useQuery<Listing[]>({
    queryKey: ['/api/listings'],
    retry: false
  });

  // Find a new map center based on available listings with coordinates
  // Only use this as fallback if user location fails
  useEffect(() => {
    if (!userLocating && listings && listings.length > 0) {
      // Find the first listing with coordinates
      const listingWithCoordinates = listings.find(listing => listing.coordinates);
      
      if (listingWithCoordinates?.coordinates) {
        setMapCenter(listingWithCoordinates.coordinates);
      }
    }
  }, [listings, userLocating]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500">Failed to load listings</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Try Again
        </Button>
      </div>
    );
  }

  // Function to handle location retry
  const retryLocation = () => {
    setUserLocating(true);
  };

  return (
    <div className="w-full px-2 sm:px-3">
      <h2 className="text-xl font-medium text-neutral-800 mb-4">Map View</h2>
      
      <div className="overflow-hidden rounded-lg border border-neutral-200 relative">
        {/* Map container with available listings */}
        <div className="h-[80vh]">
          <MapContainer
            center={[mapCenter.lat, mapCenter.lng]}
            zoom={DEFAULT_ZOOM}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false} // We'll add custom zoom controls
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* Show listings on the map */}
            {listings && listings.map((listing: Listing) => (
              listing.coordinates && (
                <Marker 
                  key={listing.id} 
                  position={[listing.coordinates.lat, listing.coordinates.lng]}
                >
                  <Popup>
                    <div className="max-w-xs">
                      <h3 className="font-medium text-neutral-800 mb-1">
                        {listing.title}
                      </h3>
                      {listing.items && listing.items.length > 0 && (
                        <p className="text-sm text-neutral-600 mb-2">
                          {listing.items.length} item{listing.items.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      <p className="text-sm text-neutral-700 mb-2">
                        {listing.address}
                      </p>
                      <Link href={`/l/${listing.id}`} className="text-sm text-primary-500 hover:text-primary-600 font-medium">
                        View details
                      </Link>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
            
            {/* Location finder component */}
            <LocationFinder />
            
            {/* Custom zoom controls in top-right */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
              <Button 
                size="icon" 
                onClick={retryLocation}
                className="w-10 h-10 bg-white text-neutral-700 hover:text-primary-600 shadow-md border border-neutral-200"
                title="Find my location"
              >
                <MapPin size={20} />
              </Button>
            </div>
          </MapContainer>
        </div>
      </div>
      
      {/* Show warning if no listings have coordinates */}
      {listings && listings.length > 0 && listings.every(listing => !listing.coordinates) && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 text-sm">
            No listings with location data available. Add addresses to your listings to see them on the map.
          </p>
        </div>
      )}
      
      {/* Info message about location usage */}
      <div className="mt-4 text-xs text-neutral-500">
        <p>This map uses your location to show nearby farms. If location isn't available, it will show all available listings.</p>
      </div>
    </div>
  );
}