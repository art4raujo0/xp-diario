function authToken() {
  return localStorage.getItem('xp_diario_token');
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${authToken()}`
  };
}

function formatarMinutos(total) {
  const minutos = Math.max(0, Number(total || 0));
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  if (horas <= 0) return `${resto} min`;
  return `${horas}h ${String(resto).padStart(2, '0')}m`;
}

function inicioDoDia(data) {
  const valor = new Date(data);
  valor.setHours(0, 0, 0, 0);
  return valor;
}

function isoDia(data) {
  return inicioDoDia(data).toISOString().slice(0, 10);
}

function nivelPorXp(xp) {
  return Math.max(1, Math.floor(Number(xp || 0) / 100) + 1);
}

function obterProgressoMateria(materia, atividades, tarefas) {
  const materiaId = Number(materia.di_id);
  const minutos = atividades
    .filter((item) => Number(item.at_disciplina) === materiaId)
    .reduce((acc, item) => acc + Number(item.at_tempo_min || 0), 0);

  const tarefasDaMateria = tarefas.filter((item) => Number(item.ta_disciplina_id) === materiaId);
  const concluidas = tarefasDaMateria.filter((item) => item.ta_status === 'concluida').length;
  const totalTarefas = tarefasDaMateria.length;
  const xp = minutos + concluidas * 20;
  const percentualBase = totalTarefas > 0 ? (concluidas / totalTarefas) * 100 : 0;
  const percentualTempo = Math.min(100, Math.round(minutos / 3));
  const percentual = Math.max(percentualBase, percentualTempo);

  return {
    xp,
    percentual: Math.min(100, Math.round(percentual)),
    minutos,
    concluidas,
    totalTarefas
  };
}

function iconeMateria(nome) {
  const texto = String(nome || '').toLowerCase();
  if (texto.includes('mat')) return 'fa-square-root-variable';
  if (texto.includes('port') || texto.includes('ing') || texto.includes('lit')) return 'fa-book-open';
  if (texto.includes('hist')) return 'fa-landmark';
  if (texto.includes('prog') || texto.includes('algo') || texto.includes('comp')) return 'fa-laptop-code';
  if (texto.includes('bio') || texto.includes('cien')) return 'fa-dna';
  return 'fa-book';
}

function classeCor(indice) {
  return ['icon-blue', 'icon-green', 'icon-yellow', 'icon-purple', 'icon-pink'][indice % 5];
}

function renderizarGraficoSemana(atividades) {
  const destino = document.getElementById('dashboard-semana-grafico');
  const totalEl = document.getElementById('dashboard-semana-tempo');
  const variacaoEl = document.getElementById('dashboard-semana-variacao');
  if (!destino || !totalEl || !variacaoEl) return;

  const hoje = inicioDoDia(new Date());
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
  const atual = Array(7).fill(0);
  const anterior = Array(7).fill(0);

  atividades.forEach((item) => {
    const data = item.at_data ? inicioDoDia(item.at_data) : null;
    if (!data || Number.isNaN(data.getTime())) return;
    const diffDias = Math.floor((hoje - data) / 86400000);
    if (diffDias >= 0 && diffDias < 7) {
      atual[6 - diffDias] += Number(item.at_tempo_min || 0);
    } else if (diffDias >= 7 && diffDias < 14) {
      anterior[13 - diffDias] += Number(item.at_tempo_min || 0);
    }
  });

  const totalAtual = atual.reduce((acc, valor) => acc + valor, 0);
  const totalAnterior = anterior.reduce((acc, valor) => acc + valor, 0);
  const maximo = Math.max(...atual, 1);
  const variacao = totalAnterior > 0 ? Math.round(((totalAtual - totalAnterior) / totalAnterior) * 100) : 0;

  totalEl.textContent = formatarMinutos(totalAtual);
  if (totalAnterior > 0) {
    variacaoEl.textContent = `${variacao >= 0 ? '+' : ''}${variacao}% em relacao a semana passada`;
    variacaoEl.classList.toggle('text-success', variacao >= 0);
    variacaoEl.classList.toggle('text-danger', variacao < 0);
  } else {
    variacaoEl.textContent = 'Sem comparacao anterior';
    variacaoEl.classList.remove('text-danger');
    variacaoEl.classList.add('text-success');
  }

  destino.innerHTML = atual.map((valor, indice) => {
    const altura = Math.max(16, Math.round((valor / maximo) * 100));
    const data = new Date(hoje);
    data.setDate(hoje.getDate() - (6 - indice));
    return `
      <div class="bar-col">
        <div class="bar" style="height:${altura}%"></div>
        <span>${diasSemana[data.getDay()]}</span>
      </div>`;
  }).join('');
}

function renderizarDisciplinas(materias, atividades, tarefas) {
  const destino = document.getElementById('dashboard-disciplinas');
  if (!destino) return;

  if (!Array.isArray(materias) || materias.length === 0) {
    destino.innerHTML = '<p class="text-muted fw-bold mb-0">Nenhuma disciplina cadastrada.</p>';
    return;
  }

  const linhas = materias.map((materia) => {
    const resumo = obterProgressoMateria(materia, atividades, tarefas);
    return { materia, resumo };
  }).sort((a, b) => b.resumo.percentual - a.resumo.percentual).slice(0, 4);

  destino.innerHTML = linhas.map(({ materia, resumo }, indice) => `
    <div class="subject-row">
      <span class="pixel-icon ${classeCor(indice)}"><i class="fas ${iconeMateria(materia.di_disciplina)}"></i></span>
      <div>
        <strong>${materia.di_disciplina || 'Disciplina'}</strong>
        <div class="progress-track mt-2">
          <div class="progress-fill ${['fill-blue', 'fill-green', 'fill-yellow', 'fill-purple', 'fill-pink'][indice % 5]}" style="width:${resumo.percentual}%"></div>
        </div>
      </div>
      <div class="text-end">
        <strong>${resumo.percentual}%</strong>
        <div class="subject-meta">XP ${resumo.xp}</div>
      </div>
    </div>
  `).join('');
}

function renderizarDesempenho(atividades) {
  const percentualEl = document.getElementById('dashboard-desempenho-percentual');
  const variacaoEl = document.getElementById('dashboard-desempenho-variacao');
  const chartEl = document.getElementById('dashboard-desempenho-chart');
  if (!percentualEl || !variacaoEl || !chartEl) return;

  const hoje = inicioDoDia(new Date());
  const serie = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const base = new Date(hoje);
    base.setDate(hoje.getDate() - offset);
    const chave = isoDia(base);
    const minutos = atividades
      .filter((item) => isoDia(item.at_data || new Date()) === chave)
      .reduce((acc, item) => acc + Number(item.at_tempo_min || 0), 0);
    serie.push(minutos);
  }

  const total = serie.reduce((acc, valor) => acc + valor, 0);
  const media = total / 7;
  const percentual = Math.min(100, Math.round((media / 120) * 100));
  percentualEl.textContent = `${percentual}%`;

  const primeiraMetade = serie.slice(0, 3).reduce((a, b) => a + b, 0);
  const segundaMetade = serie.slice(3).reduce((a, b) => a + b, 0);
  const delta = primeiraMetade > 0 ? Math.round(((segundaMetade - primeiraMetade) / primeiraMetade) * 100) : 0;
  variacaoEl.textContent = `${delta >= 0 ? '+' : ''}${delta}%`;
  variacaoEl.classList.toggle('text-success', delta >= 0);
  variacaoEl.classList.toggle('text-danger', delta < 0);

  const max = Math.max(...serie, 1);
  const pontos = serie.map((valor, indice) => {
    const x = (340 / (serie.length - 1)) * indice;
    const y = 120 - ((valor / max) * 85);
    return `${x},${Math.round(y)}`;
  }).join(' ');

  chartEl.innerHTML = `
    <svg viewBox="0 0 340 130" preserveAspectRatio="none">
      <polyline points="${pontos}" fill="none" stroke="#6d5dfb" stroke-width="6" stroke-linecap="round"/>
      <polyline points="0,130 ${pontos} 340,130" fill="rgba(109,93,251,0.18)"/>
    </svg>`;
}

function atualizarMetaCard(totalId, barraId, metas, atividades) {
  const alvo = metas.reduce((acc, meta) => acc + Number(meta.me_tempo_min || 0), 0);
  const hoje = isoDia(new Date());
  const diasSemana = [];
  for (let i = 0; i < 7; i += 1) {
    const data = new Date();
    data.setDate(data.getDate() - i);
    diasSemana.push(isoDia(data));
  }
  const feito = atividades.reduce((acc, item) => {
    const dia = isoDia(item.at_data || new Date());
    const incluir = totalId.includes('hoje') ? dia === hoje : diasSemana.includes(dia);
    return acc + (incluir ? Number(item.at_tempo_min || 0) : 0);
  }, 0);
  const pct = alvo > 0 ? Math.min(100, Math.round((feito / alvo) * 100)) : 0;
  const totalEl = document.getElementById(totalId);
  const barraEl = document.getElementById(barraId);
  if (totalEl) totalEl.textContent = alvo > 0 ? `${formatarMinutos(feito)} / ${formatarMinutos(alvo)}` : '0 / 0';
  if (barraEl) barraEl.style.width = `${pct}%`;
}

function renderizarDicaDoMestre() {
  const destino = document.getElementById('dica-mestre');
  if (!destino) return;
  destino.innerHTML = `
    <div class="wizard-tip">
      <div class="pixel-wizard"></div>
      <div>
        <strong>Dica do Mestre</strong>
        <div class="text-muted fw-bold small">Transforme uma meta grande em blocos curtos para manter o combo de foco.</div>
      </div>
    </div>`;
}

async function carregarStreak() {
  const streakValor = document.getElementById('streak-valor');
  const streakMelhor = document.getElementById('streak-melhor');
  const streakIcon = document.getElementById('streak-icon');
  const streakIconContainer = document.getElementById('streak-icon-container');

  try {
    const resposta = await fetch('/api/streak', { headers: authHeaders() });
    if (!resposta.ok) return;
    const dados = await resposta.json();
    const dias = Number(dados.streak || 0);
    const melhor = Number(dados.melhor_streak || dias);
    if (streakValor) streakValor.textContent = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
    if (streakMelhor) streakMelhor.textContent = `Melhor: ${melhor} ${melhor === 1 ? 'dia' : 'dias'}`;
    const espelho = document.getElementById('streak-valor-card');
    if (espelho) espelho.textContent = String(dias);
    if (streakIcon && streakIconContainer && dias > 0) {
      streakIcon.classList.remove('text-muted');
      streakIcon.classList.add('text-danger');
      streakIconContainer.style.backgroundColor = '#ffebe6';
    }
  } catch (erro) {
    console.error('Erro ao carregar streak:', erro);
  }
}

async function carregarProgresso(usuario) {
  const comDados = document.getElementById('progresso-com-dados');
  const vazio = document.getElementById('progresso-vazio');
  const barra = document.getElementById('progresso-barra');
  const percentualTexto = document.getElementById('progresso-percentual');
  const mensagemVazio = document.getElementById('mensagem-vazio');
  const txtTempo = document.getElementById('tempo-estudado');
  const txtMetas = document.getElementById('metas-atingidas');
  const txtTarefas = document.getElementById('tarefas-concluidas');
  const moedas = document.getElementById('dashboard-moedas');
  const recompensa = document.getElementById('dashboard-proxima-recompensa');

  try {
    const resposta = await fetch('/api/progresso', { headers: authHeaders() });
    const dados = await resposta.json();
    const xp = Number(usuario?.us_pontos_total || 0);
    const xpNoNivel = xp % 100;
    if (moedas) moedas.textContent = String(Math.floor(xp * 1.8));
    if (recompensa) recompensa.textContent = `Faltam ${Math.max(0, 100 - xpNoNivel)} XP`;

    if (!dados.possuiMetas || Number(dados?.resumo?.metasCadastradas || 0) === 0) {
      comDados?.classList.add('d-none');
      vazio?.classList.remove('d-none');
      if (mensagemVazio) mensagemVazio.textContent = dados.mensagem || 'Cadastre metas para acompanhar seu progresso.';
      return;
    }

    const resumo = dados.resumo || {};
    const percentual = Math.min(Number(resumo.percentualGeral || 0), 100);
    comDados?.classList.remove('d-none');
    vazio?.classList.add('d-none');
    if (barra) barra.style.width = `${percentual}%`;
    if (percentualTexto) percentualTexto.textContent = `${Math.round(Number(resumo.percentualGeral || 0))}%`;
    if (txtTempo) txtTempo.textContent = formatarMinutos(resumo.totalTempoEstudadoMin || 0);
    if (txtMetas) txtMetas.textContent = `${resumo.metasAtingidas || 0}/${resumo.metasAtivas || 0}`;
    if (txtTarefas) txtTarefas.textContent = String(resumo.totalTarefasConcluidas || 0);
  } catch (erro) {
    console.error('Erro ao carregar progresso:', erro);
  }
}

async function carregarDashboardReal(usuario) {
  try {
    const [atividadesRes, tarefasRes, metasRes, conquistasRes, cronosRes, materiasRes] = await Promise.all([
      fetch('/api/atividades', { headers: authHeaders() }),
      fetch('/api/tarefas', { headers: authHeaders() }),
      fetch('/api/metas', { headers: authHeaders() }),
      fetch('/api/conquistas', { headers: authHeaders() }),
      fetch('/api/cronogramas', { headers: authHeaders() }),
      fetch('/api/materias', { headers: authHeaders() })
    ]);

    const atividades = atividadesRes.ok ? (await atividadesRes.json()).historico || [] : [];
    const tarefasDados = tarefasRes.ok ? await tarefasRes.json() : {};
    const metas = metasRes.ok ? await metasRes.json() : [];
    const conquistas = conquistasRes.ok ? (await conquistasRes.json()).conquistas || [] : [];
    const cronos = cronosRes.ok ? (await cronosRes.json()).cronogramas || [] : [];
    const materias = materiasRes.ok ? await materiasRes.json() : [];
    const tarefas = tarefasDados.tarefas || [];

    const xp = Number(usuario?.us_pontos_total || atividades.reduce((acc, item) => acc + Number(item.at_tempo_min || 0), 0));
    const nivel = nivelPorXp(xp);
    const xpNoNivel = xp % 100;
    document.querySelectorAll('[data-dashboard-level]').forEach((el) => { el.textContent = `Nivel ${nivel}`; });
    document.querySelectorAll('[data-dashboard-xp]').forEach((el) => { el.textContent = `${xpNoNivel} / 100 XP`; });
    document.querySelectorAll('[data-dashboard-xp-bar]').forEach((el) => { el.style.width = `${xpNoNivel}%`; });

    renderizarDisciplinas(materias, atividades, tarefas);
    renderizarGraficoSemana(atividades);
    renderizarDesempenho(atividades);

    const hoje = isoDia(new Date());
    const cronosHoje = cronos
      .filter((item) => String(item.cr_data).slice(0, 10) === hoje)
      .sort((a, b) => String(a.cr_horario_inicio).localeCompare(String(b.cr_horario_inicio)))
      .slice(0, 5);

    const cronosEl = document.getElementById('dashboard-cronogramas');
    if (cronosEl) {
      cronosEl.innerHTML = cronosHoje.length ? cronosHoje.map((item) => `
        <div class="schedule-row">
          <span class="schedule-time">${String(item.cr_horario_inicio).slice(0, 5)}</span>
          <strong>${item.di_disciplina || 'Disciplina'}</strong>
          <span>${item.cr_duracao_min} min</span>
        </div>`).join('') : '<p class="text-muted fw-bold mb-0">Nenhuma sessao agendada para hoje.</p>';
    }

    const tarefasEl = document.getElementById('dashboard-tarefas');
    if (tarefasEl) {
      const top = tarefas.slice(0, 5);
      tarefasEl.innerHTML = top.length ? top.map((item) => {
        const concluida = item.ta_status === 'concluida';
        return `
          <div class="task-row">
            <i class="${concluida ? 'fas fa-square-check text-success' : 'far fa-square text-muted'} fs-5"></i>
            <strong>${item.ta_titulo}</strong>
            <span class="badge-soft ${concluida ? 'badge-green' : 'badge-orange'}">${concluida ? 'Concluida' : 'Pendente'}</span>
          </div>`;
      }).join('') : '<p class="text-muted fw-bold mb-0">Nenhuma tarefa cadastrada.</p>';
    }

    const concluidas = tarefas.filter((item) => item.ta_status === 'concluida').length;
    const tarefasCard = document.getElementById('tarefas-concluidas');
    if (tarefasCard) tarefasCard.textContent = String(concluidas);

    const metasHoje = metas.filter((item) => item.me_tipo === 'diaria');
    const metasSemana = metas.filter((item) => item.me_tipo === 'semanal');
    atualizarMetaCard('metas-hoje-total', 'metas-hoje-barra', metasHoje, atividades);
    atualizarMetaCard('metas-semana-total', 'metas-semana-barra', metasSemana, atividades);

    const conquistasEl = document.getElementById('dashboard-conquistas');
    if (conquistasEl) {
      const recentes = conquistas.filter((item) => item.status === 'desbloqueada').slice(0, 4);
      conquistasEl.innerHTML = (recentes.length ? recentes : conquistas.slice(0, 4)).map((item, indice) => `
        <div class="achievement-badge">
          <div class="badge-medal" style="background:${['#8b5cf6', '#f97316', '#22c55e', '#facc15'][indice % 4]}"><i class="fas fa-trophy"></i></div>
          ${item.co_titulo || item.titulo || 'Conquista'}
        </div>`).join('') || '<p class="text-muted fw-bold mb-0">Nenhuma conquista ainda.</p>';
    }

    renderizarDicaDoMestre();
  } catch (erro) {
    console.error('Erro ao carregar dashboard:', erro);
  }
}

async function carregarConfigNotificacoes() {
  try {
    const resposta = await fetch('/api/notificacoes', { headers: { Authorization: `Bearer ${authToken()}` } });
    if (!resposta.ok) return;
    const config = await resposta.json();
    document.getElementById('notif-ativo').checked = config.ativo || false;
    document.getElementById('notif-horario').value = config.horario || '08:00';
    document.getElementById('notif-fuso').value = config.fuso_horario || 'America/Sao_Paulo';
    document.getElementById('badge-notif').style.display = config.ativo ? 'block' : 'none';
  } catch (erro) {
    console.error('Erro ao carregar notificacoes:', erro);
  }
}

function abrirModalNotificacoes() {
  carregarConfigNotificacoes();
  new bootstrap.Modal(document.getElementById('modalNotificacoes')).show();
}

function exibirFeedbackNotif(mensagem, tipo) {
  const feedback = document.getElementById('notif-feedback');
  feedback.className = `mt-3 alert alert-${tipo} py-2 px-3 small`;
  feedback.textContent = mensagem;
  feedback.classList.remove('d-none');
}

async function salvarNotificacoes() {
  const ativo = document.getElementById('notif-ativo').checked;
  const horario = document.getElementById('notif-horario').value;
  const fuso_horario = document.getElementById('notif-fuso').value;
  const feedback = document.getElementById('notif-feedback');
  const btnSalvar = document.getElementById('btn-salvar-notif');

  if (!horario) {
    exibirFeedbackNotif('Defina um horario valido.', 'danger');
    return;
  }

  btnSalvar.disabled = true;
  btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Salvando...';
  try {
    const resposta = await fetch('/api/notificacoes', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ ativo, horario, fuso_horario })
    });
    const dados = await resposta.json();
    if (!resposta.ok) {
      exibirFeedbackNotif(dados.erro || 'Erro ao salvar.', 'danger');
      return;
    }

    exibirFeedbackNotif('Configuracao salva com sucesso.', 'success');
    document.getElementById('badge-notif').style.display = ativo ? 'block' : 'none';
    setTimeout(() => {
      bootstrap.Modal.getInstance(document.getElementById('modalNotificacoes'))?.hide();
      feedback.classList.add('d-none');
    }, 1000);
  } catch (erro) {
    console.error('Erro ao salvar notificacoes:', erro);
    exibirFeedbackNotif('Erro de conexao.', 'danger');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.innerHTML = 'Salvar';
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  if (!authToken()) {
    window.location.href = '/login';
    return;
  }

  const usuario = await carregarUsuarioAtual();
  await Promise.all([
    carregarStreak(),
    carregarProgresso(usuario),
    carregarDashboardReal(usuario),
    carregarConfigNotificacoes()
  ]);
});
