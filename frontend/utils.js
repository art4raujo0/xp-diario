function sair(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('xp_diario_token');
  window.location.href = '/login';
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.sidebar-overlay').classList.toggle('open');
}

function nivelPorXp(xp) {
  return Math.max(1, Math.floor(Number(xp || 0) / 100) + 1);
}

async function carregarUsuarioAtual() {
  const token = localStorage.getItem('xp_diario_token');
  if (!token) return null;

  try {
    const resposta = await fetch('/api/perfil', {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (resposta.status === 401) {
      window.location.href = '/login';
      return null;
    }

    if (!resposta.ok) return null;

    const dados = await resposta.json();
    const perfil = dados.perfil;
    const nome = perfil?.us_nome || perfil?.us_email || 'Estudante';
    const xp = Number(perfil?.us_pontos_total || 0);
    const nivel = nivelPorXp(xp);

    document.querySelectorAll('[data-user-name]').forEach((el) => {
      el.textContent = nome;
    });
    document.querySelectorAll('[data-user-first-name]').forEach((el) => {
      el.textContent = nome.split(' ')[0] || nome;
    });
    document.querySelectorAll('[data-user-level]').forEach((el) => {
      el.textContent = `Nivel ${nivel}`;
    });
    document.querySelectorAll('[data-user-xp]').forEach((el) => {
      el.textContent = xp.toLocaleString('pt-BR');
    });

    return { ...perfil, nivel };
  } catch (erro) {
    console.error('Erro ao carregar usuario atual:', erro);
    return null;
  }
}
