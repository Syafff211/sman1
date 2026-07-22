// ===== AUTH HELPERS =====
async function checkAuth(requiredRole) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) { window.location.href = requiredRole === 'admin' ? '/auth/admin.html' : '/auth/login.html'; return null; }
  
  const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', user.id).single();
  
  if (requiredRole === 'admin' && profile?.role !== 'admin') {
    // Force update to admin
    await supabase.from('profiles').update({ role: 'admin' }).eq('user_id', user.id);
    return { user, profile: { ...profile, role: 'admin' } };
  }
  
  return { user, profile };
}

async function logout() {
  await supabase.auth.signOut();
  window.location.href = '/';
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toasts') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toasts';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ===== LOADING =====
function showLoading() {
  document.getElementById('appContent').classList.add('hidden');
  document.getElementById('loadingScreen').classList.remove('hidden');
}

function hideLoading() {
  document.getElementById('loadingScreen').classList.add('hidden');
  document.getElementById('appContent').classList.remove('hidden');
}

// ===== UTILS =====
function formatDate(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(date) {
  return new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
