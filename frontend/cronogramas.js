const API_CRONOGRAMAS = '/api/cronogramas';
const API_MATERIAS = '/api/materias';
let cronogramasCache = [];
let viewAtual = 'semana';

function token() {
  return localStorage.getItem('xp_diario_token');
}

function cabecalhos() {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` };
}

function dataHojeIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatarHorario(horario) {
  return horario ? String(horario).slice(0, 5) : '-';
}

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
  abrirGameModal('modalCronograma');
}

function cancelar() {
  limparForm();
  fecharGameModal('modalCronograma');
}

function limparForm() {
  document.getElementById('cronogramaId').value = '';
  document.getElementById('materia').value = '';
  document.getElementById('data').value = formatarDataBr(dataHojeIso());
  document.getElementById('horarioInicio').value = '';
  document.getElementById('duracao').value = '';
}

async function carregarMaterias() {
  const res = await fetch(API_MATERIAS, { headers: cabecalhos() });
  const materias = await res.json();
  const select = document.getElementById('materia');
  select.innerHTML = '<option value="">Selecione uma disciplina</option>' + (Array.isArray(materias) ? materias.map((m) => `<option value="${m.di_id}">${m.di_disciplina}</option>`).join('') : '');
}

function montarCabecalhoSemana() {
  return `
    <div class="calendar-head">Hora</div>
    <div class="calendar-head">Seg</div>
    <div class="calendar-head">Ter</div>
    <div class="calendar-head">Qua</div>
    <div class="calendar-head">Qui</div>
    <div class="calendar-head">Sex</div>
    <div class="calendar-head">Sab</div>
    <div class="calendar-head">Dom</div>`;
}

function renderizarSemana() {
  const grade = document.getElementById('grade-cronograma');
  if (!grade) return;
  const horas = ['07:00', '09:00', '11:00', '14:00', '16:00', '19:00'];
  const dias = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Dom'];
  const conteudo = [montarCabecalhoSemana()];
  horas.forEach((hora) => {
    conteudo.push(`<div class="calendar-cell calendar-time">${hora}</div>`);
    dias.forEach((_, indice) => {
      const alvo = cronogramasCache.filter((item) => {
        const data = new Date(item.cr_data);
        const semanaDia = data.getDay() === 0 ? 6 : data.getDay() - 1;
        return semanaDia === indice && String(item.cr_horario_inicio).slice(0, 2) === hora.slice(0, 2);
      });
      conteudo.push(`<div class="calendar-cell">${alvo.map((item) => `<div class="schedule-badge d-block mb-2" style="background:${item.di_cor || '#ede9fe'};color:${item.di_cor ? '#fff' : '#463acb'}">${item.di_disciplina || 'Disciplina'}<br><small>${formatarHorario(item.cr_horario_inicio)} · ${item.cr_duracao_min} min</small></div>`).join('')}</div>`);
    });
  });
  grade.innerHTML = conteudo.join('');
}

function renderizarDia() {
  const destino = document.getElementById('cronograma-dia');
  if (!destino) return;
  const hoje = dataHojeIso();
  const itens = cronogramasCache.filter((item) => String(item.cr_data).slice(0, 10) === hoje);
  destino.innerHTML = itens.length ? itens.map((item) => `
    <div class="schedule-row py-3 border-bottom">
      <span class="schedule-time">${formatarHorario(item.cr_horario_inicio)}</span>
      <strong>${item.di_disciplina || 'Disciplina'}</strong>
      <span>${item.cr_duracao_min} min</span>
    </div>`).join('') : '<div class="text-muted fw-bold p-3">Nenhuma sessao hoje.</div>';
}

function renderizarAgenda() {
  const lista = document.getElementById('lista');
  if (!lista) return;
  if (!cronogramasCache.length) {
    lista.innerHTML = '<div class="p-5 text-center text-muted"><i class="fas fa-calendar-days fs-2 mb-3 d-block" style="color:#d1c4e9;"></i><p class="mb-0">Nenhum cronograma cadastrado.</p></div>';
    return;
  }

  const ordenados = [...cronogramasCache].sort((a, b) => `${a.cr_data}${a.cr_horario_inicio}`.localeCompare(`${b.cr_data}${b.cr_horario_inicio}`));
  lista.innerHTML = `<div class="table-responsive"><table class="table table-hover align-middle mb-0"><thead class="table-light"><tr><th>Disciplina</th><th>Data</th><th>Inicio</th><th>Duracao</th><th class="text-end">Acoes</th></tr></thead><tbody>${ordenados.map((c) => `<tr><td><span class="d-flex align-items-center gap-2"><span class="schedule-dot" style="background:${c.di_cor || '#463acb'};"></span><span class="fw-semibold">${c.di_disciplina || '-'}</span></span></td><td class="text-muted small">${formatarDataBr(c.cr_data)}</td><td><span class="schedule-badge"><i class="fas fa-clock"></i>${formatarHorario(c.cr_horario_inicio)}</span></td><td class="fw-semibold">${c.cr_duracao_min} min</td><td class="text-end"><button class="btn-icon me-1" title="Editar" onclick='editar(${JSON.stringify(c)})'><i class="fas fa-edit"></i></button><button class="btn-icon danger" title="Excluir" onclick="deletar(${c.cr_id})"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table></div>`;
}

function atualizarPeriodo() {
  const el = document.getElementById('cronograma-periodo');
  if (!el) return;
  const hoje = new Date();
  if (viewAtual === 'dia') {
    el.innerHTML = `<i class="fas fa-calendar-day"></i> ${formatarDataBr(hoje.toISOString().slice(0, 10))}`;
  } else if (viewAtual === 'agenda') {
    el.innerHTML = '<i class="fas fa-list"></i> Agenda completa';
  } else {
    el.innerHTML = '<i class="fas fa-calendar-week"></i> Semana atual';
  }
}

function trocarVisao(view, botao) {
  viewAtual = view;
  document.querySelectorAll('.auth-tab').forEach((item) => item.classList.remove('active'));
  botao?.classList.add('active');
  document.getElementById('painel-semana').classList.toggle('d-none', view !== 'semana');
  document.getElementById('painel-dia').classList.toggle('d-none', view !== 'dia');
  document.getElementById('painel-agenda').classList.toggle('d-none', view !== 'agenda');
  atualizarPeriodo();
  renderizarSemana();
  renderizarDia();
  renderizarAgenda();
}

async function carregarCronogramas() {
  const res = await fetch(API_CRONOGRAMAS, { headers: cabecalhos() });
  if (res.status === 401) { window.location.href = '/login'; return; }
  const dados = await res.json();
  cronogramasCache = dados.cronogramas || [];
  atualizarPeriodo();
  renderizarSemana();
  renderizarDia();
  renderizarAgenda();
}

async function salvarCronograma() {
  const id = document.getElementById('cronogramaId').value;
  const cr_data = dataBrParaIso(document.getElementById('data').value);
  const payload = {
    cr_disciplina: parseInt(document.getElementById('materia').value, 10),
    cr_data,
    cr_horario_inicio: document.getElementById('horarioInicio').value,
    cr_duracao_min: parseInt(document.getElementById('duracao').value, 10)
  };

  if (!payload.cr_disciplina || !payload.cr_data || !payload.cr_horario_inicio || !payload.cr_duracao_min) {
    exibirMensagem('Preencha os campos obrigatorios do cronograma.', 'danger');
    return;
  }

  const res = await fetch(id ? `${API_CRONOGRAMAS}/${id}` : API_CRONOGRAMAS, {
    method: id ? 'PUT' : 'POST',
    headers: cabecalhos(),
    body: JSON.stringify(payload)
  });
  const dados = await res.json();
  if (!res.ok) {
    exibirMensagem(dados.erro || 'Erro ao salvar cronograma.', 'danger');
    return;
  }
  cancelar();
  exibirMensagem(dados.mensagem || 'Cronograma salvo.', 'success');
  await carregarCronogramas();
}

function editar(cronograma) {
  document.getElementById('cronogramaId').value = cronograma.cr_id;
  document.getElementById('materia').value = cronograma.cr_disciplina;
  document.getElementById('data').value = formatarDataBr(cronograma.cr_data);
  document.getElementById('horarioInicio').value = formatarHorario(cronograma.cr_horario_inicio);
  document.getElementById('duracao').value = cronograma.cr_duracao_min;
  abrirGameModal('modalCronograma');
}

async function deletar(id) {
  if (!confirm('Deseja excluir este cronograma?')) return;
  const res = await fetch(`${API_CRONOGRAMAS}/${id}`, { method: 'DELETE', headers: cabecalhos() });
  const dados = await res.json();
  if (!res.ok) {
    exibirMensagem(dados.erro || 'Erro ao excluir cronograma.', 'danger');
    return;
  }
  exibirMensagem(dados.mensagem || 'Cronograma excluido.', 'success');
  await carregarCronogramas();
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!token()) { window.location.href = '/login'; return; }
  await carregarUsuarioAtual();
  inicializarCampoData('#data');
  await carregarMaterias();
  await carregarCronogramas();
  trocarVisao('semana', document.querySelector('.auth-tab.active'));
});
