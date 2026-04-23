document.getElementById('form-login').addEventListener('submit', async function(event) {
    event.preventDefault(); // Evita recarregar a tela

    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const divMensagem = document.getElementById('mensagem');

    divMensagem.textContent = 'Carregando...';
    divMensagem.className = 'mensagem';

    try {
        const resposta = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email, senha: senha })
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            divMensagem.textContent = dados.mensagem;
            divMensagem.className = 'mensagem sucesso';
            localStorage.setItem('token_xp', dados.token); // Mantém a sessão
        } else {
            divMensagem.textContent = dados.erro;
            divMensagem.className = 'mensagem erro';
        }
    } catch (error) {
        console.error(error);
        divMensagem.textContent = 'Erro ao conectar com o servidor.';
        divMensagem.className = 'mensagem erro';
    }
});