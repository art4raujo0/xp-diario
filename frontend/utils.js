function sair(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('xp_diario_token');
  window.location.href = '/login';
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.sidebar-overlay').classList.toggle('open');
}
