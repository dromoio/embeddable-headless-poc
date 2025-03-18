import Image from "next/image";
import Link from "next/link";
import { FileSpreadsheet } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Image
                src="/acme-logo.png"
                alt="acme Logo"
                width={120}
                height={40}
                className="h-10 w-auto"
              />
            </Link>
            <div className="hidden h-6 w-px bg-border sm:block" />
            <p className="hidden text-lg font-medium sm:block">POC</p>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              href="/imports"
              className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Imports
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
