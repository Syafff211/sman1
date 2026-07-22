// ===== ADMIN APP =====
let currentUser = null;
let currentProfile = null;
let activeTab = 'dashboard';

const menuItems = [
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
  { id: 'students', icon: '👥', label: 'Kelola Siswa' },
  { id: 'attendance', icon: '✅', label: 'Kehadiran' },
  { id: 'assignments', icon: '📝', label: 'Tugas' },
  { id: 'grades', icon: '🏆', label: 'Nilai' },
  { id: 'materials', icon: '📚', label: 'Materi' },
  { id: 'announcements', icon: '📢', label: 'Pengumuman' },
  { id: 'gallery', icon: '🖼️', label: 'Galeri' },
  { id: 'calendar', icon: '📅', label: 'Kalender' },
];

// ===== INIT =====
async function init() {
  try {
    const auth = await checkAuth('admin');
    if (!auth) {
      hideLoading();
      return;
    }
    currentUser = auth.user;
    currentProfile = auth.profile || {};
    
    document.getElementById('userName').textContent = currentProfile?.full_name || 'Admin';
    document.getElementById('userAvatar').textContent = (currentProfile?.full_name || 'A').charAt(0);
    
    renderSidebar();
    navigate('dashboard');
  } catch (err) {
    console.error('Init error:', err);
  } finally {
    hideLoading();
  }
}

function renderSidebar() {
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = menuItems.map(item => `
    <a href="#" onclick="navigate('${item.id}');return false" class="${activeTab === item.id ? 'active' : ''}">
      <span>${item.icon}</span> ${item.label}
    </a>
  `).join('');
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}

function navigate(tab) {
  activeTab = tab;
  renderSidebar();
  document.getElementById('pageTitle').textContent = menuItems.find(m => m.id === tab)?.label || tab;
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
  
  try {
    const pages = { dashboard: renderDashboard, students: renderStudents, attendance: renderAttendance, assignments: renderAssignments, grades: renderGrades, materials: renderMaterials, announcements: renderAnnouncements, gallery: renderGallery, calendar: renderCalendar };
    (pages[tab] || renderDashboard)();
  } catch (err) {
    console.error('Navigate error:', err);
    document.getElementById('mainContent').innerHTML = '<div class="card text-center p-6"><p class="text-muted">Terjadi error. Coba refresh halaman.</p></div>';
  }
}

// ===== DASHBOARD =====
async function renderDashboard() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  
  try {
    const [studentsRes, attendanceRes, assignmentsRes] = await Promise.all([
      db.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      db.from('attendance').select('*', { count: 'exact', head: true }).eq('status', 'present'),
      db.from('assignments').select('*', { count: 'exact', head: true }),
    ]);

    mc.innerHTML = `
      <div class="card mb-6" style="background:linear-gradient(135deg,rgba(99,102,241,0.1),rgba(168,85,247,0.1));border-color:rgba(99,102,241,0.2)">
        <h2 class="text-2xl font-bold mb-1">Selamat Datang, <span class="text-gradient">${currentProfile?.full_name || 'Admin'}</span> 🛡️</h2>
        <p class="text-muted text-sm">Super Admin Panel - X-5 SMAN 1 Purbalingga</p>
      </div>
      <div class="grid grid-4 mb-6">
        <div class="card stat-card card-glow"><div class="stat-icon" style="background:rgba(99,102,241,0.15);color:#818cf8">👥</div><div class="stat-value text-gradient">${studentsRes.count || 0}</div><div class="stat-label">Total Siswa</div></div>
        <div class="card stat-card card-glow"><div class="stat-icon" style="background:rgba(16,185,129,0.15);color:#34d399">✅</div><div class="stat-value text-gradient">${attendanceRes.count || 0}</div><div class="stat-label">Hadir Hari Ini</div></div>
        <div class="card stat-card card-glow"><div class="stat-icon" style="background:rgba(59,130,246,0.15);color:#60a5fa">📝</div><div class="stat-value text-gradient">${assignmentsRes.count || 0}</div><div class="stat-label">Total Tugas</div></div>
        <div class="card stat-card card-glow"><div class="stat-icon" style="background:rgba(245,158,11,0.15);color:#fbbf24">🛡️</div><div class="stat-value text-gradient">1</div><div class="stat-label">Admin</div></div>
      </div>
      <div class="grid grid-2">
        <div class="card">
          <h3 class="font-bold mb-4">⚡ Aksi Cepat</h3>
          <div class="grid grid-2 gap-2">
            <button class="btn btn-outline" onclick="navigate('students')">👥 Tambah Siswa</button>
            <button class="btn btn-outline" onclick="navigate('attendance')">✅ Input Absensi</button>
            <button class="btn btn-outline" onclick="navigate('assignments')">📝 Buat Tugas</button>
            <button class="btn btn-outline" onclick="navigate('grades')">🏆 Input Nilai</button>
            <button class="btn btn-outline" onclick="navigate('announcements')">📢 Pengumuman</button>
            <button class="btn btn-outline" onclick="navigate('gallery')">🖼️ Upload Foto</button>
          </div>
        </div>
        <div class="card">
          <h3 class="font-bold mb-4">ℹ️ Informasi</h3>
          <p class="text-sm text-muted mb-2">Selamat datang di Admin Panel X-5 SMAN 1 Purbalingga.</p>
          <p class="text-sm text-muted mb-2">Gunakan menu di sidebar untuk mengelola berbagai aspek kelas.</p>
          <p class="text-sm text-muted">Email: <strong>${currentUser?.email || '-'}</strong></p>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Dashboard error:', err);
    mc.innerHTML = '<div class="card text-center p-6"><p class="text-muted">Gagal memuat dashboard. Coba refresh.</p></div>';
  }
}

// ===== STUDENTS =====
async function renderStudents() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  
  const { data: students } = await db.from('profiles').select('*').eq('role', 'student').order('full_name');
  
  mc.innerHTML = `
    <div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:12px">
      <p class="text-muted text-sm">Total: ${students?.length || 0} siswa</p>
      <button class="btn btn-primary" onclick="showStudentModal()">+ Tambah Siswa</button>
    </div>
    <div class="grid grid-3">
      ${(students || []).map(s => `
        <div class="card card-glow">
          <div class="flex items-center gap-3 mb-3">
            <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,rgba(99,102,241,0.3),rgba(168,85,247,0.3));display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary);font-size:18px">${(s.full_name||'?').charAt(0)}</div>
            <div style="flex:1;min-width:0">
              <div class="font-bold truncate">${s.full_name}</div>
              <div class="text-xs text-muted">NISN: ${s.nisn || '-'}</div>
              <div class="text-xs text-muted truncate">${s.email}</div>
            </div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" style="flex:1" onclick="showStudentModal('${s.id}')">✏️ Edit</button>
            <button class="btn btn-outline btn-sm" style="color:var(--danger)" onclick="deleteStudent('${s.id}','${s.full_name}')">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
    ${(!students || students.length === 0) ? '<div class="card text-center p-6"><p class="text-muted">Belum ada siswa</p></div>' : ''}
  `;
}

function showStudentModal(id) {
  showModal(id ? 'Edit Siswa' : 'Tambah Siswa', `
    <div class="flex flex-col gap-3">
      <div class="input-group"><label>Nama Lengkap *</label><input type="text" id="f_name" placeholder="Nama lengkap"></div>
      <div class="grid grid-2 gap-3">
        <div class="input-group"><label>Email *</label><input type="email" id="f_email" placeholder="email@example.com"></div>
        <div class="input-group"><label>NISN</label><input type="text" id="f_nisn" placeholder="1234567890"></div>
      </div>
      <div class="grid grid-2 gap-3">
        <div class="input-group"><label>No. Telepon</label><input type="text" id="f_phone" placeholder="08xxx"></div>
        <div class="input-group"><label>Nama Ortu</label><input type="text" id="f_parent" placeholder="Nama orang tua"></div>
      </div>
      <div class="input-group"><label>Alamat</label><textarea id="f_address" rows="2" placeholder="Alamat lengkap"></textarea></div>
      <div class="flex gap-2 mt-2"><button class="btn btn-primary" style="flex:1" onclick="saveStudent('${id || ''}')">💾 Simpan</button><button class="btn btn-outline" onclick="closeModal()">Batal</button></div>
    </div>
  `, id ? async () => {
    const { data } = await db.from('profiles').select('*').eq('id', id).single();
    if (data) { document.getElementById('f_name').value = data.full_name||''; document.getElementById('f_email').value = data.email||''; document.getElementById('f_nisn').value = data.nisn||''; document.getElementById('f_phone').value = data.phone||''; document.getElementById('f_parent').value = data.parent_name||''; document.getElementById('f_address').value = data.address||''; }
  } : null);
}

async function saveStudent(id) {
  const name = document.getElementById('f_name').value.trim();
  const email = document.getElementById('f_email').value.trim();
  if (!name || !email) return showToast('Nama dan email wajib diisi!', 'error');
  
  const payload = { full_name: name, email, nisn: document.getElementById('f_nisn').value.trim() || null, phone: document.getElementById('f_phone').value.trim() || null, parent_name: document.getElementById('f_parent').value.trim() || null, address: document.getElementById('f_address').value.trim() || null, role: 'student' };
  
  if (id) {
    const { error } = await db.from('profiles').update(payload).eq('id', id);
    if (error) return showToast(error.message, 'error');
    showToast('Siswa berhasil diupdate!', 'success');
  } else {
    const { error } = await db.from('profiles').insert([payload]);
    if (error) return showToast(error.message, 'error');
    showToast('Siswa berhasil ditambahkan!', 'success');
  }
  closeModal(); renderStudents();
}

async function deleteStudent(id, name) {
  if (!confirm(`Hapus siswa "${name}"?`)) return;
  const { error } = await db.from('profiles').delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  showToast('Siswa berhasil dihapus!', 'success');
  renderStudents();
}

// ===== ATTENDANCE =====
async function renderAttendance() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  
  const today = new Date().toISOString().split('T')[0];
  const { data: students } = await db.from('profiles').select('*').eq('role', 'student').order('full_name');
  const { data: existingAttendance } = await db.from('attendance').select('*').eq('date', today);
  
  const attendanceMap = {};
  (existingAttendance || []).forEach(a => { attendanceMap[a.student_id] = a.status; });
  
  mc.innerHTML = `
    <div class="flex items-center justify-between mb-4" style="flex-wrap:wrap;gap:12px">
      <div><p class="font-bold">Absensi Tanggal: ${formatDate(today)}</p><p class="text-sm text-muted">${students?.length || 0} siswa</p></div>
      <button class="btn btn-primary" onclick="saveAllAttendance()">💾 Simpan Semua</button>
    </div>
    <div class="flex flex-col gap-2">
      ${(students || []).map(s => `
        <div class="card" style="padding:12px 16px">
          <div class="flex items-center gap-3" style="flex-wrap:wrap">
            <div style="width:36px;height:36px;border-radius:50%;background:rgba(99,102,241,0.2);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--primary);font-size:14px;flex-shrink:0">${(s.full_name||'?').charAt(0)}</div>
            <div style="flex:1;min-width:120px"><div class="font-medium text-sm">${s.full_name}</div><div class="text-xs text-muted">${s.nisn||'-'}</div></div>
            <div class="flex gap-1" style="flex-wrap:wrap">
              <button class="btn btn-sm ${attendanceMap[s.id]==='present'?'btn-success':'btn-outline'}" onclick="setAtt('${s.id}','present',this)">✅ Hadir</button>
              <button class="btn btn-sm ${attendanceMap[s.id]==='permission'?'btn-primary':'btn-outline'}" onclick="setAtt('${s.id}','permission',this)">📋 Izin</button>
              <button class="btn btn-sm ${attendanceMap[s.id]==='sick'?'btn-danger':'btn-outline'}" onclick="setAtt('${s.id}','sick',this)">🤒 Sakit</button>
            </div>
          </div>
        </div>
      `).join('')}
    </div>
    ${(!students || students.length === 0) ? '<div class="card text-center p-6"><p class="text-muted">Belum ada siswa. Tambahkan siswa dulu.</p></div>' : ''}
  `;
}

const tempAttendance = {};
function setAtt(studentId, status, btn) {
  tempAttendance[studentId] = status;
  const parent = btn.parentElement;
  parent.querySelectorAll('.btn').forEach(b => { b.className = 'btn btn-sm btn-outline'; });
  btn.className = `btn btn-sm ${status==='present'?'btn-success':status==='permission'?'btn-primary':'btn-danger'}`;
}

async function saveAllAttendance() {
  const today = new Date().toISOString().split('T')[0];
  const records = Object.entries(tempAttendance).map(([student_id, status]) => ({ student_id, date: today, status }));
  if (records.length === 0) return showToast('Pilih status minimal 1 siswa!', 'error');
  
  const { error } = await db.from('attendance').upsert(records, { onConflict: 'student_id,date' });
  if (error) return showToast(error.message, 'error');
  showToast(`${records.length} absensi berhasil disimpan!`, 'success');
}

// ===== ASSIGNMENTS =====
async function renderAssignments() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data: assignments } = await db.from('assignments').select('*').order('due_date', { ascending: false });
  
  mc.innerHTML = `
    <div class="flex items-center justify-between mb-4"><p class="text-muted text-sm">${assignments?.length||0} tugas</p><button class="btn btn-primary" onclick="showAssignmentModal()">+ Buat Tugas</button></div>
    <div class="grid grid-2">
      ${(assignments||[]).map(a => `
        <div class="card card-glow">
          <div class="flex items-center justify-between mb-2">
            ${a.subject ? `<span class="badge badge-outline">${a.subject}</span>` : '<span></span>'}
            <span class="badge badge-warning">📅 ${formatShortDate(a.due_date)}</span>
          </div>
          <h3 class="font-bold mb-2">${a.title}</h3>
          <p class="text-sm text-muted mb-3" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${a.description}</p>
          <div class="flex gap-2">
            <button class="btn btn-outline btn-sm" style="flex:1" onclick="showAssignmentModal('${a.id}')">✏️ Edit</button>
            <button class="btn btn-outline btn-sm" style="color:var(--danger)" onclick="deleteItem('assignments','${a.id}','Tugas')">🗑️</button>
          </div>
        </div>
      `).join('')}
    </div>
    ${(!assignments||assignments.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada tugas</p></div>':''}
  `;
}

function showAssignmentModal(id) {
  showModal(id?'Edit Tugas':'Buat Tugas', `
    <div class="flex flex-col gap-3">
      <div class="input-group"><label>Judul *</label><input type="text" id="f_title"></div>
      <div class="grid grid-2 gap-3">
        <div class="input-group"><label>Mapel</label><input type="text" id="f_subject"></div>
        <div class="input-group"><label>Deadline *</label><input type="date" id="f_due"></div>
      </div>
      <div class="input-group"><label>Deskripsi *</label><textarea id="f_desc" rows="4"></textarea></div>
      <div class="flex gap-2 mt-2"><button class="btn btn-primary" style="flex:1" onclick="saveAssignment('${id||''}')">💾 Simpan</button><button class="btn btn-outline" onclick="closeModal()">Batal</button></div>
    </div>
  `, id ? async () => {
    const { data } = await db.from('assignments').select('*').eq('id', id).single();
    if (data) { document.getElementById('f_title').value=data.title; document.getElementById('f_subject').value=data.subject||''; document.getElementById('f_due').value=data.due_date?.split('T')[0]||''; document.getElementById('f_desc').value=data.description; }
  } : null);
}

async function saveAssignment(id) {
  const title = document.getElementById('f_title').value.trim();
  const desc = document.getElementById('f_desc').value.trim();
  const due = document.getElementById('f_due').value;
  if (!title || !desc || !due) return showToast('Semua field wajib diisi!', 'error');
  
  const payload = { title, description: desc, subject: document.getElementById('f_subject').value.trim()||null, due_date: new Date(due).toISOString(), created_by: currentProfile?.id };
  
  if (id) { await db.from('assignments').update(payload).eq('id', id); showToast('Tugas diupdate!','success'); }
  else { await db.from('assignments').insert([payload]); showToast('Tugas dibuat!','success'); }
  closeModal(); renderAssignments();
}

// ===== GRADES =====
async function renderGrades() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const [{ data: grades }, { data: students }] = await Promise.all([
    db.from('grades').select('*, profiles(full_name)').order('created_at', { ascending: false }),
    db.from('profiles').select('id, full_name').eq('role', 'student').order('full_name')
  ]);
  
  const typeLabels = { daily: 'Harian', assignment: 'Tugas', mid_semester: 'UTS', final_semester: 'UAS' };
  window._studentsList = students || [];
  
  mc.innerHTML = `
    <div class="flex items-center justify-between mb-4"><p class="text-muted text-sm">${grades?.length||0} nilai</p><button class="btn btn-primary" onclick="showGradeModal()">+ Input Nilai</button></div>
    <div class="card" style="padding:0;overflow:hidden">
      <div class="table-wrap">
        <table>
          <thead><tr><th>Siswa</th><th>Mapel</th><th>Jenis</th><th style="text-align:center">Nilai</th><th style="text-align:center">Aksi</th></tr></thead>
          <tbody>
            ${(grades||[]).map(g => `<tr>
              <td class="font-medium">${g.profiles?.full_name||'-'}</td>
              <td>${g.subject}</td>
              <td><span class="badge badge-outline">${typeLabels[g.type]||g.type}</span></td>
              <td style="text-align:center"><span class="font-bold" style="color:${g.score>=85?'var(--success)':g.score>=70?'var(--warning)':'var(--danger)'}">${g.score}</span></td>
              <td style="text-align:center"><button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteItem('grades','${g.id}','Nilai')">🗑️</button></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ${(!grades||grades.length===0)?'<div class="card text-center p-6 mt-4"><p class="text-muted">Belum ada nilai</p></div>':''}
  `;
}

function showGradeModal() {
  showModal('Input Nilai', `
    <div class="flex flex-col gap-3">
      <div class="input-group"><label>Siswa *</label><select id="f_student">${(window._studentsList||[]).map(s=>`<option value="${s.id}">${s.full_name}</option>`).join('')}</select></div>
      <div class="grid grid-2 gap-3">
        <div class="input-group"><label>Mapel *</label><select id="f_subject">${['Matematika','Bahasa Indonesia','Bahasa Inggris','Fisika','Kimia','Biologi','Sejarah','PKN','Penjas'].map(s=>`<option>${s}</option>`).join('')}</select></div>
        <div class="input-group"><label>Jenis *</label><select id="f_type"><option value="daily">Harian</option><option value="assignment">Tugas</option><option value="mid_semester">UTS</option><option value="final_semester">UAS</option></select></div>
      </div>
      <div class="input-group"><label>Nilai (0-100) *</label><input type="number" id="f_score" min="0" max="100"></div>
      <div class="flex gap-2 mt-2"><button class="btn btn-primary" style="flex:1" onclick="saveGrade()">💾 Simpan</button><button class="btn btn-outline" onclick="closeModal()">Batal</button></div>
    </div>
  `);
}

async function saveGrade() {
  const score = parseInt(document.getElementById('f_score').value);
  if (isNaN(score) || score < 0 || score > 100) return showToast('Nilai harus 0-100!','error');
  
  const { error } = await db.from('grades').insert([{
    student_id: document.getElementById('f_student').value,
    subject: document.getElementById('f_subject').value,
    type: document.getElementById('f_type').value,
    score, semester: 1, academic_year: '2024/2025'
  }]);
  if (error) return showToast(error.message, 'error');
  showToast('Nilai berhasil ditambahkan!', 'success');
  closeModal(); renderGrades();
}

// ===== MATERIALS =====
async function renderMaterials() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('materials').select('*').order('created_at', { ascending: false });
  mc.innerHTML = `
    <div class="flex items-center justify-between mb-4"><p class="text-muted text-sm">${data?.length||0} materi</p><button class="btn btn-primary" onclick="showMaterialModal()">+ Tambah Materi</button></div>
    <div class="grid grid-3">${(data||[]).map(m=>`
      <div class="card card-glow"><span class="badge badge-outline mb-2">${m.category}</span><h3 class="font-bold text-sm mb-1">${m.title}</h3><p class="text-xs text-muted mb-3">${m.description||''}</p>
      <div class="flex gap-2"><button class="btn btn-outline btn-sm" style="flex:1" onclick="showMaterialModal('${m.id}')">✏️</button><button class="btn btn-outline btn-sm" style="color:var(--danger)" onclick="deleteItem('materials','${m.id}','Materi')">🗑️</button></div></div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada materi</p></div>':''}
  `;
}

function showMaterialModal(id) {
  showModal(id?'Edit Materi':'Tambah Materi', `
    <div class="flex flex-col gap-3">
      <div class="input-group"><label>Judul *</label><input type="text" id="f_title"></div>
      <div class="input-group"><label>Kategori *</label><select id="f_cat">${['Matematika','Bahasa Indonesia','Bahasa Inggris','Fisika','Kimia','Biologi','Sejarah','PKN','Lainnya'].map(s=>`<option>${s}</option>`).join('')}</select></div>
      <div class="input-group"><label>Deskripsi</label><textarea id="f_desc" rows="2"></textarea></div>
      <div class="input-group"><label>URL External</label><input type="url" id="f_url" placeholder="https://drive.google.com/..."></div>
      <div class="flex gap-2 mt-2"><button class="btn btn-primary" style="flex:1" onclick="saveMaterial('${id||''}')">💾 Simpan</button><button class="btn btn-outline" onclick="closeModal()">Batal</button></div>
    </div>
  `, id ? async () => {
    const { data } = await db.from('materials').select('*').eq('id',id).single();
    if(data){document.getElementById('f_title').value=data.title;document.getElementById('f_cat').value=data.category;document.getElementById('f_desc').value=data.description||'';document.getElementById('f_url').value=data.external_url||'';}
  } : null);
}

async function saveMaterial(id) {
  const title = document.getElementById('f_title').value.trim();
  if(!title) return showToast('Judul wajib diisi!','error');
  const payload = { title, category: document.getElementById('f_cat').value, description: document.getElementById('f_desc').value.trim()||null, external_url: document.getElementById('f_url').value.trim()||null, created_by: currentProfile?.id };
  if(id){await db.from('materials').update(payload).eq('id',id);showToast('Materi diupdate!','success');}
  else{await db.from('materials').insert([payload]);showToast('Materi ditambahkan!','success');}
  closeModal(); renderMaterials();
}

// ===== ANNOUNCEMENTS =====
async function renderAnnouncements() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('announcements').select('*').order('created_at', { ascending: false });
  mc.innerHTML = `
    <div class="flex items-center justify-between mb-4"><p class="text-muted text-sm">${data?.length||0} pengumuman</p><button class="btn btn-primary" onclick="showAnnouncementModal()">+ Buat Pengumuman</button></div>
    <div class="flex flex-col gap-3">${(data||[]).map(a=>`
      <div class="card card-glow"><div class="flex items-center gap-2 mb-2"><h3 class="font-bold">${a.title}</h3>${a.is_pinned?'<span class="badge badge-warning">📌 Pinned</span>':''}</div>
      <p class="text-sm text-muted mb-3">${a.content}</p><div class="flex items-center justify-between"><span class="text-xs text-muted">${formatDate(a.created_at)}</span>
      <div class="flex gap-2"><button class="btn btn-ghost btn-sm" onclick="showAnnouncementModal('${a.id}')">✏️</button><button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteItem('announcements','${a.id}','Pengumuman')">🗑️</button></div></div></div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada pengumuman</p></div>':''}
  `;
}

function showAnnouncementModal(id) {
  showModal(id?'Edit Pengumuman':'Buat Pengumuman', `
    <div class="flex flex-col gap-3">
      <div class="input-group"><label>Judul *</label><input type="text" id="f_title"></div>
      <div class="input-group"><label>Konten *</label><textarea id="f_content" rows="5"></textarea></div>
      <label class="flex items-center gap-2" style="cursor:pointer"><input type="checkbox" id="f_pinned"><span class="text-sm">📌 Pin pengumuman</span></label>
      <div class="flex gap-2 mt-2"><button class="btn btn-primary" style="flex:1" onclick="saveAnnouncement('${id||''}')">💾 Simpan</button><button class="btn btn-outline" onclick="closeModal()">Batal</button></div>
    </div>
  `, id ? async () => {
    const { data } = await db.from('announcements').select('*').eq('id',id).single();
    if(data){document.getElementById('f_title').value=data.title;document.getElementById('f_content').value=data.content;document.getElementById('f_pinned').checked=data.is_pinned;}
  } : null);
}

async function saveAnnouncement(id) {
  const title = document.getElementById('f_title').value.trim();
  const content = document.getElementById('f_content').value.trim();
  if(!title||!content) return showToast('Judul dan konten wajib!','error');
  const payload = { title, content, is_pinned: document.getElementById('f_pinned').checked, created_by: currentProfile?.id };
  if(id){await db.from('announcements').update(payload).eq('id',id);showToast('Pengumuman diupdate!','success');}
  else{await db.from('announcements').insert([payload]);showToast('Pengumuman dibuat!','success');}
  closeModal(); renderAnnouncements();
}

// ===== GALLERY =====
async function renderGallery() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('gallery').select('*').order('created_at', { ascending: false });
  mc.innerHTML = `
    <div class="flex items-center justify-between mb-4"><p class="text-muted text-sm">${data?.length||0} item</p><button class="btn btn-primary" onclick="showGalleryModal()">+ Upload</button></div>
    <div class="grid grid-3">${(data||[]).map(g=>`
      <div class="card" style="padding:0;overflow:hidden">
        <div style="aspect-ratio:1;background:linear-gradient(135deg,rgba(99,102,241,0.2),rgba(168,85,247,0.2));display:flex;align-items:center;justify-content:center;font-size:48px;overflow:hidden">${g.media_url?`<img src="${g.media_url}" style="width:100%;height:100%;object-fit:cover" onerror="this.parentElement.innerHTML='🖼️'">`:'🖼️'}</div>
        <div style="padding:12px"><p class="text-sm font-medium truncate">${g.title}</p><span class="badge badge-outline text-xs mt-1">${g.media_type}</span>
        <button class="btn btn-ghost btn-sm w-full mt-2" style="color:var(--danger)" onclick="deleteItem('gallery','${g.id}','Item galeri')">🗑️ Hapus</button></div>
      </div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada item galeri</p></div>':''}
  `;
}

function showGalleryModal() {
  showModal('Upload Galeri', `
    <div class="flex flex-col gap-3">
      <div class="input-group"><label>Judul *</label><input type="text" id="f_title"></div>
      <div class="input-group"><label>Deskripsi</label><input type="text" id="f_desc"></div>
      <div class="input-group"><label>URL Gambar/Video *</label><input type="url" id="f_url" placeholder="https://..."></div>
      <div class="input-group"><label>Tipe</label><select id="f_type"><option value="image">Foto</option><option value="video">Video</option></select></div>
      <div class="flex gap-2 mt-2"><button class="btn btn-primary" style="flex:1" onclick="saveGalleryItem()">💾 Simpan</button><button class="btn btn-outline" onclick="closeModal()">Batal</button></div>
    </div>
  `);
}

async function saveGalleryItem() {
  const title = document.getElementById('f_title').value.trim();
  const url = document.getElementById('f_url').value.trim();
  if(!title||!url) return showToast('Judul dan URL wajib!','error');
  await db.from('gallery').insert([{ title, description: document.getElementById('f_desc').value.trim()||null, media_url: url, media_type: document.getElementById('f_type').value }]);
  showToast('Item galeri ditambahkan!','success');
  closeModal(); renderGallery();
}

// ===== CALENDAR =====
async function renderCalendar() {
  const mc = document.getElementById('mainContent');
  mc.innerHTML = '<div class="spinner" style="margin:40px auto"></div>';
  const { data } = await db.from('calendar_events').select('*').order('date', { ascending: false });
  const typeLabels = { holiday:'Libur', exam:'Ujian', event:'Event', meeting:'Rapat', other:'Lainnya' };
  const typeBadge = { holiday:'success', exam:'danger', event:'primary', meeting:'info', other:'outline' };
  mc.innerHTML = `
    <div class="flex items-center justify-between mb-4"><p class="text-muted text-sm">${data?.length||0} event</p><button class="btn btn-primary" onclick="showEventModal()">+ Tambah Event</button></div>
    <div class="flex flex-col gap-2">${(data||[]).map(e=>`
      <div class="card" style="padding:12px 16px"><div class="flex items-center gap-3">
        <div style="width:48px;text-align:center;flex-shrink:0"><div class="text-xs text-muted">${formatShortDate(e.date).split(' ')[1]}</div><div class="text-xl font-bold">${new Date(e.date).getDate()}</div></div>
        <div style="flex:1"><div class="font-medium text-sm">${e.title}</div>${e.description?`<div class="text-xs text-muted">${e.description}</div>`:''}</div>
        <span class="badge badge-${typeBadge[e.type]||'outline'}">${typeLabels[e.type]||e.type}</span>
        <button class="btn btn-ghost btn-sm" style="color:var(--danger)" onclick="deleteItem('calendar_events','${e.id}','Event')">🗑️</button>
      </div></div>
    `).join('')}</div>
    ${(!data||data.length===0)?'<div class="card text-center p-6"><p class="text-muted">Belum ada event</p></div>':''}
  `;
}

function showEventModal() {
  showModal('Tambah Event', `
    <div class="flex flex-col gap-3">
      <div class="input-group"><label>Judul *</label><input type="text" id="f_title"></div>
      <div class="grid grid-2 gap-3">
        <div class="input-group"><label>Tanggal *</label><input type="date" id="f_date"></div>
        <div class="input-group"><label>Tipe</label><select id="f_type"><option value="event">Event</option><option value="exam">Ujian</option><option value="holiday">Libur</option><option value="meeting">Rapat</option><option value="other">Lainnya</option></select></div>
      </div>
      <div class="input-group"><label>Deskripsi</label><input type="text" id="f_desc"></div>
      <div class="flex gap-2 mt-2"><button class="btn btn-primary" style="flex:1" onclick="saveEvent()">💾 Simpan</button><button class="btn btn-outline" onclick="closeModal()">Batal</button></div>
    </div>
  `);
}

async function saveEvent() {
  const title = document.getElementById('f_title').value.trim();
  const date = document.getElementById('f_date').value;
  if(!title||!date) return showToast('Judul dan tanggal wajib!','error');
  await db.from('calendar_events').insert([{ title, date, type: document.getElementById('f_type').value, description: document.getElementById('f_desc').value.trim()||null }]);
  showToast('Event ditambahkan!','success');
  closeModal(); renderCalendar();
}

// ===== DELETE HELPER =====
async function deleteItem(table, id, label) {
  if (!confirm(`Hapus ${label} ini?`)) return;
  const { error } = await db.from(table).delete().eq('id', id);
  if (error) return showToast(error.message, 'error');
  showToast(`${label} berhasil dihapus!`, 'success');
  navigate(activeTab);
}

// ===== MODAL =====
function showModal(title, content, onLoad) {
  document.getElementById('modalContainer').innerHTML = `
    <div class="modal-overlay" onclick="if(event.target===this)closeModal()">
      <div class="modal">
        <div class="modal-header"><h2>${title}</h2><button class="modal-close" onclick="closeModal()">×</button></div>
        ${content}
      </div>
    </div>
  `;
  if (onLoad) onLoad();
}

function closeModal() { document.getElementById('modalContainer').innerHTML = ''; }

// ===== START =====
init();
