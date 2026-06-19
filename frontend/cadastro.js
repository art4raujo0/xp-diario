let tipoSelecionado = 'aluno';

function selecionarTipo(tipo) {
  tipoSelecionado = tipo;
  document.getElementById('btn-tipo-aluno').classList.toggle('active', tipo === 'aluno');
  document.getElementById('btn-tipo-professor').classList.toggle('active', tipo === 'professor');
}

function toggleSenha(campoId, btn) {
    const campo = document.getElementById(campoId);
    const icone = btn.querySelector('i');
    if (campo.type === 'password') {
        campo.type = 'text';
        icone.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        campo.type = 'password';
        icone.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

document.getElementById('form-cadastro').addEventListener('submit', async (event) => {
    event.preventDefault();

    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const divMensagem = document.getElementById('mensagem');
    const btnCadastrar = document.getElementById('btn-cadastrar');

    // Validações no frontend
    if (!nome || !email || !senha || !confirmarSenha) {
        divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
        divMensagem.textContent = 'Todos os campos são obrigatórios.';
        return;
    }

    if (nome.length < 3) {
        divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
        divMensagem.textContent = 'O nome deve possuir no mínimo 3 caracteres.';
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
        divMensagem.textContent = 'Formato de e-mail inválido.';
        return;
    }

    if (senha.length < 6) {
        divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
        divMensagem.textContent = 'A senha deve possuir no mínimo 6 caracteres.';
        return;
    }

    if (senha !== confirmarSenha) {
        divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
        divMensagem.textContent = 'As senhas não coincidem.';
        return;
    }

    divMensagem.textContent = 'Criando sua conta...';
    divMensagem.className = 'mt-3 text-info small text-center fw-bold';
    btnCadastrar.disabled = true;

    try {
        const objetivoEstudo = (document.getElementById('objetivo_estudo')?.value || '').trim() || undefined;
        const horasDisponiveis = document.getElementById('horas_disponiveis')?.value ? Number(document.getElementById('horas_disponiveis').value) : undefined;
        const resposta = await fetch('/api/cadastro', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, confirmarSenha, us_tipo: tipoSelecionado, objetivo_estudo: objetivoEstudo, horas_disponiveis: horasDisponiveis })
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
            btnCadastrar.disabled = false;
        }

    } catch (erro) {
        console.error('Erro ao cadastrar:', erro);
        divMensagem.className = 'mt-3 text-danger small text-center fw-bold';
        divMensagem.textContent = 'Erro ao conectar com o servidor. Verifique se o backend está rodando.';
        btnCadastrar.disabled = false;
    }
});
