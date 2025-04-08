import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Sprout, Menu, LogOut, User, LayoutDashboard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [location, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const { toast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

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
          {isAuthenticated && (
            <>
              <Link href="/dashboard">
                <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
                  Dashboard
                </span>
              </Link>
              <Link href="/create">
                <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors">
                  Create Listing
                </span>
              </Link>
            </>
          )}
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center space-x-2">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user?.firstName?.[0] || user?.username?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">{user?.firstName || user?.username}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>Dashboard</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/my-listings")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>My Listings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/create")}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>Create Listing</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
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
            </>
          )}
          
          {/* Mobile Menu Toggle */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden mt-4 border-t pt-4">
          <nav className="flex flex-col space-y-3">
            <Link href="/explore">
              <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors block py-1">
                Explore
              </span>
            </Link>
            <Link href="/popular">
              <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors block py-1">
                Popular
              </span>
            </Link>
            <Link href="/map">
              <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors block py-1">
                Map View
              </span>
            </Link>
            <Link href="/my-listings">
              <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors block py-1">
                My Listings
              </span>
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard">
                  <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors block py-1">
                    Dashboard
                  </span>
                </Link>
                <Link href="/create">
                  <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors block py-1">
                    Create Listing
                  </span>
                </Link>
              </>
            )}
            {!isAuthenticated && (
              <Link href="/login">
                <span className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors block py-1">
                  Log in
                </span>
              </Link>
            )}
            {isAuthenticated && (
              <button 
                className="text-sm font-medium text-neutral-700 hover:text-primary transition-colors block py-1 text-left"
                onClick={handleLogout}
              >
                Log out
              </button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
