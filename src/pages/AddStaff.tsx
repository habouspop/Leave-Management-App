import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { MainLayout } from "@/components/layout/main-layout";
import { Loader2 } from "lucide-react";

const staffFormSchema = z.object({
  national_id: z.string().min(5, "رقم البطاقة الوطنية مطلوب"),
  full_name: z.string().min(2, "الاسم الكامل مطلوب"),
  phone_number: z.string().min(10, "رقم الهاتف غير صحيح"),
  role: z.string().min(2, "المهمة مطلوبة"),
  mosque_name: z.string().min(1, "اسم المسجد مطلوب"),
});

type StaffFormValues = z.infer<typeof staffFormSchema>;

export default function AddStaff() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const form = useForm<StaffFormValues>({
    resolver: zodResolver(staffFormSchema),
    defaultValues: {
      national_id: "",
      full_name: "",
      phone_number: "",
      role: "",
      mosque_name: "",
    },
  });

  const onSubmit = async (values: StaffFormValues) => {
    setLoading(true);

    // الحصول على user الحالي
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      toast.error("تعذر الحصول على معلومات المستخدم.");
      setLoading(false);
      return;
    }

    // إعداد البيانات للإرسال
    const newStaff = {
      ...values,
      user_id: user.id,
    };

    // إدراج في قاعدة البيانات
    const { error } = await supabase.from("staff").insert(newStaff);

    if (error) {
      if (error.code === "23505") {
        toast.error("رقم البطاقة الوطنية مستخدم بالفعل.");
      } else {
        console.error("Insert error:", error);
        toast.error("حدث خطأ أثناء حفظ البيانات.");
      }
    } else {
      toast.success("تمت إضافة الموظف بنجاح");
      navigate("/admin");
    }

    setLoading(false);
  };

  return (
    <MainLayout>
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>إضافة موظف جديد</CardTitle>
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
                    <FormControl>
                      <Input placeholder="مثال: AB123456" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="محمد بن عبد الله" {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="06xxxxxxxx" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>المهمة</FormLabel>
                    <FormControl>
                      <Input placeholder="إمام، خطيب، مؤذن..." {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Input placeholder="مسجد التقوى" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  حفظ الموظف
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </MainLayout>
  );
}
