// ===== AUTH HELPERS =====
async function checkAuth(requiredRole) {
  try {
    const { data: { user } } = await db.auth.getUser();
    if (!user) {
      window.location.href = requiredRole === 'admin' ? '/auth/admin.html' : '/auth/login.html';
      return null;
    }
    
    // Try to get profile
    let { data: profile, error } = await db.from('profiles').select('*').eq('user_id', user.id).maybeSingle();
    
    // If profile doesn't exist, create it
    if (!profile) {
      const role = requiredRole === 'admin' ? 'admin' : 'student';
      const { data: newProfile } = await db.from('profiles').insert([{
        user_id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || (role === 'admin' ? 'Super Admin' : 'Siswa'),
        role: role
      }]).select().single();
      profile = newProfile;
    }
    
    // Force update role if needed
    if (requiredRole === 'admin' && profile?.role !== 'admin') {
      await db.from('profiles').update({ role: 'admin', full_name: 'Super Admin' }).eq('user_id', user.id);
      profile = { ...profile, role: 'admin', full_name: 'Super Admin' };
    }
    
    return { user, profile };
  } catch (err) {
    console.error('checkAuth error:', err);
    return null;
  }
}

async function logout() {
  await db.auth.signOut();
  window.location.href = '/';
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toasts') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toasts';
  container.className = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ===== LOADING =====
function hideLoading() {
  const loading = document.getElementById('loadingScreen');
  const app = document.getElementById('appContent');
  if (loading) loading.classList.add('hidden');
  if (app) app.classList.remove('hidden');
}

// ===== UTILS =====
function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatShortDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}
