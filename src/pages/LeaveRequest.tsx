import { useState, useEffect } from "react";
import { format, differenceInDays } from "date-fns";
import { ar } from "date-fns/locale";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2 } from "lucide-react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LeaveRequestFormData, RoleType, Staff } from "@/lib/types";
import { supabase, TABLES } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// [... باقي الاستيرادات كما هي ...]

export default function LeaveRequest() {
  const navigate = useNavigate();
  const [daysCount, setDaysCount] = useState(0);
  const [previousDays, setPreviousDays] = useState(0);
  const [exceedsLimit, setExceedsLimit] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const availableRoles: { id: RoleType; label: string }[] = [
    { id: "خطيب", label: "خطيب" },
    { id: "إمام", label: "إمام" },
    { id: "مؤذن", label: "مؤذن" },
  ];

  const form = useForm<LeaveRequestFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      national_id: "",
      full_name: "",
      phone_number: "",
      roles: [],
      deputies: {},
      mosque_name: "",
      travel_type: "داخل الوطن",
      country: "",
      start_date: undefined,
      end_date: undefined,
      reason: "",
    },
  });

  const watchRoles = form.watch("roles");
  const watchStartDate = form.watch("start_date");
  const watchEndDate = form.watch("end_date");
  const watchTravelType = form.watch("travel_type");

  useEffect(() => {
    if (watchTravelType === "خارج الوطن") {
      form.register("country", { required: "الدولة مطلوبة" });
    } else {
      form.setValue("country", "");
    }
  }, [watchTravelType, form]);

  useEffect(() => {
    setSelectedRoles(watchRoles || []);
  }, [watchRoles]);

  const toggleRole = (role: RoleType) => {
    const currentRoles = form.getValues("roles") || [];
    let newRoles: RoleType[];

    if (currentRoles.includes(role)) {
      newRoles = currentRoles.filter(r => r !== role);
      const currentDeputies = form.getValues("deputies") || {};
      const updatedDeputies = { ...currentDeputies };
      delete updatedDeputies[role];
      form.setValue("deputies", updatedDeputies, { shouldValidate: true });
    } else {
      newRoles = [...currentRoles, role];
    }

    form.setValue("roles", newRoles, { shouldValidate: true });
  };

  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const days = differenceInDays(watchEndDate, watchStartDate) + 1;
      setDaysCount(days);
      const totalDays = days + previousDays;
      setExceedsLimit(totalDays > 20);
    }
  }, [watchStartDate, watchEndDate, previousDays]);

  const handleSearchStaff = async (national_id: string) => {
    if (!national_id) {
      toast.error("الرجاء إدخال رقم البطاقة الوطنية");
      return;
    }

    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .select('*')
        .eq('national_id', national_id)
        .single();

      if (error) {
        toast.error("لم يتم العثور على سجل بهذا الرقم");
        return;
      }

      if (data) {
        form.setValue("full_name", data.full_name);
        form.setValue("phone_number", data.phone_number);

        if (data.role) {
          try {
            let roles: RoleType[] = [];
            if (typeof data.role === 'string') {
              try {
                const parsedRoles = JSON.parse(data.role);
                roles = Array.isArray(parsedRoles) ? parsedRoles : [data.role as RoleType];
              } catch {
                roles = [data.role as RoleType];
              }
            } else if (Array.isArray(data.role)) {
              roles = data.role as RoleType[];
            }
            form.setValue("roles", roles);
          } catch {
            form.setValue("roles", []);
          }
        }

        form.setValue("mosque_name", data.mosque_name);

        const currentYear = new Date().getFullYear();
        const { data: leaveData } = await supabase
          .from(TABLES.LEAVE_REQUESTS)
          .select('days_count')
          .eq('national_id', national_id)
          .eq('status', 'approved')
          .gte('start_date', `${currentYear}-01-01`)
          .lte('end_date', `${currentYear}-12-31`);

        if (leaveData) {
          const totalPreviousDays = leaveData.reduce((sum, item) => sum + item.days_count, 0);
          setPreviousDays(totalPreviousDays);
        }

        toast.success("تم العثور على بيانات الموظف بنجاح");
      }
    } catch (err) {
      console.error('Error during staff search:', err);
      toast.error("حدث خطأ أثناء البحث عن بيانات الموظف");
    } finally {
      setSearchLoading(false);
    }
  };

  async function onSubmit(values: LeaveRequestFormData) {
    try {
      setLoading(true);

      if (exceedsLimit) {
        toast.error("مجموع أيام الإجازة يتجاوز الحد المسموح به (20 يومًا)");
        return;
      }

      // ✅ جلب user_id الحالي
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("فشل في التعرف على المستخدم الحالي.");
        return;
      }

      const user_id = user.id;

      // 🔍 تحقق واش كاين موظف بنفس national_id
      const { data: existingStaff, error: staffError } = await supabase
        .from(TABLES.STAFF)
        .select("id, user_id")
        .eq("national_id", values.national_id)
        .maybeSingle();

      if (!existingStaff && !staffError) {
        // ➕ تسجيل الموظف الجديد
        const { error: insertStaffError } = await supabase.from(TABLES.STAFF).insert([
          {
            national_id: values.national_id,
            full_name: values.full_name,
            phone_number: values.phone_number,
            role: JSON.stringify(values.roles),
            mosque_name: values.mosque_name,
            user_id: user_id,
          },
        ]);

        if (insertStaffError) {
          toast.error("حدث خطأ أثناء تسجيل الموظف الجديد.");
          return;
        }
      } else if (existingStaff?.user_id && existingStaff.user_id !== user_id) {
        toast.error("هذا الرقم الوطني مسجل من طرف مستخدم آخر.");
        return;
      }

      const days = differenceInDays(values.end_date, values.start_date) + 1;
      const startDate = format(values.start_date, "yyyy-MM-dd");
      const endDate = format(values.end_date, "yyyy-MM-dd");

      const leaveRequestData = {
        national_id: values.national_id,
        full_name: values.full_name,
        phone_number: values.phone_number,
        roles: values.roles,
        deputies: values.deputies,
        mosque_name: values.mosque_name,
        travel_type: values.travel_type,
        country: values.country,
        start_date: startDate,
        end_date: endDate,
        days_count: days,
        reason: values.reason,
        status: "pending",
      };

      const { error } = await supabase
        .from(TABLES.LEAVE_REQUESTS)
        .insert([leaveRequestData]);

      if (error) {
        toast.error("حدث خطأ أثناء تقديم الطلب. الرجاء المحاولة مرة أخرى.");
        return;
      }

      toast.success("تم تقديم طلب الإجازة بنجاح!");
      form.reset();
      navigate("/history");
    } catch (err) {
      toast.error("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    // ⬅ الواجهة كما هي بلا تغيير
  );
}
