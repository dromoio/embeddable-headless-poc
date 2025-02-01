import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Table as TableIcon, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ResultsAreaProps {
  data?: Record<string, string | number | boolean>[];
  needsReview?: boolean;
  reviewUrl?: string;
}

export const ResultsArea = ({
  data,
  needsReview,
  reviewUrl,
}: ResultsAreaProps) => {
  const columns = data && data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <ScrollArea className="h-[calc(100vh-400px)] w-full rounded-md border">
      {needsReview && reviewUrl && (
        <div className="p-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Review Required</AlertTitle>
            <AlertDescription className="mt-2">
              Your import needs review. Please{" "}
              <a
                href={reviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline underline-offset-4"
              >
                click here
              </a>{" "}
              to review and complete the import.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {!data || data.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center p-4 text-muted-foreground">
          <TableIcon className="mr-2 h-5 w-5" />
          No results to display yet
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column}>
                  {column.charAt(0).toUpperCase() +
                    column.slice(1).replace(/_/g, " ")}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row, index) => (
              <TableRow key={index}>
                {columns.map((column) => (
                  <TableCell key={column}>
                    {row[column]?.toString() || "-"}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </ScrollArea>
  );
};
