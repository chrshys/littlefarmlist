import React, { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout/layout";
import { Header } from "@/components/layout/header";
import { Listing, Coordinates } from "@/types/listing";
import { formatCurrency } from "@/lib/listings";
import { Loader2 } from "lucide-react";
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

L.Marker.prototype.options.icon = DefaultIcon;

// Default coordinates for map center (will be updated based on available listings)
const DEFAULT_CENTER: Coordinates = { lat: 40.7128, lng: -74.0060 };
const DEFAULT_ZOOM = 10;

export default function MapView() {
  const [mapCenter, setMapCenter] = useState<Coordinates>(DEFAULT_CENTER);

  // Fetch all listings
  const { data: listings = [], isLoading, error } = useQuery<Listing[]>({
    queryKey: ['/api/listings'],
    retry: false
  });

  // Find a new map center based on available listings with coordinates
  useEffect(() => {
    if (listings && listings.length > 0) {
      // Find the first listing with coordinates
      const listingWithCoordinates = listings.find(listing => listing.coordinates);
      
      if (listingWithCoordinates?.coordinates) {
        setMapCenter(listingWithCoordinates.coordinates);
      }
    }
  }, [listings]);

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

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-medium text-neutral-800 mb-4">Map View</h2>
      
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* Map container with available listings */}
          <div className="h-[70vh]">
            <MapContainer
              center={[mapCenter.lat, mapCenter.lng]}
              zoom={DEFAULT_ZOOM}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              
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
            </MapContainer>
          </div>
        </CardContent>
      </Card>
      
      {listings && listings.length > 0 && listings.every(listing => !listing.coordinates) && (
        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-amber-800 text-sm">
            No listings with location data available. Add addresses to your listings to see them on the map.
          </p>
        </div>
      )}
    </div>
  );
}