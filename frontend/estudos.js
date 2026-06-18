const API_ATIVIDADES = '/api/atividades';
const API_MATERIAS = '/api/materias';

let sessaoAtual = null;
let sessaoTimer = null;
let materiasCache = [];

function token() {
  return localStorage.getItem('xp_diario_token');
}

function cabecalhos() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token()}`
  };
}

function exibirMensagem(texto, tipo) {
  const div = document.getElementById('mensagem');
  div.className = `alert alert-${tipo} border-0 shadow-sm`;
  div.innerHTML = texto;
  if (tipo === 'success' || tipo === 'info') {
    setTimeout(() => {
      div.innerHTML = '';
      div.className = '';
    }, 6000);
  }
}

function formatarData(valor) {
  return formatarDataBr(valor) || '-';
}

function formatarDuracaoSegundos(totalSegundos) {
  const minutos = Math.floor(totalSegundos / 60);
  const segundos = totalSegundos % 60;
  return `${String(minutos).padStart(2, '0')}:${String(segundos).padStart(2, '0')}`;
}

function atualizarPainelSessao() {
  const emAndamento = Boolean(sessaoAtual);
  const display = document.getElementById('timer-display');
  const subtitulo = document.getElementById('timer-subtitle');
  const badge = document.getElementById('sessao-disciplina-badge');
  const btnAbrir = document.getElementById('btn-abrir-sessao');
  const btnParar = document.getElementById('btn-parar-sessao');
  const status = document.getElementById('sessao-status');
  const statusDetalhe = document.getElementById('sessao-status-detalhe');
  const disciplinaDetalhe = document.getElementById('sessao-disciplina-detalhe');
  const inicioDetalhe = document.getElementById('sessao-inicio-detalhe');
  const duracaoDetalhe = document.getElementById('sessao-duracao-detalhe');
  const minutosSalvos = document.getElementById('sessao-minutos');
  const xpSessao = document.getElementById('sessao-xp');
  const balao = document.getElementById('sessao-balao');

  if (!emAndamento) {
    display.textContent = '00:00';
    subtitulo.textContent = 'Escolha uma disciplina e comece.';
    badge.textContent = 'Nenhuma disciplina selecionada';
    status.innerHTML = '<i class="fas fa-circle"></i> Pronto para iniciar';
    statusDetalhe.textContent = 'Não iniciada';
    disciplinaDetalhe.textContent = 'Aguardando início';
    inicioDetalhe.textContent = '--:--';
    duracaoDetalhe.textContent = '00:00';
    minutosSalvos.textContent = '0 min';
    xpSessao.textContent = '0 XP';
    balao.textContent = 'Cada minuto conta!';
    btnAbrir.classList.remove('d-none');
    btnParar.classList.add('d-none');
    return;
  }

  const duracaoSeg = Math.max(0, Math.floor((Date.now() - sessaoAtual.inicioMs) / 1000));
  const duracaoTxt = formatarDuracaoSegundos(duracaoSeg);
  const minutosInteiros = Math.floor(duracaoSeg / 60);
  display.textContent = duracaoTxt;
  subtitulo.textContent = 'Sua sessão está em andamento.';
  badge.textContent = sessaoAtual.disciplinaNome;
  status.innerHTML = '<i class="fas fa-circle"></i> Sessão em andamento';
  statusDetalhe.textContent = 'Gravando tempo';
  disciplinaDetalhe.textContent = sessaoAtual.disciplinaNome;
  inicioDetalhe.textContent = sessaoAtual.inicioLabel;
  duracaoDetalhe.textContent = duracaoTxt;
  minutosSalvos.textContent = `${minutosInteiros} min`;
  xpSessao.textContent = `${minutosInteiros} XP`;
  balao.textContent = 'Continue assim! Seu XP está subindo.';
  btnAbrir.classList.add('d-none');
  btnParar.classList.remove('d-none');
}

async function carregarMaterias() {
  try {
    const res = await fetch(API_MATERIAS, { headers: cabecalhos() });
    const materias = await res.json();
    materiasCache = Array.isArray(materias) ? materias : [];
    const select = document.getElementById('sessaoMateria');
    if (!select) return;
    if (!materiasCache.length) {
      select.innerHTML = '<option value="">Nenhuma disciplina cadastrada</option>';
      return;
    }
    select.innerHTML = '<option value="">Selecione uma disciplina</option>' +
      materiasCache.map((m) => `<option value="${m.di_id}">${m.di_disciplina}</option>`).join('');
  } catch (err) {
    console.error('Erro ao carregar matérias:', err);
  }
}

function abrirModalSessao() {
  abrirGameModal('modalSessaoInicio');
}

function iniciarSessao() {
  const select = document.getElementById('sessaoMateria');
  const disciplinaId = Number(select.value);
  const disciplina = materiasCache.find((m) => Number(m.di_id) === disciplinaId);

  if (!disciplina) {
    exibirMensagem('Selecione uma disciplina para iniciar a sessão.', 'danger');
    return;
  }

  sessaoAtual = {
    disciplinaId,
    disciplinaNome: disciplina.di_disciplina,
    inicioMs: Date.now(),
    inicioLabel: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  };

  fecharGameModal('modalSessaoInicio');
  clearInterval(sessaoTimer);
  sessaoTimer = setInterval(atualizarPainelSessao, 1000);
  atualizarPainelSessao();
}

async function encerrarSessao() {
  if (!sessaoAtual) return;

  clearInterval(sessaoTimer);
  sessaoTimer = null;

  const duracaoSeg = Math.max(0, Math.floor((Date.now() - sessaoAtual.inicioMs) / 1000));
  const minutosInteiros = Math.floor(duracaoSeg / 60);

  if (minutosInteiros <= 0) {
    exibirMensagem('A sessão precisa ter pelo menos 1 minuto para ser registrada.', 'warning');
    sessaoAtual = null;
    atualizarPainelSessao();
    return;
  }

  try {
    const res = await fetch(API_ATIVIDADES, {
      method: 'POST',
      headers: cabecalhos(),
      body: JSON.stringify({
        at_disciplina: sessaoAtual.disciplinaId,
        at_tempo_min: minutosInteiros,
        at_tarefas_concluidas: 0
      })
    });

    const dados = await res.json();
    if (!res.ok) {
      exibirMensagem(dados.erro || 'Erro ao salvar a sessão.', 'danger');
      sessaoAtual = null;
      atualizarPainelSessao();
      return;
    }

    exibirMensagem(`Sessão salva com sucesso. ${minutosInteiros} minuto(s) registrados em ${sessaoAtual.disciplinaNome}.`, 'success');
    sessaoAtual = null;
    atualizarPainelSessao();
    await carregarHistorico();
    await carregarUsuarioAtual();
  } catch (err) {
    console.error('Erro ao encerrar sessão:', err);
    exibirMensagem('Erro ao conectar com o servidor.', 'danger');
    sessaoAtual = null;
    atualizarPainelSessao();
  }
}

async function carregarHistorico() {
  const lista = document.getElementById('lista');
  try {
    const res = await fetch(API_ATIVIDADES, { headers: cabecalhos() });
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }

    const dados = await res.json();
    const historico = dados.historico || [];

    if (!historico.length) {
      lista.innerHTML = `
        <div class="p-5 text-center text-muted">
          <i class="fas fa-book-open fs-2 mb-3 d-block" style="color: #d1c4e9;"></i>
          <p class="mb-0">Nenhum registro encontrado. Inicie sua primeira sessão de estudo.</p>
        </div>`;
      return;
    }

    lista.innerHTML = `
      <div class="d-flex justify-content-between align-items-center px-2 pt-1 pb-3">
        <span class="fw-semibold text-muted" style="font-size: 0.85rem;">
          <i class="fas fa-history me-1"></i> ${historico.length} registro${historico.length !== 1 ? 's' : ''} encontrado${historico.length !== 1 ? 's' : ''}
        </span>
        <span class="xp-badge">
          <i class="fas fa-clock"></i>
          ${historico.reduce((acc, a) => acc + Number(a.at_tempo_min || 0), 0)} min totais
        </span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Disciplina</th>
              <th>Data</th>
              <th>Tempo</th>
              <th>Tarefas</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            ${historico.map((a) => `
              <tr>
                <td><span class="fw-semibold">${a.di_disciplina || '-'}</span></td>
                <td class="text-muted small">${formatarData(a.at_data)}</td>
                <td><span class="xp-badge"><i class="fas fa-clock"></i> ${a.at_tempo_min} min</span></td>
                <td class="text-muted">${a.at_tarefas_concluidas > 0 ? a.at_tarefas_concluidas : '—'}</td>
                <td class="text-muted small">${a.at_descricao || 'Sessão registrada pelo timer'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (err) {
    console.error('Erro ao carregar histórico:', err);
    lista.innerHTML = `<div class="p-4 text-center text-danger">Erro ao carregar o histórico.</div>`;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!token()) {
    window.location.href = '/login';
    return;
  }
  await carregarUsuarioAtual();
  await carregarMaterias();
  await carregarHistorico();
  atualizarPainelSessao();
});
