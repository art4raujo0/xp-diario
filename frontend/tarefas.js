const API_TAREFAS = '/api/tarefas';
const API_MATERIAS = '/api/materias';
const API_METAS = '/api/metas';
const API_ATIVIDADES = '/api/atividades';
let tarefasCache = [];
let historicoCache = [];

function token() { return localStorage.getItem('xp_diario_token'); }
function cabecalhos() { return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }; }
function formatarData(data) { return data ? formatarDataBr(data) : '-'; }
function formatarDataHora(data) { return data ? new Date(data).toLocaleString('pt-BR') : '-'; }

function exibirMensagem(texto, tipo) {
  const div = document.getElementById('mensagem');
  div.className = `alert alert-${tipo} border-0 shadow-sm`;
  div.textContent = texto;
}

function limparMensagem() {
  const div = document.getElementById('mensagem');
  div.className = '';
  div.textContent = '';
}

function mostrarForm() {
  limparMensagem();
  limparForm();
  abrirGameModal('modalTarefa');
}

function cancelar() {
  limparForm();
  fecharGameModal('modalTarefa');
}

function limparForm() {
  document.getElementById('tarefaId').value = '';
  document.getElementById('titulo').value = '';
  document.getElementById('prazo').value = '';
  document.getElementById('materia').value = '';
  document.getElementById('descricao').value = '';
  document.getElementById('btnSalvarTarefa').innerHTML = '<i class="fas fa-floppy-disk me-2"></i>Salvar Tarefa';
}

function obterTextoHistorico(item) {
  if (item.th_acao === 'criada') return 'Tarefa criada';
  if (item.th_acao === 'atualizada') return 'Dados atualizados';
  if (item.th_acao === 'status_alterado') return item.th_status_novo === 'concluida' ? 'Tarefa concluida' : 'Tarefa voltou para pendente';
  if (item.th_acao === 'excluida') return 'Tarefa excluida';
  return item.th_descricao || 'Atualizacao registrada';
}

function renderResumo(resumo) {
  const container = document.getElementById('resumo');
  const itens = [
    { label: 'Total', valor: resumo?.total || 0, icon: 'fa-list-check', klass: 'icon-blue' },
    { label: 'Pendentes', valor: resumo?.pendentes || 0, icon: 'fa-hourglass-half', klass: 'icon-orange' },
    { label: 'Concluidas', valor: resumo?.concluidas || 0, icon: 'fa-circle-check', klass: 'icon-green' },
    { label: 'Vencidas', valor: resumo?.vencidas || 0, icon: 'fa-calendar-xmark', klass: 'icon-purple' }
  ];
  container.innerHTML = itens.map((item) => `<div class="col-6 col-md-3"><div class="stat-card"><div><div class="stat-label">${item.label}</div><div class="stat-value">${item.valor}</div></div><div class="stat-icon ${item.klass}"><i class="fas ${item.icon}"></i></div></div></div>`).join('');
}

function renderListaTarefas(tarefas) {
  const lista = document.getElementById('listaTarefas');
  tarefasCache = Array.isArray(tarefas) ? tarefas : [];
  if (!tarefasCache.length) {
    lista.innerHTML = '<div class="p-5 text-center text-muted"><i class="fas fa-list-check fs-2 mb-3 d-block" style="color:#d1c4e9;"></i><p class="mb-0">Nenhuma tarefa cadastrada ainda.</p></div>';
    return;
  }

  lista.innerHTML = tarefasCache.map((tarefa) => {
    const cor = tarefa.di_cor || '#94a3b8';
    const concluida = tarefa.ta_status === 'concluida';
    const discPill = tarefa.di_disciplina
      ? `<span class="disc-pill" style="background:${hexToRgba(cor, 0.13)};color:${cor};">${tarefa.di_disciplina}</span>`
      : '';
    const prazo = tarefa.ta_prazo
      ? `<span class="task-date"><i class="fas fa-calendar-days"></i>${formatarData(tarefa.ta_prazo)}</span>`
      : '';
    const statusBadge = `<span class="task-badge ${tarefa.ta_status}"><i class="fas ${concluida ? 'fa-circle-check' : 'fa-hourglass-half'}"></i>${concluida ? 'Conc.' : 'Pendente'}</span>`;
    const desc = tarefa.ta_descricao ? `<div class="task-row-desc">${tarefa.ta_descricao}</div>` : '';

    return `<div class="task-row-item${concluida ? ' concluida' : ''}">
  <button class="task-check${concluida ? ' checked' : ''}" title="${concluida ? 'Voltar para pendente' : 'Marcar como concluida'}" onclick="alternarStatus(${tarefa.ta_id}, '${tarefa.ta_status}')">
    ${concluida ? '<i class="fas fa-check"></i>' : ''}
  </button>
  <div class="task-row-body">
    <div class="task-row-top">
      <span class="task-row-title${concluida ? ' text-decoration-line-through text-muted' : ''}">${tarefa.ta_titulo || '-'}</span>
      ${discPill}${prazo}${statusBadge}
    </div>
    ${desc}
  </div>
  <div class="task-row-actions">
    <button class="btn-icon" title="Editar" onclick="editarTarefaPorId(${tarefa.ta_id})"><i class="fas fa-pen"></i></button>
    <button class="btn-icon danger" title="Excluir" onclick="excluirTarefa(${tarefa.ta_id})"><i class="fas fa-trash"></i></button>
  </div>
</div>`;
  }).join('');
}

function montarHistoricoHtml(historico) {
  if (!historico.length) return '<div class="text-muted small">Nenhuma movimentacao registrada.</div>';
  return historico.map((item) => `<div class="history-item"><div class="history-icon"><i class="fas fa-clock-rotate-left"></i></div><div><div class="history-title">${obterTextoHistorico(item)}</div><div class="text-muted small">${item.th_titulo_snapshot}</div><div class="history-meta">${formatarDataHora(item.th_criado_em)}</div></div></div>`).join('');
}

function abrirHistoricoCompleto() {
  document.getElementById('historicoTarefasModalBody').innerHTML = montarHistoricoHtml(historicoCache);
  abrirGameModal('modalHistoricoTarefas');
}

function renderHistorico(historico) {
  historicoCache = Array.isArray(historico) ? historico : [];
  const container = document.getElementById('historicoTarefas');
  const recentes = historicoCache.slice(0, 3);
  container.innerHTML = `<div class="d-flex justify-content-between align-items-center mb-3"><h6 class="fw-bold mb-0" style="color:#1e293b;">Historico recente</h6>${historicoCache.length > 3 ? '<button class="btn btn-light btn-sm border" onclick="abrirHistoricoCompleto()">Ver mais</button>' : ''}</div>${montarHistoricoHtml(recentes)}`;
}

async function carregarMaterias() {
  const resposta = await fetch(API_MATERIAS, { headers: cabecalhos() });
  const materias = await resposta.json();
  const select = document.getElementById('materia');
  select.innerHTML = '<option value="">Sem disciplina especifica</option>' + (Array.isArray(materias) ? materias.map((materia) => `<option value="${materia.di_id}">${materia.di_disciplina}</option>`).join('') : '');
}

async function carregarMetasCards() {
  const [respostaMetas, respostaAtividades] = await Promise.all([
    fetch(API_METAS, { headers: cabecalhos() }),
    fetch(API_ATIVIDADES, { headers: cabecalhos() })
  ]);
  const metas = respostaMetas.ok ? await respostaMetas.json() : [];
  const atividades = respostaAtividades.ok ? ((await respostaAtividades.json()).historico || []) : [];
  const diarias = metas.filter((item) => item.me_tipo === 'diaria').slice(0, 2);
  const semanais = metas.filter((item) => item.me_tipo === 'semanal').slice(0, 2);

  const hoje = new Date().toISOString().slice(0, 10);
  const chavesSemana = Array.from({ length: 7 }, (_, indice) => {
    const data = new Date();
    data.setDate(data.getDate() - indice);
    return data.toISOString().slice(0, 10);
  });

  function progressoMeta(item, tipo) {
    const totalEstudado = atividades.reduce((acc, atividade) => {
      const dia = String(atividade.at_data || '').slice(0, 10);
      const mesmaDisciplina = !item.me_disciplina || Number(atividade.at_disciplina) === Number(item.me_disciplina);
      const periodoCompativel = tipo === 'diaria' ? dia === hoje : chavesSemana.includes(dia);
      return acc + (mesmaDisciplina && periodoCompativel ? Number(atividade.at_tempo_min || 0) : 0);
    }, 0);
    return Math.min(100, item.me_tempo_min > 0 ? Math.floor((totalEstudado / item.me_tempo_min) * 100) : 0);
  }

  document.getElementById('metas-diarias-card').innerHTML = diarias.length
    ? diarias.map((item) => {
      const pct = progressoMeta(item, 'diaria');
      return `<div class="mb-3"><strong>${item.di_disciplina || 'Meta geral'}</strong><div class="stat-value">${item.me_tempo_min} min</div><div class="progress-track"><div class="progress-fill fill-green" style="width:${pct}%"></div></div><div class="text-muted small mt-1">${pct}% concluido</div></div>`;
    }).join('')
    : 'Nenhuma meta diaria cadastrada.';

  document.getElementById('metas-semanais-card').innerHTML = semanais.length
    ? semanais.map((item) => {
      const pct = progressoMeta(item, 'semanal');
      return `<div class="mb-3"><strong>${item.di_disciplina || 'Meta geral'}</strong><div class="stat-value">${item.me_tempo_min} min</div><div class="progress-track"><div class="progress-fill fill-purple" style="width:${pct}%"></div></div><div class="text-muted small mt-1">${pct}% concluido</div></div>`;
    }).join('')
    : 'Nenhuma meta semanal cadastrada.';
}

async function carregarTarefas() {
  const resposta = await fetch(API_TAREFAS, { headers: cabecalhos() });
  if (resposta.status === 401) { window.location.href = '/login'; return; }
  const dados = await resposta.json();
  renderResumo(dados.resumo || {});
  renderListaTarefas(dados.tarefas || []);
  renderHistorico(dados.historico || []);
}

async function salvarTarefa() {
  limparMensagem();
  const id = document.getElementById('tarefaId').value;
  const titulo = document.getElementById('titulo').value.trim();
  const prazo = dataBrParaIso(document.getElementById('prazo').value);
  const materiaId = document.getElementById('materia').value;
  const descricao = document.getElementById('descricao').value.trim();
  if (!titulo) {
    exibirMensagem('Titulo da tarefa e obrigatorio.', 'danger');
    return;
  }

  const resposta = await fetch(id ? `${API_TAREFAS}/${id}` : API_TAREFAS, {
    method: id ? 'PUT' : 'POST',
    headers: cabecalhos(),
    body: JSON.stringify({ ta_titulo: titulo, ta_descricao: descricao || undefined, ta_prazo: prazo || undefined, ta_disciplina_id: materiaId || undefined })
  });

  const dados = await resposta.json();
  if (!resposta.ok) {
    exibirMensagem(dados.erro || 'Erro ao salvar tarefa.', 'danger');
    return;
  }
  cancelar();
  exibirMensagem(dados.mensagem || 'Tarefa salva com sucesso.', 'success');
  await carregarTarefas();
}

function editarTarefaPorId(id) {
  const tarefa = tarefasCache.find((item) => Number(item.ta_id) === Number(id));
  if (!tarefa) {
    exibirMensagem('Nao foi possivel localizar a tarefa selecionada.', 'danger');
    return;
  }
  document.getElementById('tarefaId').value = tarefa.ta_id;
  document.getElementById('titulo').value = tarefa.ta_titulo || '';
  document.getElementById('prazo').value = formatarDataBr(tarefa.ta_prazo);
  document.getElementById('materia').value = tarefa.ta_disciplina_id || '';
  document.getElementById('descricao').value = tarefa.ta_descricao || '';
  document.getElementById('btnSalvarTarefa').innerHTML = '<i class="fas fa-floppy-disk me-2"></i>Atualizar Tarefa';
  abrirGameModal('modalTarefa');
}

async function alternarStatus(id, statusAtual) {
  const proximoStatus = statusAtual === 'concluida' ? 'pendente' : 'concluida';
  const resposta = await fetch(`${API_TAREFAS}/${id}/status`, {
    method: 'PATCH',
    headers: cabecalhos(),
    body: JSON.stringify({ status: proximoStatus })
  });
  const dados = await resposta.json();
  if (!resposta.ok) {
    exibirMensagem(dados.erro || 'Erro ao alterar status da tarefa.', 'danger');
    return;
  }
  exibirMensagem(dados.mensagem || 'Status atualizado.', 'success');
  await carregarTarefas();
}

async function excluirTarefa(id) {
  if (!confirm('Deseja excluir esta tarefa?')) return;
  const resposta = await fetch(`${API_TAREFAS}/${id}`, { method: 'DELETE', headers: cabecalhos() });
  const dados = await resposta.json();
  if (!resposta.ok) {
    exibirMensagem(dados.erro || 'Erro ao excluir tarefa.', 'danger');
    return;
  }
  exibirMensagem(dados.mensagem || 'Tarefa excluida com sucesso.', 'success');
  await carregarTarefas();
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!token()) { window.location.href = '/login'; return; }
  inicializarCampoData('#prazo');
  await carregarUsuarioAtual();
  await carregarMaterias();
  await Promise.all([carregarTarefas(), carregarMetasCards()]);
});
