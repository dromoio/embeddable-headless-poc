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
  let streamController: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      streamController = controller;
    },
  });

  const encoder = new TextEncoder();
  const enqueue = (data: object) => {
    // Encode the JSON string with a newline delimiter before enqueuing
    streamController.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
  };
  const closeStream = () => {
    try {
      streamController.close();
    } catch (e) {
      console.error("Error closing stream:", e);
    }
  };
  const streamError = (message: string, status: number, details?: unknown) => {
    try {
      enqueue({ status: "error", error: message, details });
    } catch (e) {
      console.error("Error enqueuing error message:", e);
    }
    closeStream();
    // Note: We can't return a traditional error response here as the stream headers are already sent.
    // The error is sent through the stream itself.
  };

  // Process request in background, allowing the stream response to be sent immediately
  (async () => {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as File;
      const userDataStr = formData.get("userData") as string;
      const schemaId = formData.get("schemaId") as string | null;

      if (!file) {
        streamError("No file provided", 400);
        return;
      }

      if (!userDataStr) {
        streamError("No user data provided", 400);
        return;
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
      enqueue({ status: "processing", message: "Starting import..." });

      // Create headless import
      enqueue({
        status: "processing",
        message: "Creating Dromo import record...",
      });
      const importResponse = await createHeadlessImport(
        file.name,
        userData,
        schemaId
      );
      console.log("Import created with ID:", importResponse.id);
      enqueue({
        status: "processing",
        message: `Import record created (ID: ${importResponse.id}). Uploading file...`,
        importId: importResponse.id,
      });

      // Upload file
      const fileBuffer = await file.arrayBuffer();
      await uploadFileToUrl(
        importResponse.upload,
        fileBuffer,
        file.type || "application/octet-stream"
      );
      enqueue({
        status: "processing",
        message: "File uploaded. Waiting for Dromo processing...",
      });

      // Wait a moment
      await wait(5000); // Initial wait

      // Poll for status
      let importStatus;
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS) {
        importStatus = await checkImportStatus(importResponse.id);
        const attemptMsg = `Polling Dromo status (${
          attempts + 1
        }/${MAX_ATTEMPTS}): ${importStatus.status}`;
        console.log(attemptMsg);
        enqueue({
          status: "polling",
          message: attemptMsg,
          dromoStatus: importStatus.status,
        });

        switch (importStatus.status) {
          case "SUCCESSFUL":
            enqueue({
              status: "processing",
              message: "Import successful. Downloading results...",
            });
            const presignedUrl = await getImportPresignedUrl(importResponse.id);
            const results = await downloadFromPresignedUrl(presignedUrl);
            enqueue({ status: "success", data: results });
            closeStream();
            return;

          case "NEEDS_REVIEW":
            enqueue({
              status: "needs_review",
              reviewUrl: importStatus.review_url,
              importId: importResponse.id,
            });
            closeStream();
            return;

          case "FAILED":
            streamError("Import failed in Dromo", 400, importStatus);
            return; // Error already sent via streamError

          case "AWAITING_UPLOAD":
            console.log(
              "Still awaiting upload. This might indicate an issue with the upload process."
            );
            enqueue({
              status: "polling",
              message: "Dromo is still awaiting upload...",
              dromoStatus: importStatus.status,
            });
          // Fall through to wait and try again
          case "PENDING":
          case "RUNNING":
            await wait(POLLING_INTERVAL);
            attempts++;
            break;

          default:
            streamError("Unknown Dromo status", 400, importStatus);
            return; // Error already sent via streamError
        }
      }

      streamError("Import timeout after polling", 408, {
        importId: importResponse.id,
      });
    } catch (error) {
      console.error("Headless import stream error:", error);
      streamError(
        "Internal server error during import process",
        500,
        error instanceof Error ? error.message : "Unknown error"
      );
    }
  })(); // IIFE to run the async processing

  // Return the stream immediately
  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8", // Or application/x-ndjson
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}
