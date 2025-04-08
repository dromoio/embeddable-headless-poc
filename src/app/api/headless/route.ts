import { NextRequest, NextResponse } from "next/server";

const DROMO_API_URL = "https://app.dromo.io/api/v1/headless/imports";
const POLLING_INTERVAL = 5000; // 5 seconds in milliseconds
const MAX_POLLING_TIME = 60000; // 60 seconds total timeout
const MAX_ATTEMPTS = Math.floor(MAX_POLLING_TIME / POLLING_INTERVAL);

async function createHeadlessImport(
  filename: string,
  userData: Record<string, string>,
  schemaId: string | null
) {
  const effectiveSchemaId = schemaId || process.env.NEXT_PUBLIC_SCHEMA_ID;

  console.log("Creating headless import with:", {
    filename,
    schemaId: effectiveSchemaId,
    userData,
  });

  const response = await fetch(`${DROMO_API_URL}/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Dromo-License-Key": process.env.DROMO_BACKEND_API_KEY!,
    },
    body: JSON.stringify({
      schema_id: effectiveSchemaId,
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

async function uploadFileToUrl(
  url: string,
  file: ArrayBuffer,
  contentType: string
) {
  if (!url) {
    throw new Error("No upload URL provided");
  }

  console.log("Uploading file to URL:", url);

  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": contentType,
      },
      body: file,
    });

    if (!response.ok) {
      const errorText = await response
        .text()
        .catch(() => "Could not read error response");
      console.error(
        "Upload failed:",
        response.status,
        response.statusText,
        errorText
      );
      throw new Error(
        `Failed to upload file: ${response.status} ${response.statusText}. ${errorText}`
      );
    }

    console.log("File uploaded successfully with status:", response.status);
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

async function getImportPresignedUrl(importId: string) {
  console.log("Getting presigned download URL for:", importId);

  const response = await fetch(`${DROMO_API_URL}/${importId}/url/`, {
    headers: {
      "X-Dromo-License-Key": process.env.DROMO_BACKEND_API_KEY!,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Failed to get presigned URL:", data);
    throw new Error(`Failed to get presigned URL: ${response.statusText}`);
  }

  if (!data.presigned_url) {
    console.error("Invalid presigned URL response:", data);
    throw new Error("No presigned URL returned in the response");
  }

  console.log("Presigned URL retrieved successfully");
  return data.presigned_url;
}

async function downloadFromPresignedUrl(presignedUrl: string) {
  console.log("Downloading data from presigned URL");

  const response = await fetch(presignedUrl);

  if (!response.ok) {
    console.error("Failed to download data:", response.statusText);
    throw new Error(`Failed to download data: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("Data downloaded successfully");
  return data;
}

// Helper function to wait a specific time in milliseconds
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const userDataStr = formData.get("userData") as string;
    const schemaId = formData.get("schemaId") as string | null;

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
    console.log(
      "Processing file:",
      file.name,
      "type:",
      file.type,
      "size:",
      file.size,
      "Schema ID:",
      schemaId || "(Not provided, using default)"
    );

    // Create headless import with user data and schemaId
    const importResponse = await createHeadlessImport(
      file.name,
      userData,
      schemaId
    );
    console.log("Import created with ID:", importResponse.id);

    // Upload file
    const fileBuffer = await file.arrayBuffer();
    await uploadFileToUrl(
      importResponse.upload,
      fileBuffer,
      file.type || "application/octet-stream"
    );

    // Wait a moment to allow the server to process the upload
    console.log("Waiting 5 seconds before checking status...");
    await wait(5000);

    // Poll for status until complete or error
    let importStatus;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      importStatus = await checkImportStatus(importResponse.id);
      console.log(
        `Status check ${attempts + 1}/${MAX_ATTEMPTS}: ${importStatus.status}`
      );

      switch (importStatus.status) {
        case "SUCCESSFUL":
          // Get presigned URL and download data
          const presignedUrl = await getImportPresignedUrl(importResponse.id);
          const results = await downloadFromPresignedUrl(presignedUrl);
          return NextResponse.json({ status: "success", data: results });

        case "NEEDS_REVIEW":
          return NextResponse.json({
            status: "needs_review",
            reviewUrl: importStatus.review_url,
            importId: importResponse.id,
          });

        case "FAILED":
          return NextResponse.json(
            { error: "Import failed", details: importStatus },
            { status: 400 }
          );

        case "AWAITING_UPLOAD":
          console.log(
            "Still awaiting upload. This might indicate an issue with the upload process."
          );
        // Fall through to wait and try again
        case "PENDING":
        case "RUNNING":
          await wait(POLLING_INTERVAL);
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
