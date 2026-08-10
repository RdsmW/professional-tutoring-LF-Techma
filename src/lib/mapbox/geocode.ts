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

type MapboxGeocodeResponse = {
  features?: MapboxFeature[];
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
  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token || query.trim().length < 3) return [];

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query.trim())}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("country", "us");
  url.searchParams.set("types", "address");
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");

  const response = await fetch(url.toString(), { signal });
  const data = (await response.json()) as MapboxGeocodeResponse;
  if (!response.ok) {
    throw new Error(data.message || "Mapbox address lookup failed");
  }

  return (data.features ?? []).map(parseMapboxFeature);
}
