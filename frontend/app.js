document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('xp_diario_token');
    if (!token) { window.location.href = '/login'; return; }

    popularHeroBanner(token);
    carregarStreak(token);
    carregarProgresso(token);
    carregarConfigNotificacoes(token);
    carregarDisciplinasDashboard(token);
    carregarTarefasDashboard(token);
    carregarConquisitasDashboard(token);

    // Mascote motivacional — aparece após 2s
    setTimeout(() => {
        const bubble = document.getElementById('mascot-bubble');
        if (bubble) bubble.style.display = 'flex';
    }, 2000);
});

function popularHeroBanner(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const nome = (payload.nome || payload.email || '').split(' ')[0];
        if (nome) {
            const saudacao = document.getElementById('hero-saudacao');
            const titulo = document.getElementById('hero-titulo');
            if (saudacao) saudacao.textContent = `Olá, ${nome}! 👋`;
            const hora = new Date().getHours();
            const msg = hora < 12 ? 'Bom dia! Que tal começar estudando?' :
                        hora < 18 ? 'Boa tarde! Hora de focar nos estudos.' :
                                    'Boa noite! Uma sessão antes de dormir?';
            if (titulo) titulo.textContent = msg;
        }
    } catch {}
}

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
            
            const label = `${dias} ${dias === 1 ? 'dia' : 'dias'}`;
            streakValor.textContent = label;

            const heroStreak = document.getElementById('hero-streak-val');
            if (heroStreak) heroStreak.textContent = label;

            const mascotMsg = document.getElementById('mascot-msg');
            if (mascotMsg) {
                if (dias >= 7) mascotMsg.textContent = `${dias} dias seguidos! Incrível! 🔥`;
                else if (dias >= 3) mascotMsg.textContent = `${dias} dias de sequência! Continue! ⚡`;
                else mascotMsg.textContent = 'Comece sua sequência hoje! 💪';
            }

            // Acende o fogo se houver sequência
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
async function carregarProgresso(token) {
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
        txtTempo.textContent = `${resumo.totalTempoEstudadoMin} min`;
        txtMetas.textContent = `${resumo.metasAtingidas}/${resumo.metasAtivas}`;
        txtTarefas.textContent = resumo.totalTarefasConcluidas;

    } catch (error) {
        console.error("Erro Progresso:", error);
    }
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

// ============================================================
// --- DISCIPLINAS NO DASHBOARD ---
// ============================================================
async function carregarDisciplinasDashboard(token) {
    const container = document.getElementById('dashboard-disciplinas');
    if (!container) return;
    try {
        const res = await fetch('/api/materias', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const materias = await res.json();
        if (!Array.isArray(materias) || !materias.length) {
            container.innerHTML = `<p class="text-muted small text-center py-2">Nenhuma matéria cadastrada. <a href="/materias" style="color:var(--primary);">Adicionar →</a></p>`;
            return;
        }
        const top = materias.slice(0, 5);
        const coresPadrao = ['#5B4FCF','#3B82F6','#22C55E','#F59E0B','#EF4444'];
        container.innerHTML = top.map((m, i) => {
            const cor = m.di_cor || coresPadrao[i % coresPadrao.length];
            const dif = m.di_dificuldade || '';
            const difPct = dif === 'facil' ? 30 : dif === 'media' ? 60 : dif === 'dificil' ? 90 : 50;
            return `
            <div class="mb-3">
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-semibold" style="font-size:0.85rem;color:var(--text-dark);">${m.di_disciplina}</span>
                <span class="diff-badge diff-${dif || 'default'}" style="font-size:0.7rem;">${dif || 'geral'}</span>
              </div>
              <div style="background:#F1F5F9;border-radius:99px;height:6px;">
                <div style="width:${difPct}%;background:${cor};border-radius:99px;height:100%;transition:width .6s ease;"></div>
              </div>
            </div>`;
        }).join('');
    } catch {
        container.innerHTML = `<p class="text-muted small text-center py-2">Erro ao carregar matérias.</p>`;
    }
}

// ============================================================
// --- TAREFAS NO DASHBOARD ---
// ============================================================
async function carregarTarefasDashboard(token) {
    const container = document.getElementById('dashboard-tarefas');
    if (!container) return;
    try {
        const res = await fetch('/api/tarefas', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const dados = await res.json();
        const lista = dados.tarefas || [];
        const pendentes = lista.filter(t => t.ta_status === 'pendente').slice(0, 5);
        if (!pendentes.length) {
            container.innerHTML = `<div class="text-center py-3"><div style="font-size:2rem;margin-bottom:6px;">✅</div><p class="text-muted small mb-0">Todas as tarefas concluídas!</p></div>`;
            return;
        }
        container.innerHTML = pendentes.map(t => {
            const hoje = new Date().toISOString().slice(0, 10);
            const prazo = t.ta_prazo ? String(t.ta_prazo).slice(0, 10) : null;
            const atrasada = prazo && prazo < hoje;
            const tagCor = atrasada ? '#FEF2F2' : (prazo === hoje ? '#FFF7ED' : '#F0FDF4');
            const tagTxt = atrasada ? '#DC2626' : (prazo === hoje ? '#EA580C' : '#16A34A');
            const tagLabel = atrasada ? 'Atrasada' : (prazo === hoje ? 'Hoje' : (prazo || 'Sem prazo'));
            return `
            <div class="d-flex align-items-start gap-2 mb-2 p-2" style="border-radius:8px;background:#FAFBFC;border:1.5px solid #F1F5F9;">
              <div style="width:16px;height:16px;border-radius:4px;border:2px solid #CBD5E1;flex-shrink:0;margin-top:3px;"></div>
              <div style="flex:1;min-width:0;">
                <div class="fw-semibold" style="font-size:0.83rem;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.ta_titulo}</div>
                <span style="font-size:0.68rem;font-weight:600;padding:1px 7px;border-radius:99px;background:${tagCor};color:${tagTxt};">${tagLabel}</span>
              </div>
            </div>`;
        }).join('');
    } catch {
        container.innerHTML = `<p class="text-muted small text-center py-2">Erro ao carregar tarefas.</p>`;
    }
}

// ============================================================
// --- CONQUISTAS NO DASHBOARD ---
// ============================================================
async function carregarConquisitasDashboard(token) {
    const container = document.getElementById('dashboard-conquistas');
    if (!container) return;
    try {
        const res = await fetch('/api/conquistas', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!res.ok) throw new Error();
        const dados = await res.json();
        const lista = dados.conquistas || [];
        const desbloqueadas = lista.filter(c => c.status === 'desbloqueada').slice(0, 4);
        if (!desbloqueadas.length) {
            container.innerHTML = `<div class="text-center py-3"><div style="font-size:2rem;margin-bottom:6px;">🏆</div><p class="text-muted small mb-0">Continue estudando para desbloquear conquistas!</p></div>`;
            return;
        }
        const icones = { 'sequencia': '🔥', 'tempo': '⏰', 'metas': '🎯', 'tarefas': '✅', 'disciplinas': '📚', 'sessoes': '⚡' };
        container.innerHTML = `<div class="row g-2">${desbloqueadas.map(c => {
            const icone = icones[c.criterio?.tipo] || '🏅';
            return `
            <div class="col-6">
              <div class="d-flex align-items-center gap-2 p-2" style="border-radius:10px;background:#FFFBEB;border:1.5px solid #FDE68A;">
                <span style="font-size:1.5rem;line-height:1;">${icone}</span>
                <div style="min-width:0;">
                  <div class="fw-bold" style="font-size:0.78rem;color:var(--text-dark);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${c.co_titulo}</div>
                  <span style="font-size:0.65rem;color:#B45309;font-weight:600;">Desbloqueada ✓</span>
                </div>
              </div>
            </div>`;
        }).join('')}</div>`;
    } catch {
        container.innerHTML = `<p class="text-muted small text-center py-2">Erro ao carregar conquistas.</p>`;
    }
}
