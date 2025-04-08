import { FileUp } from "lucide-react";
import DromoUploader from "dromo-uploader-react";
import { ResultsArea } from "@/components/results-area";
import { UserFormData } from "./user-form";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface EmbeddableProps {
  userData: UserFormData;
  schemaId: string;
}

export const Embeddable = ({ userData, schemaId }: EmbeddableProps) => {
  const [results, setResults] = useState<
    Record<string, string | number | boolean>[]
  >([]);

  const handleResults = (
    response: Record<string, string | number | boolean>[]
  ) => {
    // Transform the response data using mergeRowsById
    const mergedResults = response;
    setResults(mergedResults);
  };

  return (
    <div className="space-y-4">
      <DromoUploader
        licenseKey={process.env.NEXT_PUBLIC_DROMO_LICENSE_KEY!}
        schemaId={schemaId || process.env.NEXT_PUBLIC_SCHEMA_ID!}
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
