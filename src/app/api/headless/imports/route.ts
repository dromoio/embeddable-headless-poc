import { NextRequest, NextResponse } from "next/server";

// Use the same base URL as in the main headless route
const DROMO_API_URL = "http://localhost:8000/api/v1/headless/imports";

export async function GET(request: NextRequest) {
  // Get query parameters
  const searchParams = request.nextUrl.searchParams;
  const offset = searchParams.get("offset") || "0";
  const limit = searchParams.get("limit") || "100";

  try {
    // Fetch the list of imports from Dromo
    const response = await fetch(
      `${DROMO_API_URL}/?offset=${offset}&limit=${limit}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Dromo-License-Key": process.env.DROMO_BACKEND_API_KEY || "",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to fetch imports list from Dromo",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const importsData = await response.json();
    return NextResponse.json(importsData);
  } catch (error) {
    console.error("Error fetching imports list:", error);
    return NextResponse.json(
      { error: "Failed to fetch imports list" },
      { status: 500 }
    );
  }
}
