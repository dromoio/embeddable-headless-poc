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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Check,
  AlertCircle,
  Clock,
  Hourglass,
  XCircle,
  RefreshCw,
  FileSpreadsheet,
  ExternalLink,
  Hash,
  File,
  ListChecks,
  CalendarClock,
  CalendarCheck,
  Puzzle,
  Settings,
  Inbox,
  Info,
  ClipboardCopy,
  Check as CheckIcon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface Import {
  id: string;
  status: string;
  created_date: string;
  modified_date: string;
  schema_id: string | null;
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
  const [hoveredSchemaId, setHoveredSchemaId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedId(id);
        setTimeout(() => {
          setCopiedId(null);
        }, 1500);
      },
      (err) => {
        console.error("Failed to copy text: ", err);
      }
    );
  };

  const getStatusBadge = (status: string) => {
    const upperStatus = status?.toUpperCase() || "UNKNOWN";

    switch (upperStatus) {
      case "SUCCESSFUL":
        return (
          <Badge variant="success">
            <Check className="-ms-1 me-1.5 size-4" />
            <span className="whitespace-nowrap">Success</span>
          </Badge>
        );
      case "NEEDS_REVIEW":
        return (
          <Badge variant="warning">
            <AlertCircle className="-ms-1 me-1.5 size-4" />
            <span className="whitespace-nowrap">Needs Review</span>
          </Badge>
        );
      case "FAILED":
        return (
          <Badge variant="danger">
            <XCircle className="-ms-1 me-1.5 size-4" />
            <span className="whitespace-nowrap">Failed</span>
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="info">
            <Clock className="-ms-1 me-1.5 size-4" />
            <span className="whitespace-nowrap">Pending</span>
          </Badge>
        );
      case "RUNNING":
        return (
          <Badge variant="running">
            <Hourglass className="-ms-1 me-1.5 size-4" />
            <span className="whitespace-nowrap">Running</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <span className="whitespace-nowrap">{status || "Unknown"}</span>
          </Badge>
        );
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

  const formatFullDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch (error) {
      console.error("Error formatting full date:", error);
      return "Invalid date";
    }
  };

  return (
    <TooltipProvider>
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
            <Button
              variant="default"
              size="sm"
              onClick={() => router.push("/")}
            >
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

        <div className="bg-white rounded-md shadow overflow-hidden border">
          {loading ? (
            <div className="p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4 py-4">
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : imports.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Inbox className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No imports found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Hash className="h-4 w-4" /> ID
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <File className="h-4 w-4" /> Filename
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <ListChecks className="h-4 w-4" /> Status
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="h-4 w-4" /> Created
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <CalendarCheck className="h-4 w-4" /> Last Modified
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Puzzle className="h-4 w-4" /> Schema ID
                    </div>
                  </TableHead>
                  <TableHead className="whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Settings className="h-4 w-4" /> Actions
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((importItem) => (
                  <TableRow
                    key={importItem.id}
                    className="odd:bg-muted/50 hover:bg-muted/80"
                    onMouseLeave={() => setHoveredSchemaId(null)}
                  >
                    <TableCell className="font-mono text-xs">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{importItem.id.substring(0, 8)}...</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{importItem.id}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="truncate max-w-xs">
                      {importItem.original_filename}
                    </TableCell>
                    <TableCell>{getStatusBadge(importItem.status)}</TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{formatDate(importItem.created_date)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatFullDate(importItem.created_date)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>{formatDate(importItem.modified_date)}</span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{formatFullDate(importItem.modified_date)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell
                      className="font-mono text-xs"
                      onMouseEnter={() => setHoveredSchemaId(importItem.id)}
                    >
                      {importItem.schema_id &&
                      importItem.schema_id !== "None" ? (
                        <div className="relative flex items-center justify-between group">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate pr-1">
                                {importItem.schema_id.substring(0, 8)}...
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{importItem.schema_id}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 transition-opacity ${
                              hoveredSchemaId === importItem.id
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(
                                importItem.schema_id!,
                                importItem.id
                              );
                            }}
                            aria-label="Copy Schema ID"
                          >
                            {copiedId === importItem.id ? (
                              <CheckIcon className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <ClipboardCopy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {importItem.status.toUpperCase() === "NEEDS_REVIEW" ? (
                        <div className="flex items-center gap-2">
                          {importItem.review_url && (
                            <a
                              href={importItem.review_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={buttonVariants({
                                variant: "default",
                                size: "sm",
                              })}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Review Now
                            </a>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span tabIndex={0}>
                                <Button variant="outline" size="sm" disabled>
                                  Internal Review
                                </Button>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Coming soon</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <p className="flex items-center gap-1.5 text-sm text-gray-500">
            <Info className="h-4 w-4" />
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
    </TooltipProvider>
  );
}
