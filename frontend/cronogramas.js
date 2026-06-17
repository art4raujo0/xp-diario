const API_CRONOGRAMAS = '/api/cronogramas';
const API_MATERIAS = '/api/materias';
let calendarioData = null;

function token() {
  return localStorage.getItem('xp_diario_token');
}

function cabecalhos() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token()}`
  };
}

function dataHoje() {
  const hoje = new Date();
  const dia = String(hoje.getDate()).padStart(2, '0');
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const ano = hoje.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function formatarData(data) {
  if (!data) return '-';
  const texto = String(data).slice(0, 10);

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    return texto;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function converterDataParaIso(dataBr) {
  const texto = String(dataBr || '').trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return texto;
  }

  const match = texto.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) {
    return null;
  }

  const dia = Number(match[1]);
  const mes = Number(match[2]);
  const ano = Number(match[3]);
  const data = new Date(ano, mes - 1, dia);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function inicializarCalendario() {
  if (!window.flatpickr) {
    return;
  }

  calendarioData = flatpickr('#data', {
    allowInput: true,
    dateFormat: 'd/m/Y',
    locale: flatpickr.l10ns.pt,
    disableMobile: true
  });

  document.getElementById('btnAbrirCalendario').addEventListener('click', () => {
    calendarioData.open();
  });
}

function formatarHorario(horario) {
  if (!horario) return '-';
  return String(horario).slice(0, 5);
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

function limparMensagem() {
  const div = document.getElementById('mensagem');
  div.className = '';
  div.textContent = '';
}

function mostrarForm() {
  limparMensagem();
  document.getElementById('formCronograma').classList.remove('d-none');

  if (!document.getElementById('data').value) {
    document.getElementById('data').value = dataHoje();
  }
}

function cancelar() {
  limparForm();
  document.getElementById('formCronograma').classList.add('d-none');
}

function limparForm() {
  document.getElementById('cronogramaId').value = '';
  document.getElementById('materia').selectedIndex = 0;
  document.getElementById('data').value = dataHoje();
  document.getElementById('horarioInicio').value = '';
  document.getElementById('duracao').value = '';

  if (calendarioData) {
    calendarioData.setDate(document.getElementById('data').value, false, 'd/m/Y');
  }
}

async function carregarMaterias() {
  try {
    const res = await fetch(API_MATERIAS);
    const materias = await res.json();
    const select = document.getElementById('materia');

    if (!Array.isArray(materias) || materias.length === 0) {
      select.innerHTML = '<option value="">Nenhuma materia cadastrada</option>';
      return;
    }

    select.innerHTML = '<option value="">Selecione uma materia</option>' +
      materias.map(m => `<option value="${m.di_id}">${m.di_disciplina}</option>`).join('');
  } catch (error) {
    console.error('Erro ao carregar materias:', error);
    document.getElementById('materia').innerHTML = '<option value="">Erro ao carregar</option>';
  }
}

async function carregarCronogramas() {
  const lista = document.getElementById('lista');

  try {
    const res = await fetch(API_CRONOGRAMAS, { headers: cabecalhos() });

    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }

    const dados = await res.json();
    const cronogramas = dados.cronogramas || [];

    if (cronogramas.length === 0) {
      lista.innerHTML = `
        <div class="p-5 text-center text-muted">
          <i class="fas fa-calendar-days fs-2 mb-3 d-block" style="color:#d1c4e9;"></i>
          <p class="mb-0">Nenhum cronograma cadastrado. Planeje sua primeira sessao!</p>
        </div>`;
      return;
    }

    lista.innerHTML = `
      <div class="d-flex justify-content-between align-items-center px-2 pt-1 pb-3">
        <span class="fw-semibold text-muted" style="font-size:0.85rem;">
          <i class="fas fa-calendar-check me-1"></i>
          ${cronogramas.length} cronograma${cronogramas.length !== 1 ? 's' : ''} encontrado${cronogramas.length !== 1 ? 's' : ''}
        </span>
        <span class="schedule-badge">
          <i class="fas fa-clock"></i>
          ${cronogramas.reduce((acc, item) => acc + Number(item.cr_duracao_min || 0), 0)} min planejados
        </span>
      </div>
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="table-light">
            <tr>
              <th>Materia</th>
              <th>Data</th>
              <th>Inicio</th>
              <th>Duracao</th>
              <th class="text-end">Acoes</th>
            </tr>
          </thead>
          <tbody>
            ${cronogramas.map(c => `
              <tr>
                <td>
                  <span class="d-flex align-items-center gap-2">
                    <span class="schedule-dot" style="background:${c.di_cor || '#463acb'};"></span>
                    <span class="fw-semibold">${c.di_disciplina || '-'}</span>
                  </span>
                </td>
                <td class="text-muted small">${formatarData(c.cr_data)}</td>
                <td>
                  <span class="schedule-badge">
                    <i class="fas fa-clock"></i>${formatarHorario(c.cr_horario_inicio)}
                  </span>
                </td>
                <td class="fw-semibold">${c.cr_duracao_min} min</td>
                <td class="text-end">
                  <button class="btn-icon me-1" title="Editar" onclick='editar(${JSON.stringify(c)})'>
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="btn-icon danger" title="Excluir" onclick="deletar(${c.cr_id})">
                    <i class="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>`;
  } catch (error) {
    console.error('Erro ao carregar cronogramas:', error);
    lista.innerHTML = '<div class="p-4 text-center text-danger">Erro ao carregar cronogramas.</div>';
  }
}

async function salvarCronograma() {
  limparMensagem();

  const id = document.getElementById('cronogramaId').value;
  const materiaId = parseInt(document.getElementById('materia').value);
  const data = document.getElementById('data').value;
  const dataIso = converterDataParaIso(data);
  const horarioInicio = document.getElementById('horarioInicio').value;
  const duracao = parseInt(document.getElementById('duracao').value);

  if (!materiaId) {
    exibirMensagem('Selecione uma materia.', 'danger');
    return;
  }

  if (!dataIso) {
    exibirMensagem('Informe uma data valida.', 'danger');
    return;
  }

  if (!horarioInicio) {
    exibirMensagem('Informe o horario de inicio.', 'danger');
    return;
  }

  if (!duracao || duracao <= 0) {
    exibirMensagem('A duracao deve ser maior que zero.', 'danger');
    return;
  }

  const btnSalvar = document.querySelector('#formCronograma .btn-success');
  btnSalvar.disabled = true;
  btnSalvar.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';

  try {
    const res = await fetch(id ? `${API_CRONOGRAMAS}/${id}` : API_CRONOGRAMAS, {
      method: id ? 'PUT' : 'POST',
      headers: cabecalhos(),
      body: JSON.stringify({
        cr_disciplina: materiaId,
        cr_data: dataIso,
        cr_horario_inicio: horarioInicio,
        cr_duracao_min: duracao
      })
    });

    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }

    const dados = await res.json();

    if (!res.ok) {
      exibirMensagem(dados.erro || 'Erro ao salvar cronograma.', 'danger');
      return;
    }

    exibirMensagem(dados.mensagem || 'Cronograma salvo com sucesso.', 'success');
    cancelar();
    await carregarCronogramas();
  } catch (error) {
    console.error('Erro ao salvar cronograma:', error);
    exibirMensagem('Erro ao conectar com o servidor.', 'danger');
  } finally {
    btnSalvar.disabled = false;
    btnSalvar.innerHTML = '<i class="fas fa-floppy-disk me-2"></i>Salvar';
  }
}

function editar(cronograma) {
  mostrarForm();
  document.getElementById('cronogramaId').value = cronograma.cr_id;
  document.getElementById('materia').value = cronograma.cr_disciplina;
  const dataFormatada = formatarData(cronograma.cr_data);
  document.getElementById('data').value = dataFormatada;

  if (calendarioData) {
    calendarioData.setDate(dataFormatada, false, 'd/m/Y');
  }
  document.getElementById('horarioInicio').value = formatarHorario(cronograma.cr_horario_inicio);
  document.getElementById('duracao').value = cronograma.cr_duracao_min;
}

async function deletar(id) {
  if (!confirm('Deseja excluir este cronograma?')) {
    return;
  }

  try {
    const res = await fetch(`${API_CRONOGRAMAS}/${id}`, {
      method: 'DELETE',
      headers: cabecalhos()
    });

    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }

    const dados = await res.json();

    if (!res.ok) {
      exibirMensagem(dados.erro || 'Erro ao excluir cronograma.', 'danger');
      return;
    }

    exibirMensagem(dados.mensagem || 'Cronograma excluido com sucesso.', 'success');
    await carregarCronogramas();
  } catch (error) {
    console.error('Erro ao excluir cronograma:', error);
    exibirMensagem('Erro ao conectar com o servidor.', 'danger');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  if (!token()) {
    window.location.href = '/login';
    return;
  }

  carregarMaterias();
  carregarCronogramas();
  inicializarCalendario();
  limparForm();
});
