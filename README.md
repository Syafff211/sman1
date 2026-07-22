# X-5 SMAN 1 Purbalingga - Static Version

Platform manajemen kelas digital - versi HTML/CSS/JS murni.
Tanpa framework, tanpa build step, langsung jalan!

## 📁 Struktur File

```
x5-static/
├── index.html              ← Landing page
├── auth/
│   ├── login.html          ← Login siswa
│   └── admin.html          ← Login admin
├── admin/
│   └── index.html          ← Admin panel (SPA)
├── dashboard/
│   └── index.html          ← Dashboard siswa (SPA)
├── css/
│   └── style.css           ← Semua CSS
├── js/
│   ├── config.js           ← Supabase credentials
│   ├── auth.js             ← Auth helpers
│   ├── admin-app.js        ← Admin panel logic
│   └── student-app.js      ← Student dashboard logic
└── vercel.json             ← Vercel routing config
```

## 🚀 Cara Deploy ke Vercel

### Step 1: Setup Database

Jalankan SQL ini di **Supabase → SQL Editor**:

```sql
-- Fix admin role
UPDATE profiles SET role = 'admin', full_name = 'Super Admin' 
WHERE email = 'admin@x5sman1.com';

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
('profile-images', 'profile-images', true),
('gallery', 'gallery', true),
('materials', 'materials', true),
('assignments', 'assignments', true),
('medical-certificates', 'medical-certificates', false),
('landing-assets', 'landing-assets', true)
ON CONFLICT (id) DO NOTHING;
```

### Step 2: Upload ke GitHub

1. Buat repo baru di GitHub (misalnya: `x5-sman1-static`)
2. Upload semua file di folder `x5-static/` ke repo
3. **PENTING**: Pastikan file `js/config.js` sudah berisi Supabase credentials kamu

### Step 3: Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com)
2. Import repo GitHub
3. **Framework Preset**: `Other` (bukan Next.js!)
4. **Root Directory**: `./` (kosongkan saja)
5. Klik **Deploy**

### Step 4: Akses Website

- Landing page: `https://your-domain.vercel.app`
- Login siswa: `https://your-domain.vercel.app/auth/login.html`
- Login admin: `https://your-domain.vercel.app/auth/admin.html`

## 🔑 Default Login

### Admin
- URL: `/auth/admin.html`
- Email: `admin@x5sman1.com`
- Password: `admin123`

### Siswa
- URL: `/auth/login.html`
- Email: (email siswa yang sudah didaftarkan admin)
- Password: (password yang di-set)

## 🎯 Fitur

### Landing Page
- Hero section dengan animated gradient orbs
- About (Visi, Misi, Motto)
- Statistics
- Class Officers
- Gallery
- Contact
- Footer

### Admin Panel
- Dashboard dengan statistik
- Kelola Siswa (CRUD)
- Kelola Kehadiran (bulk attendance)
- Kelola Tugas (CRUD)
- Kelola Nilai (input nilai)
- Kelola Materi (CRUD)
- Kelola Pengumuman (CRUD + Pin)
- Kelola Galeri
- Kelola Kalender/Event

### Dashboard Siswa
- Dashboard dengan ringkasan
- Lihat kehadiran & statistik
- Lihat tugas
- Lihat materi
- Lihat nilai & rata-rata
- Lihat pengumuman
- Lihat galeri
- Lihat jadwal/event
- Lihat profil

## 🎨 Design

- Dark theme luxury
- Glassmorphism cards
- Responsive (mobile-first)
- Sidebar navigation
- Toast notifications
- Modal dialogs
- Loading spinners

## 📱 Responsive

- Desktop: Sidebar tetap (260px)
- Tablet: Grid 2 kolom
- Mobile: Sidebar slide-in, grid 1 kolom

## 🔒 Security

- Supabase Auth (JWT)
- Row Level Security (RLS)
- Admin login separate dari student login
- Force role update saat login

## ⚡ Performance

- Zero build step
- No framework overhead
- CDN-served static files
- Supabase JS SDK dari CDN
- Google Fonts (Inter)

## 🛠️ Tech Stack

- HTML5
- CSS3 (custom, no framework)
- Vanilla JavaScript
- Supabase (Auth, Database, Storage)
- Vercel (Hosting)

---

Made with ❤️ by Kelas X-5 SMAN 1 Purbalingga
