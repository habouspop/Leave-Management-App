import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/main-layout";

export default function Dashboard() {
  // This would be connected to real data once Supabase is properly connected
  const stats = [
    {
      title: "الطلبات الجديدة",
      value: 5,
    },
    {
      title: "الطلبات الموافق عليها",
      value: 24,
    },
    {
      title: "الطلبات المرفوضة",
      value: 3,
    },
    {
      title: "مجموع الطلبات",
      value: 32,
    },
  ];

  return (
    <MainLayout>
      <div className="space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">مرحباً بك في نظام إدارة الإجازات</h2>
        <p className="text-muted-foreground">
          نظام إدارة إجازات العاملين الدينيين تحت إشراف وزارة الأوقاف والشؤون الإسلامية
        </p>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
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

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle>آخر الطلبات</CardTitle>
              <CardDescription>آخر 5 طلبات مقدمة في النظام</CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would be populated with real data */}
              <div className="text-center py-10 text-muted-foreground">
                سيتم عرض آخر الطلبات هنا بعد اتصال قاعدة البيانات
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>إحصائيات</CardTitle>
              <CardDescription>ملخص إجازات العام الحالي</CardDescription>
            </CardHeader>
            <CardContent>
              {/* This would be populated with real data */}
              <div className="text-center py-10 text-muted-foreground">
                سيتم عرض الإحصائيات هنا بعد اتصال قاعدة البيانات
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}