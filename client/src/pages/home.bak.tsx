import React from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

export default function Home() {
  const [_, navigate] = useLocation();
  
  return (
    <main className="mt-4">
      <Card className="mb-6 shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <h2 className="text-xl font-medium text-neutral-800 mb-3 sm:mb-4">
            Share what you have available today
          </h2>
          <p className="text-neutral-600 mb-5 sm:mb-6">
            Create a simple listing that you can share with neighbors and your community.
          </p>
          
          <div className="space-y-3 sm:space-y-4">
            <Button 
              variant="default" 
              className="w-full py-5 sm:py-6 text-base"
              onClick={() => navigate("/create")}
            >
              Create a listing
            </Button>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <Button 
                variant="outline" 
                className="flex-1 py-4"
                onClick={() => navigate("/my-listings")}
              >
                View my listings
              </Button>
              
              <Button 
                variant="outline" 
                className="flex-1 py-4"
                onClick={() => navigate("/popular")}
              >
                Browse popular listings
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 rounded-full p-2 mt-1 flex-shrink-0">
              <InfoIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-neutral-800 mb-2">How it works</h3>
              <ul className="space-y-3 text-sm text-neutral-600">
                <li className="flex">
                  <span className="font-medium mr-2 flex-shrink-0">1.</span>
                  <span>Create a listing of what you're selling today</span>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2 flex-shrink-0">2.</span>
                  <span>Share the link with neighbors and community</span>
                </li>
                <li className="flex">
                  <span className="font-medium mr-2 flex-shrink-0">3.</span>
                  <span>Use your magic edit link to update availability</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}