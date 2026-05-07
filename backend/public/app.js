document.addEventListener('DOMContentLoaded', async () => {
    // 1. Verificação de Autenticação
    const token = localStorage.getItem('xp_diario_token');
    
    if (!token) {
        window.location.href = '/login';
        return;
    }

    // Executa as chamadas em paralelo para carregar o Dashboard
    carregarStreak(token);
    carregarProgresso(token);
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