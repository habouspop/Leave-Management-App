// src/pages/SignUp.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function SignUp() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      toast.error("فشل التسجيل: " + error.message);
    } else {
      toast.success("تم إنشاء الحساب! تحقق من بريدك الإلكتروني للتفعيل.");
      navigate("/login");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">إنشاء حساب جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
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
              {loading ? "جاري التسجيل..." : "إنشاء الحساب"}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm">
            لديك حساب؟{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:underline"
            >
              تسجيل الدخول
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
