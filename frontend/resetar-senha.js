const params = new URLSearchParams(window.location.search);
const token = params.get('token');
const formSolicitar = document.getElementById('form-solicitar-reset');
const formRedefinir = document.getElementById('form-redefinir-reset');
const mensagem = document.getElementById('mensagem');

function exibirMensagem(texto, tipo) {
  mensagem.className = `mt-3 small text-center fw-bold text-${tipo}`;
  mensagem.textContent = texto;
}

if (token) {
  document.getElementById('titulo-reset').textContent = 'Crie uma nova senha';
  document.getElementById('subtitulo-reset').textContent = 'Digite uma nova senha para voltar ao XP Diario.';
  formSolicitar.classList.add('d-none');
  formRedefinir.classList.remove('d-none');
}

formSolicitar.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = document.getElementById('email').value.trim();
  const btn = formSolicitar.querySelector('button');
  btn.disabled = true;
  exibirMensagem('Enviando link...', 'info');

  try {
    const res = await fetch('/api/senha/esqueci', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const dados = await res.json();
    exibirMensagem(dados.mensagem || dados.erro, res.ok ? 'success' : 'danger');
  } catch (erro) {
    exibirMensagem('Erro ao conectar com o servidor.', 'danger');
  } finally {
    btn.disabled = false;
  }
});

formRedefinir.addEventListener('submit', async (event) => {
  event.preventDefault();
  const senha = document.getElementById('senha').value;
  const confirmarSenha = document.getElementById('confirmarSenha').value;
  const btn = formRedefinir.querySelector('button');
  btn.disabled = true;
  exibirMensagem('Redefinindo senha...', 'info');

  try {
    const res = await fetch('/api/senha/redefinir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, senha, confirmarSenha })
    });
    const dados = await res.json();
    exibirMensagem(dados.mensagem || dados.erro, res.ok ? 'success' : 'danger');
    if (res.ok) {
      setTimeout(() => { window.location.href = '/login'; }, 1200);
    }
  } catch (erro) {
    exibirMensagem('Erro ao conectar com o servidor.', 'danger');
  } finally {
    btn.disabled = false;
  }
});
