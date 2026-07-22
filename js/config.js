// ===== SUPABASE CONFIG =====
// GANTI DENGAN CREDENTIALS SUPABASE KAMU
const SUPABASE_URL = 'https://qmawtxbvjkhmqgnbbscv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtYXd0eGJ2amtobXFnbmJic2N2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjQyNDYsImV4cCI6MjEwMDIwMDI0Nn0.jW2nAt-uKFQpOsPGdLh6vg2Pw_GqzvYp29YI_bI7klM';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
