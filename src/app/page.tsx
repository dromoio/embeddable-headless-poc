"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Upload } from "lucide-react";
import { Embeddable } from "@/components/embeddable";
import { Headless } from "@/components/headless";
import { UserForm, UserFormData } from "@/components/user-form";
import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    company: "",
    email: "",
  });

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
          <Embeddable userData={formData} />
        </TabsContent>
        <TabsContent value="headless">
          <Headless userData={formData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
