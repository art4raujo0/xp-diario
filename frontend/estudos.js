const API_MATERIAS = '/api/materias';
const API_SESSOES = '/api/sessoes';
const API_ATIVIDADES = '/api/atividades';

let sessaoAtual = null;
let sessaoTimer = null;
let materiasCache = [];

function token() {
  return localStorage.getItem('xp_diario_token');
}

function cabecalhos() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`
  };
}

function exibirMensagem(texto, tipo) {
  const div = document.getElementById('mensagem');
  div.className = `alert alert-${tipo} border-0 shadow-sm`;
  div.textContent = texto;
  if (tipo === 'success' || tipo === 'info') {
    setTimeout(() => {
      div.className = '';
      div.textContent = '';
    }, 5000);
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

function disciplinaNomePorId(id) {
  return materiasCache.find((item) => Number(item.di_id) === Number(id))?.di_disciplina || 'Disciplina nao encontrada';
}

function segundosDaSessao() {
  if (!sessaoAtual) return 0;
  const base = Number(sessaoAtual.segundos_base || 0);
  if (sessaoAtual.status === 'iniciada' && sessaoAtual.anchor_ms) {
    return base + Math.max(0, Math.floor((Date.now() - sessaoAtual.anchor_ms) / 1000));
  }
  return base;
}

function atualizarPainelSessao() {
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
  const foco = document.getElementById('sessao-foco');
  const balao = document.getElementById('sessao-balao');

  if (!sessaoAtual) {
    display.textContent = '00:00';
    subtitulo.textContent = 'Escolha uma disciplina e comece.';
    badge.textContent = 'Nenhuma disciplina selecionada';
    status.innerHTML = '<i class="fas fa-circle"></i> Pronto para iniciar';
    statusDetalhe.textContent = 'Nao iniciada';
    disciplinaDetalhe.textContent = 'Aguardando inicio';
    inicioDetalhe.textContent = '--:--';
    duracaoDetalhe.textContent = '00:00';
    minutosSalvos.textContent = '0 min';
    xpSessao.textContent = '0 XP';
    foco.textContent = '100%';
    balao.textContent = 'Cada minuto conta!';
    btnAbrir.classList.remove('d-none');
    btnParar.classList.add('d-none');
    return;
  }

  const totalSegundos = segundosDaSessao();
  const minutosInteiros = Math.floor(totalSegundos / 60);
  const nomeDisciplina = disciplinaNomePorId(sessaoAtual.disciplina);

  display.textContent = formatarDuracaoSegundos(totalSegundos);
  subtitulo.textContent = sessaoAtual.descricao || 'Sua sessao esta em andamento.';
  badge.textContent = nomeDisciplina;
  status.innerHTML = '<i class="fas fa-circle"></i> Sessao em andamento';
  statusDetalhe.textContent = sessaoAtual.status === 'pausada' ? 'Pausada' : 'Gravando tempo';
  disciplinaDetalhe.textContent = nomeDisciplina;
  inicioDetalhe.textContent = sessaoAtual.inicio_label || '--:--';
  duracaoDetalhe.textContent = formatarDuracaoSegundos(totalSegundos);
  minutosSalvos.textContent = `${minutosInteiros} min`;
  xpSessao.textContent = `${minutosInteiros} XP`;
  const focoValor = Math.max(80, 100 - Math.floor(totalSegundos / 300));
  foco.textContent = `${focoValor}%`;
  const focoFill = document.getElementById('foco-medio-fill');
  const focoLabel = document.getElementById('foco-medio-label');
  if (focoFill) focoFill.style.width = `${focoValor}%`;
  if (focoLabel) focoLabel.textContent = `${focoValor}%`;
  balao.textContent = 'Continue assim! Seu XP esta subindo.';
  btnAbrir.classList.add('d-none');
  btnParar.classList.remove('d-none');

  const rowDesc = document.getElementById('row-descricao');
  const rowTar = document.getElementById('row-tarefas');
  const rowTipo = document.getElementById('row-tipo-estudo');
  if (rowDesc) {
    rowDesc.style.display = sessaoAtual.descricao ? '' : 'none';
    const el = document.getElementById('sessao-descricao-detalhe');
    if (el) el.textContent = sessaoAtual.descricao || '';
  }
  if (rowTar) {
    rowTar.style.display = sessaoAtual.tarefas > 0 ? '' : 'none';
    const el = document.getElementById('sessao-tarefas-detalhe');
    if (el) el.textContent = sessaoAtual.tarefas;
  }
  if (rowTipo) {
    const tipoLabel = { leitura: 'Leitura', revisao: 'Revisão', exercicios: 'Exercícios', videoaula: 'Videoaula', pratica: 'Prática' };
    rowTipo.style.display = sessaoAtual.tipo_estudo ? '' : 'none';
    const el = document.getElementById('sessao-tipo-detalhe');
    if (el) el.textContent = tipoLabel[sessaoAtual.tipo_estudo] || sessaoAtual.tipo_estudo || '';
  }
}

function abrirModalSessao() {
  const desc = document.getElementById('sessaoDescricao');
  const tar = document.getElementById('sessaoTarefas');
  const tipo = document.getElementById('sessaoTipoEstudo');
  if (desc) desc.value = '';
  if (tar) tar.value = '0';
  if (tipo) tipo.value = '';
  abrirGameModal('modalSessaoInicio');
}

async function carregarMaterias() {
  const res = await fetch(API_MATERIAS, { headers: cabecalhos() });
  const materias = await res.json();
  materiasCache = Array.isArray(materias) ? materias : [];
  const select = document.getElementById('sessaoMateria');
  if (!select) return;
  select.innerHTML = materiasCache.length
    ? '<option value="">Selecione uma disciplina</option>' + materiasCache.map((m) => `<option value="${m.di_id}">${m.di_disciplina}</option>`).join('')
    : '<option value="">Nenhuma disciplina cadastrada</option>';
}

async function carregarSessaoAtiva() {
  try {
    const res = await fetch(`${API_SESSOES}/ativa`, { headers: cabecalhos() });
    if (!res.ok) return;
    const dados = await res.json();
    const sessao = dados.sessao;
    if (!sessao) {
      sessaoAtual = null;
      clearInterval(sessaoTimer);
      sessaoTimer = null;
      atualizarPainelSessao();
      return;
    }

    sessaoAtual = {
      id: sessao.id,
      status: sessao.status,
      disciplina: sessao.disciplina,
      descricao: sessao.descricao || null,
      tarefas: Number(sessao.tarefas || 0),
      tipo_estudo: sessao.tipo_estudo || null,
      inicio_label: sessao.inicio
        ? new Date(sessao.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        : '--:--',
      segundos_base: Number(sessao.segundos_correntes != null ? sessao.segundos_correntes : (sessao.segundos_focados || 0)),
      anchor_ms: sessao.status === 'iniciada' ? Date.now() : null,
    };
    clearInterval(sessaoTimer);
    sessaoTimer = setInterval(atualizarPainelSessao, 1000);
    atualizarPainelSessao();
  } catch (erro) {
    console.error('Erro ao carregar sessao ativa:', erro);
  }
}

async function iniciarSessao() {
  const select = document.getElementById('sessaoMateria');
  const disciplina = Number(select.value);
  if (!disciplina) {
    exibirMensagem('Selecione uma disciplina para iniciar a sessao.', 'danger');
    return;
  }

  const descricao = (document.getElementById('sessaoDescricao')?.value || '').trim();
  const tarefas = Math.max(0, Number(document.getElementById('sessaoTarefas')?.value || 0));
  const tipoEstudo = (document.getElementById('sessaoTipoEstudo')?.value || '').trim() || null;

  try {
    const res = await fetch(`${API_SESSOES}/iniciar`, {
      method: 'POST',
      headers: cabecalhos(),
      body: JSON.stringify({ disciplina, descricao: descricao || null, tarefas, tipo_estudo: tipoEstudo })
    });
    const dados = await res.json();
    if (!res.ok) {
      exibirMensagem(dados.erro || 'Erro ao iniciar a sessao.', 'danger');
      return;
    }

    fecharGameModal('modalSessaoInicio');
    await carregarSessaoAtiva();
  } catch (err) {
    exibirMensagem('Nao foi possivel conectar ao servidor. Verifique sua conexao.', 'danger');
  }
}

async function encerrarSessao() {
  if (!sessaoAtual?.id) return;

  const res = await fetch(`${API_SESSOES}/${sessaoAtual.id}/encerrar`, {
    method: 'PATCH',
    headers: cabecalhos()
  });
  const dados = await res.json();
  if (!res.ok) {
    exibirMensagem(dados.erro || 'Erro ao encerrar a sessao.', 'danger');
    return;
  }

  clearInterval(sessaoTimer);
  sessaoTimer = null;
  sessaoAtual = null;
  atualizarPainelSessao();
  exibirMensagem(`Sessao salva com sucesso. ${dados.minutos || 0} minuto(s) registrados.`, 'success');
  await carregarHistorico();
  await carregarUsuarioAtual();
}

function renderCombo(historico) {
  const hoje = new Date().toISOString().slice(0, 10);
  const diasComSessao = new Set((historico || []).map((a) => String(a.at_data || '').slice(0, 10)));
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    if (diasComSessao.has(key)) streak++;
    else break;
  }

  const comboValor = document.getElementById('combo-valor');
  const comboMelhor = document.getElementById('combo-melhor');
  const comboDots = document.getElementById('combo-dots');
  if (comboValor) comboValor.textContent = `${streak} ${streak === 1 ? 'dia' : 'dias'}`;

  const semana = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    semana.push(d.toISOString().slice(0, 10));
  }
  if (comboDots) {
    const dias = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
    comboDots.innerHTML = semana.map((d, i) => {
      const done = diasComSessao.has(d);
      return `<div class="combo-dot${done ? ' done' : ''}" title="${d}">${done ? '<i class="fas fa-check" style="font-size:0.55rem;"></i>' : dias[i]}</div>`;
    }).join('');
  }
  if (comboMelhor && streak > 0) comboMelhor.textContent = `Melhor: ${streak} dias`;
}

async function carregarHistorico() {
  const lista = document.getElementById('lista');
  const res = await fetch(API_ATIVIDADES, { headers: cabecalhos() });
  if (res.status === 401) {
    window.location.href = '/login';
    return;
  }

  const dados = await res.json();
  const historico = dados.historico || [];
  renderCombo(historico);
  if (!historico.length) {
    lista.innerHTML = `
      <div class="p-5 text-center text-muted">
        <i class="fas fa-book-open fs-2 mb-3 d-block" style="color:#d1c4e9;"></i>
        <p class="mb-0">Nenhum registro encontrado. Inicie sua primeira sessao de estudo.</p>
      </div>`;
    return;
  }

  lista.innerHTML = `
    <div class="d-flex justify-content-between align-items-center px-2 pt-1 pb-3">
      <span class="fw-semibold text-muted" style="font-size:0.85rem;">
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
            <th>Descricao</th>
          </tr>
        </thead>
        <tbody>
          ${historico.map((a) => `
            <tr>
              <td><span class="fw-semibold">${a.di_disciplina || '-'}</span></td>
              <td class="text-muted small">${formatarData(a.at_data)}</td>
              <td><span class="xp-badge"><i class="fas fa-clock"></i> ${a.at_tempo_min} min</span></td>
              <td class="text-muted">${a.at_tarefas_concluidas > 0 ? a.at_tarefas_concluidas : '-'}</td>
              <td class="text-muted small">${a.at_descricao || 'Sessao registrada pelo timer'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!token()) {
    window.location.href = '/login';
    return;
  }
  await carregarUsuarioAtual();
  await carregarMaterias();
  await carregarSessaoAtiva();
  await carregarHistorico();
  atualizarPainelSessao();
});
