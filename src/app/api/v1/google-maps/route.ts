import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const place = searchParams.get("place");

    if (!place) {
      return NextResponse.json(
        { error: "Missing place parameter" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GCP_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      place
    )}&key=${apiKey}`;

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://tippit.app/",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      return NextResponse.json(
        { error: `Google Places API Error: ${data.status}` },
        { status: 500 }
      );
    }

    const result = {
      predictions: data.predictions || [],
      status: data.status,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Google Maps API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch places" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { placeId } = body;

    if (!placeId) {
      return NextResponse.json(
        { error: "Missing placeId parameter" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GCP_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 }
      );
    }

    const apiUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${apiKey}&fields=place_id,formatted_address,geometry`;

    const response = await fetch(apiUrl, {
      headers: {
        "Content-Type": "application/json",
        Referer: "https://tippit.app/",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Google API Error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { error: `Google Places Details API Error: ${data.status}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Google Maps API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch place details" },
      { status: 500 }
    );
  }
}
