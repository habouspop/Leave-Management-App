
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

const roleEnum = z.enum(["خطيب", "إمام", "مؤذن"]);

const formSchema = z.object({
  national_id: z.string().min(5, { message: "رقم البطاقة الوطنية مطلوب" }),
  full_name: z.string().min(2, { message: "الاسم الكامل مطلوب" }),
  phone_number: z.string().min(10, { message: "رقم الهاتف مطلوب" }),
  roles: z.array(roleEnum).min(1, { 
    message: "يجب اختيار مهمة واحدة على الأقل", 
  }),
  deputies: z.record(z.string().optional()),
  mosque_name: z.string().min(1, { message: "اسم المسجد مطلوب" }),
  travel_type: z.enum(["داخل الوطن", "خارج الوطن"], {
    required_error: "نوع السفر مطلوب",
  }),
  country: z.string().optional(),
  start_date: z.date({
    required_error: "تاريخ البداية مطلوب",
  }),
  end_date: z.date({
    required_error: "تاريخ النهاية مطلوب",
  }).refine(
    (date) => date >= new Date(), 
    { message: "تاريخ النهاية يجب أن يكون في المستقبل" }
  ),
  reason: z.string().min(5, { message: "سبب الإجازة مطلوب" }),
}).refine((data) => data.end_date >= data.start_date, {
  message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية",
  path: ["end_date"],
});

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

  // Watch form fields for dynamic UI updates
  const watchRoles = form.watch("roles");
  const watchStartDate = form.watch("start_date");
  const watchEndDate = form.watch("end_date");
  const watchTravelType = form.watch("travel_type");
  
  // Update country field validation based on travel type
  useEffect(() => {
    // If travel type is "خارج الوطن" (outside the country), make country field required
    if (watchTravelType === "خارج الوطن") {
      form.register("country", { required: "الدولة مطلوبة" });
    } else {
      // If travel type is "داخل الوطن" (inside the country), clear country field
      form.setValue("country", "");
    }
  }, [watchTravelType, form]);
  
  // Update selectedRoles when watchRoles changes
  useEffect(() => {
    setSelectedRoles(watchRoles || []);
  }, [watchRoles]);
  
  // Toggle a role selection
  const toggleRole = (role: RoleType) => {
    const currentRoles = form.getValues("roles") || [];
    let newRoles: RoleType[];
    
    if (currentRoles.includes(role)) {
      newRoles = currentRoles.filter(r => r !== role);
      // Also clear the deputy for this role
      const currentDeputies = form.getValues("deputies") || {};
      const updatedDeputies = { ...currentDeputies };
      delete updatedDeputies[role];
      form.setValue("deputies", updatedDeputies, { shouldValidate: true });
    } else {
      newRoles = [...currentRoles, role];
    }
    
    form.setValue("roles", newRoles, { shouldValidate: true });
  };

  // Calculate days when dates change
  useEffect(() => {
    if (watchStartDate && watchEndDate) {
      const days = differenceInDays(watchEndDate, watchStartDate) + 1;
      setDaysCount(days);
      
      // Check if total days exceed limit
      const totalDays = days + previousDays;
      setExceedsLimit(totalDays > 20);
    }
  }, [watchStartDate, watchEndDate, previousDays]);

  // Fetch staff data from Supabase based on national_id
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
        console.error('Error searching for staff:', error);
        toast.error("لم يتم العثور على سجل بهذا الرقم");
        return;
      }
      
      if (data) {
        // Populate form with staff data
        form.setValue("full_name", data.full_name);
        form.setValue("phone_number", data.phone_number);
        
        // Set roles
        if (data.role) {
          try {
            // Check if role is stored as an array, a string, or needs to be parsed
            let roles: RoleType[] = [];
            if (typeof data.role === 'string') {
              try {
                const parsedRoles = JSON.parse(data.role);
                roles = Array.isArray(parsedRoles) ? parsedRoles : [data.role as RoleType];
              } catch (e) {
                roles = [data.role as RoleType];
              }
            } else if (Array.isArray(data.role)) {
              roles = data.role as RoleType[];
            }
            
            form.setValue("roles", roles);
          } catch (e) {
            console.error('Error parsing roles:', e);
            form.setValue("roles", []);
          }
        }
        
        form.setValue("mosque_name", data.mosque_name);
        
        // Fetch previous leave days for the current year
        const currentYear = new Date().getFullYear();
        const { data: leaveData, error: leaveError } = await supabase
          .from(TABLES.LEAVE_REQUESTS)
          .select('days_count')
          .eq('national_id', national_id)
          .eq('status', 'approved')
          .gte('start_date', `${currentYear}-01-01`)
          .lte('end_date', `${currentYear}-12-31`);
        
        if (leaveError) {
          console.error('Error fetching leave history:', leaveError);
        } else if (leaveData) {
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
      
      // Calculate days count
      const days = differenceInDays(values.end_date, values.start_date) + 1;
      
      // Format dates for database
      const startDate = format(values.start_date, "yyyy-MM-dd");
      const endDate = format(values.end_date, "yyyy-MM-dd");
      
      // Prepare data for insertion
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
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from(TABLES.LEAVE_REQUESTS)
        .insert([leaveRequestData])
        .select();
      
      if (error) {
        console.error('Error submitting leave request:', error);
        toast.error("حدث خطأ أثناء تقديم الطلب. الرجاء المحاولة مرة أخرى.");
        return;
      }
      
      toast.success("تم تقديم طلب الإجازة بنجاح!");
      
      // Reset form
      form.reset();
      
      // Navigate to history page
      navigate('/history');
    } catch (err) {
      console.error('Error submitting form:', err);
      toast.error("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">طلب إجازة</h2>
          <p className="text-muted-foreground">
            املأ النموذج التالي لتقديم طلب إجازة جديد
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>نموذج طلب الإجازة</CardTitle>
            <CardDescription>
              يرجى تعبئة جميع الحقول المطلوبة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Staff Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">معلومات الموظف</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-end gap-2">
                      <FormField
                        control={form.control}
                        name="national_id"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel>رقم البطاقة الوطنية</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل رقم البطاقة الوطنية"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        className="mb-2"
                        onClick={() => handleSearchStaff(form.getValues("national_id"))}
                        disabled={searchLoading}
                      >
                        {searchLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : "بحث"}
                      </Button>
                    </div>

                    <FormField
                      control={form.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="الاسم الكامل"
                              {...field}
                            />
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
                            <Input
                              placeholder="رقم الهاتف"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div>
                      <FormField
                        control={form.control}
                        name="roles"
                        render={() => (
                          <FormItem>
                            <FormLabel>المهام المكلف بها</FormLabel>
                            <div className="space-y-2">
                              {availableRoles.map((role) => (
                                <div key={role.id} className="flex flex-col space-y-2">
                                  <div className="flex items-center space-x-2 space-x-reverse">
                                    <Checkbox
                                      id={`role-${role.id}`}
                                      checked={selectedRoles.includes(role.id)}
                                      onCheckedChange={() => toggleRole(role.id)}
                                    />
                                    <label
                                      htmlFor={`role-${role.id}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mr-2"
                                    >
                                      {role.label}
                                    </label>
                                  </div>
                                  
                                  {selectedRoles.includes(role.id) && (
                                    <FormField
                                      control={form.control}
                                      name={`deputies.${role.id}`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="mr-6">النائب عن {role.label}</FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder={`أدخل اسم النائب عن ${role.label}`}
                                              {...field}
                                              value={field.value || ""}
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="mosque_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>المسجد المكلف به</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="المسجد المكلف به"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Leave Details */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">تفاصيل الإجازة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="travel_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>نوع السفر</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر نوع السفر" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="داخل الوطن">داخل الوطن</SelectItem>
                              <SelectItem value="خارج الوطن">خارج الوطن</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Dynamic Country Field - Only appears when "خارج الوطن" is selected */}
                    {watchTravelType === "خارج الوطن" && (
                      <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>الدولة</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="أدخل اسم الدولة"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>من تاريخ</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`pl-3 text-right font-normal ${
                                      !field.value && "text-muted-foreground"
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: ar })
                                    ) : (
                                      <span>اختر تاريخ</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  locale={ar}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>إلى تاريخ</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`pl-3 text-right font-normal ${
                                      !field.value && "text-muted-foreground"
                                    }`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP", { locale: ar })
                                    ) : (
                                      <span>اختر تاريخ</span>
                                    )}
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                  locale={ar}
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>السبب</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="سبب طلب الإجازة"
                              className="h-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Leave Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">ملخص الإجازة</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm font-medium">عدد الأيام المطلوبة</p>
                      <p className="text-2xl font-bold">{daysCount || 0}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm font-medium">عدد الأيام السابقة</p>
                      <p className="text-2xl font-bold">{previousDays}</p>
                    </div>
                    <div className="p-4 bg-muted rounded-md">
                      <p className="text-sm font-medium">المجموع السنوي</p>
                      <p className="text-2xl font-bold">{(daysCount || 0) + previousDays}</p>
                    </div>
                  </div>

                  {exceedsLimit && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>تنبيه</AlertTitle>
                      <AlertDescription>
                        مجموع أيام الإجازة يتجاوز الحد المسموح به (20 يومًا). يرجى مراجعة طلبك.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => form.reset()}>إلغاء</Button>
                  <Button type="submit" disabled={loading || exceedsLimit}>
                    {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    تقديم الطلب
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
