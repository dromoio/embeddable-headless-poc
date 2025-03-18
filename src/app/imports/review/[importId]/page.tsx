"use client";

import { useParams, useRouter } from "next/navigation";
import { HeadlessImportReview } from "@/components/headless-import-review";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function ImportReviewPage() {
  const params = useParams();
  const router = useRouter();
  const importId =
    typeof params.importId === "string"
      ? params.importId
      : Array.isArray(params.importId)
      ? params.importId[0]
      : "";

  const handleReviewComplete = (
    result: "success" | "canceled" | "error",
    data?: Record<string, string | number | boolean>[]
  ) => {
    // Optionally handle what happens after the review is complete
    if (result === "success") {
      // Maybe show a success message or update some state
      console.log("Review completed successfully:", data);
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Button
          variant="ghost"
          className="pl-0"
          onClick={() => router.push("/imports")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Imports
        </Button>
        <h1 className="text-2xl font-bold mt-2">Review Import</h1>
        <p className="text-muted-foreground">
          Review and confirm the import to complete the process
        </p>
      </div>

      <HeadlessImportReview
        importId={importId}
        onComplete={handleReviewComplete}
        onBack={() => router.push("/imports")}
      />
    </div>
  );
}
