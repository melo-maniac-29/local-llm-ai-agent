"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

// Make sure you have this environment variable set
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "http://localhost:3001";

// Create a Convex client
const convexClient = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convexClient}>
      {children}
    </ConvexProvider>
  );
}
