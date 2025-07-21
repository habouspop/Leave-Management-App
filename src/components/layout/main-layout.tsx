import { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { ModeToggle } from "../ui/theme-toggle";
import { cn } from "@/lib/utils";

type MainLayoutProps = {
  children: ReactNode;
  className?: string;
};

export function MainLayout({ children, className }: MainLayoutProps) {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen flex">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Content */}
      <div className={cn("flex-1 p-6", className)}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">المندوبية الإقليمية للشؤون الإسلامية بالحي الحسني</h1>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
        
        <main>{children}</main>
      </div>
    </div>
  );
}
