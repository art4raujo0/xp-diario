document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificação de Autenticação
    const token = localStorage.getItem('xp_diario_token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    const usuario = await carregarUsuarioAtual();
    carregarStreak(token);
    carregarProgresso(token, usuario);
    carregarDashboardReal(token, usuario);
    carregarConfigNotificacoes(token);
});

// --- FUNÇÃO DO STREAK ---
async function carregarStreak(token) {
    const streakValor = document.getElementById('streak-valor');
    const streakIcon = document.getElementById('streak-icon');
    const streakIconContainer = document.getElementById('streak-icon-container');

    try {
        const resposta = await fetch('/api/streak', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });
        
        if (resposta.ok) {
            const dados = await resposta.json();
            const dias = dados.streak || 0; 
            
            streakValor.textContent = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
            
            // Regra de Negócio: Acender o fogo se houver sequência
            if (dias > 0) {
                streakIcon.classList.remove('text-muted');
                streakIcon.classList.add('text-danger'); 
                streakIconContainer.style.backgroundColor = '#ffebe6'; 
            }
        } else {
            streakValor.textContent = 'Erro';
        }
    } catch (erro) {
        console.error('Erro Streak:', erro);
        streakValor.textContent = 'Offline';
    }
}

// --- FUNÇÃO DO PROGRESSO (US PROGRESSO) ---
async function carregarProgresso(token, usuario) {
    const comDados = document.getElementById('progresso-com-dados');
    const vazio = document.getElementById('progresso-vazio');
    const barra = document.getElementById('progresso-barra');
    const percentualTexto = document.getElementById('progresso-percentual');
    const mensagemVazio = document.getElementById('mensagem-vazio');
    
    // Elementos do resumo conforme seu backend
    const txtTempo = document.getElementById('tempo-estudado');
    const txtMetas = document.getElementById('metas-atingidas');
    const txtTarefas = document.getElementById('tarefas-concluidas');

    try {
        const resposta = await fetch('/api/progresso', {
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            }
        });

        const dados = await resposta.json();

        // Critério de Aceitação: Se não possuir metas cadastradas
        if (!dados.possuiMetas || dados.resumo.metasCadastradas === 0) {
            comDados.classList.add('d-none');
            vazio.classList.remove('d-none');
            mensagemVazio.textContent = dados.mensagem || "Cadastre metas para acompanhar seu progresso.";
            return;
        }

        // Se possui metas, exibe o resumo
        comDados.classList.remove('d-none');
        vazio.classList.add('d-none');

        const resumo = dados.resumo;
        // Garante que a barra não passe de 100% visualmente
        const percentualExibicao = Math.min(resumo.percentualGeral, 100); 

        // Atualiza indicadores visuais (Critério de Aceitação: Forma clara e intuitiva)
        barra.style.width = `${percentualExibicao}%`;
        percentualTexto.textContent = `${Math.round(resumo.percentualGeral)}%`;
        
        // Preenche os dados do resumo vindos do backend
        txtTempo.textContent = formatarMinutos(resumo.totalTempoEstudadoMin || 0);
        txtMetas.textContent = `${resumo.metasAtingidas}/${resumo.metasAtivas}`;
        txtTarefas.textContent = resumo.totalTarefasConcluidas;

    } catch (error) {
        console.error("Erro Progresso:", error);
    }
}

function formatarMinutos(total) {
    const minutos = Number(total || 0);
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    if (horas <= 0) return `${resto} min`;
    return `${horas}h ${String(resto).padStart(2, '0')}m`;
}

async function carregarDashboardReal(token, usuario) {
    try {
        const [atividadesRes, tarefasRes, metasRes, conquistasRes, cronosRes] = await Promise.all([
            fetch('/api/atividades', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/tarefas', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/metas', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/conquistas', { headers: { Authorization: `Bearer ${token}` } }),
            fetch('/api/cronogramas', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        const atividades = atividadesRes.ok ? (await atividadesRes.json()).historico || [] : [];
        const tarefasDados = tarefasRes.ok ? await tarefasRes.json() : { tarefas: [] };
        const metas = metasRes.ok ? await metasRes.json() : [];
        const conquistas = conquistasRes.ok ? (await conquistasRes.json()).conquistas || [] : [];
        const cronos = cronosRes.ok ? (await cronosRes.json()).cronogramas || [] : [];

        const xp = Number(usuario?.us_pontos_total || atividades.reduce((acc, a) => acc + Number(a.at_tempo_min || 0), 0));
        const nivel = nivelPorXp(xp);
        const xpNoNivel = xp % 100;
        document.querySelectorAll('[data-dashboard-level]').forEach(el => el.textContent = `Nivel ${nivel}`);
        document.querySelectorAll('[data-dashboard-xp]').forEach(el => el.textContent = `${xpNoNivel} / 100 XP`);
        document.querySelectorAll('[data-dashboard-xp-bar]').forEach(el => el.style.width = `${xpNoNivel}%`);

        const hojeIso = new Date().toISOString().slice(0, 10);
        const cronosHoje = cronos.filter(c => String(c.cr_data).slice(0, 10) === hojeIso).slice(0, 5);
        const cronosEl = document.getElementById('dashboard-cronogramas');
        if (cronosEl) {
            cronosEl.innerHTML = cronosHoje.length ? cronosHoje.map(c => `
                <div class="schedule-row">
                    <span class="schedule-time">${String(c.cr_horario_inicio).slice(0, 5)}</span>
                    <strong>${c.di_disciplina || 'Disciplina'}</strong>
                    <span>${c.cr_duracao_min} min</span>
                </div>`).join('') : '<p class="text-muted fw-bold mb-0">Nenhuma sessao agendada para hoje.</p>';
        }

        const tarefasEl = document.getElementById('dashboard-tarefas');
        const tarefas = tarefasDados.tarefas || [];
        if (tarefasEl) {
            tarefasEl.innerHTML = tarefas.slice(0, 5).map(t => {
                const concluida = t.ta_status === 'concluida';
                return `<div class="task-row">
                    <i class="${concluida ? 'fas fa-square-check text-success' : 'far fa-square text-muted'} fs-5"></i>
                    <strong>${t.ta_titulo}</strong>
                    <span class="badge-soft ${concluida ? 'badge-green' : 'badge-orange'}">${concluida ? 'Concluida' : 'Pendente'}</span>
                </div>`;
            }).join('') || '<p class="text-muted fw-bold mb-0">Nenhuma tarefa cadastrada.</p>';
        }

        const concluidas = tarefas.filter(t => t.ta_status === 'concluida').length;
        const tarefasCard = document.getElementById('tarefas-concluidas');
        if (tarefasCard) tarefasCard.textContent = concluidas;

        const metasHoje = metas.filter(m => m.me_tipo === 'diaria');
        const metasSemana = metas.filter(m => m.me_tipo === 'semanal');
        atualizarMetaCard('metas-hoje-total', 'metas-hoje-barra', metasHoje, atividades, tarefas);
        atualizarMetaCard('metas-semana-total', 'metas-semana-barra', metasSemana, atividades, tarefas);

        const conquistasEl = document.getElementById('dashboard-conquistas');
        if (conquistasEl) {
            const recentes = conquistas.filter(c => c.status === 'desbloqueada').slice(0, 4);
            conquistasEl.innerHTML = (recentes.length ? recentes : conquistas.slice(0, 4)).map(c => `
                <div class="achievement-badge">
                    <div class="badge-medal" style="background:#8b5cf6"><i class="fas fa-trophy"></i></div>
                    ${c.co_titulo || c.nome || c.titulo || 'Conquista'}
                </div>`).join('');
        }

        renderizarDicaDoMestre();
    } catch (erro) {
        console.error('Erro ao carregar dashboard real:', erro);
    }
}

function atualizarMetaCard(totalId, barraId, metas, atividades, tarefas) {
    const alvo = metas.reduce((acc, meta) => acc + Number(meta.me_tempo_min || 0), 0);
    const feito = atividades.reduce((acc, a) => acc + Number(a.at_tempo_min || 0), 0);
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
                <div class="text-muted fw-bold small">Transforme uma meta grande em sessoes de 25 minutos para manter o combo de foco.</div>
            </div>
        </div>`;
}
// ============================================================
// --- NOTIFICAÇÕES DE LEMBRETE DIÁRIO ---
// ============================================================

// Carrega a config do backend e preenche o modal
async function carregarConfigNotificacoes(token) {
    try {
        const resposta = await fetch('/api/notificacoes', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!resposta.ok) return;

        const config = await resposta.json();

        document.getElementById('notif-ativo').checked = config.ativo || false;
        document.getElementById('notif-horario').value = config.horario || '08:00';
        document.getElementById('notif-fuso').value = config.fuso_horario || 'America/Sao_Paulo';

        // Mostra badge verde no sino quando ativo
        const badge = document.getElementById('badge-notif');
        if (config.ativo) {
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    } catch (erro) {
        console.error('Erro ao carregar config de notificações:', erro);
    }
}

// Abre o modal e garante que os dados estejam atualizados
function abrirModalNotificacoes() {
    const token = localStorage.getItem('xp_diario_token');
    if (token) carregarConfigNotificacoes(token);

    const modal = new bootstrap.Modal(document.getElementById('modalNotificacoes'));
    modal.show();
}

// Salva a config no backend
async function salvarNotificacoes() {
    const token = localStorage.getItem('xp_diario_token');
    if (!token) return;

    const ativo = document.getElementById('notif-ativo').checked;
    const horario = document.getElementById('notif-horario').value;
    const fuso_horario = document.getElementById('notif-fuso').value;

    const feedback = document.getElementById('notif-feedback');
    const btnSalvar = document.getElementById('btn-salvar-notif');

    if (!horario) {
        exibirFeedbackNotif('Por favor, defina um horário válido.', 'danger');
        return;
    }

    btnSalvar.disabled = true;
    btnSalvar.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Salvando...';

    try {
        const resposta = await fetch('/api/notificacoes', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ativo, horario, fuso_horario })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            exibirFeedbackNotif('✓ Configuração salva com sucesso!', 'success');
            // Atualiza badge do sino
            const badge = document.getElementById('badge-notif');
            badge.style.display = ativo ? 'block' : 'none';

            // Fecha o modal após 1.2s
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalNotificacoes'));
                if (modal) modal.hide();
                feedback.classList.add('d-none');
            }, 1200);
        } else {
            exibirFeedbackNotif(dados.erro || 'Erro ao salvar. Tente novamente.', 'danger');
        }
    } catch (erro) {
        console.error('Erro ao salvar notificações:', erro);
        exibirFeedbackNotif('Erro de conexão. Tente novamente.', 'danger');
    } finally {
        btnSalvar.disabled = false;
        btnSalvar.innerHTML = 'Salvar';
    }
}

function exibirFeedbackNotif(mensagem, tipo) {
    const feedback = document.getElementById('notif-feedback');
    feedback.className = `mt-3 alert alert-${tipo} py-2 px-3 small`;
    feedback.textContent = mensagem;
    feedback.classList.remove('d-none');
}
