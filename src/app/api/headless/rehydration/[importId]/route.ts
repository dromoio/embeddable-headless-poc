import { NextRequest, NextResponse } from "next/server";

// Use the same base URL as in the main headless route
const DROMO_API_URL = "http://localhost:8000/api/v1/headless/imports";

export async function GET(
  request: NextRequest,
  context: { params: { importId: string } }
) {
  // In Next.js 15, we need to await params
  const { importId } = await context.params;

  if (!importId) {
    return NextResponse.json(
      { error: "Import ID is required" },
      { status: 400 }
    );
  }

  try {
    // Fetch the rehydration payload from Dromo's API using the localhost URL
    const response = await fetch(`${DROMO_API_URL}/${importId}/rehydration/`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Dromo-License-Key": process.env.DROMO_BACKEND_API_KEY || "",
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: "Failed to fetch rehydration payload from Dromo",
          details: errorData,
        },
        { status: response.status }
      );
    }

    const rehydrationPayload = await response.json();
    console.log(
      "Rehydration payload:",
      JSON.stringify(rehydrationPayload, null, 2)
    );
    return NextResponse.json(rehydrationPayload);
  } catch (error) {
    console.error("Error fetching rehydration payload:", error);
    return NextResponse.json(
      { error: "Failed to fetch rehydration payload" },
      { status: 500 }
    );
  }
}
