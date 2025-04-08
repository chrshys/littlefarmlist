import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Sprout } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/listings";
import { Listing } from "@/types/listing";
import { CategoryRow } from "@/components/CategoryRow";

export default function Home() {
  const [_, navigate] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string>("Discover");
  
  // Get category ID from selected category name
  const getCategoryId = (categoryName: string): number | null => {
    const category = categoriesData.find(cat => cat.name === categoryName);
    return category ? category.id : null;
  };
  
  // Fetch categories from API
  const { data: categoriesData = [], isLoading: categoriesLoading } = useQuery<{ id: number, name: string, description: string }[]>({
    queryKey: ["/api/categories"],
  });
  
  // Process categories for display
  // Add our special 'Discover' and 'Popular' options at the beginning
  const categories = ["Discover", "Popular", ...categoriesData.map(cat => cat.name)];
  
  // Fetch all listings or category-specific listings
  const { data: listings = [], isLoading: listingsLoading } = useQuery<Listing[]>({
    queryKey: [
      selectedCategory === "Discover" || selectedCategory === "Popular" 
        ? "/api/listings" 
        : `/api/categories/${getCategoryId(selectedCategory)}/listings`
    ],
    // Only fetch category-specific listings if a specific category is selected (not Discover or Popular)
    enabled: selectedCategory === "Discover" || selectedCategory === "Popular" || !!getCategoryId(selectedCategory),
  });
  
  // Loading state for components
  const isLoading = listingsLoading || categoriesLoading;
  
  // Trending searches - these would be dynamically generated based on user behavior
  const trendingSearches = [
    "farm fresh eggs", "organic produce", "local honey", "homemade bread", "fresh milk", "handmade soap"
  ];
  
  return (
    <main className="mt-8 pb-12">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mb-4">
          Discover local products<br /> from your neighbours
        </h1>
        <p className="text-lg text-neutral-600 max-w-2xl mx-auto mb-8">
          Discover locally grown and handmade goods in your community
        </p>
        
        {/* Search Bar */}
        <div className="max-w-lg mx-auto relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-5 w-5" />
            <Input 
              placeholder="What are you looking for?" 
              className="pl-10 py-6 text-base rounded-full pr-24"
            />
            <div className="absolute right-1.5 top-1/2 transform -translate-y-1/2">
              <Button 
                className="rounded-full h-9" 
                size="sm"
              >
                Search
              </Button>
            </div>
          </div>
          
          {/* Trending Searches */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <span className="text-sm text-neutral-500 mr-1">Trending searches:</span>
            {trendingSearches.map((term, index) => (
              <button 
                key={index}
                className="text-sm text-neutral-600 hover:text-primary hover:underline transition-colors"
                onClick={() => {/* Would handle search */}}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>
      
      {/* Categories */}
      <section className="mb-10">
        <CategoryRow 
          categories={categories}
          title="Browse by category"
          selectedCategory={selectedCategory}
          onCategoryClick={(category) => {
            setSelectedCategory(category);
            // Here you would filter listings by the selected category
            console.log(`Selected category: ${category}`);
          }}
          onFilterClick={() => {
            // Would open filter modal
            console.log("Filter clicked");
          }}
        />
      </section>
      
      {/* Listings Grid */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">
            {selectedCategory === "Discover" && "Recent listings"}
            {selectedCategory === "Popular" && "Popular listings"}
            {selectedCategory !== "Discover" && selectedCategory !== "Popular" && `${selectedCategory} listings`}
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate("/popular")}
          >
            View all
            <span className="ml-1 text-lg leading-none">→</span>
          </Button>
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
        
        {!isLoading && listings.length === 0 && (
          <div className="text-center py-16 bg-neutral-50 rounded-lg border border-neutral-200">
            <div className="bg-neutral-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sprout className="h-8 w-8 text-neutral-400" />
            </div>
            <h3 className="text-lg font-medium text-neutral-800 mb-2">
              {(selectedCategory === "Discover" || selectedCategory === "Popular") 
                ? "No listings yet" 
                : `No ${selectedCategory} listings yet`}
            </h3>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              {(selectedCategory === "Discover" || selectedCategory === "Popular")
                ? "Be the first to create a listing and share it with your community"
                : `Be the first to create a listing in the ${selectedCategory} category`}
            </p>
            <Button onClick={() => navigate("/create")}>
              Create a listing
            </Button>
          </div>
        )}
        
        {!isLoading && listings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map(listing => (
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
                  
                  {/* Categories display */}
                  {listing.categories && listing.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {listing.categories.map((category, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {category}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  {/* Items display */}
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
      </section>
    </main>
  );
}
