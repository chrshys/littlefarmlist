import React, { useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckIcon, Clipboard, Share, Edit } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency } from "@/lib/listings";
import { Listing } from "@/types/listing";
import { useAuth } from "@/hooks/use-auth";

export default function Confirmation() {
  const { id = "0" } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState("");
  const { user } = useAuth();
  
  const listingId = parseInt(id, 10);
  
  const { data: listing, isLoading } = useQuery<Listing>({
    queryKey: [`/api/listings/${id}`],
    // The query will use the default queryFn from queryClient.ts
  });

  // Security check - if we're not logged in or don't own this listing, go home
  if (!user) {
    navigate("/login");
    return null;
  }

  // Public sharing URL
  const baseUrl = window.location.origin;
  const publicUrl = `${baseUrl}/l/${listingId}`;

  // Copy to clipboard function
  const copyToClipboard = (text: string, type: "public") => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(type);
        setTimeout(() => setCopied(""), 2000);
        toast({
          title: "Copied to clipboard",
          description: "Link has been copied to your clipboard"
        });
      })
      .catch(() => {
        toast({
          title: "Failed to copy",
          description: "Please try manually selecting and copying the link",
          variant: "destructive"
        });
      });
  };

  // Share link using Web Share API if available
  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title || "My Small Things listing",
        text: `Check out what I have available: ${listing?.title}`,
        url: publicUrl
      }).catch((error) => {
        console.error("Error sharing:", error);
      });
    } else {
      copyToClipboard(publicUrl, "public");
    }
  };

  if (!listing) {
    return (
      <div className="max-w-md mx-auto p-4 pb-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="rounded-full bg-gray-200 h-16 w-16 mx-auto"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-4 pb-16">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 text-primary mb-4">
          <CheckIcon className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-medium text-neutral-800 mb-2">Listing created!</h2>
        <p className="text-neutral-600">Your listing has been created and is ready to share</p>
      </div>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium text-neutral-800 mb-4">Share with customers</h3>
          <div className="bg-neutral-100 rounded-md p-3 mb-4 break-all">
            <p className="text-sm font-medium text-neutral-800">{publicUrl}</p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => copyToClipboard(publicUrl, "public")}
            >
              {copied === "public" ? (
                <>
                  <CheckIcon className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Clipboard className="h-4 w-4 mr-2" />
                  Copy link
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={shareLink}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Preview Section */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium text-neutral-800 mb-4">Listing Preview</h3>
          
          <div className="mb-4">
            <h4 className="text-lg font-medium text-neutral-800 mb-2">{listing.title}</h4>
            {listing.description && <p className="text-neutral-600 mb-4">{listing.description}</p>}
          
            <div className="mb-4">
              <h5 className="font-medium text-neutral-700 mb-2">Available items</h5>
              <div>
                {listing.items.map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between py-3 ${
                      index !== listing.items.length - 1 ? "border-b border-neutral-200" : ""
                    }`}
                  >
                    <span className="text-neutral-800">{item.name}</span>
                    <span className="font-medium">{formatCurrency(item.price)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h5 className="font-medium text-neutral-700 mb-2">Pickup instructions</h5>
              <div className="bg-neutral-50 rounded-md p-3">
                <p className="text-neutral-700">{listing.pickupInstructions}</p>
              </div>
            </div>
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate(`/l/${listing.id}`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit this listing
          </Button>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button
          variant="link"
          className="text-primary hover:text-primary/90 font-medium"
          onClick={() => navigate("/")}
        >
          Back to home
        </Button>
      </div>
    </div>
  );
}
