"use client";

import {
  ArrowUpToLine,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { ResultsArea } from "@/components/results-area";
import { UserFormData } from "./user-form";
import { useState, useCallback, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

type RowData = Record<string, string | number | boolean>;

interface HeadlessProps {
  userData: UserFormData;
  schemaId: string;
}

// Update StreamMessage with possible stages
type ProcessStage =
  | "idle"
  | "uploading"
  | "processing"
  | "polling"
  | "error"
  | "success"
  | "needs_review";

type StreamMessage = {
  status: ProcessStage;
  message?: string;
  data?: RowData[];
  reviewUrl?: string;
  importId?: string;
  error?: string;
  dromoStatus?: string;
  details?: unknown;
  progress?: number; // Optional progress percentage
};

export const Headless = ({ userData, schemaId }: HeadlessProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [streamMessages, setStreamMessages] = useState<StreamMessage[]>([]);
  const [finalStatus, setFinalStatus] = useState<StreamMessage | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState<ProcessStage>("idle");
  const [showAllMessages, setShowAllMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Map process stages to progress percentages
  const stageToProgress = {
    idle: 0,
    uploading: 20,
    processing: 40,
    polling: 60,
    needs_review: 95,
    success: 100,
    error: 100,
  };

  // Helper to scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);
      setStreamMessages([]);
      setFinalStatus(null);
      setShowReview(false);
      setProgress(0);
      setCurrentStage("uploading");
      let receivedFinalMessage = false;

      // Start with an initial loading message
      const initialMsg: StreamMessage = {
        status: "uploading",
        message: `Uploading ${file.name} (${(file.size / 1024).toFixed(
          1
        )} KB)...`,
      };
      setStreamMessages([initialMsg]);

      // Simulate initial upload progress more aggressively
      const uploadTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 18) return prev + 2; // More noticeable increments
          return prev;
        });
      }, 100);

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
        if (schemaId) {
          formData.append("schemaId", schemaId);
        }

        const response = await fetch("/api/headless", {
          method: "POST",
          body: formData,
        });

        // Clear the timer and explicitly set to 20% after upload completes
        clearInterval(uploadTimer);
        setProgress(20);

        if (!response.ok || !response.body) {
          const errorText = await response.text().catch(() => "Upload failed");
          throw new Error(
            `Upload failed: ${response.status} ${response.statusText}. ${errorText}`
          );
        }

        // Processing stage after upload
        setCurrentStage("processing");
        setProgress(stageToProgress.processing);

        // --- Stream Processing ---
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let pollCount = 0;
        const maxPolls = 12; // Assume 12 polling attempts max

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");

          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.trim() === "") continue;
            try {
              const message: StreamMessage = JSON.parse(line);
              console.log("Received stream message:", message);

              // Update progress more explicitly based on message status
              if (message.status) {
                const prevStage = currentStage;
                setCurrentStage(message.status);

                // Only update progress for specific status changes
                if (message.status === "polling") {
                  pollCount++;
                  // Calculate progress during polling (40-90%)
                  const pollingRange =
                    stageToProgress.needs_review - stageToProgress.processing;
                  const pollingProgress =
                    stageToProgress.processing +
                    pollingRange * (pollCount / maxPolls);

                  console.log(
                    `Updating polling progress: ${pollingProgress.toFixed(1)}%`
                  );
                  setProgress(
                    Math.min(
                      Math.floor(pollingProgress),
                      stageToProgress.needs_review - 1
                    )
                  );
                } else if (message.status !== prevStage) {
                  // If status changed, update progress based on the mapping
                  console.log(
                    `Status changed to ${message.status}, progress: ${
                      stageToProgress[message.status]
                    }%`
                  );
                  setProgress(stageToProgress[message.status]);
                }
              }

              setStreamMessages((prev) => [...prev, message]);
              scrollToBottom();

              if (
                message.status === "success" ||
                message.status === "needs_review" ||
                message.status === "error"
              ) {
                setFinalStatus(message);
                receivedFinalMessage = true;
              }
            } catch (e) {
              console.error("Failed to parse stream chunk:", line, e);
              const errorMsg = {
                status: "error",
                error: `Failed to parse stream data: ${e}`,
              } as StreamMessage;
              setStreamMessages((prev) => [...prev, errorMsg]);
              setFinalStatus(errorMsg);
              receivedFinalMessage = true;
              setCurrentStage("error");
              setProgress(100);
            }
          }
        }

        // Process any remaining data in the buffer
        if (buffer.trim() !== "") {
          try {
            const message: StreamMessage = JSON.parse(buffer);
            console.log("Received final stream message:", message);

            if (message.status) {
              setCurrentStage(message.status);
              setProgress(stageToProgress[message.status]);
            }

            setStreamMessages((prev) => [...prev, message]);

            if (
              message.status === "success" ||
              message.status === "needs_review" ||
              message.status === "error"
            ) {
              setFinalStatus(message);
              receivedFinalMessage = true;
            }
          } catch (e) {
            console.error("Failed to parse final stream chunk:", buffer, e);
            const errorMsg = {
              status: "error",
              error: `Failed to parse final stream data: ${e}`,
            } as StreamMessage;
            setStreamMessages((prev) => [...prev, errorMsg]);
            setFinalStatus(errorMsg);
            receivedFinalMessage = true;
            setCurrentStage("error");
            setProgress(100);
          }
        }

        // Check if a final message was processed using the local variable
        if (!receivedFinalMessage) {
          console.warn(
            "Stream ended without a recognized final status message."
          );
          const errorMsg = {
            status: "error",
            error: "Import process ended without a clear result.",
          } as StreamMessage;
          setStreamMessages((prev) => [...prev, errorMsg]);
          setFinalStatus(errorMsg);
          setCurrentStage("error");
          setProgress(100);
        }
      } catch (error) {
        console.error("Upload error:", error);
        clearInterval(uploadTimer);

        const errorMsg = {
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Unknown upload error occurred",
        } as StreamMessage;

        // Ensure final status is set even if error happens before stream processing
        if (!receivedFinalMessage) {
          setStreamMessages((prev) => [...prev, errorMsg]);
          setFinalStatus(errorMsg);
          setCurrentStage("error");
          setProgress(100);
        }
      } finally {
        setIsUploading(false);
        clearInterval(uploadTimer);
      }
    },
    [userData, schemaId]
  );

  // Reset function to start a new upload
  const handleNewUpload = () => {
    setStreamMessages([]);
    setFinalStatus(null);
    setShowReview(false);
    setProgress(0);
    setCurrentStage("idle");
    setShowAllMessages(false);
  };

  // Start review when needed and button is clicked - open the reviewUrl in a new tab
  const handleStartReview = () => {
    if (finalStatus?.status === "needs_review" && finalStatus?.reviewUrl) {
      window.open(finalStatus.reviewUrl, "_blank");
    }
  };

  const acceptedFileTypes = {
    "text/csv": [".csv"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-excel": [".xls"],
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: acceptedFileTypes,
    multiple: false,
    disabled: isUploading,
  });

  // Get the latest message
  const lastMessage = streamMessages[streamMessages.length - 1];

  // Function to render status icon based on current stage
  const renderStatusIcon = () => {
    switch (currentStage) {
      case "idle":
        return <ArrowUpToLine className="h-6 w-6 text-muted-foreground" />;
      case "success":
        return <CheckCircle className="h-6 w-6 text-green-500" />;
      case "error":
        return <XCircle className="h-6 w-6 text-destructive" />;
      case "needs_review":
        return <AlertCircle className="h-6 w-6 text-amber-500" />;
      default:
        return <Loader2 className="h-6 w-6 text-primary animate-spin" />;
    }
  };

  // Function to get appropriate progress bar color
  const getProgressBarClassName = () => {
    if (currentStage === "error") return "bg-destructive";
    if (currentStage === "success") return "bg-green-500";
    if (currentStage === "needs_review") return "bg-amber-500";
    return "bg-primary";
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="col-span-1">
        <motion.div
          className="rounded-lg border shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Header */}
          <div className="border-b p-4 flex justify-between items-center">
            <h3 className="text-lg font-medium flex items-center gap-2">
              {renderStatusIcon()}
              <span>
                {currentStage === "idle" && "File Import"}
                {currentStage === "uploading" && "Uploading..."}
                {currentStage === "processing" && "Processing..."}
                {currentStage === "polling" && "Analyzing..."}
                {currentStage === "success" && "Import Complete"}
                {currentStage === "needs_review" && "Review Required"}
                {currentStage === "error" && "Import Failed"}
              </span>
            </h3>

            {/* New Upload button - show in success, needs_review (when not reviewing), or error states */}
            {(currentStage === "success" ||
              (currentStage === "needs_review" && !showReview) ||
              currentStage === "error") && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-3 py-1 text-xs text-primary border border-primary rounded-md hover:bg-primary/5"
                onClick={handleNewUpload}
              >
                New Upload
              </motion.button>
            )}
          </div>

          {/* Progress bar */}
          <AnimatePresence mode="wait">
            {isUploading || progress > 0 ? (
              <motion.div
                className="p-4 pb-0"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`absolute top-0 left-0 h-full transition-all ${getProgressBarClassName()}`}
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-right text-muted-foreground mb-4 mt-2">
                  {Math.round(progress)}%
                </p>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Dropzone */}
          <div
            {...(currentStage === "idle" || currentStage === "error"
              ? getRootProps()
              : {})}
            className={`relative p-6 ${
              (currentStage === "idle" || currentStage === "error") &&
              !isUploading
                ? "cursor-pointer hover:bg-muted/50"
                : ""
            }`}
          >
            {(currentStage === "idle" || currentStage === "error") &&
              !isUploading && <input {...getInputProps()} />}

            <AnimatePresence mode="wait">
              {currentStage === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <FileSpreadsheet className="mb-2 h-12 w-12 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">
                    Drag & drop your CSV or Excel file here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    or click to select a file
                  </p>
                </motion.div>
              )}

              {(isUploading ||
                ["uploading", "processing", "polling"].includes(
                  currentStage
                )) && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <Loader2 className="mb-2 h-12 w-12 animate-spin text-primary" />
                  <p className="text-sm font-medium mb-1">
                    {lastMessage?.message || `Processing your file...`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    This may take a moment
                  </p>
                </motion.div>
              )}

              {currentStage === "success" && !isUploading && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <CheckCircle className="mb-2 h-12 w-12 text-green-500" />
                  <p className="text-sm font-medium text-green-500 mb-1">
                    Import successful!
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {finalStatus?.data &&
                      `${finalStatus.data.length} records imported successfully`}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-primary text-white rounded-md text-sm"
                    onClick={handleNewUpload}
                  >
                    Upload Another File
                  </motion.button>
                </motion.div>
              )}

              {currentStage === "needs_review" && !isUploading && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <AlertCircle className="mb-2 h-12 w-12 text-amber-500" />
                  <p className="text-sm font-medium text-amber-500 mb-1">
                    Your import needs review
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Some data requires your attention in the Dromo web interface
                  </p>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 bg-amber-500 text-white rounded-md text-sm"
                      onClick={handleStartReview}
                    >
                      Open Review Page
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-4 py-2 border border-muted-foreground text-muted-foreground rounded-md text-sm"
                      onClick={handleNewUpload}
                    >
                      New Upload
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {currentStage === "error" && !isUploading && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center text-center"
                >
                  <XCircle className="mb-2 h-12 w-12 text-destructive" />
                  <p className="text-sm font-medium text-destructive mb-1">
                    Import failed
                  </p>
                  <p className="text-xs text-muted-foreground mb-4 max-w-[250px] break-words">
                    {finalStatus?.error || "An unknown error occurred"}
                  </p>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-4 py-2 bg-primary text-white rounded-md text-sm"
                    onClick={handleNewUpload}
                  >
                    Try Again
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Message log toggle and area */}
          {streamMessages.length > 0 && (
            <div className="border-t">
              <button
                onClick={() => setShowAllMessages(!showAllMessages)}
                className="flex w-full items-center justify-between p-4 text-xs text-muted-foreground hover:bg-muted/50"
              >
                <span>Import log ({streamMessages.length} messages)</span>
                {showAllMessages ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>

              <AnimatePresence>
                {showAllMessages && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="max-h-40 overflow-y-auto p-4 bg-muted/20 text-xs">
                      {streamMessages.map((msg, i) => (
                        <div key={i} className="mb-1 last:mb-0">
                          <span
                            className={
                              msg.status === "error"
                                ? "text-destructive"
                                : msg.status === "success"
                                ? "text-green-500"
                                : ""
                            }
                          >
                            {msg.message || msg.status}
                            {msg.status === "error" &&
                              msg.error &&
                              `: ${msg.error}`}
                          </span>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>
      </div>
      <div className="col-span-2">
        <ResultsArea
          data={
            finalStatus?.status === "success" ? finalStatus.data : undefined
          }
          needsReview={finalStatus?.status === "needs_review"}
          reviewUrl={finalStatus?.reviewUrl}
          hasImportId={!!finalStatus?.importId}
        />
      </div>
    </div>
  );
};
