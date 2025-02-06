import Image from "next/image";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2">
            <Image
              src="/acme-logo.png"
              alt="acme Logo"
              width={120}
              height={40}
              className="h-10 w-auto"
            />
            <div className="hidden h-6 w-px bg-border sm:block" />
            <p className="hidden text-lg font-medium sm:block">POC</p>
          </div>
        </div>
      </div>
    </header>
  );
}
