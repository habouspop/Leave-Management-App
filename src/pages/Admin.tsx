import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Check, X, Search, FileText } from "lucide-react";
import { useState } from "react";
import { LeaveRequest } from "@/lib/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function Admin() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [approvalNote, setApprovalNote] = useState("");

  // This would be connected to real data once Supabase is properly connected
 

  const filteredPendingRequests = mockPendingRequests.filter(request => {
    return searchTerm ? request.national_id.includes(searchTerm) : true;
  });

  const filteredProcessedRequests = mockProcessedRequests.filter(request => {
    return searchTerm ? request.national_id.includes(searchTerm) : true;
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

  const handleApprove = () => {
    if (!selectedRequest) return;
    
    // This would connect to Supabase to update the request status
    alert(`تمت الموافقة على الطلب رقم ${selectedRequest.id} مع ملاحظة: ${approvalNote}`);
    setSelectedRequest(null);
    setApprovalNote("");
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    
    // This would connect to Supabase to update the request status
    alert(`تم رفض الطلب رقم ${selectedRequest.id} مع ملاحظة: ${approvalNote}`);
    setSelectedRequest(null);
    setApprovalNote("");
  };

  const viewRequestDetails = (request: LeaveRequest) => {
    setSelectedRequest(request);
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
                    <Button variant="destructive" onClick={handleReject}>
                      <X className="h-4 w-4 mr-2" /> رفض
                    </Button>
                    <Button variant="default" onClick={handleApprove}>
                      <Check className="h-4 w-4 mr-2" /> موافقة
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
