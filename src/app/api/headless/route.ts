import { NextRequest, NextResponse } from "next/server";

const DROMO_API_URL = "https://app.dromo.io/api/v1/headless/imports";
const POLLING_INTERVAL = 2000; // 2 seconds in milliseconds
const MAX_POLLING_TIME = 30000; // 30 seconds total timeout
const MAX_ATTEMPTS = Math.floor(MAX_POLLING_TIME / POLLING_INTERVAL);

const SCHEMA_ID = "e279b70f-32fd-422d-999f-cbc4b3a71836";

async function createHeadlessImport(
  filename: string,
  userData: Record<string, string>
) {
  console.log("Creating headless import with:", {
    filename,
    schemaId: SCHEMA_ID,
    userData,
  });

  const response = await fetch(`${DROMO_API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dromo-License-Key": process.env.DROMO_BACKEND_API_KEY!,
    },
    body: JSON.stringify({
      schema_id: SCHEMA_ID,
      original_filename: filename,
      import_metadata: {
        user: userData,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to create import:", data);
    throw new Error(
      `Failed to create headless import: ${
        response.statusText
      }. Details: ${JSON.stringify(data)}`
    );
  }

  if (!data.id || !data.upload) {
    console.error("Invalid import response:", data);
    throw new Error(
      `Invalid import response: missing required fields. Response: ${JSON.stringify(
        data
      )}`
    );
  }

  console.log("Import created successfully:", {
    id: data.id,
    hasUploadUrl: !!data.upload,
  });
  return data;
}

async function uploadFileToUrl(url: string, file: ArrayBuffer) {
  if (!url) {
    throw new Error("No upload URL provided");
  }

  console.log("Uploading file to URL:", url);

  try {
    const response = await fetch(url, {
      method: "PUT",
      body: file,
    });

    if (!response.ok) {
      console.error("Upload failed:", response.statusText);
      throw new Error(`Failed to upload file: ${response.statusText}`);
    }

    console.log("File uploaded successfully");
    return response;
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}

async function checkImportStatus(importId: string) {
  console.log("Checking import status for:", importId);

  const response = await fetch(`${DROMO_API_URL}/${importId}`, {
    headers: {
      "X-Dromo-License-Key": process.env.DROMO_BACKEND_API_KEY!,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to check status:", data);
    throw new Error(`Failed to check import status: ${response.statusText}`);
  }

  console.log("Import status:", data);
  return data;
}

async function getImportResults(importId: string) {
  console.log("Getting import results for:", importId);

  const response = await fetch(`${DROMO_API_URL}/${importId}/data`, {
    headers: {
      "X-Dromo-License-Key": process.env.DROMO_BACKEND_API_KEY!,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to get results:", data);
    throw new Error(`Failed to get import results: ${response.statusText}`);
  }

  console.log("Import results retrieved successfully");
  return data;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userDataStr = formData.get("userData") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!userDataStr) {
      return NextResponse.json(
        { error: "No user data provided" },
        { status: 400 }
      );
    }

    const userData = JSON.parse(userDataStr);

    // Create headless import with user data
    const importResponse = await createHeadlessImport(file.name, userData);

    // Upload file
    const fileBuffer = await file.arrayBuffer();
    await uploadFileToUrl(importResponse.upload, fileBuffer);

    // Poll for status until complete or error
    let importStatus;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      importStatus = await checkImportStatus(importResponse.id);

      switch (importStatus.status) {
        case "SUCCESSFUL":
          const results = await getImportResults(importResponse.id);
          return NextResponse.json({ status: "success", data: results.data });

        case "NEEDS_REVIEW":
          return NextResponse.json({
            status: "needs_review",
            reviewUrl: importStatus.review_url,
          });

        case "FAILED":
          return NextResponse.json(
            { error: "Import failed", details: importStatus },
            { status: 400 }
          );

        case "AWAITING_UPLOAD":
        case "PENDING":
        case "RUNNING":
          await new Promise((resolve) => setTimeout(resolve, POLLING_INTERVAL));
          attempts++;
          break;

        default:
          return NextResponse.json(
            { error: "Unknown status", details: importStatus },
            { status: 400 }
          );
      }
    }

    return NextResponse.json(
      { error: "Import timeout after 30 seconds" },
      { status: 408 }
    );
  } catch (error) {
    console.error("Headless import error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
