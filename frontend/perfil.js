function token() { return localStorage.getItem('xp_diario_token'); }
function cab() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token()}` };
}

const RANKS = [
  { min: 0,    max: 99,   nome: 'Iniciante',    cor: '#94a3b8', bg: '#f1f5f9', icone: 'fa-seedling'  },
  { min: 100,  max: 499,  nome: 'Aprendiz',     cor: '#16a34a', bg: '#f0fdf4', icone: 'fa-star'      },
  { min: 500,  max: 1499, nome: 'Estudioso',    cor: '#3b82f6', bg: '#eff6ff', icone: 'fa-book-open' },
  { min: 1500, max: 2999, nome: 'Dedicado',     cor: '#f59e0b', bg: '#fff7ed', icone: 'fa-fire'      },
  { min: 3000, max: 5999, nome: 'Especialista', cor: '#8b5cf6', bg: '#ede9fe', icone: 'fa-gem'       },
  { min: 6000, max: null, nome: 'Mestre',       cor: '#463acb', bg: '#eef2ff', icone: 'fa-crown'     },
];

function rankAtual(pontos) {
  return RANKS.findLast(r => pontos >= r.min) || RANKS[0];
}

function proximoRank(pontos) {
  return RANKS.find(r => r.min > pontos) || null;
}

function pctParaProximo(pontos) {
  const prox = proximoRank(pontos);
  if (!prox) return 100;
  const rank = rankAtual(pontos);
  return Math.round(((pontos - rank.min) / (prox.min - rank.min)) * 100);
}

function iniciais(nome) {
  return (nome || '?').trim().split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

function apelido(nome) {
  return (nome || 'Estudante').trim().split(' ')[0] || 'Estudante';
}

async function carregarPerfil() {
  try {
    const [resPerfil, resStreak, resConquistas] = await Promise.all([
      fetch('/api/perfil',      { headers: cab() }),
      fetch('/api/streak',      { headers: cab() }),
      fetch('/api/conquistas',  { headers: cab() }),
    ]);

    if (resPerfil.status === 401) { window.location.href = '/login'; return; }

    const { perfil }     = await resPerfil.json();
    const dadosStreak    = await resStreak.json();
    const dadosConq      = await resConquistas.json();

    const pontos      = Number(perfil.us_pontos_total || 0);
    const streak      = dadosStreak.streak || 0;
    const totalSessoes= dadosStreak.total_registros || 0;
    const conquistas  = dadosConq.conquistas || [];
    const desbloqueadas = conquistas.filter(c => c.status === 'desbloqueada').length;

    const rank  = rankAtual(pontos);
    const prox  = proximoRank(pontos);
    const pct   = pctParaProximo(pontos);

    document.getElementById('conteudo').innerHTML = `
      <div class="perfil-hero mb-4">
        <div class="perfil-avatar">${iniciais(perfil.us_nome)}</div>
        <div>
          <div class="perfil-nome">${apelido(perfil.us_nome)}</div>
          <div class="perfil-email">${perfil.us_email}</div>
          <div class="perfil-email">Classe: <strong style="color:${rank.cor};">${rank.nome}</strong></div>
        </div>
      </div>

      <div class="rank-progresso-card mb-4">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="fw-semibold" style="font-size:0.9rem;color:#1e293b;">
            <i class="fas ${rank.icone} me-1" style="color:${rank.cor};"></i>${rank.nome}
          </span>
          ${prox
            ? `<span style="font-size:0.85rem;font-weight:600;color:${rank.cor};">${pct}%</span>`
            : `<span style="font-size:0.8rem;color:#f59e0b;font-weight:700;"><i class="fas fa-crown me-1"></i>Rank máximo!</span>`
          }
        </div>
        <div class="progress" style="height:10px;">
          <div class="progress-bar" role="progressbar" style="width:${pct}%;background:${rank.cor};"></div>
        </div>
        ${prox
          ? `<div class="rank-proxximo">
               <i class="fas ${prox.icone} me-1" style="color:${prox.cor};"></i>
               Próximo rank: <strong>${prox.nome}</strong> — faltam <strong>${(prox.min - pontos).toLocaleString('pt-BR')} XP</strong>
             </div>`
          : ''
        }
      </div>

      <div class="row g-3">
        <div class="col-sm-4">
          <div class="stat-mini">
            <div class="stat-mini-icon icon-orange"><i class="fas fa-fire"></i></div>
            <div>
              <div class="stat-mini-valor">${streak}</div>
              <div class="stat-mini-label">Dias de sequência</div>
            </div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="stat-mini">
            <div class="stat-mini-icon icon-blue"><i class="fas fa-clock"></i></div>
            <div>
              <div class="stat-mini-valor">${totalSessoes}</div>
              <div class="stat-mini-label">Sessões registradas</div>
            </div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="stat-mini">
            <div class="stat-mini-icon icon-purple"><i class="fas fa-trophy"></i></div>
            <div>
              <div class="stat-mini-valor">${desbloqueadas}/${conquistas.length}</div>
              <div class="stat-mini-label">Conquistas</div>
            </div>
          </div>
        </div>
      </div>`;
  } catch (err) {
    console.error(err);
    document.getElementById('conteudo').innerHTML = `
      <div class="card-panel p-4 text-center">
        <span class="text-danger">Erro ao carregar perfil.</span>
      </div>`;
  }
}

if (!token()) { window.location.href = '/login'; } else { carregarPerfil(); }
