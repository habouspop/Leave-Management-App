import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xehgqqgnxaaoeykyfxrr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhlaGdxcWdueGFhb2V5a3lmeHJyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3NTU5OTgsImV4cCI6MjA2ODMzMTk5OH0.8jotMbvfytB_BUYBE0vg3hldKNza7GcV4d5lrZO6IGk';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Table names with app prefix
const APP_ID = '898addec89d545269726d3424da4f59d';
export const TABLES = {
  STAFF: `app_${APP_ID}_staff`,
  LEAVE_REQUESTS: `app_${APP_ID}_leave_requests`,
  ANNUAL_LEAVE_SUMMARY: `app_${APP_ID}_annual_leave_summary`,
};