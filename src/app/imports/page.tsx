"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Check,
  AlertCircle,
  Clock,
  Hourglass,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Import {
  id: string;
  status: string;
  created_at: string;
  schema_id: string;
  original_filename: string;
  review_url?: string;
}

interface ImportsResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Import[];
}

export default function ImportsPage() {
  const [imports, setImports] = useState<Import[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [count, setCount] = useState(0);
  const limit = 20;
  const router = useRouter();

  const fetchImports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/headless/imports?offset=${offset}&limit=${limit}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch imports");
      }
      const data: ImportsResponse = await response.json();
      setImports(data.results);
      setCount(data.count);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "An error occurred while fetching imports"
      );
      console.error("Error fetching imports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImports();
  }, [offset]);

  const goToReview = (importId: string) => {
    router.push(`/imports/review/${importId}`);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "SUCCESSFUL":
        return (
          <Badge className="bg-green-500">
            <Check className="h-3 w-3 mr-1" /> Success
          </Badge>
        );
      case "NEEDS_REVIEW":
        return (
          <Badge className="bg-amber-500">
            <AlertCircle className="h-3 w-3 mr-1" /> Needs Review
          </Badge>
        );
      case "FAILED":
        return (
          <Badge className="bg-red-500">
            <XCircle className="h-3 w-3 mr-1" /> Failed
          </Badge>
        );
      case "PENDING":
        return (
          <Badge className="bg-blue-500">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge className="bg-purple-500">
            <Hourglass className="h-3 w-3 mr-1" /> Running
          </Badge>
        );
      default:
        return <Badge className="bg-gray-500">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Headless Imports</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchImports}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="default" size="sm" onClick={() => router.push("/")}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            New Import
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      <div className="bg-white rounded-md shadow overflow-hidden">
        {loading ? (
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-4">
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : imports.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No imports found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Filename</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {imports.map((importItem) => (
                <TableRow key={importItem.id}>
                  <TableCell className="font-mono text-xs">
                    {importItem.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>{importItem.original_filename}</TableCell>
                  <TableCell>{getStatusBadge(importItem.status)}</TableCell>
                  <TableCell>{formatDate(importItem.created_at)}</TableCell>
                  <TableCell>
                    {importItem.status.toUpperCase() === "NEEDS_REVIEW" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToReview(importItem.id)}
                      >
                        Review
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-gray-500">
          Showing {imports.length} of {count} imports
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0 || loading}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= count || loading}
            onClick={() => setOffset(offset + limit)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
