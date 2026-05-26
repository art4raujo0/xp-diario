const API = '/api/conquistas';

function token() { return localStorage.getItem('xp_diario_token'); }
function cabecalhos() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` };
}

function formatarData(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

function iconePorTipo(tipo) {
  if (tipo === 'streak_dias')      return 'fa-fire';
  if (tipo === 'tempo_minutos')    return 'fa-clock';
  if (tipo === 'metas_concluidas') return 'fa-bullseye';
  return 'fa-star';
}

function coresPorTipo(tipo) {
  if (tipo === 'streak_dias')      return { bg: '#fff7ed', cor: '#ea580c' };
  if (tipo === 'tempo_minutos')    return { bg: '#eff6ff', cor: '#3b82f6' };
  if (tipo === 'metas_concluidas') return { bg: '#ede9fe', cor: '#463acb' };
  return { bg: '#f0fdf4', cor: '#16a34a' };
}

function descricaoCriterio(tipo, valor) {
  if (tipo === 'streak_dias')      return `${valor} dia${valor > 1 ? 's' : ''} de sequência`;
  if (tipo === 'tempo_minutos') {
    if (valor >= 60) {
      const h = Math.floor(valor / 60);
      const m = valor % 60;
      return m > 0 ? `${h}h ${m}min estudados` : `${h}h estudada${h > 1 ? 's' : ''}`;
    }
    return `${valor} minutos estudados`;
  }
  if (tipo === 'metas_concluidas') return `${valor} meta${valor > 1 ? 's' : ''} concluída${valor > 1 ? 's' : ''}`;
  return '';
}

function renderCard(c) {
  const desbloqueada = c.status === 'desbloqueada';
  const { bg, cor } = coresPorTipo(c.criterio.tipo);
  const icone = iconePorTipo(c.criterio.tipo);
  const iconeCor = desbloqueada ? cor : '#94a3b8';
  const iconeBg  = desbloqueada ? bg  : '#f1f5f9';

  return `
    <div class="col-sm-6 col-md-4 col-lg-3">
      <div class="conquista-card ${desbloqueada ? 'desbloqueada' : 'bloqueada'}">
        <div class="conquista-icon" style="background:${iconeBg};color:${iconeCor};">
          <i class="fas ${desbloqueada ? icone : 'fa-lock'}"></i>
        </div>
        <div class="conquista-titulo">${c.co_titulo}</div>
        <div class="conquista-desc">${c.co_descricao}</div>
        <div class="conquista-criterio">
          <i class="fas ${icone} me-1"></i>${descricaoCriterio(c.criterio.tipo, c.criterio.valor)}
        </div>
        ${desbloqueada
          ? `<span class="badge-desbloqueada"><i class="fas fa-check-circle"></i> Desbloqueada</span>
             <div class="conquista-data">${formatarData(c.desbloqueadoEm)}</div>`
          : `<span class="badge-bloqueada"><i class="fas fa-lock"></i> Bloqueada</span>`
        }
      </div>
    </div>`;
}

async function carregarConquistas() {
  try {
    const res = await fetch(API, { headers: cabecalhos() });
    if (res.status === 401) { window.location.href = '/login'; return; }

    const dados = await res.json();
    const conquistas = dados.conquistas || [];
    const lista = document.getElementById('lista');

    if (!conquistas.length) {
      lista.innerHTML = `
        <div class="card-panel p-5 text-center text-muted">
          <i class="fas fa-trophy fs-2 mb-3 d-block" style="color:#d1c4e9;"></i>
          <p class="mb-0">Nenhuma conquista encontrada.</p>
        </div>`;
      return;
    }

    const desbloqueadas = conquistas.filter(c => c.status === 'desbloqueada').length;
    const total = conquistas.length;
    const pct = Math.round((desbloqueadas / total) * 100);

    document.getElementById('total-desbloqueadas').textContent = desbloqueadas;
    document.getElementById('total-conquistas').textContent = total;
    document.getElementById('pct-label').textContent = pct + '%';
    document.getElementById('pct-bar').style.width = pct + '%';
    document.getElementById('resumo').classList.remove('d-none');

    const desbloqueadasFirst = [
      ...conquistas.filter(c => c.status === 'desbloqueada'),
      ...conquistas.filter(c => c.status !== 'desbloqueada')
    ];

    lista.innerHTML = `<div class="row g-3">${desbloqueadasFirst.map(renderCard).join('')}</div>`;
  } catch (err) {
    console.error(err);
    document.getElementById('lista').innerHTML = `
      <div class="card-panel p-4 text-center">
        <span class="text-danger">Erro ao carregar conquistas.</span>
      </div>`;
  }
}

if (!token()) { window.location.href = '/login'; } else { carregarConquistas(); }
