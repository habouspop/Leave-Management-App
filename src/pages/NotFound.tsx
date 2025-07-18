import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 p-4 text-center">
      <div className="space-y-4">
        <h1 className="text-6xl font-bold text-primary">404</h1>
        <h2 className="text-3xl font-semibold">الصفحة غير موجودة</h2>
        <p className="text-lg text-muted-foreground">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تمت إزالتها
        </p>
      </div>
      <Button asChild className="mt-4">
        <Link to="/">العودة للصفحة الرئيسية</Link>
      </Button>
    </div>
  );
}