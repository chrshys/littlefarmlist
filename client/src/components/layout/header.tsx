import React from "react";
import { Link, useLocation } from "wouter";
import { Sprout } from "lucide-react";

export function Header() {
  const [location] = useLocation();

  return (
    <header className="mb-6">
      <div className="flex flex-col items-center">
        <Link href="/">
          <div className="flex items-center justify-center cursor-pointer mb-3">
            <Sprout className="h-7 w-7 text-primary-500 mr-2" />
            <h1 className="text-2xl font-medium text-neutral-800">Small Things</h1>
          </div>
        </Link>
        <p className="text-neutral-500 text-sm text-center mb-4">Hyperlocal listings for local goods</p>
      </div>
      
      <nav className="flex justify-center">
        <div className="inline-flex items-center border border-neutral-200 rounded-lg overflow-hidden divide-x">
          <div className={`px-3 py-2 text-sm ${location === '/' ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            <Link href="/">Home</Link>
          </div>
          <div className={`px-3 py-2 text-sm ${location === '/popular' ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            <Link href="/popular">Popular</Link>
          </div>
          <div className={`px-3 py-2 text-sm ${location === '/map' ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            <Link href="/map">Map</Link>
          </div>
          <div className={`px-3 py-2 text-sm ${location === '/my-listings' ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
            <Link href="/my-listings">My Listings</Link>
          </div>
        </div>
      </nav>
    </header>
  );
}
