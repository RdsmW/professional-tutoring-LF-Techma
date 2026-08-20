export type AddressSuggestion = {
  id: string;
  label: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
};

type MapboxContext = {
  id: string;
  text: string;
  short_code?: string;
};

type MapboxFeature = {
  id: string;
  place_name: string;
  text?: string;
  address?: string;
  context?: MapboxContext[];
};

type AddressAutocompleteResponse = {
  features?: AddressSuggestion[];
  message?: string;
};

function contextValue(contexts: MapboxContext[] | undefined, prefix: string) {
  return contexts?.find((item) => item.id.startsWith(prefix));
}

export function parseMapboxFeature(feature: MapboxFeature): AddressSuggestion {
  const contexts = feature.context ?? [];
  const region = contextValue(contexts, "region.");
  const place = contextValue(contexts, "place.");
  const locality = contextValue(contexts, "locality.");
  const postcode = contextValue(contexts, "postcode.");
  const state = (region?.short_code ?? "").replace(/^US-/i, "").toUpperCase();

  return {
    id: feature.id,
    label: feature.place_name,
    addressLine1: [feature.address, feature.text].filter(Boolean).join(" ").trim() || feature.place_name,
    city: place?.text || locality?.text || "",
    state,
    postalCode: postcode?.text || "",
  };
}

export async function searchUsAddresses(
  query: string,
  signal?: AbortSignal,
): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) return [];

  const url = `/api/public/address-autocomplete?q=${encodeURIComponent(query.trim())}`;
  const response = await fetch(url, { signal });
  const data = (await response.json()) as AddressAutocompleteResponse;
  if (!response.ok) {
    throw new Error(data.message || "Address search is temporarily unavailable.");
  }

  return data.features ?? [];
}
