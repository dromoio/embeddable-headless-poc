"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Upload } from "lucide-react";
import { Embeddable } from "@/components/embeddable";
import { Headless } from "@/components/headless";
import { UserForm, UserFormData } from "@/components/user-form";
import { useState, useEffect } from "react";

// Define a key for localStorage
const FORM_DATA_STORAGE_KEY = "dromo_user_form_data";

export default function Home() {
  // Initialize state with default values or from localStorage
  const [formData, setFormData] = useState<UserFormData>(() => {
    // Check if running in browser context
    if (typeof window !== "undefined") {
      const savedData = localStorage.getItem(FORM_DATA_STORAGE_KEY);
      if (savedData) {
        try {
          const parsedData = JSON.parse(savedData);
          // Basic validation to ensure structure matches
          if (
            parsedData &&
            typeof parsedData.name === "string" &&
            typeof parsedData.company === "string" &&
            typeof parsedData.email === "string" &&
            typeof parsedData.schemaId === "string"
          ) {
            return parsedData as UserFormData;
          }
        } catch (error) {
          console.error("Failed to parse form data from localStorage", error);
        }
      }
    }
    // Return default state if no valid data in localStorage
    return {
      name: "",
      company: "",
      email: "",
      schemaId: "", // Added schemaId default
    };
  });

  // Effect to save formData to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(FORM_DATA_STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  return (
    <div className="min-h-screen p-8 font-[family-name:var(--font-geist-sans)]">
      <UserForm values={formData} onChange={setFormData} />

      <Tabs defaultValue="embeddable" className="space-y-4">
        <TabsList>
          <TabsTrigger
            value="embeddable"
            className="inline-flex items-center gap-1"
          >
            <FileUp className="h-4 w-4" />
            Embeddable
          </TabsTrigger>
          <TabsTrigger
            value="headless"
            className="inline-flex items-center gap-1"
          >
            <Upload className="h-4 w-4" />
            Headless
          </TabsTrigger>
        </TabsList>
        <TabsContent value="embeddable">
          <Embeddable userData={formData} schemaId={formData.schemaId} />
        </TabsContent>
        <TabsContent value="headless">
          <Headless userData={formData} schemaId={formData.schemaId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
