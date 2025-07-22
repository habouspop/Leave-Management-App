import { NavLink } from "react-router-dom";
import { Home, FileText, Clock, Printer, User, UserPlus } from "lucide-react"; // ✅ أضف UserPlus
import { cn } from "@/lib/utils";

const navItems = [
  {
    title: "الرئيسية",
    href: "/",
    icon: Home,
  },
  {
    title: "طلب إجازة",
    href: "/leave-request",
    icon: FileText,
  },
  {
    title: "سجل الطلبات",
    href: "/history",
    icon: Clock,
  },
  {
    title: "طباعة الوثائق",
    href: "/print",
    icon: Printer,
  },
  {
    title: "لوحة الإدارة",
    href: "/admin",
    icon: User,
  },
  {
    title: "إضافة موظف", // ✅ العنوان الجديد
    href: "/add-staff", // ✅ الرابط الجديد
    icon: UserPlus,     // ✅ الأيقونة الجديدة
  },
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-card border-l overflow-y-auto h-screen py-6 px-3 flex flex-col">
      <div className="mb-6 px-2">
        <h2 className="text-xl font-bold text-center">نظام إدارة الإجازات</h2>
      </div>

      <nav className="space-y-1 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                isActive
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-muted-foreground"
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 px-2 text-center text-sm text-muted-foreground">
        المندوبية الإقليمية للشؤون الإسلامية بالحي الحسني
        <br />
        {new Date().getFullYear()} ©
      </div>
    </aside>
  );
}
