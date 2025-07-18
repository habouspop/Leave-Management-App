// Type definitions for the leave management system

export type Staff = {
  id: number;
  national_id: string;
  full_name: string;
  phone_number: string;
  role: string;
  mosque_name: string;
  created_at: string;
};

export type LeaveRequest = {
  id: string;
  national_id: string;
  travel_type: "داخل الوطن" | "خارج الوطن";
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
};

export type AdminUser = {
  id: number;
  email: string;
  name: string;
  role: string;
  created_at: string;
};

export type AnnualLeaveSummary = {
  national_id: string;
  year: number;
  total_days: number;
};

// Form submission types
export type RoleType = "خطيب" | "إمام" | "مؤذن";

export type LeaveRequestFormData = {
  national_id: string;
  full_name: string;
  phone_number: string;
  roles: RoleType[];
  deputies: {
    [key in RoleType]?: string;
  };
  mosque_name: string;
  travel_type: "داخل الوطن" | "خارج الوطن";
  country?: string; // Optional field for travel destination when outside the country
  start_date: Date;
  end_date: Date;
  reason: string;
};