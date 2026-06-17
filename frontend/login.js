async function enviarRecuperacao() {
  const email = (document.getElementById('esqueci-email')?.value || '').trim();
  const msg = document.getElementById('esqueci-msg');
  const btn = document.getElementById('btn-esqueci');

  if (!email) {
    msg.style.color = '#dc2626';
    msg.textContent = 'Informe seu e-mail.';
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando…';
  msg.textContent = '';

  try {
    const res = await fetch('/api/auth/esqueci-senha', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const dados = await res.json();

    if (res.ok) {
      msg.style.color = '#16a34a';
      msg.textContent = dados.mensagem;
      btn.textContent = 'Link enviado!';
    } else {
      msg.style.color = '#dc2626';
      msg.textContent = dados.erro || 'Erro ao enviar. Tente novamente.';
      btn.disabled = false;
      btn.textContent = 'Enviar link de recuperação';
    }
  } catch {
    msg.style.color = '#dc2626';
    msg.textContent = 'Erro ao conectar com o servidor.';
    btn.disabled = false;
    btn.textContent = 'Enviar link de recuperação';
  }
}

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
        // Dispara o pedido de login para o seu backend usando caminho relativo
        const resposta = await fetch('/api/login', { 
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
            
            // Redireciona o utilizador para o Dashboard usando a rota do server.js
            setTimeout(() => {
                window.location.href = '/app'; 
            }, 800);
            
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
        divMensagem.textContent = 'Erro ao conectar com o servidor. Verifique se o backend está a correr.';
    }
});