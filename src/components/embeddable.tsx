import { FileUp } from "lucide-react";
import DromoUploader from "dromo-uploader-react";
import { ResultsArea } from "@/components/results-area";
import { UserFormData } from "./user-form";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { mergeRowsById, RowData } from "@/utils/merge-rows";

interface EmbeddableProps {
  userData: UserFormData;
}

export const Embeddable = ({ userData }: EmbeddableProps) => {
  const [results, setResults] = useState<RowData[]>([]);

  const handleResults = (
    response: Record<string, string | number | boolean>[]
  ) => {
    // Transform the response data using mergeRowsById
    const mergedResults = mergeRowsById(response as RowData[]);
    setResults(mergedResults);
  };

  return (
    <div className="space-y-4">
      <DromoUploader
        licenseKey={process.env.NEXT_PUBLIC_DROMO_LICENSE_KEY!}
        schemaId="e279b70f-32fd-422d-999f-cbc4b3a71836"
        user={{
          id: "1",
          name: userData.name || "Anonymous",
          email: userData.email || "anonymous@example.com",
          companyId: userData.company || "Unknown",
          companyName: userData.company || "Unknown",
        }}
        onResults={handleResults}
      >
        <Button component="div">
          <FileUp />
          Launch Dromo
        </Button>
      </DromoUploader>
      <ResultsArea
        data={results as Record<string, string | number | boolean>[]}
      />
    </div>
  );
};
