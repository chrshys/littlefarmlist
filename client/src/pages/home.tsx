import React from "react";
import { Link, useLocation } from "wouter";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";

export default function Home() {
  const [_, navigate] = useLocation();

  return (
    <div className="max-w-md mx-auto p-4 pb-16">
      <Header />
      
      <main>
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
                className="w-full bg-primary-500 hover:bg-primary-600"
                onClick={() => navigate("/create")}
              >
                Create a listing
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate("/my-listings")}
              >
                View my listings
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary-100 rounded-full p-2 mt-1">
                <InfoIcon className="h-5 w-5 text-primary-500" />
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
