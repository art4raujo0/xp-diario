const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Importa a conexão com o banco de dados Neon
const pool = require('../config/db'); 

router.post('/', async (req, res) => {
    
    // Recebe a senha e o e-mail do corpo da requisição.
    // O (req.body.email || '') evita erros caso venha vazio.
    // O .trim() remove espaços em branco acidentais no início e no final do e-mail.
    const email = (req.body.email || '').trim().toLowerCase();
    const senha = req.body.senha;

    // 1. Validações: Verifica se os campos obrigatórios foram preenchidos
    if (!email || !senha) {
        return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    // Validação: Verifica se o formato de e-mail é válido usando Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ erro: 'Formato de e-mail inválido.' });
    }

    try {
        // 2. Busca o usuário no banco de dados Neon através do e-mail
        const userResult = await pool.query('SELECT * FROM usuarios WHERE us_email = $1', [email]);
        const usuario = userResult.rows[0];

        // Retorno genérico de erro: não informa se o problema foi o e-mail ou a senha
        if (!usuario) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        // 3. Segurança: Verifica se a conta possui um bloqueio temporário ativo
        if (usuario.us_bloqueado_ate && new Date(usuario.us_bloqueado_ate) > new Date()) {
            // Calcula os minutos restantes para liberar a conta
            const minutosRestantes = Math.ceil((new Date(usuario.us_bloqueado_ate) - new Date()) / 60000);
            return res.status(403).json({ 
                erro: `Conta bloqueada por múltiplas tentativas. Tente novamente em ${minutosRestantes} minutos.` 
            });
        }

        // 4. Valida senha com suporte a base legada (hash bcrypt ou texto puro)
        let senhaCorreta = false;
        const hash = usuario.us_senha_hash;
        const senhaLegada = usuario.us_senha;

        if (hash && typeof hash === 'string' && hash.startsWith('$2')) {
            senhaCorreta = await bcrypt.compare(senha, hash);
        } else if (senhaLegada && typeof senhaLegada === 'string') {
            senhaCorreta = senha === senhaLegada;
        } else if (hash && typeof hash === 'string') {
            senhaCorreta = senha === hash;
        }

        if (!senhaCorreta) {
            // Incrementa o número de tentativas falhas no banco
            const novasTentativas = (usuario.us_tentativas_falhas || 0) + 1;
            let bloqueadoAte = null;

            // Se atingir 5 tentativas, aplica a regra de bloqueio para os próximos 15 minutos
            if (novasTentativas >= 5) {
                bloqueadoAte = new Date(Date.now() + 15 * 60000); 
            }

            // Atualiza os dados de segurança no banco com a nova falha/bloqueio
            await pool.query(
                'UPDATE usuarios SET us_tentativas_falhas = $1, us_bloqueado_ate = $2 WHERE us_email = $3',
                [novasTentativas, bloqueadoAte, email]
            );

            // Retorna erro genérico novamente
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        // 5. Sucesso: Acesso liberado! 
        // Reseta as tentativas falhas para zero e remove qualquer bloqueio
        await pool.query(
            'UPDATE usuarios SET us_tentativas_falhas = 0, us_bloqueado_ate = NULL WHERE us_email = $1',
            [email]
        );

        // 6. Sessão: Geração do token JWT com expiração configurada para 24h
        const token = jwt.sign(
            { id: usuario.us_id, email: usuario.us_email },
            process.env.JWT_SECRET || 'chave_super_secreta_padrao', 
            { expiresIn: '24h' }
        );

        // Retorna sucesso e o token gerado para o frontend
        return res.json({
            mensagem: 'Login realizado com sucesso!',
            token: token
        });

    } catch (erro) {
        // Registra o erro no terminal para depuração e retorna status 500
        console.error('Erro na rota de login:', erro);
        return res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

module.exports = router;
