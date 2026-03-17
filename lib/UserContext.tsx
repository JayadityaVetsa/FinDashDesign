"use client";

import { createContext, useContext } from "react";

type UserContextType = {
  userId: string;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({
  userId,
  children,
}: {
  userId: string;
  children: React.ReactNode;
}) {
  return (
    <UserContext.Provider value={{ userId }}>{children}</UserContext.Provider>
  );
}

/**
 * Hook to get the current authenticated user's id.
 * Must be used inside a <UserProvider>.
 */
export function useUserId(): string {
  const ctx = useContext(UserContext);
  if (!ctx)
    throw new Error("useUserId must be used inside a <UserProvider>.");
  return ctx.userId;
}
