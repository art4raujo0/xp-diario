document.getElementById('form-login').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  const divMensagem = document.getElementById('mensagem');

  divMensagem.textContent = 'Conectando ao servidor...';
  divMensagem.className = 'mt-3 text-info small text-center fw-bold';

  try {
    const resposta = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, senha })
    });

    const dados = await resposta.json();

    if (resposta.ok) {
      localStorage.setItem('xp_diario_token', dados.token);
      divMensagem.className = 'mt-3 text-success small text-center fw-bold';
      divMensagem.textContent = dados.mensagem;

      setTimeout(() => {
        window.location.href = '/app';
      }, 800);
    } else {
      divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
      divMensagem.textContent = dados.erro;
    }
  } catch (erro) {
    console.error('Erro fatal de conexao:', erro);
    divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
    divMensagem.textContent = 'Erro ao conectar com o servidor. Verifique se o backend esta rodando.';
  }
});
