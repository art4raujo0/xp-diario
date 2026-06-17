// Interceptor global: qualquer 401 redireciona para /login
(function() {
  const _fetch = window.fetch;
  window.fetch = function(url, options) {
    return _fetch.apply(this, arguments).then(function(res) {
      if (res.status === 401) {
        const pub = ['/', '/login', '/cadastro'];
        if (!pub.includes(window.location.pathname)) {
          localStorage.removeItem('xp_diario_token');
          window.location.href = '/login';
        }
      }
      return res;
    });
  };
})();

function sair(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('xp_diario_token');
  window.location.href = '/login';
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.sidebar-overlay').classList.toggle('open');
}

// Proteção de rotas: redireciona para login se token ausente ou expirado
(function() {
  const paginasPublicas = ['/', '/login', '/cadastro'];
  if (paginasPublicas.includes(window.location.pathname)) return;

  const token = localStorage.getItem('xp_diario_token');
  if (!token) { window.location.href = '/login'; return; }

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('xp_diario_token');
      window.location.href = '/login';
    }
  } catch {
    localStorage.removeItem('xp_diario_token');
    window.location.href = '/login';
  }
})();

// Injeta avatar + nome do usuário no topbar
function inicializarTopbar() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  const token = localStorage.getItem('xp_diario_token');
  if (!token) return;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const nome = payload.nome || payload.email || 'Usuário';
    const primeiroNome = nome.split(' ')[0];
    const inicial = primeiroNome[0].toUpperCase();

    const tipoLabel = { admin: '👑 Admin', professor: '🎓 Professor', aluno: '⚔️ Aluno' };
    const sublabel = tipoLabel[payload.tipo] || '⚔️ Aluno';

    const userDiv = document.createElement('div');
    userDiv.className = 'topbar-user';
    userDiv.innerHTML = `
      <button class="topbar-bell" title="Notificações">
        <i class="fas fa-bell"></i>
      </button>
      <div class="topbar-avatar" title="${nome}">${inicial}</div>
      <div class="topbar-uinfo">
        <div class="topbar-uname">${primeiroNome}</div>
        <div class="topbar-ulevel">${sublabel}</div>
      </div>
    `;
    topbar.appendChild(userDiv);
  } catch {}
}

document.addEventListener('DOMContentLoaded', inicializarTopbar);
