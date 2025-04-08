import { User, Building2, Mail, Key } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface UserFormData {
  name: string;
  company: string;
  email: string;
  schemaId: string;
}

interface UserFormProps {
  values: UserFormData;
  onChange: (values: UserFormData) => void;
}

export const UserForm = ({ values, onChange }: UserFormProps) => {
  const handleChange =
    (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({
        ...values,
        [field]: e.target.value,
      });
    };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>User & Upload Settings</CardTitle>
        <CardDescription>
          Enter your details and the target Dromo Schema ID for uploads.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="inline-flex items-center gap-1">
              <User className="h-4 w-4" />
              Name
            </Label>
            <Input
              id="name"
              placeholder="Enter your name"
              value={values.name}
              onChange={handleChange("name")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company" className="inline-flex items-center gap-1">
              <Building2 className="h-4 w-4" />
              Company
            </Label>
            <Input
              id="company"
              placeholder="Enter your company"
              value={values.company}
              onChange={handleChange("company")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="inline-flex items-center gap-1">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={values.email}
              onChange={handleChange("email")}
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="schemaId"
              className="inline-flex items-center gap-1"
            >
              <Key className="h-4 w-4" />
              Schema ID
            </Label>
            <Input
              id="schemaId"
              placeholder="Enter Dromo Schema ID"
              value={values.schemaId}
              onChange={handleChange("schemaId")}
            />
            <p className="text-sm text-muted-foreground">
              Find this in your Dromo dashboard under Schema Studio.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
