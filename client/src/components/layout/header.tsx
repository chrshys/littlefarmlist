import React from "react";
import { Link, useLocation } from "wouter";
import { Sprout, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="py-4 border-b border-neutral-200">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <Link href="/">
          <div className="flex items-center cursor-pointer">
            <Sprout className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-medium text-neutral-800">Little Farm List</h1>
          </div>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link href="/explore">
            <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
              Explore
            </span>
          </Link>
          <Link href="/popular">
            <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
              Popular
            </span>
          </Link>
          <Link href="/map">
            <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
              Map View
            </span>
          </Link>
          <Link href="/my-listings">
            <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
              My Listings
            </span>
          </Link>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-2">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hidden md:inline-flex">
              Log in
            </Button>
          </Link>
          <Link href="/signup">
            <Button variant="default" size="sm">
              Sign up
            </Button>
          </Link>
          
          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
