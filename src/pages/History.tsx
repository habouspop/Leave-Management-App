import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormEvent, useState } from "react";
import { FileText, Printer, Loader2 } from "lucide-react";
import { supabase, TABLES } from "@/lib/supabase";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function Print() {
  const [nationalId, setNationalId] = useState("");
  const [error, setError] = useState("");
  const [searchPerformed, setSearchPerformed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [printLoading, setPrintLoading] = useState<number | null>(null);
  const [staffName, setStaffName] = useState("");

  // Documents available for printing
  const documents = [
    { id: 1, title: "شهادة عمل", description: "شهادة تثبت العمل في المؤسسة الدينية" },
    { id: 2, title: "إشعار إجازة", description: "وثيقة رسمية تفيد الموافقة على الإجازة" },
    { id: 3, title: "مذكرة استئناف عمل", description: "وثيقة لتأكيد العودة بعد الإجازة" },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!nationalId) {
      setError("الرجاء إدخال رقم البطاقة الوطنية");
      return;
    }
    
    try {
      setLoading(true);
      setError("");
      
      // Search for staff in Supabase
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .select('*')
        .eq('national_id', nationalId)
        .single();
      
      if (error) {
        console.error('Error searching for staff:', error);
        setError("لم يتم العثور على سجل لهذا الرقم");
        setSearchPerformed(false);
        setStaffName("");
        return;
      }
      
      if (data) {
        setSearchPerformed(true);
        setStaffName(data.full_name);
        toast.success("تم العثور على بيانات الموظف بنجاح");
      } else {
        setError("لم يتم العثور على سجل لهذا الرقم");
        setSearchPerformed(false);
        setStaffName("");
      }
    } catch (err) {
      console.error('Error during staff search:', err);
      setError("حدث خطأ أثناء البحث. الرجاء المحاولة مرة أخرى.");
      setSearchPerformed(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async (documentId: number) => {
    try {
      setPrintLoading(documentId);
      
      // Log document request in Supabase
      const { error } = await supabase
        .from(TABLES.DOCUMENT_REQUESTS)
        .insert([{
          national_id: nationalId,
          document_type: documents.find(d => d.id === documentId)?.title || "",
          status: "printed"
        }]);
      
      if (error) {
        console.error('Error logging document print:', error);
        toast.error("حدث خطأ أثناء طلب المستند");
        return;
      }
      
      // Simulate document generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate document content based on document type and staff info
      let documentContent = "";
      const docType = documents.find(d => d.id === documentId)?.title;
      const currentDate = new Date().toLocaleDateString('ar-SA');
      
      if (docType === "شهادة عمل") {
        documentContent = `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a;">شهادة عمل</h1>
              <p>وزارة الأوقاف والشؤون الإسلامية</p>
            </div>
            
            <p>تشهد وزارة الأوقاف والشؤون الإسلامية بأن السيد ${staffName} يعمل لديها بصفة موظف ديني.</p>
            
            <p>رقم البطاقة الوطنية: ${nationalId}</p>
            <p>منذ تاريخ: 01/01/2020</p>
            
            <p>حررت هذه الشهادة بناءً على طلب المعني بالأمر للإدلاء بها عند الحاجة.</p>
            
            <div style="margin-top: 50px; text-align: left;">
              <p>حرر بتاريخ: ${currentDate}</p>
              <p>توقيع المسؤول:</p>
              <div style="margin-top: 15px; border-bottom: 1px solid #000; width: 200px;"></div>
            </div>
          </div>
        `;
      } else if (docType === "إشعار إجازة") {
        documentContent = `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a;">إشعار إجازة</h1>
              <p>وزارة الأوقاف والشؤون الإسلامية</p>
            </div>
            
            <p>هذه الوثيقة تشهد بأن السيد ${staffName} قد تمت الموافقة على إجازته.</p>
            
            <p>رقم البطاقة الوطنية: ${nationalId}</p>
            <p>فترة الإجازة: من تاريخ __/__/____ إلى تاريخ __/__/____</p>
            <p>عدد أيام الإجازة: ___</p>
            
            <div style="margin-top: 50px; text-align: left;">
              <p>حرر بتاريخ: ${currentDate}</p>
              <p>توقيع المسؤول:</p>
              <div style="margin-top: 15px; border-bottom: 1px solid #000; width: 200px;"></div>
            </div>
          </div>
        `;
      } else if (docType === "مذكرة استئناف عمل") {
        documentContent = `
          <div dir="rtl" style="font-family: Arial, sans-serif; padding: 40px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a1a;">مذكرة استئناف عمل</h1>
              <p>وزارة الأوقاف والشؤون الإسلامية</p>
            </div>
            
            <p>نشهد بأن السيد ${staffName} قد استأنف عمله بعد انتهاء إجازته.</p>
            
            <p>رقم البطاقة الوطنية: ${nationalId}</p>
            <p>تاريخ استئناف العمل: ${currentDate}</p>
            
            <div style="margin-top: 50px; text-align: left;">
              <p>حرر بتاريخ: ${currentDate}</p>
              <p>توقيع المسؤول:</p>
              <div style="margin-top: 15px; border-bottom: 1px solid #000; width: 200px;"></div>
            </div>
          </div>
        `;
      }
      
      // Print document
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${docType} - ${staffName}</title>
              <style>
                @media print {
                  body { margin: 0; }
                }
              </style>
            </head>
            <body>
              ${documentContent}
              <script>
                window.onload = function() {
                  window.print();
                  setTimeout(function() { window.close(); }, 500);
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
      
      toast.success("تم إنشاء المستند بنجاح");
    } catch (err) {
      console.error('Error generating document:', err);
      toast.error("حدث خطأ أثناء إنشاء المستند");
    } finally {
      setPrintLoading(null);
    }
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
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : "بحث"}
                </Button>
              </div>
              
              {error && <p className="text-destructive text-sm">{error}</p>}
            </form>
            
            {loading ? (
              <div className="mt-8 space-y-4">
                <h3 className="text-lg font-medium mb-4">جاري البحث...</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              </div>
            ) : searchPerformed && (
              <div className="mt-8">
                <h3 className="text-lg font-medium mb-1">الوثائق المتاحة للطباعة</h3>
                <p className="text-sm text-muted-foreground mb-4">للموظف: {staffName}</p>
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
                          disabled={printLoading === doc.id}
                        >
                          {printLoading === doc.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Printer className="h-4 w-4 mr-2" />
                          )}
                          طباعة
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
