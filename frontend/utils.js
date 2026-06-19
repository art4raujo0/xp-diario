function sair(e) {
  if (e) e.preventDefault();
  localStorage.removeItem('xp_diario_token');
  window.location.href = '/login';
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('open');
  document.querySelector('.sidebar-overlay').classList.toggle('open');
}

function formatarDataBr(valor) {
  if (!valor) return '';
  const texto = String(valor).slice(0, 10);
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) return texto;
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split('-');
    return `${dia}/${mes}/${ano}`;
  }
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '';
  return data.toLocaleDateString('pt-BR');
}

function dataBrParaIso(valor) {
  const texto = String(valor || '').trim();
  if (!texto) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) return texto;
  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (!match) return '';
  const ano = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${ano}-${match[2]}-${match[1]}`;
}

function inicializarCampoData(seletor, opcoes = {}) {
  if (!window.flatpickr) return null;
  const el = document.querySelector(seletor);
  if (!el) return null;
  return flatpickr(el, {
    allowInput: true,
    locale: flatpickr.l10ns.pt,
    dateFormat: 'd/m/Y',
    disableMobile: true,
    ...opcoes
  });
}

function abrirGameModal(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const modal = bootstrap.Modal.getOrCreateInstance(el);
  modal.show();
  return modal;
}

function fecharGameModal(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const modal = bootstrap.Modal.getInstance(el);
  if (modal) modal.hide();
}

function hexToRgba(hex, alpha) {
  const r = parseInt((hex || '#94a3b8').slice(1, 3), 16);
  const g = parseInt((hex || '#94a3b8').slice(3, 5), 16);
  const b = parseInt((hex || '#94a3b8').slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
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
