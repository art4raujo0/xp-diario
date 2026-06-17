const API_ATIVIDADES = '/api/atividades';
const API_MATERIAS = '/api/materias';

function token() {
  return localStorage.getItem('xp_diario_token');
}

function cabecalhos() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token()}`
  };
}

function formatarData(data) {
  if (!data) return '-';
  const d = new Date(data);
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function dataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

function exibirMensagem(texto, tipo) {
  const div = document.getElementById('mensagem');
  div.className = `alert alert-${tipo} border-0 shadow-sm`;
  div.innerHTML = texto;
  if (tipo === 'success' || tipo === 'info') {
    setTimeout(() => { div.innerHTML = ''; div.className = ''; }, 6000);
  }
}

function mostrarForm() {
  document.getElementById('formEstudo').classList.remove('d-none');
  document.getElementById('data').value = dataHoje();
}

function cancelar() {
  limparForm();
  document.getElementById('formEstudo').classList.add('d-none');
}

function limparForm() {
  document.getElementById('materia').selectedIndex = 0;
  document.getElementById('tempo').value = '';
  document.getElementById('tarefas').value = '0';
  document.getElementById('data').value = dataHoje();
  document.getElementById('descricao').value = '';
}

async function carregarMaterias() {
  try {
    const res = await fetch(API_MATERIAS, { headers: { 'Authorization': `Bearer ${token()}` } });
    const materias = await res.json();
    const select = document.getElementById('materia');
    if (!Array.isArray(materias) || materias.length === 0) {
      select.innerHTML = '<option value="">Nenhuma matéria cadastrada</option>';
      return;
    }
    select.innerHTML = '<option value="">Selecione uma matéria</option>' +
      materias.map(m => `<option value="${m.di_id}">${m.di_disciplina}</option>`).join('');
  } catch (err) {
    console.error('Erro ao carregar matérias:', err);
    document.getElementById('materia').innerHTML = '<option value="">Erro ao carregar</option>';
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

    if (historico.length === 0) {
      lista.innerHTML = `
        <div class="p-5 text-center text-muted">
          <i class="fas fa-book-open fs-2 mb-3 d-block" style="color: #d1c4e9;"></i>
          <p class="mb-0">Nenhum registro encontrado. Comece registrando sua primeira sessão de estudo!</p>
        </div>`;
      return;
    }

    lista.innerHTML = `
      <div class="d-flex justify-content-between align-items-center px-2 pt-1 pb-3">
        <span class="fw-semibold text-muted" style="font-size: 0.85rem;">
          <i class="fas fa-history me-1"></i> ${historico.length} registro${historico.length !== 1 ? 's' : ''} encontrado${historico.length !== 1 ? 's' : ''}
        </span>
        <span class="xp-badge">
          <i class="fas fa-bolt"></i>
          ${historico.reduce((acc, a) => acc + (a.at_tempo_min || 0), 0)} min totais
        </span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Matéria</th>
              <th>Data</th>
              <th>Tempo</th>
              <th>Tarefas</th>
              <th>Descrição</th>
            </tr>
          </thead>
          <tbody>
            ${historico.map(a => `
              <tr>
                <td>
                  <span class="d-flex align-items-center gap-2">
                    <span class="status-dot"></span>
                    <span class="fw-semibold">${a.di_disciplina || '-'}</span>
                  </span>
                </td>
                <td class="text-muted small">${formatarData(a.at_data)}</td>
                <td>
                  <span class="xp-badge">
                    <i class="fas fa-clock"></i> ${a.at_tempo_min} min
                  </span>
                </td>
                <td class="text-muted">${a.at_tarefas_concluidas > 0 ? a.at_tarefas_concluidas : '<span class="text-muted">—</span>'}</td>
                <td class="text-muted small" style="max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                  ${a.at_descricao || '<span class="text-muted">—</span>'}
                </td>
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

async function salvarRegistro() {
  const materiaId = parseInt(document.getElementById('materia').value);
  const tempoMin = parseInt(document.getElementById('tempo').value);
  const tarefas = parseInt(document.getElementById('tarefas').value) || 0;
  const data = document.getElementById('data').value;
  const descricao = document.getElementById('descricao').value.trim();

  if (!materiaId) {
    exibirMensagem('Selecione uma matéria.', 'danger');
    return;
  }

  if (!tempoMin || tempoMin <= 0) {
    exibirMensagem('Informe um tempo válido (maior que zero).', 'danger');
    return;
  }

  if (tarefas < 0) {
    exibirMensagem('O número de tarefas não pode ser negativo.', 'danger');
    return;
  }

  const btnSalvar = document.querySelector('#formEstudo .btn-success');
  btnSalvar.disabled = true;
  btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';

  try {
    const res = await fetch(API_ATIVIDADES, {
      method: 'POST',
      headers: cabecalhos(),
      body: JSON.stringify({
        at_disciplina: materiaId,
        at_tempo_min: tempoMin,
        at_tarefas_concluidas: tarefas,
        at_data: data || undefined,
        at_descricao: descricao || undefined
      })
    });

    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }

    const dados = await res.json();

    if (res.ok) {
      let mensagemHTML = `
        <div class="d-flex flex-wrap align-items-center gap-2">
          <i class="fas fa-circle-check text-success"></i>
          <strong>${dados.mensagem}</strong>
          <span class="xp-badge"><i class="fas fa-bolt"></i> +${dados.pontuacao?.pontosGanhos || tempoMin} XP</span>
          <span class="text-muted small">Total: ${dados.pontuacao?.totalPontos || 0} pts</span>
        </div>`;

      if (dados.conquistasDesbloqueadas && dados.conquistasDesbloqueadas.length > 0) {
        const badges = dados.conquistasDesbloqueadas
          .map(c => `<span class="conquista-badge"><i class="fas fa-trophy"></i> ${c.co_nome || c.nome || 'Conquista'}</span>`)
          .join(' ');
        mensagemHTML += `<div class="mt-2 d-flex flex-wrap gap-2"><span class="text-muted small">Conquistas desbloqueadas:</span>${badges}</div>`;
      }

      exibirMensagem(mensagemHTML, 'success');
      cancelar();
      carregarHistorico();
    } else {
      exibirMensagem(dados.erro || 'Erro ao salvar o registro.', 'danger');
    }
  } catch (err) {
    console.error('Erro ao salvar:', err);
    exibirMensagem('Erro ao conectar com o servidor.', 'danger');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.innerHTML = '<i class="fas fa-floppy-disk me-2"></i>Salvar Registro';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!token()) {
    window.location.href = '/login';
    return;
  }
  carregarMaterias();
  carregarHistorico();
});
