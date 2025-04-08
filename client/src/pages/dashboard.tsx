import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Listing } from "@shared/schema";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash, Edit, Share2, HeartOff } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/listings";

export default function Dashboard() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("my-listings");
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  
  // Fetch own listings
  const { 
    data: myListings, 
    isLoading: isMyListingsLoading,
    error: myListingsError 
  } = useQuery({ 
    queryKey: ['/api/listings'], 
    enabled: isAuthenticated,
    select: (data: Listing[]) => {
      // Filter listings that belong to the user
      // Since we don't have a direct field for this, we use the editToken
      // which is saved in localStorage when the user creates a listing
      const myListingTokens = getMyListings();
      return data.filter(listing => myListingTokens[listing.id]);
    }
  });
  
  // Fetch favorites
  const { 
    data: favorites, 
    isLoading: isFavoritesLoading,
    error: favoritesError 
  } = useQuery({ 
    queryKey: ['/api/favorites'], 
    enabled: isAuthenticated
  });
  
  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: async (listingId: number) => {
      return apiRequest({
        url: `/api/favorites/${listingId}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      // Invalidate the favorites query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/favorites'] });
      toast({
        title: "Success",
        description: "Listing removed from favorites",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to remove favorite",
        variant: "destructive",
      });
    }
  });
  
  // Delete listing mutation
  const deleteListingMutation = useMutation({
    mutationFn: async ({ id, editToken }: { id: number, editToken: string }) => {
      return apiRequest({
        url: `/api/listings/${id}?editToken=${editToken}`,
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      // Invalidate the listings query to refetch the data
      queryClient.invalidateQueries({ queryKey: ['/api/listings'] });
      toast({
        title: "Success",
        description: "Listing deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete listing",
        variant: "destructive",
      });
    }
  });
  
  // Share a listing
  const handleShare = (listing: Listing) => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Check out this listing: ${listing.title}`,
        url: `/l/${listing.id}`
      })
      .catch((error) => {
        console.error('Error sharing:', error);
        // Fallback to copying the URL
        copyToClipboard(`${window.location.origin}/l/${listing.id}`);
      });
    } else {
      // Fallback for browsers that don't support the Web Share API
      copyToClipboard(`${window.location.origin}/l/${listing.id}`);
    }
  };
  
  // Copy to clipboard helper
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Link copied",
        description: "Listing link copied to clipboard",
      });
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };
  
  // Helper function to get my listings from localStorage
  function getMyListings(): Record<number, string> {
    try {
      const myListings = localStorage.getItem('myListings');
      return myListings ? JSON.parse(myListings) : {};
    } catch (e) {
      console.error('Error parsing my listings:', e);
      return {};
    }
  }
  
  // Delete a listing
  const handleDelete = (listing: Listing) => {
    const editToken = getMyListings()[listing.id];
    if (!editToken) {
      toast({
        title: "Error",
        description: "You don't have permission to delete this listing",
        variant: "destructive",
      });
      return;
    }
    
    if (window.confirm("Are you sure you want to delete this listing?")) {
      deleteListingMutation.mutate({ id: listing.id, editToken });
    }
  };
  
  // Remove from favorites
  const handleRemoveFavorite = (listingId: number) => {
    removeFavoriteMutation.mutate(listingId);
  };
  
  // If authentication is still loading, show a loading message
  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <p>Loading user information...</p>
      </div>
    );
  }
  
  // If not authenticated, show a login prompt
  if (!isAuthenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
        <Card>
          <CardHeader>
            <CardTitle>Login Required</CardTitle>
            <CardDescription>Please login to view your dashboard</CardDescription>
          </CardHeader>
          <CardFooter>
            <Link href="/login">
              <Button>Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Hello, {user?.firstName || user?.username}</h1>
          <p className="text-muted-foreground">Welcome to your dashboard</p>
        </div>
        <Link href="/create">
          <Button className="mt-4 md:mt-0">Create New Listing</Button>
        </Link>
      </div>
      
      {isMobile ? (
        // Mobile/Tablet view with tabs
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="my-listings">My Listings</TabsTrigger>
            <TabsTrigger value="favorites">Favorites</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my-listings">
            <div className="grid grid-cols-1 gap-6 mt-6">
              {isMyListingsLoading ? (
                <p>Loading your listings...</p>
              ) : myListingsError ? (
                <p className="text-red-500">Error loading your listings</p>
              ) : myListings && Array.isArray(myListings) && myListings.length > 0 ? (
                myListings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {listing.imageUrl && (
                        <div className="w-full md:w-1/4 h-40 md:h-auto">
                          <img 
                            src={listing.imageUrl} 
                            alt={listing.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6">
                        <CardHeader className="p-0 pb-2">
                          <div className="flex justify-between items-start">
                            <Link href={`/l/${listing.id}`}>
                              <CardTitle className="hover:underline cursor-pointer">{listing.title}</CardTitle>
                            </Link>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleShare(listing)}>
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Link href={`/create?edit=${listing.id}&token=${getMyListings()[listing.id]}`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(listing)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {listing.categories && listing.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {listing.categories.map((category, index) => (
                                <Badge key={index} variant="outline">{category}</Badge>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="p-0 py-2">
                          <p className="text-muted-foreground line-clamp-2">{listing.description}</p>
                          {listing.items && listing.items.length > 0 && (
                            <div className="mt-2">
                              <h4 className="font-semibold">Items:</h4>
                              <ul className="mt-1">
                                {listing.items.slice(0, 3).map((item, index) => (
                                  <li key={index} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="font-medium">{formatCurrency(item.price)}</span>
                                  </li>
                                ))}
                                {listing.items.length > 3 && (
                                  <li className="text-sm text-muted-foreground">
                                    + {listing.items.length - 3} more items
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="p-0 pt-2 flex justify-between">
                          <div className="text-sm text-muted-foreground">
                            Created: {formatDate(listing.createdAt)}
                          </div>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Listings Yet</CardTitle>
                    <CardDescription>
                      You haven't created any listings yet. Create your first listing to get started.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href="/create">
                      <Button>Create Listing</Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="favorites">
            <div className="grid grid-cols-1 gap-6 mt-6">
              {isFavoritesLoading ? (
                <p>Loading your favorites...</p>
              ) : favoritesError ? (
                <p className="text-red-500">Error loading your favorites</p>
              ) : favorites && Array.isArray(favorites) && favorites.length > 0 ? (
                favorites.map((listing: Listing) => (
                  <Card key={listing.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      {listing.imageUrl && (
                        <div className="w-full md:w-1/4 h-40 md:h-auto">
                          <img 
                            src={listing.imageUrl} 
                            alt={listing.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6">
                        <CardHeader className="p-0 pb-2">
                          <div className="flex justify-between items-start">
                            <Link href={`/l/${listing.id}`}>
                              <CardTitle className="hover:underline cursor-pointer">{listing.title}</CardTitle>
                            </Link>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleShare(listing)}>
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveFavorite(listing.id)}
                              >
                                <HeartOff className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {listing.categories && listing.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {listing.categories.map((category, index) => (
                                <Badge key={index} variant="outline">{category}</Badge>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="p-0 py-2">
                          <p className="text-muted-foreground line-clamp-2">{listing.description}</p>
                          {listing.items && listing.items.length > 0 && (
                            <div className="mt-2">
                              <h4 className="font-semibold">Items:</h4>
                              <ul className="mt-1">
                                {listing.items.slice(0, 3).map((item, index) => (
                                  <li key={index} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="font-medium">{formatCurrency(item.price)}</span>
                                  </li>
                                ))}
                                {listing.items.length > 3 && (
                                  <li className="text-sm text-muted-foreground">
                                    + {listing.items.length - 3} more items
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="p-0 pt-2 flex justify-between">
                          <div className="text-sm text-muted-foreground">
                            Created: {formatDate(listing.createdAt)}
                          </div>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Favorites Yet</CardTitle>
                    <CardDescription>
                      You haven't added any listings to your favorites yet.
                      Browse listings and click the heart icon to add them to your favorites.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href="/explore">
                      <Button>Explore Listings</Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      ) : (
        // Desktop view with columns
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* My Listings Column */}
          <div>
            <h2 className="text-xl font-semibold mb-4">My Listings</h2>
            <div className="grid grid-cols-1 gap-6">
              {isMyListingsLoading ? (
                <p>Loading your listings...</p>
              ) : myListingsError ? (
                <p className="text-red-500">Error loading your listings</p>
              ) : myListings && Array.isArray(myListings) && myListings.length > 0 ? (
                myListings.map((listing) => (
                  <Card key={listing.id} className="overflow-hidden">
                    <div className="flex flex-col">
                      {listing.imageUrl && (
                        <div className="w-full h-40">
                          <img 
                            src={listing.imageUrl} 
                            alt={listing.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6">
                        <CardHeader className="p-0 pb-2">
                          <div className="flex justify-between items-start">
                            <Link href={`/l/${listing.id}`}>
                              <CardTitle className="hover:underline cursor-pointer">{listing.title}</CardTitle>
                            </Link>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleShare(listing)}>
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Link href={`/create?edit=${listing.id}&token=${getMyListings()[listing.id]}`}>
                                <Button variant="ghost" size="icon">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Button variant="ghost" size="icon" onClick={() => handleDelete(listing)}>
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {listing.categories && listing.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {listing.categories.map((category, index) => (
                                <Badge key={index} variant="outline">{category}</Badge>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="p-0 py-2">
                          <p className="text-muted-foreground line-clamp-2">{listing.description}</p>
                          {listing.items && listing.items.length > 0 && (
                            <div className="mt-2">
                              <h4 className="font-semibold">Items:</h4>
                              <ul className="mt-1">
                                {listing.items.slice(0, 3).map((item, index) => (
                                  <li key={index} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="font-medium">{formatCurrency(item.price)}</span>
                                  </li>
                                ))}
                                {listing.items.length > 3 && (
                                  <li className="text-sm text-muted-foreground">
                                    + {listing.items.length - 3} more items
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="p-0 pt-2 flex justify-between">
                          <div className="text-sm text-muted-foreground">
                            Created: {formatDate(listing.createdAt)}
                          </div>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Listings Yet</CardTitle>
                    <CardDescription>
                      You haven't created any listings yet. Create your first listing to get started.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href="/create">
                      <Button>Create Listing</Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
          
          {/* Favorites Column */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Favorites</h2>
            <div className="grid grid-cols-1 gap-6">
              {isFavoritesLoading ? (
                <p>Loading your favorites...</p>
              ) : favoritesError ? (
                <p className="text-red-500">Error loading your favorites</p>
              ) : favorites && Array.isArray(favorites) && favorites.length > 0 ? (
                favorites.map((listing: Listing) => (
                  <Card key={listing.id} className="overflow-hidden">
                    <div className="flex flex-col">
                      {listing.imageUrl && (
                        <div className="w-full h-40">
                          <img 
                            src={listing.imageUrl} 
                            alt={listing.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 p-6">
                        <CardHeader className="p-0 pb-2">
                          <div className="flex justify-between items-start">
                            <Link href={`/l/${listing.id}`}>
                              <CardTitle className="hover:underline cursor-pointer">{listing.title}</CardTitle>
                            </Link>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="icon" onClick={() => handleShare(listing)}>
                                <Share2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleRemoveFavorite(listing.id)}
                              >
                                <HeartOff className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          {listing.categories && listing.categories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {listing.categories.map((category, index) => (
                                <Badge key={index} variant="outline">{category}</Badge>
                              ))}
                            </div>
                          )}
                        </CardHeader>
                        <CardContent className="p-0 py-2">
                          <p className="text-muted-foreground line-clamp-2">{listing.description}</p>
                          {listing.items && listing.items.length > 0 && (
                            <div className="mt-2">
                              <h4 className="font-semibold">Items:</h4>
                              <ul className="mt-1">
                                {listing.items.slice(0, 3).map((item, index) => (
                                  <li key={index} className="flex justify-between text-sm">
                                    <span>{item.name}</span>
                                    <span className="font-medium">{formatCurrency(item.price)}</span>
                                  </li>
                                ))}
                                {listing.items.length > 3 && (
                                  <li className="text-sm text-muted-foreground">
                                    + {listing.items.length - 3} more items
                                  </li>
                                )}
                              </ul>
                            </div>
                          )}
                        </CardContent>
                        <CardFooter className="p-0 pt-2 flex justify-between">
                          <div className="text-sm text-muted-foreground">
                            Created: {formatDate(listing.createdAt)}
                          </div>
                        </CardFooter>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Favorites Yet</CardTitle>
                    <CardDescription>
                      You haven't added any listings to your favorites yet.
                      Browse listings and click the heart icon to add them to your favorites.
                    </CardDescription>
                  </CardHeader>
                  <CardFooter>
                    <Link href="/explore">
                      <Button>Explore Listings</Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}