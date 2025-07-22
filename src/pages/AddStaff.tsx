// src/pages/AddStaff.tsx

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase, TABLES } from "@/lib/supabase";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";
import { Checkbox } from "@/components/ui/checkbox";
import { useNavigate } from "react-router-dom";

const schema = z.object({
  national_id: z.string().min(5, "رقم البطاقة مطلوب"),
  full_name: z.string().min(3, "الاسم الكامل مطلوب"),
  phone_number: z.string().min(10, "رقم الهاتف غير صالح"),
  mosque_name: z.string().min(2, "اسم المسجد مطلوب"),
  role: z.array(z.enum(["خطيب", "إمام", "مؤذن"])).min(1, "اختر على الأقل مهمة واحدة"),
});

export default function AddStaff() {
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const navigate = useNavigate();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      national_id: "",
      full_name: "",
      phone_number: "",
      mosque_name: "",
      role: [],
    },
  });

  const selectedRoles = form.watch("role");

  const toggleRole = (value: string) => {
    const current = form.getValues("role") || [];
    if (current.includes(value)) {
      form.setValue("role", current.filter((v) => v !== value));
    } else {
      form.setValue("role", [...current, value]);
    }
  };

  // استرجاع user_id من Supabase auth
  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      } else {
        console.error("تعذر استرجاع المستخدم", error);
        toast.error("يجب تسجيل الدخول");
      }
    };
    fetchUser();
  }, []);

  const onSubmit = async (values: any) => {
    if (!userId) {
      toast.error("لا يمكن الحفظ بدون معرف المستخدم");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from(TABLES.STAFF).insert({
        national_id: values.national_id,
        full_name: values.full_name,
        phone_number: values.phone_number,
        mosque_name: values.mosque_name,
        role: JSON.stringify(values.role),
        user_id: userId,
      });

      if (error) {
        console.error(error);
        toast.error("فشل حفظ الموظف");
        return;
      }

      toast.success("تمت إضافة الموظف بنجاح");
      form.reset();
      navigate("/"); // أو أي صفحة أخرى
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">إضافة موظف</h2>
        <Card>
          <CardHeader>
            <CardTitle>المعلومات الشخصية</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="national_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم البطاقة الوطنية</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>الاسم الكامل</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>رقم الهاتف</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="mosque_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>اسم المسجد</FormLabel>
                      <FormControl><Input {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>المهام</FormLabel>
                  <div className="flex gap-4">
                    {["خطيب", "إمام", "مؤذن"].map((role) => (
                      <label key={role} className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedRoles.includes(role)}
                          onCheckedChange={() => toggleRole(role)}
                        />
                        {role}
                      </label>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading}>
                    {loading ? "جاري الحفظ..." : "حفظ"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
