"use client";

import { createContext, useContext } from "react";

export type FamilyPortalState = {
  displayName: string;
  householdName: string | null;
  householdStatus: string | null;
};

const FamilyPortalContext = createContext<FamilyPortalState>({
  displayName: "Family",
  householdName: null,
  householdStatus: null,
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
