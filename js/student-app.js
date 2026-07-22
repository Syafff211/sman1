// ===== STUDENT APP =====
let currentUser = null;
let currentProfile = null;
let activeTab = 'dashboard';

const menuItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'attendance', icon: '✅', label: 'Kehadiran' },
  { id: 'assignments', icon: '📝', label: 'Tugas' },
  { id: 'materials', icon: '📚', label: 'Materi' },
  { id: 'grades', icon: '🏆', label: 'Nilai' },
  { id: 'announcements', icon: '📢', label: 'Pengumuman' },
  { id: 'gallery', icon: '🖼️', label: 'Galeri' },
  { id: 'calendar', icon: '📅', label: 'Jadwal' },
  { id: 'profile', icon: '👤', label: 'Profil' },
];

async function init() {
  const auth = await checkAuth('student');
  if (!auth) return;
  currentUser = auth.user;
  currentProfile = auth.profile;
  document.getElementById('userName').textContent = currentProfile?.full_name || 'Siswa';
  document.getElementById('userAvatar').textContent = (currentProfile?.full_name || 'S').charAt(0);
  renderSidebar();
  navigate('dashboard');
  hideLoading();
}

function renderSidebar() {
  document.getElementById('sidebarNav').innerHTML = menuItems.map(item =>
    `<a href="#" onclick="navigate('${item.id}');return false" class="${activeTab===item.id?'active':''}" id="nav-${item.id}"><span>${item.icon}</span> ${item.label}</a>`
  ).join('');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function navigate(tab) {
  activeTab = tab;
  renderSidebar();
  document.getElementById('pageTitle').textContent = menuItems.find(m=>m.id===tab)?.label||tab;
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  const pages = { dashboard:renderDashboard, attendance:renderAttendance, assignments:renderAssignments, materials:renderMaterials, grades:renderGrades, announcements:renderAnnouncements, gallery:renderGallery, calendar:renderCalendar, profile:renderProfile };
  (pages[tab]||renderDashboard)();
}

// ===== DASHBOARD =====
async function renderDashboard() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const sid = currentProfile?.id;
  const [attRes, assignRes, gradeRes, annRes] = await Promise.all([
    db.from('attendance').select('status').eq('student_id', sid),
    db.from('assignments').select('*').order('due_date').limit(3),
    db.from('grades').select('score').eq('student_id', sid),
    db.from('announcements').select('*').order('created_at',{ascending:false}).limit(3),
  ]);

  const totalAtt = attRes.data?.length || 0;
  const presentCount = attRes.data?.filter(a => a.status === 'present').length || 0;
  const attPercent = totalAtt > 0 ? Math.round((presentCount/totalAtt)*100) : 0;
  const avgGrade = gradeRes.data?.length > 0 ? Math.round(gradeRes.data.reduce((s,g)=>s+g.score,0)/gradeRes.data.length) : 0;

  mc.innerHTML = `
    <div class="card mb-6" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1));border-color:rgba(99,102,241,0.2)">
      <h2 class="text-2xl font-bold mb-1">Selamat Datang, <span class="text-gradient">${currentProfile?.full_name || 'Siswa'}</span> 👋</h2>
      <p class="text-muted text-sm">Berikut ringkasan kegiatan kelas X-5 hari ini.</p>
    </div>
    <div class="grid grid-4 mb-6">
      <div class="card stat-card card-glow"><div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#34d399">✅</div><div class="stat-value text-gradient">${attPercent}%</div><div class="stat-label">Kehadiran</div></div>
      <div class="card stat-card card-glow"><div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#818cf8">📝</div><div class="stat-value text-gradient">${assignRes.data?.length||0}</div><div class="stat-label">Tugas Aktif</div></div>
      <div class="card stat-card card-glow"><div class="stat-icon" style="background:rgba(59,130,246,0.15);color:#60a5fa">🏆</div><div class="stat-value text-gradient">${avgGrade}</div><div class="stat-label">Rata-rata Nilai</div></div>
      <div class="card stat-card card-glow"><div class="stat-icon" style="background:rgba(245,158,11,0.15);color:#fbbf24">📅</div><div class="stat-value text-gradient">${totalAtt}</div><div class="stat-label">Total Absensi</div></div>
    </div>
    <div class="grid grid-2">
      <div class="card">
        <h3 class="font-bold mb-3">📝 Tugas Mendatang</h3>
        ${(assignRes.data||[]).length > 0 ? assignRes.data.map(a=>`
          <div class="card mb-2" style="padding:12px;background:rgba(255,255,255,0.02)">
            ${a.subject?`<span class="badge badge-outline text-xs mb-1">${a.subject}</span>`:''}
            <div class="font-medium text-sm">${a.title}</div>
            <div class="text-xs text-muted">📅 ${formatDate(a.due_date)}</div>
          </div>
        `).join('') : '<p class="text-sm text-muted">Tidak ada tugas aktif</p>'}
      </div>
      <div class="card">
        <h3 class="font-bold mb-3">📢 Pengumuman Terbaru</h3>
        ${(annRes.data||[]).length > 0 ? annRes.data.map(a=>`
          <div class="card mb-2" style="padding:12px;background:rgba(255,255,255,0.02)">
            <div class="flex items-center gap-2 mb-1"><div class="font-medium text-sm">${a.title}</div>${a.is_pinned?'<span class="badge badge-warning text-xs">📌</span>':''}</div>
            <div class="text-xs text-muted">${a.content?.substring(0,80)}${a.content?.length>80?'...':''}</div>
          </div>
        `).join('') : '<p class="text-sm text-muted">Tidak ada pengumuman</p>'}
      </div>
    </div>
  `;
}

// ===== ATTENDANCE =====
async function renderAttendance() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const sid = currentProfile?.id;
  const { data } = await db.from('attendance').select('*').eq('student_id', sid).order('date', { ascending: false });
  const total = data?.length || 0;
  const present = data?.filter(a=>a.status==='present').length||0;
  const sick = data?.filter(a=>a.status==='sick').length||0;
  const perm = data?.filter(a=>a.status==='permission').length||0;
  const pct = total>0?Math.round((present/total)*100):0;
  const statusBadge = { present:'success', permission:'warning', sick:'danger', absent:'outline' };
  const statusLabel = { present:'Hadir', permission:'Izin', sick:'Sakit', absent:'Absen' };

  mc.innerHTML = `
    <div class="grid grid-4 mb-6">
      <div class="card stat-card"><div class="stat-value text-gradient">${present}</div><div class="stat-label">Hadir</div></div>
      <div class="card stat-card"><div class="stat-value" style="color:var(--warning)">${perm}</div><div class="stat-label">Izin</div></div>
      <div class="card stat-card"><div class="stat-value" style="color:var(--danger)">${sick}</div><div class="stat-label">Sakit</div></div>
      <div class="card stat-card"><div class="stat-value text-gradient">${pct}%</div><div class="stat-label">Kehadiran</div></div>
    </div>
    <div class="card"><h3 class="font-bold mb-3">Riwayat Kehadiran</h3>
      <div class="flex flex-col gap-2">${(data||[]).map(a=>`
        <div class="flex items-center justify-between" style="padding:10px;border-radius:8px;background:rgba(255,255,255,0.03)">
          <div><div class="text-sm font-medium">${formatDate(a.date)}</div>${a.note?`<div class="text-xs text-muted">${a.note}</div>`:''}</div>
          <span class="badge badge-${statusBadge[a.status]||'outline'}">${statusLabel[a.status]||a.status}</span>
        </div>
      `).join('')}</div>
      ${total===0?'<p class="text-sm text-muted text-center p-4">Belum ada data kehadiran</p>':''}
    </div>
  `;
}

// ===== ASSIGNMENTS =====
async function renderAssignments() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('assignments').select('*').order('due_date');
  mc.innerHTML = `
    <h2 class="text-xl font-bold mb-4">📝 Daftar Tugas</h2>
    <div class="grid grid-2">${(data||[]).map(a=>`
      <div class="card card-glow">
        <div class="flex items-center justify-between mb-2">${a.subject?`<span class="badge badge-outline">${a.subject}</span>`:'<span></span>'}<span class="badge badge-warning">📅 ${formatShortDate(a.due_date)}</span></div>
        <h3 class="font-bold mb-2">${a.title}</h3>
        <p class="text-sm text-muted">${a.description}</p>
      </div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada tugas</p></div>':''}
  `;
}

// ===== MATERIALS =====
async function renderMaterials() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('materials').select('*').order('created_at', { ascending: false });
  mc.innerHTML = `
    <h2 class="text-xl font-bold mb-4">📚 Materi Pembelajaran</h2>
    <div class="grid grid-3">${(data||[]).map(m=>`
      <div class="card card-glow"><span class="badge badge-outline mb-2">${m.category}</span><h3 class="font-bold text-sm mb-1">${m.title}</h3><p class="text-xs text-muted mb-3">${m.description||''}</p>
      ${m.external_url?`<a href="${m.external_url}" target="_blank" class="btn btn-outline btn-sm w-full">🔗 Buka Materi</a>`:''}</div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada materi</p></div>':''}
  `;
}

// ===== GRADES =====
async function renderGrades() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('grades').select('*').eq('student_id', currentProfile?.id).order('created_at', { ascending: false });
  const avg = data?.length>0 ? (data.reduce((s,g)=>s+g.score,0)/data.length).toFixed(1) : 0;
  const typeLabels = { daily:'Harian', assignment:'Tugas', mid_semester:'UTS', final_semester:'UAS' };

  mc.innerHTML = `
    <div class="grid grid-3 mb-6">
      <div class="card stat-card card-glow"><div class="stat-value text-gradient">${avg}</div><div class="stat-label">Rata-rata</div></div>
      <div class="card stat-card"><div class="stat-value" style="color:var(--success)">${avg>=85?'A':avg>=70?'B':'C'}</div><div class="stat-label">Predikat</div></div>
      <div class="card stat-card"><div class="stat-value">${data?.length||0}</div><div class="stat-label">Total Nilai</div></div>
    </div>
    <div class="card" style="padding:0;overflow:hidden"><div class="table-wrap"><table>
      <thead><tr><th>Mapel</th><th>Jenis</th><th style="text-align:center">Nilai</th><th style="text-align:center">Predikat</th></tr></thead>
      <tbody>${(data||[]).map(g=>`<tr><td class="font-medium">${g.subject}</td><td><span class="badge badge-outline">${typeLabels[g.type]||g.type}</span></td><td style="text-align:center"><span class="font-bold" style="color:${g.score>=85?'var(--success)':g.score>=70?'var(--warning)':'var(--danger)'}">${g.score}</span></td><td style="text-align:center"><span class="badge badge-${g.score>=85?'success':'warning'}">${g.score>=85?'A':'B'}</span></td></tr>`).join('')}</tbody>
    </table></div></div>
    ${(!data||data.length===0)?'<div class="card text-center p-6 mt-4"><p class="text-muted">Belum ada nilai</p></div>':''}
  `;
}

// ===== ANNOUNCEMENTS =====
async function renderAnnouncements() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('announcements').select('*').order('is_pinned', { ascending: false }).order('created_at', { ascending: false });
  mc.innerHTML = `
    <h2 class="text-xl font-bold mb-4">📢 Pengumuman</h2>
    <div class="flex flex-col gap-3">${(data||[]).map(a=>`
      <div class="card card-glow"><div class="flex items-center gap-2 mb-2"><h3 class="font-bold">${a.title}</h3>${a.is_pinned?'<span class="badge badge-warning">📌 Pinned</span>':''}</div>
      <p class="text-sm text-muted mb-2">${a.content}</p><span class="text-xs text-muted">${formatDate(a.created_at)}</span></div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada pengumuman</p></div>':''}
  `;
}

// ===== GALLERY =====
async function renderGallery() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('gallery').select('*').order('created_at', { ascending: false });
  mc.innerHTML = `
    <h2 class="text-xl font-bold mb-4">🖼️ Galeri Kegiatan</h2>
    <div class="grid grid-3">${(data||[]).map(g=>`
      <div class="card" style="padding:0;overflow:hidden">
        <div style="aspect-ratio:1;background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2));display:flex;align-items:center;justify-content:center;font-size:48px;overflow:hidden">${g.media_url?`<img src="${g.media_url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='🖼️'">`:'🖼️'}</div>
        <div style="padding:12px"><p class="text-sm font-medium truncate">${g.title}</p><span class="badge badge-outline text-xs mt-1">${g.media_type}</span></div>
      </div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada foto</p></div>':''}
  `;
}

// ===== CALENDAR =====
async function renderCalendar() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('calendar_events').select('*').order('date');
  const typeLabels = { holiday:'Libur', exam:'Ujian', event:'Event', meeting:'Rapat', other:'Lainnya' };
  const typeBadge = { holiday:'success', exam:'danger', event:'primary', meeting:'info', other:'outline' };
  mc.innerHTML = `
    <h2 class="text-xl font-bold mb-4">📅 Jadwal & Event</h2>
    <div class="flex flex-col gap-2">${(data||[]).map(e=>`
      <div class="card" style="padding:12px 16px"><div class="flex items-center gap-3">
        <div style="width:48px;text-align:center;flex-shrink:0"><div class="text-xs text-muted">${formatShortDate(e.date).split(' ')[1]}</div><div class="text-xl font-bold">${new Date(e.date).getDate()}</div></div>
        <div style="flex:1"><div class="font-medium text-sm">${e.title}</div>${e.description?`<div class="text-xs text-muted">${e.description}</div>`:''}</div>
        <span class="badge badge-${typeBadge[e.type]||'outline'}">${typeLabels[e.type]||e.type}</span>
      </div></div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada event</p></div>':''}
  `;
}

// ===== PROFILE =====
function renderProfile() {
  const p = currentProfile;
  const mc = document.getElementById('mainContent');
  mc.innerHTML = `
    <div class="grid grid-2">
      <div class="card text-center">
        <div style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(168,85,247,0.3));display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:var(--primary);margin:0 auto 16px">${(p?.full_name||'S').charAt(0)}</div>
        <h2 class="text-xl font-bold">${p?.full_name||'-'}</h2>
        <p class="text-sm text-muted">${p?.email||'-'}</p>
        <div class="card mt-4" style="padding:12px;background:rgba(255,255,255,0.03)"><div class="text-xs text-muted">NISN</div><div class="font-bold font-mono">${p?.nisn||'-'}</div></div>
      </div>
      <div class="card">
        <h3 class="font-bold mb-4">Informasi Profil</h3>
        <div class="flex flex-col gap-3">
          <div><div class="text-xs text-muted">Nama Lengkap</div><div class="font-medium">${p?.full_name||'-'}</div></div>
          <div><div class="text-xs text-muted">Email</div><div class="font-medium">${p?.email||'-'}</div></div>
          <div><div class="text-xs text-muted">No. Telepon</div><div class="font-medium">${p?.phone||'-'}</div></div>
          <div><div class="text-xs text-muted">Nama Orang Tua</div><div class="font-medium">${p?.parent_name||'-'}</div></div>
          <div><div class="text-xs text-muted">Alamat</div><div class="font-medium">${p?.address||'-'}</div></div>
        </div>
      </div>
    </div>
  `;
}

function formatShortDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

init();
