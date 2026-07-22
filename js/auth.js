// ===== AUTH HELPERS =====
async function checkAuth(requiredRole) {
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    window.location.href = requiredRole === 'admin' ? '/auth/admin.html' : '/auth/login.html';
    return null;
  }
  
  const { data: profile } = await db.from('profiles').select('*').eq('user_id', user.id).single();
  return { user, profile };
}

async function logout() {
  await db.auth.signOut();
  window.location.href = '/';
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.getElementById('toasts').appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ===== MODAL =====
function showModal(content) {
  document.getElementById('modalContainer').innerHTML = content;
}

function closeModal() {
  document.getElementById('modalContainer').innerHTML = '';
}

// ===== UTILS =====
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
