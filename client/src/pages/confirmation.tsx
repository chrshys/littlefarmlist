import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckIcon, Clipboard, Share } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getListingToken } from "@/lib/listings";

export default function Confirmation() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [copied, setCopied] = useState("");
  
  const listingId = parseInt(id, 10);
  const editToken = getListingToken(listingId);
  
  const { data: listing } = useQuery({
    queryKey: [`/api/listings/${id}`],
    // The query will use the default queryFn from queryClient.ts
  });

  // Security check - if we don't have edit token for this listing, go home
  useEffect(() => {
    if (!editToken) {
      navigate("/");
    }
  }, [editToken, navigate]);

  // Public sharing URL
  const baseUrl = window.location.origin;
  const publicUrl = `${baseUrl}/l/${listingId}`;
  const editUrl = `${publicUrl}?edit=${editToken}`;

  // Copy to clipboard function
  const copyToClipboard = (text: string, type: "public" | "edit") => {
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
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-500 mb-4">
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
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <h3 className="font-medium text-neutral-800 mb-2">Edit link (for you only)</h3>
          <p className="text-sm text-neutral-500 mb-4">
            Save this link to edit your listing later. Don't share it with others.
          </p>
          
          <div className="bg-neutral-100 rounded-md p-3 mb-4 break-all">
            <p className="text-sm font-medium text-neutral-800">{editUrl}</p>
          </div>
          
          <Button
            variant="outline"
            className="w-full"
            onClick={() => copyToClipboard(editUrl, "edit")}
          >
            {copied === "edit" ? (
              <>
                <CheckIcon className="h-4 w-4 mr-2" />
                Copied
              </>
            ) : (
              <>
                <Clipboard className="h-4 w-4 mr-2" />
                Copy edit link
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button
          variant="link"
          className="text-primary-500 hover:text-primary-600 font-medium"
          onClick={() => navigate("/")}
        >
          Back to home
        </Button>
      </div>
    </div>
  );
}
