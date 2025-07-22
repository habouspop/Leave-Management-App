// src/pages/Login.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast.error("فشل تسجيل الدخول: " + error.message);
    } else if (data?.user) {
      toast.success("تم تسجيل الدخول بنجاح!");
      navigate("/");  // توجه للرئيسية أو أي صفحة محمية
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">تسجيل الدخول</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block mb-1 text-sm font-medium">البريد الإلكتروني</label>
              <Input
                type="email"
                placeholder="example@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm font-medium">كلمة المرور</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            لا تملك حساب؟{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-blue-600 hover:underline"
            >
              إنشاء حساب
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
