import { ArrowUpToLine, FileSpreadsheet } from "lucide-react";
import { ResultsArea } from "@/components/results-area";
import { UserFormData } from "./user-form";
import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { mergeRowsById, RowData } from "@/utils/merge-rows";

interface HeadlessProps {
  userData: UserFormData;
}

type ImportStatus = {
  status: "success" | "needs_review" | "error";
  data?: Record<string, string | number | boolean>[];
  reviewUrl?: string;
  error?: string;
};

export const Headless = ({ userData }: HeadlessProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);
      setImportStatus(null);

      try {
        const formData = new FormData();
        const userMetadata = {
          id: "1",
          name: userData.name || "Anonymous",
          email: userData.email || "anonymous@example.com",
          companyId: userData.company || "Unknown",
          companyName: userData.company || "Unknown",
        };

        formData.append("file", file);
        formData.append("userData", JSON.stringify(userMetadata));

        const response = await fetch("/api/headless", {
          method: "POST",
          body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Upload failed");
        }

        if (result.status === "success" && result.data) {
          // Transform the data using mergeRowsById before setting the import status
          const mergedData = mergeRowsById(result.data as RowData[]);
          setImportStatus({
            status: "success",
            data: mergedData as Record<string, string | number | boolean>[],
          });
        } else if (result.status === "needs_review" && result.reviewUrl) {
          setImportStatus({
            status: "needs_review",
            reviewUrl: result.reviewUrl,
          });
        } else {
          throw new Error("Invalid response format");
        }
      } catch (error) {
        console.error("Upload error:", error);
        setImportStatus({
          status: "error",
          error:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      } finally {
        setIsUploading(false);
      }
    },
    [userData]
  );

  const acceptedFileTypes = {
    "text/csv": [".csv"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-excel": [".xls"],
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: false,
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1">
        <div
          {...getRootProps()}
          className={`flex h-[200px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors ${
            isDragActive ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <input {...getInputProps()} />
          <ArrowUpToLine className="mb-2 h-12 w-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            <span className="inline-flex items-center">
              <FileSpreadsheet className="mr-1 h-4 w-4" />
              Drag and drop your CSV or Excel file here
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            or click to select a file
          </p>
          {isUploading && (
            <p className="mt-2 text-sm text-muted-foreground">Uploading...</p>
          )}
          {importStatus?.status === "error" && (
            <p className="mt-2 text-sm text-destructive">
              {importStatus.error}
            </p>
          )}
        </div>
      </div>
      <div className="col-span-2">
        <ResultsArea
          data={
            importStatus?.status === "success" ? importStatus.data : undefined
          }
          needsReview={importStatus?.status === "needs_review"}
          reviewUrl={importStatus?.reviewUrl}
        />
      </div>
    </div>
  );
};
