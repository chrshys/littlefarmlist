import React from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/listings";
import { Listing } from "@/types/listing";

export default function PopularListings() {
  const [_, navigate] = useLocation();
  
  // Fetch all listings
  const { data: listings = [], isLoading, error } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });
  
  // Sort listings by popularity (number of items, then by creation date)
  const sortedListings = [...listings].sort((a, b) => {
    // Primary sort: number of items (more items = more popular)
    if (b.items.length !== a.items.length) {
      return b.items.length - a.items.length;
    }
    // Secondary sort: creation date (newer = more popular)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Popular Listings</h1>
          <p className="text-muted-foreground">Listings sorted by popularity</p>
        </div>
        <div className="text-xs text-neutral-500 mt-2 md:mt-0">Sorted by item count</div>
      </div>
      
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )}
      
      {error && (
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">Error loading listings</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try again
          </Button>
        </div>
      )}
      
      {!isLoading && sortedListings.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-neutral-100 text-neutral-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-800 mb-2">No listings found</h3>
          <p className="text-neutral-600 mb-4">
            Be the first to create a listing to share with your community.
          </p>
          <Button
            onClick={() => navigate("/create")}
            className="py-5 px-6"
          >
            Create a listing
          </Button>
        </div>
      )}
      
      {!isLoading && sortedListings.length > 0 && (
        <div className="space-y-4">
          {sortedListings.map(listing => (
            <Card key={listing.id} className="overflow-hidden shadow-sm hover:shadow transition-shadow">
              <CardContent className="p-0">
                {listing.imageUrl && (
                  <div className="w-full h-40 overflow-hidden">
                    <img 
                      src={listing.imageUrl} 
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-4 sm:p-5">
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <h3 className="font-medium text-lg text-neutral-800 line-clamp-1">
                      {listing.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs flex-shrink-0">
                      {listing.items.length} {listing.items.length === 1 ? "item" : "items"}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-500 mb-2">
                    {formatDate(listing.createdAt)}
                  </p>
                  
                  {/* Categories */}
                  {listing.categories && listing.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {listing.categories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {listing.description && (
                    <p className="text-neutral-700 text-sm mb-3 line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    {listing.items.slice(0, 3).map((item, index) => (
                      <Badge key={index} variant="outline" className="text-xs bg-neutral-50">
                        {item.name} – {formatCurrency(item.price)}
                      </Badge>
                    ))}
                    {listing.items.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-neutral-50">
                        +{listing.items.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50 flex justify-between items-center">
                  <Button
                    variant="link"
                    className="text-primary hover:text-primary/90 p-0 h-auto text-sm font-medium"
                    onClick={() => navigate(`/l/${listing.id}`)}
                  >
                    View details
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => navigate(`/l/${listing.id}`)}
                  >
                    See all items
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
