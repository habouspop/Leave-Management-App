import { useState } from "react";
import { supabase, TABLES } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { toast } from "sonner";
import { MainLayout } from "@/components/layout/main-layout";

export default function AddStaff() {
  const [nationalId, setNationalId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState("");
  const [mosqueName, setMosqueName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nationalId || !fullName || !phoneNumber || !role || !mosqueName) {
      toast.error("يرجى ملء جميع الحقول");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from(TABLES.STAFF)
        .insert([
          {
            id: uuidv4(),
            national_id: nationalId,
            full_name: fullName,
            phone_number: phoneNumber,
            role,
            mosque_name: mosqueName,
            // حذف user_id نهائيًا
          },
        ]);

      if (error) {
        toast.error("خطأ في الإضافة: " + error.message);
      } else {
        toast.success("تمت إضافة الموظف بنجاح");
        setNationalId("");
        setFullName("");
        setPhoneNumber("");
        setRole("");
        setMosqueName("");
      }
    } catch (e) {
      toast.error("حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-md mx-auto bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-2xl font-bold text-center mb-4">إضافة موظف جديد</h2>

        <input
          type="text"
          placeholder="رقم البطاقة الوطنية"
          value={nationalId}
          onChange={(e) => setNationalId(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <input
          type="text"
          placeholder="الاسم الكامل"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <input
          type="text"
          placeholder="رقم الهاتف"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <input
          type="text"
          placeholder="المهمة (خطيب، إمام، مؤذن)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <input
          type="text"
          placeholder="المسجد المكلف به"
          value={mosqueName}
          onChange={(e) => setMosqueName(e.target.value)}
          className="border rounded px-3 py-2 w-full"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="bg-primary text-white px-4 py-2 rounded w-full mt-4 hover:bg-primary/90 transition"
        >
          {loading ? "جارٍ الإضافة..." : "إضافة الموظف"}
        </button>
      </div>
    </MainLayout>
  );
}
