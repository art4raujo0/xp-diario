const CTX_KEY = 'xp_diario_contexto';

function getContexto() {
  try {
    const raw = localStorage.getItem(CTX_KEY);
    return raw ? JSON.parse(raw) : { tipo: 'pessoal', turma_id: null, turma_nome: 'Minha Área' };
  } catch {
    return { tipo: 'pessoal', turma_id: null, turma_nome: 'Minha Área' };
  }
}

function getUserTipo() {
  try {
    const token = localStorage.getItem('xp_diario_token');
    if (!token) return 'aluno';
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.tipo || 'aluno';
  } catch {
    return 'aluno';
  }
}

function renderizarContextoSidebar() {
  const ctx = getContexto();
  const nomeEl = document.getElementById('ctx-nome');
  const iconEl = document.getElementById('ctx-icon');
  if (!nomeEl || !iconEl) return;

  const nome = ctx.turma_nome || 'Minha Área';
  nomeEl.textContent = nome;

  if (ctx.tipo === 'pessoal') {
    iconEl.innerHTML = '<i class="fas fa-user" style="font-size:0.85rem;"></i>';
    iconEl.style.background = '#685ed4';
    iconEl.style.fontSize = '';
  } else {
    iconEl.textContent = nome.charAt(0).toUpperCase();
    iconEl.style.background = '#463acb';
    iconEl.style.fontSize = '0.9rem';
  }
}

let _todasTurmas = [];

function abrirContexto() {
  if (!document.getElementById('ctx-overlay')) {
    const el = document.createElement('div');
    el.className = 'ctx-overlay';
    el.id = 'ctx-overlay';
    el.innerHTML = `
      <div class="ctx-modal">
        <div class="ctx-modal-header">
          <div>
            <p class="ctx-modal-title">Explorar Contextos</p>
            <p class="ctx-modal-sub">Navegue entre suas turmas e área pessoal</p>
          </div>
          <button class="ctx-close" onclick="fecharContexto()"><i class="fas fa-times"></i></button>
        </div>
        <div class="ctx-search-wrap">
          <i class="fas fa-search ctx-search-icon"></i>
          <input type="text" id="ctx-search" class="ctx-search" placeholder="Buscar turma…" oninput="filtrarContextos(this.value)">
        </div>
        <div id="ctx-list"><div style="padding:24px;text-align:center;color:#94a3b8;font-size:0.85rem;"><i class="fas fa-spinner fa-spin me-2"></i>Carregando…</div></div>
      </div>`;
    el.addEventListener('click', (e) => { if (e.target === el) fecharContexto(); });
    document.body.appendChild(el);
  }

  requestAnimationFrame(() => {
    document.getElementById('ctx-overlay').classList.add('open');
  });
  _carregarTurmasContexto();
}

function fecharContexto() {
  const el = document.getElementById('ctx-overlay');
  if (el) el.classList.remove('open');
}

async function _carregarTurmasContexto() {
  const token = localStorage.getItem('xp_diario_token');
  if (!token) return;
  try {
    const res = await fetch('/api/turmas', { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return;
    const dados = await res.json();
    _todasTurmas = dados.turmas || [];
    _renderizarOpcoes(_todasTurmas);
  } catch (err) {
    console.error('Erro ao carregar turmas:', err);
  }
}

function _renderizarOpcoes(turmas) {
  const lista = document.getElementById('ctx-list');
  if (!lista) return;

  const ctx = getContexto();
  const pessoalAtivo = ctx.tipo === 'pessoal';
  const tipo = getUserTipo();

  let html = `
    <div class="ctx-section-label">Pessoal</div>
    <div class="ctx-option${pessoalAtivo ? ' active' : ''}" onclick="selecionarContexto('pessoal',null,'Minha Área')">
      <div class="ctx-option-icon" style="background:${pessoalAtivo ? '#463acb' : '#ede9fe'};color:${pessoalAtivo ? '#fff' : '#7c3aed'};">
        <i class="fas fa-user"></i>
      </div>
      <div style="flex:1;min-width:0;">
        <div class="ctx-option-nome">Minha Área</div>
        <div class="ctx-option-sub">Estudos pessoais e autônomos</div>
      </div>
      ${pessoalAtivo ? '<i class="fas fa-circle-check" style="color:#463acb;margin-left:auto;flex-shrink:0;"></i>' : ''}
    </div>`;

  html += `<div class="ctx-section-label" style="margin-top:14px;">Turmas / Organizações</div>`;

  if (turmas.length === 0) {
    html += `
      <div style="padding:16px 8px;text-align:center;color:#94a3b8;font-size:0.85rem;">
        <i class="fas fa-users" style="display:block;font-size:1.5rem;margin-bottom:8px;"></i>
        Nenhuma turma encontrada.<br>
        <a href="/turmas" onclick="fecharContexto()" style="color:#463acb;font-weight:600;text-decoration:none;margin-top:6px;display:inline-block;">
          ${tipo === 'professor' || tipo === 'admin' ? 'Criar uma turma' : 'Entrar em uma turma'}
        </a>
      </div>`;
  } else {
    turmas.forEach(t => {
      const ativo = ctx.tipo === 'turma' && ctx.turma_id === t.tu_id;
      const inicial = (t.tu_nome || '?').charAt(0).toUpperCase();
      const sub = t.professor_nome
        ? 'Prof. ' + t.professor_nome
        : (t.total_alunos != null ? t.total_alunos + ' aluno(s)' : '');
      const inativa = !t.tu_ativa ? ' · Inativa' : '';
      html += `
        <div class="ctx-option${ativo ? ' active' : ''}" onclick="selecionarContexto('turma',${t.tu_id},${JSON.stringify(t.tu_nome)})">
          <div class="ctx-option-icon" style="background:${ativo ? '#463acb' : '#ede9fe'};color:${ativo ? '#fff' : '#7c3aed'};font-weight:700;font-size:0.9rem;">
            ${inicial}
          </div>
          <div style="flex:1;min-width:0;">
            <div class="ctx-option-nome">${t.tu_nome}</div>
            <div class="ctx-option-sub">${sub}${inativa}</div>
          </div>
          ${ativo ? '<i class="fas fa-circle-check" style="color:#463acb;margin-left:auto;flex-shrink:0;"></i>' : ''}
        </div>`;
    });
  }

  html += `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;">
      <a href="/turmas" onclick="fecharContexto()"
        style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:8px;text-decoration:none;color:#463acb;font-size:0.85rem;font-weight:600;transition:background 0.12s;"
        onmouseover="this.style.background='#ede9fe'" onmouseout="this.style.background='transparent'">
        <i class="fas fa-cog"></i> Gerenciar Turmas
      </a>
    </div>`;

  lista.innerHTML = html;
}

function selecionarContexto(tipo, turmaId, turmaNome) {
  localStorage.setItem(CTX_KEY, JSON.stringify({ tipo, turma_id: turmaId, turma_nome: turmaNome }));
  _renderizarOpcoes(_todasTurmas);
  renderizarContextoSidebar();
  renderizarContextoBanner();
  fecharContexto();
}

function renderizarContextoBanner() {
  const existente = document.getElementById('ctx-banner');
  if (existente) existente.remove();

  const ctx = getContexto();
  if (ctx.tipo !== 'turma') return;

  const banner = document.createElement('div');
  banner.id = 'ctx-banner';
  banner.className = 'ctx-banner';
  banner.innerHTML = `
    <i class="fas fa-users" style="flex-shrink:0;"></i>
    <span>Contexto: <strong>${ctx.turma_nome}</strong></span>
    <button class="ctx-banner-close" onclick="selecionarContexto('pessoal',null,'Minha Área')" title="Sair do contexto da turma">
      <i class="fas fa-times"></i> Sair
    </button>`;

  const topbar = document.querySelector('.content .topbar');
  if (topbar) topbar.after(banner);
}

function filtrarContextos(busca) {
  const filtradas = !busca.trim()
    ? _todasTurmas
    : _todasTurmas.filter(t => t.tu_nome.toLowerCase().includes(busca.toLowerCase()));
  _renderizarOpcoes(filtradas);
}

document.addEventListener('DOMContentLoaded', () => {
  renderizarContextoSidebar();
  renderizarContextoBanner();
});
