"use client";

import { createContext, useContext } from "react";

export type FamilyPortalState = {
  displayName: string;
  householdName: string | null;
  householdStatus: string | null;
  setHouseholdName: (name: string | null) => void;
  setHouseholdStatus: (status: string | null) => void;
  setDisplayName: (name: string) => void;
};

const FamilyPortalContext = createContext<FamilyPortalState>({
  displayName: "Family",
  householdName: null,
  householdStatus: null,
  setHouseholdName: () => undefined,
  setHouseholdStatus: () => undefined,
  setDisplayName: () => undefined,
});

export function FamilyPortalProvider({
  value,
  children,
}: {
  value: FamilyPortalState;
  children: React.ReactNode;
}) {
  return <FamilyPortalContext.Provider value={value}>{children}</FamilyPortalContext.Provider>;
}

export function useFamilyPortal() {
  return useContext(FamilyPortalContext);
}
