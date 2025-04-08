import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Filter, Sprout } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/listings";
import { Listing } from "@/types/listing";
import { CategoryRow } from "@/components/CategoryRow";

export default function Explore() {
  const [_, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  
  // Fetch all listings
  const { data: listings = [], isLoading } = useQuery<Listing[]>({
    queryKey: ["/api/listings"],
  });
  
  // Filter listings based on search term and category
  const filteredListings = listings.filter(listing => {
    // Filter by search term if provided
    const matchesSearchTerm = !searchTerm || 
      listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filter by category if not "All"
    const matchesCategory = selectedCategory === "All" || 
      // Here you would ideally have a category field on the listing
      // For now, we'll just simulate matching based on title and items
      listing.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
      listing.items.some(item => item.name.toLowerCase().includes(selectedCategory.toLowerCase()));
    
    return matchesSearchTerm && matchesCategory;
  });
  
  // Categories for filtering
  const categories = [
    "All", "Fruits", "Vegetables", "Eggs", "Dairy", "Baked Goods", "Crafts"
  ];
  
  return (
    <main className="mt-8 pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Explore Listings</h1>
        <p className="text-neutral-600">
          Browse all listings or search for specific items
        </p>
      </div>
      
      {/* Search and Filter */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <Input 
              placeholder="Search listings..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" className="sm:w-auto">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      
      {/* Categories */}
      <div className="mb-8">
        <CategoryRow 
          categories={categories}
          title="Categories"
          selectedCategory={selectedCategory}
          onCategoryClick={(category) => {
            setSelectedCategory(category);
          }}
          onFilterClick={() => {
            // Would open filter modal
            console.log("Filter clicked");
          }}
        />
      </div>
      
      {/* Listing Results */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium">
            {searchTerm 
              ? `Search results for "${searchTerm}"${selectedCategory !== "All" ? ` in ${selectedCategory}` : ''}` 
              : selectedCategory !== "All" 
                ? `${selectedCategory} listings` 
                : "All listings"
            }
          </h2>
          <div className="text-sm text-neutral-500">
            {filteredListings.length} {filteredListings.length === 1 ? 'listing' : 'listings'} found
          </div>
        </div>
        
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2 mb-4" />
                  <div className="flex gap-2 mb-3">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {!isLoading && filteredListings.length === 0 && (
          <div className="text-center py-16 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="bg-neutral-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">No listings found</h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              {searchTerm 
                ? "Try a different search term or browse all listings" 
                : selectedCategory !== "All"
                  ? `No ${selectedCategory.toLowerCase()} listings are available at the moment`
                  : "No listings are available at the moment"}
            </p>
            <div className="flex justify-center gap-3">
              {searchTerm && (
                <Button variant="outline" onClick={() => setSearchTerm("")}>
                  Clear search
                </Button>
              )}
              {selectedCategory !== "All" && (
                <Button variant="outline" onClick={() => setSelectedCategory("All")}>
                  View all categories
                </Button>
              )}
            </div>
          </div>
        )}
        
        {!isLoading && filteredListings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredListings.map(listing => (
              <Card key={listing.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" 
                onClick={() => navigate(`/l/${listing.id}`)}>
                {listing.imageUrl ? (
                  <div className="h-48 overflow-hidden">
                    <img 
                      src={listing.imageUrl} 
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-neutral-100 flex items-center justify-center">
                    <Sprout className="h-10 w-10 text-neutral-300" />
                  </div>
                )}
                
                <CardContent className="p-4">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-medium text-lg text-neutral-800 line-clamp-1">
                      {listing.title}
                    </h3>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {listing.items.length} {listing.items.length === 1 ? 'item' : 'items'}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-500 mb-3">
                    {formatDate(listing.createdAt)}
                  </p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {listing.items.slice(0, 3).map((item, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {item.name} – {formatCurrency(item.price)}
                      </Badge>
                    ))}
                    {listing.items.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{listing.items.length - 3} more
                      </Badge>
                    )}
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                  >
                    View details
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}