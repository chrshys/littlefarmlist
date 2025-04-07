import React from "react";
import { Header } from "./header";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="max-w-lg mx-auto px-4 pb-16 w-full pt-6">
      <Header />
      {children}
    </div>
  );
}