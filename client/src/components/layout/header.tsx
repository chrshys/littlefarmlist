import React from "react";
import { Link } from "wouter";
import { Sprout } from "lucide-react";

export function Header() {
  return (
    <header className="mb-6 text-center">
      <Link href="/">
        <div className="inline-flex items-center justify-center cursor-pointer">
          <div className="flex items-center justify-center mb-2">
            <Sprout className="h-7 w-7 text-primary-500 mr-2" />
            <h1 className="text-2xl font-medium text-neutral-800">Small Things</h1>
          </div>
        </div>
      </Link>
      <p className="text-neutral-500 text-sm">Hyperlocal listings for local goods</p>
    </header>
  );
}
