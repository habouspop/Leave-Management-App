import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import { FileText, Printer } from "lucide-react";

export default function Print() {
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Mock documents available for printing
  const documents = [
    { id: 1, title: "شهادة عمل", description: "شهادة تثبت العمل في المؤسسة الدينية" },
    { id: 2, title: "إشعار إجازة", description: "وثيقة رسمية تفيد الموافقة على الإجازة" },
    { id: 3, title: "مذكرة استئناف عمل", description: "وثيقة لتأكيد العودة بعد الإجازة" },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!nationalId) {
      setError("الرجاء إدخال رقم البطاقة الوطنية");
      return;
    }
    
    // This would connect to Supabase to verify the staff exists
    if (nationalId === "A123456" || nationalId === "B789012") {
      setError("");
      setSearchPerformed(true);
    } else {
      setError("لم يتم العثور على سجل لهذا الرقم");
      setSearchPerformed(false);
    }
  };

  const handlePrint = (documentId: number) => {
    // This would connect to Supabase to generate the actual document
    alert(`جاري تحضير المستند رقم ${documentId} للطباعة`);
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">طباعة الوثائق</h2>
          <p className="text-muted-foreground">
            طباعة الوثائق والشهادات الرسمية
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>طلب وثيقة</CardTitle>
            <CardDescription>
              أدخل رقم البطاقة الوطنية للموظف للبحث عن الوثائق المتاحة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <label htmlFor="national_id" className="block text-sm font-medium mb-2">
                    رقم البطاقة الوطنية
                  </label>
                  <Input
                    id="national_id"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="أدخل رقم البطاقة الوطنية"
                  />
                </div>
                <Button type="submit">بحث</Button>
              </div>
              
              {error && <p className="text-destructive text-sm">{error}</p>}
            </form>
            
            {searchPerformed && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-4">الوثائق المتاحة للطباعة</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {documents.map((doc) => (
                    <Card key={doc.id}>
                      <CardContent className="p-5">
                        <div className="flex justify-center mb-4">
                          <FileText className="h-10 w-10 text-primary" />
                        </div>
                        <h4 className="font-medium text-center mb-2">{doc.title}</h4>
                        <p className="text-sm text-muted-foreground text-center mb-4">
                          {doc.description}
                        </p>
                        <Button 
                          onClick={() => handlePrint(doc.id)} 
                          className="w-full"
                          variant="outline"
                        >
                          <Printer className="h-4 w-4 mr-2" /> طباعة
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}