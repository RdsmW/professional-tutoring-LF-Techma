import { NextResponse } from "next/server";
import { parseMapboxFeature } from "@/lib/mapbox/geocode";

type MapboxFeature = Parameters<typeof parseMapboxFeature>[0];

type MapboxResponse = {
  features?: MapboxFeature[];
  message?: string;
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (query.length < 3) {
    return NextResponse.json({ features: [] });
  }

  const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { message: "Address search is temporarily unavailable." },
      { status: 503 },
    );
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set("access_token", token);
  url.searchParams.set("country", "us");
  url.searchParams.set("types", "address");
  url.searchParams.set("autocomplete", "true");
  url.searchParams.set("limit", "5");

  try {
    const response = await fetch(url, {
      next: { revalidate: 60 },
    });
    const data = (await response.json().catch(() => ({}))) as MapboxResponse;
    if (!response.ok) {
      console.warn("[public/address-autocomplete] Mapbox lookup failed", {
        status: response.status,
        message: data.message,
      });
      return NextResponse.json(
        { message: "Address search is temporarily unavailable." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      features: (data.features ?? []).map(parseMapboxFeature),
    });
  } catch (error) {
    console.warn("[public/address-autocomplete] lookup failed", error);
    return NextResponse.json(
      { message: "Address search is temporarily unavailable." },
      { status: 502 },
    );
  }
}