import React, { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Share, Trash2, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { getMyListings, formatDate, deleteListing, formatCurrency } from "@/lib/listings";
import { Listing } from "@/types/listing";
import { useAuth } from "@/hooks/use-auth";

export default function MyListings() {
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Fetch my listings
  const { data: myListings = [], isLoading, error } = useQuery<Listing[]>({
    queryKey: ['/api/user/listings'],
    staleTime: 60 * 1000 // 1 minute
  });
  
  // Handle edit - now uses account authentication instead of edit tokens
  const handleEdit = (id: number) => {
    navigate(`/create?edit=${id}`);
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
            title: "Copied to clipboard",
            description: "Link has been copied to your clipboard",
          });
        })
        .catch(() => {
          toast({
            title: "Failed to copy",
            description: "Please try manually selecting and copying the link",
            variant: "destructive"
          });
        });
    }
  };
  
  // Handle delete - now uses account authentication instead of edit tokens
  const handleDelete = async (id: number) => {
    setIsDeleting(id);
    try {
      await deleteListing(id);
      
      // Refresh the listings after deletion
      queryClient.invalidateQueries({ queryKey: ['/api/user/listings'] });
      
      toast({
        title: "Listing deleted",
        description: "Your listing has been removed",
      });
    } catch (error) {
      toast({
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Listings</h1>
          <p className="text-muted-foreground">Manage your created listings</p>
        </div>
        <Button
          variant="default"
          onClick={() => navigate("/create")}
          className="flex items-center gap-1 mt-4 md:mt-0"
        >
          <Plus className="h-4 w-4 mr-1" />
          Create New Listing
        </Button>
      </div>
      
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      )}
      
      {!isLoading && myListings.length === 0 && (
        <div className="text-center py-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-neutral-100 text-neutral-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-neutral-800 mb-2">No listings found</h3>
          <p className="text-neutral-600 mb-4">
            You haven"t created any listings yet or they might be on another device.
          </p>
          <Button
            onClick={() => navigate("/create")}
            className="py-5 px-6"
          >
            Create a listing
          </Button>
        </div>
      )}
      
      {!isLoading && myListings.length > 0 && (
        <div className="space-y-4">
          {myListings.map(listing => (
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
                
                <div className="border-t border-neutral-100 px-4 py-3 bg-neutral-50 grid sm:flex sm:justify-between gap-3">
                  <div className="flex justify-center sm:justify-start gap-2 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-500 hover:text-neutral-700 h-9 flex items-center gap-1"
                      onClick={() => handleEdit(listing.id)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sm:hidden text-xs">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-500 hover:text-neutral-700 h-9 flex items-center gap-1"
                      onClick={() => handleShare(listing)}
                    >
                      <Share className="h-4 w-4" />
                      <span className="sm:hidden text-xs">Share</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-neutral-500 hover:text-red-500 h-9 flex items-center gap-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sm:hidden text-xs">Delete</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete listing</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this listing? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                          <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(listing.id)}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            {isDeleting === listing.id ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-primary hover:text-primary/90 hover:bg-primary/5"
                    onClick={() => handleEdit(listing.id)}
                  >
                    Edit
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
