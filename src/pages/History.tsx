import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { LeaveRequest } from "@/lib/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase, TABLES } from "@/lib/supabase";

export default function History() {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [requestToDelete, setRequestToDelete] = useState<string | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch leave requests from Supabase
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from(TABLES.LEAVE_REQUESTS)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Transform data to match our LeaveRequest type
          const formattedData: LeaveRequest[] = data.map(item => ({
            id: item.id,
            national_id: item.national_id,
            travel_type: item.travel_type,
            start_date: item.start_date,
            end_date: item.end_date,
            days_count: item.days_count,
            reason: item.reason,
            status: item.status,
            admin_notes: item.admin_notes,
            created_at: item.created_at,
            updated_at: item.updated_at
          }));
          setRequests(formattedData);
        }
      } catch (err) {
        console.error('Error fetching leave requests:', err);
        setError('حدث خطأ أثناء جلب البيانات. الرجاء المحاولة مرة أخرى.');
        
        // Fallback to mock data if there's an error
        setRequests([
          {
            id: "1",
            national_id: "A123456",
            travel_type: "داخل الوطن",
            start_date: "2023-07-10",
            end_date: "2023-07-15",
            days_count: 6,
            reason: "زيارة عائلية",
            status: "approved",
            admin_notes: "موافقة",
            created_at: "2023-06-15",
            updated_at: "2023-06-20"
          },
          {
            id: "2",
            national_id: "B789012",
            travel_type: "خارج الوطن",
            start_date: "2023-08-05",
            end_date: "2023-08-15",
            days_count: 11,
            reason: "سفر للعمرة",
            status: "pending",
            created_at: "2023-07-20",
            updated_at: "2023-07-20"
          },
          {
            id: "3",
            national_id: "C345678",
            travel_type: "داخل الوطن",
            start_date: "2023-09-01",
            end_date: "2023-09-05",
            days_count: 5,
            reason: "ظروف خاصة",
            status: "rejected",
            admin_notes: "تجاوز الحد المسموح",
            created_at: "2023-08-15",
            updated_at: "2023-08-18"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaveRequests();
  }, []);

  // Function to handle deleting a leave request
  const deleteRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.LEAVE_REQUESTS)
        .delete()
        .eq('id', id);
      
      if (error) {
        if (error.code === "42501") {
          // Permission denied error (RLS policy restriction)
          toast.error("لا يمكن حذف هذا الطلب. قد يكون تمت الموافقة عليه بالفعل أو ليس لديك الصلاحيات المطلوبة.");
        } else {
          console.error('Error deleting leave request:', error);
          toast.error("حدث خطأ أثناء محاولة حذف الطلب. يرجى المحاولة مرة أخرى.");
        }
        return;
      }
      
      // Update local state after successful deletion
      setRequests(prevRequests => prevRequests.filter(request => request.id !== id));
      toast.success("تم حذف طلب الإجازة بنجاح");
    } catch (err) {
      console.error('Error deleting leave request:', err);
      toast.error("حدث خطأ أثناء محاولة حذف الطلب. يرجى المحاولة مرة أخرى.");
    } finally {
      setRequestToDelete(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    // Filter by status
    if (filter !== "all" && request.status !== filter) return false;
    
    // Filter by search term
    if (searchTerm && !request.national_id.includes(searchTerm)) return false;
    
    return true;
  });

  function formatDate(dateString: string) {
    const date = new Date(dateString);
    return format(date, "PPP", { locale: ar });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "approved":
        return <Badge className="bg-green-500">تمت الموافقة</Badge>;
      case "rejected":
        return <Badge variant="destructive">مرفوض</Badge>;
      case "pending":
        return <Badge variant="outline">قيد المراجعة</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">سجل الطلبات</h2>
          <p className="text-muted-foreground">
            عرض وتتبع جميع طلبات الإجازة السابقة
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>الطلبات السابقة</CardTitle>
            <CardDescription>
              يمكنك البحث وتصفية الطلبات حسب الحالة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/3">
                <Input
                  placeholder="البحث برقم البطاقة الوطنية..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-1/3">
                <Select
                  value={filter}
                  onValueChange={setFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="تصفية حسب الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الطلبات</SelectItem>
                    <SelectItem value="pending">قيد المراجعة</SelectItem>
                    <SelectItem value="approved">تمت الموافقة</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableCaption>قائمة بجميع طلبات الإجازة السابقة.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>رقم البطاقة</TableHead>
                  <TableHead>نوع السفر</TableHead>
                  <TableHead>من تاريخ</TableHead>
                  <TableHead>إلى تاريخ</TableHead>
                  <TableHead>الأيام</TableHead>
                  <TableHead>حالة الطلب</TableHead>
                  <TableHead>تاريخ الطلب</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>{request.id}</TableCell>
                      <TableCell>{request.national_id}</TableCell>
                      <TableCell>{request.travel_type}</TableCell>
                      <TableCell>{formatDate(request.start_date)}</TableCell>
                      <TableCell>{formatDate(request.end_date)}</TableCell>
                      <TableCell>{request.days_count}</TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{formatDate(request.created_at)}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button variant="ghost" size="sm">التفاصيل</Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rtl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                              <AlertDialogDescription>
                                هل أنت متأكد من رغبتك في حذف طلب الإجازة هذا؟ لا يمكن التراجع عن هذا الإجراء.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>إلغاء</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteRequest(request.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                حذف
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      لا توجد طلبات متطابقة مع معايير البحث
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}