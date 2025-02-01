import { User, Building2, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface UserFormData {
  name: string;
  company: string;
  email: string;
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
    <div className="mb-8 space-y-4">
      <div className="grid grid-cols-3 gap-4">
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
      </div>
    </div>
  );
};
