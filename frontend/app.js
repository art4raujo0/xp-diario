document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('xp_diario_token');
    if (!token) { window.location.href = '/login'; return; }

    popularHeroBanner(token);
    carregarStreak(token);
    carregarProgresso(token);
    carregarConfigNotificacoes(token);

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
