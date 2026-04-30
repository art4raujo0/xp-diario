document.getElementById('form-login').addEventListener('submit', async (event) => {
    // Evita que a página recarregue ao clicar no botão
    event.preventDefault();

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const divMensagem = document.getElementById('mensagem');

    // Mensagem de carregamento enquanto o backend pensa
    divMensagem.textContent = 'Conectando ao servidor...';
    divMensagem.className = 'mt-3 text-info small text-center fw-bold';

    try {
        // Dispara o pedido de login para o seu backend
        const resposta = await fetch('http://localhost:3000/api/login', { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        // Se o status da resposta for 200 (OK)
        if (resposta.ok) {
            // SUCESSO!
            console.log("Sucesso! Token recebido:", dados.token);
            
            // Salva o token da sessão no navegador
            localStorage.setItem('xp_diario_token', dados.token);
            
            // Mostra a mensagem verde na tela
            divMensagem.className = 'mt-3 text-success small text-center fw-bold';
            divMensagem.textContent = dados.mensagem;
            
            // Simula o redirecionamento (Pode descomentar quando criar o dashboard)
            /*
            setTimeout(() => {
                window.location.href = '/dashboard.html'; 
            }, 1500);
            */
        } else {
            // ERRO (Senha errada, bloqueio de 15 min, etc)
            console.error("Acesso negado:", dados.erro);
            divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
            divMensagem.textContent = dados.erro;
        }

    } catch (erro) {
        // Se o servidor estiver desligado ou der erro de rede
        console.error("Erro fatal de conexão:", erro);
        divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
        divMensagem.textContent = 'Erro ao conectar com o servidor. Verifique se o backend está rodando.';
    }
});