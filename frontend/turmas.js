// turmas.js — Página de gestão de turmas

document.addEventListener('DOMContentLoaded', () => {
  const tipo = getUserTipo();

  if (tipo === 'professor' || tipo === 'admin') {
    document.getElementById('view-professor').classList.remove('d-none');
    carregarTurmasProfessor();
  } else {
    document.getElementById('view-aluno').classList.remove('d-none');
    carregarTurmasAluno();
  }
});

// ── Professor / Admin ────────────────────────────────────────────────────────

async function carregarTurmasProfessor() {
  const token = localStorage.getItem('xp_diario_token');
  const lista = document.getElementById('lista-professor');
  lista.innerHTML = '<div class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Carregando turmas…</div>';

  try {
    const res = await fetch('/api/turmas', { headers: { Authorization: `Bearer ${token}` } });
    const dados = await res.json();
    if (!res.ok) return mostrarMensagem('err', dados.erro || 'Erro ao carregar turmas.');
    renderizarListaProfessor(dados.turmas || []);
  } catch {
    lista.innerHTML = '<div class="text-danger small p-2">Erro ao conectar com o servidor.</div>';
  }
}

function renderizarListaProfessor(turmas) {
  const lista = document.getElementById('lista-professor');

  if (turmas.length === 0) {
    lista.innerHTML = `
      <div class="card-panel p-5 text-center">
        <i class="fas fa-users" style="font-size:2.5rem;color:#cbd5e1;display:block;margin-bottom:12px;"></i>
        <div class="fw-semibold mb-1" style="color:#64748b;">Nenhuma turma criada</div>
        <div class="text-muted small">Clique em <strong>Nova Turma</strong> para começar.</div>
      </div>`;
    return;
  }

  lista.innerHTML = `<div class="row g-3">` + turmas.map(t => {
    const inicial = (t.tu_nome || '?')[0].toUpperCase();
    const cores = ['#5b5ef4','#7c3aed','#2563eb','#0891b2','#059669','#d97706'];
    const cor = cores[(t.tu_id || 0) % cores.length];
    return `
    <div class="col-md-6">
      <div class="card-panel p-4" style="height:100%;transition:box-shadow 0.15s,transform 0.15s;" onmouseenter="this.style.boxShadow='0 4px 16px rgba(91,94,244,0.12)';this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='';this.style.transform=''">
        <div class="d-flex align-items-start gap-3">
          <div style="width:48px;height:48px;border-radius:14px;background:${cor};display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800;color:#fff;flex-shrink:0;">
            ${inicial}
          </div>
          <div style="flex:1;min-width:0;">
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <span class="fw-bold" style="color:#1e293b;font-size:0.98rem;">${t.tu_nome}</span>
              <span style="display:inline-flex;align-items:center;gap:3px;border-radius:99px;padding:2px 9px;font-size:0.7rem;font-weight:600;background:${t.tu_ativa?'#f0fdf4':'#f1f5f9'};color:${t.tu_ativa?'#16a34a':'#94a3b8'};">
                <i class="fas fa-circle" style="font-size:0.45rem;"></i>${t.tu_ativa ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div class="d-flex align-items-center gap-3 flex-wrap" style="font-size:0.81rem;color:#64748b;">
              <span><i class="fas fa-users me-1"></i>${t.total_alunos || 0} aluno(s)</span>
              <span style="display:flex;align-items:center;gap:5px;">
                <i class="fas fa-key" style="color:#94a3b8;"></i>
                <code style="background:#f1f5f9;padding:2px 8px;border-radius:6px;letter-spacing:2px;color:#463acb;font-size:0.8rem;">${t.tu_codigo || '——'}</code>
                <button title="Copiar código" onclick="copiarCodigo('${t.tu_codigo||''}')"
                  style="color:#94a3b8;border:none;background:none;font-size:0.78rem;cursor:pointer;padding:0;">
                  <i class="fas fa-copy"></i>
                </button>
              </span>
            </div>
          </div>
          <div class="d-flex gap-2 flex-shrink-0">
            <button class="btn-icon" title="Ver alunos" onclick="abrirDetalhes(${t.tu_id})"><i class="fas fa-eye"></i></button>
            <button class="btn-icon" title="Editar" onclick="abrirEditar(${t.tu_id},${JSON.stringify(t.tu_nome)},${t.tu_ativa})"><i class="fas fa-pen"></i></button>
          </div>
        </div>
      </div>
    </div>`;
  }).join('') + `</div>`;
}

function toggleFormCriar() {
  const form = document.getElementById('form-criar');
  form.classList.toggle('d-none');
  if (!form.classList.contains('d-none')) document.getElementById('input-nome-turma').focus();
}

async function criarTurma() {
  const nome = document.getElementById('input-nome-turma').value.trim();
  const btn = document.getElementById('btn-criar-turma');
  if (!nome) return mostrarMensagem('err', 'Informe o nome da turma.');

  const token = localStorage.getItem('xp_diario_token');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Criando…';

  try {
    const res = await fetch('/api/turmas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tu_nome: nome })
    });
    const dados = await res.json();

    if (res.ok) {
      document.getElementById('input-nome-turma').value = '';
      document.getElementById('form-criar').classList.add('d-none');
      mostrarMensagem('ok', `Turma "${dados.turma.tu_nome}" criada! Código: ${dados.turma.tu_codigo}`);
      carregarTurmasProfessor();
    } else {
      mostrarMensagem('err', dados.erro || 'Erro ao criar turma.');
    }
  } catch {
    mostrarMensagem('err', 'Erro ao conectar com o servidor.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check me-2"></i>Criar Turma';
  }
}

function copiarCodigo(codigo) {
  if (!codigo) return;
  navigator.clipboard.writeText(codigo).then(() => mostrarMensagem('ok', `Código ${codigo} copiado para a área de transferência!`));
}

async function abrirDetalhes(turmaId) {
  const token = localStorage.getItem('xp_diario_token');
  const corpo = document.getElementById('modal-body-detalhes');
  corpo.innerHTML = '<div class="text-center py-3"><i class="fas fa-spinner fa-spin"></i></div>';
  new bootstrap.Modal(document.getElementById('modal-detalhes')).show();

  try {
    const res = await fetch(`/api/turmas/${turmaId}`, { headers: { Authorization: `Bearer ${token}` } });
    const dados = await res.json();
    if (!res.ok) { corpo.innerHTML = `<div class="text-danger small">${dados.erro}</div>`; return; }

    const t = dados.turma;
    const alunos = dados.alunos || [];
    document.getElementById('modal-title-detalhes').textContent = t.tu_nome;

    let html = `
      <div class="d-flex align-items-center gap-2 mb-4 flex-wrap">
        <span class="badge rounded-pill" style="background:#ede9fe;color:#7c3aed;font-size:0.8rem;font-family:monospace;letter-spacing:1px;">
          <i class="fas fa-key me-1"></i>${t.tu_codigo}
        </span>
        <span class="badge rounded-pill" style="background:${t.tu_ativa ? '#dcfce7' : '#f1f5f9'};color:${t.tu_ativa ? '#16a34a' : '#94a3b8'};font-size:0.8rem;">
          ${t.tu_ativa ? 'Ativa' : 'Inativa'}
        </span>
        <span class="text-muted" style="font-size:0.78rem;">${alunos.length} aluno(s)</span>
      </div>`;

    if (alunos.length === 0) {
      html += '<div class="text-center text-muted py-3 small">Nenhum aluno nesta turma ainda.</div>';
    } else {
      html += `<table class="table table-sm">
        <thead><tr>
          <th style="font-size:0.78rem;color:#64748b;font-weight:600;">Aluno</th>
          <th style="font-size:0.78rem;color:#64748b;font-weight:600;" class="text-end">XP</th>
          <th style="font-size:0.78rem;color:#64748b;font-weight:600;" class="text-end">Ação</th>
        </tr></thead><tbody>
        ${alunos.map(a => `
          <tr>
            <td style="font-size:0.85rem;">
              <div class="fw-semibold">${a.us_nome}</div>
              <div class="text-muted" style="font-size:0.75rem;">${a.us_email}</div>
            </td>
            <td class="text-end" style="font-size:0.85rem;color:#463acb;font-weight:600;">${a.us_pontos_total || 0}</td>
            <td class="text-end">
              <button class="btn btn-sm p-1" style="color:#ef4444;border:none;background:none;font-size:0.8rem;"
                onclick="removerAluno(${turmaId},${a.us_id},${JSON.stringify(a.us_nome)})">
                <i class="fas fa-times"></i>
              </button>
            </td>
          </tr>`).join('')}
        </tbody></table>`;
    }

    corpo.innerHTML = html;
  } catch {
    corpo.innerHTML = '<div class="text-danger small">Erro ao carregar dados.</div>';
  }
}

async function removerAluno(turmaId, alunoId, alunoNome) {
  if (!confirm(`Remover "${alunoNome}" desta turma?`)) return;
  const token = localStorage.getItem('xp_diario_token');

  try {
    const res = await fetch(`/api/turmas/${turmaId}/alunos/${alunoId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const dados = await res.json();
    if (res.ok) {
      mostrarMensagem('ok', dados.mensagem);
      abrirDetalhes(turmaId);
      carregarTurmasProfessor();
    } else {
      mostrarMensagem('err', dados.erro || 'Erro ao remover aluno.');
    }
  } catch {
    mostrarMensagem('err', 'Erro ao conectar com o servidor.');
  }
}

let _editandoTurmaId = null;

function abrirEditar(turmaId, nome, ativa) {
  _editandoTurmaId = turmaId;
  document.getElementById('edit-nome-turma').value = nome;
  document.getElementById('edit-ativa').checked = ativa;
  new bootstrap.Modal(document.getElementById('modal-editar')).show();
}

async function salvarEdicao() {
  const nome = document.getElementById('edit-nome-turma').value.trim();
  const ativa = document.getElementById('edit-ativa').checked;
  const token = localStorage.getItem('xp_diario_token');
  const btn = document.getElementById('btn-salvar-edicao');
  if (!nome) return mostrarMensagem('err', 'Nome não pode ser vazio.');

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Salvando…';

  try {
    const res = await fetch(`/api/turmas/${_editandoTurmaId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tu_nome: nome, tu_ativa: ativa })
    });
    const dados = await res.json();
    if (res.ok) {
      bootstrap.Modal.getInstance(document.getElementById('modal-editar')).hide();
      mostrarMensagem('ok', 'Turma atualizada com sucesso!');
      carregarTurmasProfessor();
    } else {
      mostrarMensagem('err', dados.erro || 'Erro ao atualizar turma.');
    }
  } catch {
    mostrarMensagem('err', 'Erro ao conectar com o servidor.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-check me-1"></i>Salvar';
  }
}

// ── Aluno ────────────────────────────────────────────────────────────────────

async function carregarTurmasAluno() {
  const token = localStorage.getItem('xp_diario_token');
  const lista = document.getElementById('lista-aluno');
  lista.innerHTML = '<div class="text-center py-4 text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Carregando turmas…</div>';

  try {
    const res = await fetch('/api/turmas', { headers: { Authorization: `Bearer ${token}` } });
    const dados = await res.json();
    if (!res.ok) return mostrarMensagem('err', dados.erro || 'Erro ao carregar turmas.');
    renderizarListaAluno(dados.turmas || []);
  } catch {
    lista.innerHTML = '<div class="text-danger small p-2">Erro ao conectar com o servidor.</div>';
  }
}

function renderizarListaAluno(turmas) {
  const lista = document.getElementById('lista-aluno');

  if (turmas.length === 0) {
    lista.innerHTML = `
      <div class="card-panel p-5 text-center">
        <i class="fas fa-door-open" style="font-size:2.5rem;color:#cbd5e1;display:block;margin-bottom:12px;"></i>
        <div class="fw-semibold mb-1" style="color:#64748b;">Você não está em nenhuma turma</div>
        <div class="text-muted small">Peça o código ao seu professor e clique em <strong>Entrar em Turma</strong>.</div>
      </div>`;
    return;
  }

  const cores = ['#5b5ef4','#7c3aed','#2563eb','#0891b2','#059669','#d97706'];
  lista.innerHTML = `<div class="row g-3">` + turmas.map(t => {
    const inicial = (t.tu_nome || '?')[0].toUpperCase();
    const cor = cores[(t.tu_id || 0) % cores.length];
    return `
    <div class="col-md-6">
      <div class="card-panel p-4" style="height:100%;transition:box-shadow 0.15s,transform 0.15s;" onmouseenter="this.style.boxShadow='0 4px 16px rgba(91,94,244,0.12)';this.style.transform='translateY(-2px)'" onmouseleave="this.style.boxShadow='';this.style.transform=''">
        <div class="d-flex align-items-start gap-3">
          <div style="width:48px;height:48px;border-radius:14px;background:${cor};display:flex;align-items:center;justify-content:center;font-size:1.3rem;font-weight:800;color:#fff;flex-shrink:0;">
            ${inicial}
          </div>
          <div style="flex:1;min-width:0;">
            <div class="d-flex align-items-center gap-2 flex-wrap mb-1">
              <span class="fw-bold" style="color:#1e293b;font-size:0.98rem;">${t.tu_nome}</span>
              <span style="display:inline-flex;align-items:center;gap:3px;border-radius:99px;padding:2px 9px;font-size:0.7rem;font-weight:600;background:${t.tu_ativa?'#f0fdf4':'#f1f5f9'};color:${t.tu_ativa?'#16a34a':'#94a3b8'};">
                <i class="fas fa-circle" style="font-size:0.45rem;"></i>${t.tu_ativa ? 'Ativa' : 'Inativa'}
              </span>
            </div>
            <div style="font-size:0.81rem;color:#64748b;">
              ${t.professor_nome ? `<span><i class="fas fa-chalkboard-teacher me-1"></i>Prof. ${t.professor_nome}</span>` : ''}
              ${t.ta_entrou_em ? `<span class="ms-2"><i class="fas fa-calendar me-1"></i>${new Date(t.ta_entrou_em).toLocaleDateString('pt-BR')}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>`;
  }).join('') + `</div>`;
}

function toggleFormEntrar() {
  const form = document.getElementById('form-entrar');
  form.classList.toggle('d-none');
  if (!form.classList.contains('d-none')) document.getElementById('input-codigo').focus();
}

async function entrarTurma() {
  const codigo = document.getElementById('input-codigo').value.trim().toUpperCase();
  const btn = document.getElementById('btn-entrar-turma');
  if (!codigo) return mostrarMensagem('err', 'Informe o código da turma.');

  const token = localStorage.getItem('xp_diario_token');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Entrando…';

  try {
    const res = await fetch('/api/turmas/entrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ codigo })
    });
    const dados = await res.json();

    if (res.ok) {
      document.getElementById('input-codigo').value = '';
      document.getElementById('form-entrar').classList.add('d-none');
      mostrarMensagem('ok', dados.mensagem);
      carregarTurmasAluno();
    } else {
      mostrarMensagem('err', dados.erro || 'Erro ao entrar na turma.');
    }
  } catch {
    mostrarMensagem('err', 'Erro ao conectar com o servidor.');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt me-2"></i>Entrar';
  }
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function mostrarMensagem(tipo, texto) {
  const div = document.getElementById('mensagem');
  if (!div) return;
  div.className = `mb-3 p-3 rounded-3 small fw-semibold ${tipo === 'ok' ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`;
  div.textContent = texto;
  div.style.display = 'block';
  clearTimeout(div._timer);
  div._timer = setTimeout(() => { div.style.display = 'none'; }, 6000);
}
