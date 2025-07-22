// src/hooks/useRequireAuth.ts
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export function useRequireAuth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/login");
      } else {
        setLoading(false);
      }
    });
  }, [navigate]);

  return { loading };
}
