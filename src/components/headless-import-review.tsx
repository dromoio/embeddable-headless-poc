"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import DromoUploader from "dromo-uploader-js";

// Add type declarations for window properties
declare global {
  interface Window {
    DROMO_WIDGET_OVERRIDE?: string;
  }
}

type RowData = Record<string, string | number | boolean>;

interface HeadlessImportReviewProps {
  importId: string;
  onComplete?: (
    result: "success" | "canceled" | "error",
    data?: RowData[]
  ) => void;
  onBack?: () => void;
}

export const HeadlessImportReview = ({
  importId,
  onComplete,
  onBack,
}: HeadlessImportReviewProps) => {
  const [status, setStatus] = useState<
    "loading" | "reviewing" | "success" | "canceled" | "error"
  >("loading");
  const [error, setError] = useState<string | null>(null);

  // Function to initialize all window-scoped variables
  const initWindowVariables = () => {
    // Only run on client-side
    if (typeof window === "undefined") return;

    // You can add more window variables as needed
    // window.SOME_OTHER_VARIABLE = someValue;
  };

  useEffect(() => {
    const initializeReview = async () => {
      try {
        const response = await fetch(`/api/headless/rehydration/${importId}`, {
          method: "GET",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch payload: ${response.statusText}`);
        }

        const payload = await response.json();

        try {
          // @ts-expect-error - DromoUploader is not typed
          const dromo = await DromoUploader.rehydrateHeadless(payload);

          // Set up result handler
          dromo.onResults((data: RowData[]) => {
            setStatus("success");
            if (onComplete) onComplete("success", data);
          });

          // Set up cancel handler
          dromo.onCancel(() => {
            setStatus("canceled");
            if (onComplete) onComplete("canceled");
          });

          setStatus("reviewing");
        } catch (initError) {
          console.error("Error initializing DromoUploader:", initError);
          throw initError;
        }
      } catch (err) {
        console.error("Error initializing review:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
        setStatus("error");
        if (onComplete) onComplete("error");
      }
    };

    if (importId) {
      initializeReview();
    }

    // No need for cleanup as the DromoUploader manages its own lifecycle
  }, [importId, onComplete]);

  return (
    <div className="headless-import-review space-y-4">
      {status === "loading" && (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            Initializing review process...
          </p>
        </div>
      )}

      {status === "reviewing" && (
        <div id="dromo-container" className="min-h-[400px]">
          {/* DromoUploader will take over this container */}
        </div>
      )}

      {status === "success" && (
        <div className="rounded-lg border p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-green-600">
            Your import is complete.
          </h2>
          <div className="mb-4 flex justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              width="100"
              height="100"
            >
              <path
                d="M32,2C15.431,2,2,15.432,2,32c0,16.568,13.432,30,30,30c16.568,0,30-13.432,30-30C62,15.432,48.568,2,32,2z M25.025,50
                l-0.02-0.02L24.988,50L11,35.6l7.029-7.164l6.977,7.184l21-21.619L53,21.199L25.025,50z"
                fill="#43a047"
              />
            </svg>
          </div>
          <p className="mb-4 text-muted-foreground">
            You may close this window.
          </p>
          <Button onClick={onBack}>Return to Uploader</Button>
        </div>
      )}

      {status === "canceled" && (
        <div className="rounded-lg border p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-amber-600">
            Your import was canceled.
          </h2>
          <p className="mb-4 text-muted-foreground">
            If you would like to try again, you can reload the page or return to
            the uploader.
          </p>
          <div className="flex justify-center space-x-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Again
            </Button>
            <Button onClick={onBack}>Return to Uploader</Button>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="rounded-lg border p-6 text-center">
          <h2 className="mb-4 text-xl font-semibold text-destructive">Error</h2>
          <p className="mb-4 text-muted-foreground">{error}</p>
          <Button onClick={onBack}>Return to Uploader</Button>
        </div>
      )}
    </div>
  );
};
