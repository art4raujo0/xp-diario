const API_TAREFAS = "/api/tarefas";
const API_MATERIAS = "/api/materias";
let tarefasCache = [];

function token() {
  return localStorage.getItem("xp_diario_token");
}

function cabecalhos() {
  return {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token()}`
  };
}

function formatarData(data) {
  if (!data) return "-";
  const texto = String(data).slice(0, 10);
  const partes = texto.split("-");
  if (partes.length !== 3) return "-";
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataHora(data) {
  if (!data) return "-";
  return new Date(data).toLocaleString("pt-BR");
}

function exibirMensagem(texto, tipo) {
  const div = document.getElementById("mensagem");
  div.className = `alert alert-${tipo} border-0 shadow-sm`;
  div.textContent = texto;

  if (tipo === "success" || tipo === "info") {
    setTimeout(() => {
      div.className = "";
      div.textContent = "";
    }, 4000);
  }
}

function limparMensagem() {
  const div = document.getElementById("mensagem");
  div.className = "";
  div.textContent = "";
}

function mostrarForm() {
  limparMensagem();
  document.getElementById("formTarefa").classList.remove("d-none");
}

function cancelar() {
  limparForm();
  document.getElementById("formTarefa").classList.add("d-none");
}

function limparForm() {
  document.getElementById("tarefaId").value = "";
  document.getElementById("titulo").value = "";
  document.getElementById("prazo").value = "";
  document.getElementById("materia").value = "";
  document.getElementById("descricao").value = "";
  document.getElementById("btnSalvarTarefa").innerHTML = '<i class="fas fa-floppy-disk me-2"></i>Salvar Tarefa';
}

function obterTextoHistorico(item) {
  if (item.th_acao === "criada") return "Tarefa criada";
  if (item.th_acao === "atualizada") return "Dados atualizados";
  if (item.th_acao === "status_alterado") {
    return item.th_status_novo === "concluida"
      ? "Tarefa concluida"
      : "Tarefa voltou para pendente";
  }
  if (item.th_acao === "excluida") return "Tarefa excluida";
  return item.th_descricao || "Atualizacao registrada";
}

function renderResumo(resumo) {
  const container = document.getElementById("resumo");
  const itens = [
    { label: "Total", valor: resumo?.total || 0, icon: "fa-list-check", klass: "icon-blue" },
    { label: "Pendentes", valor: resumo?.pendentes || 0, icon: "fa-hourglass-half", klass: "icon-orange" },
    { label: "Concluidas", valor: resumo?.concluidas || 0, icon: "fa-circle-check", klass: "icon-green" },
    { label: "Vencidas", valor: resumo?.vencidas || 0, icon: "fa-calendar-xmark", klass: "icon-purple" }
  ];

  container.innerHTML = itens.map((item) => `
    <div class="col-6 col-md-3">
      <div class="stat-card">
        <div>
          <div class="stat-label">${item.label}</div>
          <div class="stat-value">${item.valor}</div>
        </div>
        <div class="stat-icon ${item.klass}">
          <i class="fas ${item.icon}"></i>
        </div>
      </div>
    </div>
  `).join("");
}

function renderListaTarefas(tarefas) {
  const lista = document.getElementById("listaTarefas");
  tarefasCache = Array.isArray(tarefas) ? tarefas : [];

  if (!Array.isArray(tarefas) || tarefas.length === 0) {
    lista.innerHTML = `
      <div class="p-5 text-center text-muted">
        <i class="fas fa-list-check fs-2 mb-3 d-block" style="color:#d1c4e9;"></i>
        <p class="mb-0">Nenhuma tarefa cadastrada ainda.</p>
      </div>`;
    return;
  }

  lista.innerHTML = `
    <div class="d-flex justify-content-between align-items-center px-2 pt-1 pb-3">
      <span class="fw-semibold text-muted" style="font-size:0.85rem;">
        <i class="fas fa-list-check me-1"></i> ${tarefas.length} tarefa${tarefas.length !== 1 ? "s" : ""}
      </span>
    </div>
    <div class="table-responsive">
      <table class="table table-hover align-middle mb-0">
        <thead>
          <tr>
            <th>Status</th>
            <th>Titulo</th>
            <th>Materia</th>
            <th>Prazo</th>
            <th>Atualizada</th>
            <th class="text-end">Acoes</th>
          </tr>
        </thead>
        <tbody>
          ${tarefas.map((tarefa) => `
            <tr>
              <td>
                <span class="task-badge ${tarefa.ta_status}">
                  <i class="fas ${tarefa.ta_status === "concluida" ? "fa-circle-check" : "fa-hourglass-half"}"></i>
                  ${tarefa.ta_status}
                </span>
              </td>
              <td>
                <div class="fw-semibold">${tarefa.ta_titulo || "-"}</div>
                <div class="text-muted small">${tarefa.ta_descricao || "Sem descricao"}</div>
              </td>
              <td class="text-muted">${tarefa.di_disciplina || "Nao vinculada"}</td>
              <td class="text-muted">${formatarData(tarefa.ta_prazo)}</td>
              <td class="text-muted small">${formatarDataHora(tarefa.ta_atualizado_em)}</td>
              <td class="text-end">
                <button class="btn-icon me-1" title="${tarefa.ta_status === "concluida" ? "Voltar para pendente" : "Marcar como concluida"}" onclick="alternarStatus(${tarefa.ta_id}, '${tarefa.ta_status}')">
                  <i class="fas ${tarefa.ta_status === "concluida" ? "fa-rotate-left" : "fa-check"}"></i>
                </button>
                <button class="btn-icon me-1" title="Editar" onclick="editarTarefaPorId(${tarefa.ta_id})">
                  <i class="fas fa-pen"></i>
                </button>
                <button class="btn-icon danger" title="Excluir" onclick="excluirTarefa(${tarefa.ta_id})">
                  <i class="fas fa-trash"></i>
                </button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

function renderHistorico(historico) {
  const container = document.getElementById("historicoTarefas");

  if (!Array.isArray(historico) || historico.length === 0) {
    container.innerHTML = `
      <h6 class="fw-bold mb-3" style="color:#1e293b;">Historico recente</h6>
      <div class="text-muted small">Nenhuma movimentacao registrada.</div>`;
    return;
  }

  container.innerHTML = `
    <h6 class="fw-bold mb-3" style="color:#1e293b;">Historico recente</h6>
    ${historico.map((item) => `
      <div class="history-item">
        <div class="history-icon"><i class="fas fa-clock-rotate-left"></i></div>
        <div>
          <div class="history-title">${obterTextoHistorico(item)}</div>
          <div class="text-muted small">${item.th_titulo_snapshot}</div>
          <div class="history-meta">${formatarDataHora(item.th_criado_em)}</div>
        </div>
      </div>
    `).join("")}`;
}

async function carregarMaterias() {
  try {
    const resposta = await fetch(API_MATERIAS);
    const materias = await resposta.json();
    const select = document.getElementById("materia");

    if (!Array.isArray(materias)) {
      select.innerHTML = '<option value="">Sem materia especifica</option>';
      return;
    }

    select.innerHTML = '<option value="">Sem materia especifica</option>' +
      materias.map((materia) => `<option value="${materia.di_id}">${materia.di_disciplina}</option>`).join("");
  } catch (error) {
    console.error("Erro ao carregar materias:", error);
  }
}

async function carregarTarefas() {
  try {
    const resposta = await fetch(API_TAREFAS, { headers: cabecalhos() });

    if (resposta.status === 401) {
      window.location.href = "/login";
      return;
    }

    const dados = await resposta.json();
    renderResumo(dados.resumo || {});
    renderListaTarefas(dados.tarefas || []);
    renderHistorico(dados.historico || []);
  } catch (error) {
    console.error("Erro ao carregar tarefas:", error);
    exibirMensagem("Erro ao carregar tarefas.", "danger");
  }
}

async function salvarTarefa() {
  limparMensagem();

  const id = document.getElementById("tarefaId").value;
  const titulo = document.getElementById("titulo").value.trim();
  const prazo = document.getElementById("prazo").value;
  const materiaId = document.getElementById("materia").value;
  const descricao = document.getElementById("descricao").value.trim();

  if (!titulo) {
    exibirMensagem("Titulo da tarefa e obrigatorio.", "danger");
    return;
  }

  const botao = document.getElementById("btnSalvarTarefa");
  botao.disabled = true;
  botao.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Salvando...';

  try {
    const resposta = await fetch(id ? `${API_TAREFAS}/${id}` : API_TAREFAS, {
      method: id ? "PUT" : "POST",
      headers: cabecalhos(),
      body: JSON.stringify({
        ta_titulo: titulo,
        ta_descricao: descricao || undefined,
        ta_prazo: prazo || undefined,
        ta_disciplina_id: materiaId || undefined
      })
    });

    if (resposta.status === 401) {
      window.location.href = "/login";
      return;
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      exibirMensagem(dados.erro || "Erro ao salvar tarefa.", "danger");
      return;
    }

    exibirMensagem(dados.mensagem || "Tarefa salva com sucesso.", "success");
    cancelar();
    await carregarTarefas();
  } catch (error) {
    console.error("Erro ao salvar tarefa:", error);
    exibirMensagem("Erro ao salvar tarefa.", "danger");
  } finally {
    botao.disabled = false;
    botao.innerHTML = '<i class="fas fa-floppy-disk me-2"></i>Salvar Tarefa';
  }
}

function editarTarefaPorId(id) {
  const tarefa = tarefasCache.find((item) => Number(item.ta_id) === Number(id));

  if (!tarefa) {
    exibirMensagem("Nao foi possivel localizar a tarefa selecionada.", "danger");
    return;
  }

  mostrarForm();
  document.getElementById("tarefaId").value = tarefa.ta_id;
  document.getElementById("titulo").value = tarefa.ta_titulo || "";
  document.getElementById("prazo").value = tarefa.ta_prazo ? String(tarefa.ta_prazo).slice(0, 10) : "";
  document.getElementById("materia").value = tarefa.ta_disciplina_id || "";
  document.getElementById("descricao").value = tarefa.ta_descricao || "";
  document.getElementById("btnSalvarTarefa").innerHTML = '<i class="fas fa-floppy-disk me-2"></i>Atualizar Tarefa';
}

async function alternarStatus(id, statusAtual) {
  const proximoStatus = statusAtual === "concluida" ? "pendente" : "concluida";

  try {
    const resposta = await fetch(`${API_TAREFAS}/${id}/status`, {
      method: "PATCH",
      headers: cabecalhos(),
      body: JSON.stringify({ status: proximoStatus })
    });

    if (resposta.status === 401) {
      window.location.href = "/login";
      return;
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      exibirMensagem(dados.erro || "Erro ao alterar status da tarefa.", "danger");
      return;
    }

    exibirMensagem(dados.mensagem || "Status atualizado.", "success");
    await carregarTarefas();
  } catch (error) {
    console.error("Erro ao alterar status:", error);
    exibirMensagem("Erro ao alterar status da tarefa.", "danger");
  }
}

async function excluirTarefa(id) {
  if (!confirm("Deseja excluir esta tarefa?")) {
    return;
  }

  try {
    const resposta = await fetch(`${API_TAREFAS}/${id}`, {
      method: "DELETE",
      headers: cabecalhos()
    });

    if (resposta.status === 401) {
      window.location.href = "/login";
      return;
    }

    const dados = await resposta.json();

    if (!resposta.ok) {
      exibirMensagem(dados.erro || "Erro ao excluir tarefa.", "danger");
      return;
    }

    exibirMensagem(dados.mensagem || "Tarefa excluida com sucesso.", "success");
    await carregarTarefas();
  } catch (error) {
    console.error("Erro ao excluir tarefa:", error);
    exibirMensagem("Erro ao excluir tarefa.", "danger");
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (!token()) {
    window.location.href = "/login";
    return;
  }

  await carregarMaterias();
  await carregarTarefas();
});
