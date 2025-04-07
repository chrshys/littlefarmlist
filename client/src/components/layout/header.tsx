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
          <Link href="/">
            <a className={`px-3 py-2 text-sm ${location === '/' ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
              Home
            </a>
          </Link>
          <Link href="/popular">
            <a className={`px-3 py-2 text-sm ${location === '/popular' ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
              Popular
            </a>
          </Link>
          <Link href="/my-listings">
            <a className={`px-3 py-2 text-sm ${location === '/my-listings' ? 'bg-primary-50 text-primary-500 font-medium' : 'text-neutral-600 hover:bg-neutral-50'}`}>
              My Listings
            </a>
          </Link>
        </div>
      </nav>
    </header>
  );
}
