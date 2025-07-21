import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";
import { supabase, TABLES } from "@/lib/supabase";
import { LeaveRequest } from "@/lib/types";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    newRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalRequests: 0
  });
  const [recentRequests, setRecentRequests] = useState<LeaveRequest[]>([]);
  const [annualSummary, setAnnualSummary] = useState<{total: number}>({ total: 0 });
  
  // Fetch stats and recent requests from Supabase
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all leave requests to calculate stats
        const { data: leaveRequests, error: leaveRequestsError } = await supabase
          .from(TABLES.LEAVE_REQUESTS)
          .select('*');
        
        if (leaveRequestsError) throw leaveRequestsError;
        
        // Calculate stats
        if (leaveRequests) {
          const pending = leaveRequests.filter(req => req.status === 'pending').length;
          const approved = leaveRequests.filter(req => req.status === 'approved').length;
          const rejected = leaveRequests.filter(req => req.status === 'rejected').length;
          
          setStats({
            newRequests: pending,
            approvedRequests: approved,
            rejectedRequests: rejected,
            totalRequests: leaveRequests.length
          });
          
          // Get recent requests (latest 5)
          const recent = leaveRequests
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5)
            .map(item => ({
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
          
          setRecentRequests(recent);
          
          // Calculate total leave days in current year
          const currentYear = new Date().getFullYear();
          const userLeaveRequests = leaveRequests.filter(req => 
            req.status === 'approved' && 
            new Date(req.start_date).getFullYear() === currentYear
          );
          
          const totalDays = userLeaveRequests.reduce((total, req) => total + req.days_count, 0);
          setAnnualSummary({ total: totalDays });
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('حدث خطأ أثناء جلب البيانات. الرجاء المحاولة مرة أخرى.');
        
        // Fallback to mock data
        setStats({
          newRequests: 5,
          approvedRequests: 24,
          rejectedRequests: 3,
          totalRequests: 32
        });
        
        setAnnualSummary({ total: 15 });
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Format date for display
  function formatDate(dateString: string) {
    try {
      const date = new Date(dateString);
      return format(date, "PPP", { locale: ar });
    } catch (error) {
      return dateString;
    }
  }

  // Get status badge text in Arabic
  function getStatusText(status: string) {
    switch (status) {
      case "approved": return "تمت الموافقة";
      case "rejected": return "مرفوض";
      case "pending": return "قيد المراجعة";
      default: return status;
    }
  }

  // Create stats items from dynamic data
  const statsItems = [
    {
      title: "الطلبات الجديدة",
      value: stats.newRequests,
    },
    {
      title: "الطلبات الموافق عليها",
      value: stats.approvedRequests,
    },
    {
      title: "الطلبات المرفوضة",
      value: stats.rejectedRequests,
    },
    {
      title: "مجموع الطلبات",
      value: stats.totalRequests,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">مرحباً بك في نظام إدارة الإجازات</h2>
        <p className="text-muted-foreground">
          نظام إدارة إجازات العاملين الدينيين تحت إشراف وزارة الأوقاف والشؤون الإسلامية
        </p>

        {loading ? (
          // Loading state with skeletons
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-10" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          // Error state
          <div className="p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        ) : (
          // Success state with data
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statsItems.map((stat) => (
              <Card key={stat.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>آخر الطلبات</CardTitle>
              <CardDescription>آخر 5 طلبات مقدمة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-10 text-muted-foreground">
                  حدث خطأ أثناء جلب البيانات
                </div>
              ) : recentRequests.length > 0 ? (
                <div className="space-y-4">
                  {recentRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className="flex justify-between items-center p-2 border-b"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{request.national_id}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                      <div className="flex-1 text-right">
                        <span 
                          className={`text-sm px-2 py-1 rounded ${
                            request.status === 'approved' ? 'bg-green-100 text-green-700' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {getStatusText(request.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  لا توجد طلبات حتى الآن
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات</CardTitle>
              <CardDescription>ملخص إجازات العام الحالي</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-32 w-full" />
              ) : error ? (
                <div className="text-center py-10 text-muted-foreground">
                  حدث خطأ أثناء جلب البيانات
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center">
                    <span className="text-4xl font-bold">{annualSummary.total}</span>
                    <p className="text-sm text-muted-foreground">إجمالي أيام الإجازة</p>
                  </div>
                  <div className="bg-muted p-3 rounded-md">
                    <div className="flex justify-between">
                      <span className="text-sm">الإجازات المستخدمة</span>
                      <span className="font-medium">{annualSummary.total}/15</span>
                    </div>
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary"
                        style={{ width: `${Math.min((annualSummary.total / 15) * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
