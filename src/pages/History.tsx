import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Search, FileText, Loader2 } from "lucide-react";
import { LeaveRequest } from "@/lib/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { supabase, TABLES } from "@/lib/supabase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");
  const [pendingRequests, setPendingRequests] = useState<LeaveRequest[]>([]);
  const [processedRequests, setProcessedRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch leave requests from Supabase
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all leave requests
        const { data, error } = await supabase
          .from(TABLES.LEAVE_REQUESTS)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        if (data) {
          // Transform data to match our LeaveRequest type
          const formattedData = data.map(item => ({
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

          // Separate pending and processed requests
          const pending = formattedData.filter(req => req.status === 'pending');
          const processed = formattedData.filter(req => req.status !== 'pending');

          setPendingRequests(pending);
          setProcessedRequests(processed);
        }
      } catch (err) {
        console.error('Error fetching leave requests:', err);
        setError('حدث خطأ أثناء جلب البيانات. الرجاء المحاولة مرة أخرى.');
        
        // Fallback to mock data
        setPendingRequests([
          {
            id: "1",
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
            id: "2",
            national_id: "D567890",
            travel_type: "داخل الوطن",
            start_date: "2023-09-20",
            end_date: "2023-09-25",
            days_count: 6,
            reason: "ظروف عائلية",
            status: "pending",
            created_at: "2023-09-10",
            updated_at: "2023-09-10"
          }
        ]);
        
        setProcessedRequests([
          {
            id: "3",
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
            id: "4",
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

  // Filter requests based on search term
  const filteredPendingRequests = pendingRequests.filter(request => {
    return searchTerm ? request.national_id.includes(searchTerm) : true;
  });

  const filteredProcessedRequests = processedRequests.filter(request => {
    return searchTerm ? request.national_id.includes(searchTerm) : true;
  });

  // Format date for display
  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return format(date, "PPP", { locale: ar });
    } catch (error) {
      return dateString;
    }
  }

  // Get status badge
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

  // Handle approve request
  const handleApprove = async () => {
    if (!selectedRequest) return;
    
    try {
      setActionLoading(true);
      
      // Update request status in Supabase
      const { error } = await supabase
        .from(TABLES.LEAVE_REQUESTS)
        .update({
          status: 'approved',
          admin_notes: approvalNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);
      
      if (error) {
        console.error('Error approving leave request:', error);
        toast.error("حدث خطأ أثناء الموافقة على الطلب. الرجاء المحاولة مرة أخرى.");
        return;
      }
      
      toast.success("تمت الموافقة على طلب الإجازة بنجاح");
      
      // Update local state
      const updatedRequest = {
        ...selectedRequest,
        status: 'approved',
        admin_notes: approvalNote,
        updated_at: new Date().toISOString()
      };
      
      setPendingRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setProcessedRequests(prev => [updatedRequest, ...prev]);
      
      // Close dialog and reset state
      setSelectedRequest(null);
      setApprovalNote("");
    } catch (err) {
      console.error('Error in approval process:', err);
      toast.error("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle reject request
  const handleReject = async () => {
    if (!selectedRequest) return;
    
    try {
      setActionLoading(true);
      
      // Update request status in Supabase
      const { error } = await supabase
        .from(TABLES.LEAVE_REQUESTS)
        .update({
          status: 'rejected',
          admin_notes: approvalNote,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedRequest.id);
      
      if (error) {
        console.error('Error rejecting leave request:', error);
        toast.error("حدث خطأ أثناء رفض الطلب. الرجاء المحاولة مرة أخرى.");
        return;
      }
      
      toast.success("تم رفض طلب الإجازة بنجاح");
      
      // Update local state
      const updatedRequest = {
        ...selectedRequest,
        status: 'rejected',
        admin_notes: approvalNote,
        updated_at: new Date().toISOString()
      };
      
      setPendingRequests(prev => prev.filter(req => req.id !== selectedRequest.id));
      setProcessedRequests(prev => [updatedRequest, ...prev]);
      
      // Close dialog and reset state
      setSelectedRequest(null);
      setApprovalNote("");
    } catch (err) {
      console.error('Error in rejection process:', err);
      toast.error("حدث خطأ غير متوقع. الرجاء المحاولة مرة أخرى.");
    } finally {
      setActionLoading(false);
    }
  };

  // View request details
  const viewRequestDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setApprovalNote(""); // Reset notes when viewing a new request
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">لوحة الإدارة</h2>
          <p className="text-muted-foreground">
            إدارة ومراجعة طلبات الإجازات
          </p>
        </div>

        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input 
            type="search" 
            placeholder="بحث برقم البطاقة الوطنية..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Button type="submit" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="pending">طلبات قيد المراجعة</TabsTrigger>
            <TabsTrigger value="processed">طلبات تمت معالجتها</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>طلبات قيد المراجعة</CardTitle>
                <CardDescription>
                  مراجعة والموافقة على طلبات الإجازة المعلقة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                  </div>
                ) : (
                  <Table>
                    <TableCaption>قائمة بجميع طلبات الإجازة المعلقة.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>رقم البطاقة</TableHead>
                        <TableHead>نوع السفر</TableHead>
                        <TableHead>من تاريخ</TableHead>
                        <TableHead>إلى تاريخ</TableHead>
                        <TableHead>الأيام</TableHead>
                        <TableHead>تاريخ الطلب</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPendingRequests.length > 0 ? (
                        filteredPendingRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.id}</TableCell>
                            <TableCell>{request.national_id}</TableCell>
                            <TableCell>{request.travel_type}</TableCell>
                            <TableCell>{formatDate(request.start_date)}</TableCell>
                            <TableCell>{formatDate(request.end_date)}</TableCell>
                            <TableCell>{request.days_count}</TableCell>
                            <TableCell>{formatDate(request.created_at)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => viewRequestDetails(request)}
                              >
                                <FileText className="h-4 w-4 mr-1" /> عرض
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-10">
                            لا توجد طلبات معلقة
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="processed">
            <Card>
              <CardHeader>
                <CardTitle>طلبات تمت معالجتها</CardTitle>
                <CardDescription>
                  استعراض جميع طلبات الإجازة التي تمت معالجتها
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : error ? (
                  <div className="p-4 bg-red-50 text-red-700 rounded-md">
                    {error}
                  </div>
                ) : (
                  <Table>
                    <TableCaption>قائمة بجميع طلبات الإجازة التي تمت معالجتها.</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الطلب</TableHead>
                        <TableHead>رقم البطاقة</TableHead>
                        <TableHead>نوع السفر</TableHead>
                        <TableHead>من تاريخ</TableHead>
                        <TableHead>إلى تاريخ</TableHead>
                        <TableHead>الأيام</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ المعالجة</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcessedRequests.length > 0 ? (
                        filteredProcessedRequests.map((request) => (
                          <TableRow key={request.id}>
                            <TableCell>{request.id}</TableCell>
                            <TableCell>{request.national_id}</TableCell>
                            <TableCell>{request.travel_type}</TableCell>
                            <TableCell>{formatDate(request.start_date)}</TableCell>
                            <TableCell>{formatDate(request.end_date)}</TableCell>
                            <TableCell>{request.days_count}</TableCell>
                            <TableCell>{getStatusBadge(request.status)}</TableCell>
                            <TableCell>{formatDate(request.updated_at)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => viewRequestDetails(request)}
                              >
                                <FileText className="h-4 w-4 mr-1" /> عرض
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-10">
                            لا توجد طلبات تمت معالجتها
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Request Details Dialog */}
        {selectedRequest && (
          <Dialog open={!!selectedRequest} onOpenChange={(open) => !open && setSelectedRequest(null)}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>تفاصيل طلب الإجازة #{selectedRequest.id}</DialogTitle>
                <DialogDescription>
                  معلومات تفصيلية عن الطلب
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">رقم البطاقة</p>
                    <p>{selectedRequest.national_id}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">نوع السفر</p>
                    <p>{selectedRequest.travel_type}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">من تاريخ</p>
                    <p>{formatDate(selectedRequest.start_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">إلى تاريخ</p>
                    <p>{formatDate(selectedRequest.end_date)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">عدد الأيام</p>
                    <p>{selectedRequest.days_count}</p>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">سبب الإجازة</p>
                  <p className="p-3 bg-muted rounded-md">{selectedRequest.reason}</p>
                </div>
                
                {selectedRequest.status !== "pending" && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">ملاحظات الإدارة</p>
                    <p className="p-3 bg-muted rounded-md">{selectedRequest.admin_notes || "لا توجد ملاحظات"}</p>
                  </div>
                )}
                
                {selectedRequest.status === "pending" && (
                  <div className="space-y-1">
                    <label htmlFor="approval_note" className="text-sm font-medium">
                      ملاحظات الموافقة / الرفض
                    </label>
                    <Textarea
                      id="approval_note"
                      placeholder="أدخل ملاحظات إضافية هنا..."
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                    />
                  </div>
                )}
              </div>
              
              <DialogFooter>
                {selectedRequest.status === "pending" ? (
                  <div className="flex space-x-2 space-x-reverse rtl:space-x-reverse">
                    <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                      إلغاء
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <X className="h-4 w-4 mr-2" />
                      )}
                      رفض
                    </Button>
                    <Button 
                      variant="default" 
                      onClick={handleApprove}
                      disabled={actionLoading}
                    >
                      {actionLoading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 mr-2" />
                      )}
                      موافقة
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" onClick={() => setSelectedRequest(null)}>
                    إغلاق
                  </Button>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </MainLayout>
  );
}
