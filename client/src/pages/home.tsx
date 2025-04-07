import React, { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoIcon, Edit, Share, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueries } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getMyListings, formatDate, deleteListing } from "@/lib/listings";
import { Listing } from "@/types/listing";

export default function Home() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [listingIds, setListingIds] = useState<number[]>([]);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  
  // Get all my listing IDs from localStorage
  useEffect(() => {
    const myListings = getMyListings();
    setListingIds(Object.keys(myListings).map(id => parseInt(id, 10)));
  }, []);
  
  // Fetch all listings data
  const listingQueries = useQueries({
    queries: listingIds.map(id => ({
      queryKey: [`/api/listings/${id}`],
      staleTime: 60 * 1000, // 1 minute
    })),
  });
  
  // Extract listings data and loading states
  const isLoading = listingQueries.some(query => query.isLoading);
  const listings = listingQueries
    .filter(query => query.data)
    .map(query => query.data as Listing)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // Handle edit
  const handleEdit = (id: number, editToken: string) => {
    navigate(`/l/${id}?edit=${editToken}`);
  };
  
  // Handle share
  const handleShare = (listing: Listing) => {
    const url = `${window.location.origin}/l/${listing.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: `Check out what I have available: ${listing.title}`,
        url: url
      }).catch(error => {
        console.error("Error sharing:", error);
      });
    } else {
      navigator.clipboard.writeText(url)
        .then(() => {
          toast({
            title: "Link copied",
            description: "Listing URL has been copied to clipboard",
          });
        })
        .catch(error => {
          console.error("Error copying to clipboard:", error);
          toast({
            title: "Could not copy link",
            description: "Please try again or copy the URL manually",
            variant: "destructive",
          });
        });
    }
  };
  
  // Handle delete
  const handleDelete = async (id: number, editToken: string) => {
    setIsDeleting(id);
    try {
      await deleteListing(id, editToken);
      
      // Remove from state
      setListingIds(prevIds => prevIds.filter(listingId => listingId !== id));
      
      toast({
        title: "Listing deleted",
        description: "Your listing has been permanently removed",
      });
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast({
        title: "Delete failed",
        description: "Could not delete the listing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(null);
    }
  };
  
  return (
    <div className="max-w-md mx-auto p-4 pb-16">
      <Header />
      
      <main className="mt-4">
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-medium text-neutral-800 mb-4">
              Share what you have available today
            </h2>
            <p className="text-neutral-600 mb-6">
              Create a simple listing that you can share with neighbors and your community.
            </p>
            
            <div className="space-y-4">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => navigate("/create")}
              >
                Create a listing
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/popular")}
              >
                Browse popular listings
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* My Listings Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-medium text-neutral-800 mb-4">
              My Listings
            </h2>
            
            {isLoading && (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            )}
            
            {!isLoading && listings.length > 0 && (
              <div className="space-y-4">
                {listings.map(listing => (
                  <Card key={listing.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-neutral-800">{listing.title}</h3>
                        <p className="text-sm text-neutral-500">
                          Created {formatDate(listing.createdAt)}
                        </p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-neutral-500 hover:text-neutral-700 h-8 w-8"
                          onClick={() => handleEdit(listing.id, listing.editToken)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-neutral-500 hover:text-neutral-700 h-8 w-8"
                          onClick={() => handleShare(listing)}
                        >
                          <Share className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-neutral-500 hover:text-red-500 h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete listing</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete this listing. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDelete(listing.id, listing.editToken)}
                                disabled={isDeleting === listing.id}
                              >
                                {isDeleting === listing.id ? "Deleting..." : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">
                        {listing.items.length} item{listing.items.length !== 1 && 's'}
                      </span>
                      <Button
                        variant="link"
                        className="text-primary-500 hover:text-primary-600 p-0 h-auto"
                        onClick={() => navigate(`/l/${listing.id}`)}
                      >
                        View listing
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
            
            {!isLoading && listings.length === 0 && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-neutral-100 text-neutral-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-neutral-800 mb-2">No listings found</h3>
                <p className="text-neutral-600 mb-4">
                  You haven't created any listings yet or they might be on another device.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 rounded-full p-2 mt-1">
                <InfoIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-neutral-800 mb-2">How it works</h3>
                <ul className="space-y-2 text-sm text-neutral-600">
                  <li className="flex">
                    <span className="font-medium mr-2">1.</span>
                    <span>Create a listing of what you're selling today</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">2.</span>
                    <span>Share the link with neighbors and community</span>
                  </li>
                  <li className="flex">
                    <span className="font-medium mr-2">3.</span>
                    <span>Use your magic edit link to update availability</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
