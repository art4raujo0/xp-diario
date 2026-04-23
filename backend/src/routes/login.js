const express = require('express');
const router = express.Router();
const pool = require('../config/db'); // Puxando o banco de dados que seu amigo configurou
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// A rota agora é só '/', pois o '/api/login' será definido no server.js
router.post('/', async (req, res) => {
    const { email, senha } = req.body;

    //  --- INÍCIO DO MOCK DE TESTE --- 
    if (email === 'teste@teste.com' && senha === '123456') {
        // Criei um token genérico só pra ele não dar erro se não achar o .env
        const tokenFalso = jwt.sign({ id: 999 }, process.env.JWT_SECRET || 'chave_teste', { expiresIn: '2h' });
        return res.json({ mensagem: 'Login de TESTE realizado com sucesso!', token: tokenFalso });
    }
    //  --- FIM DO MOCK DE TESTE ---

    try {
        const userResult = await pool.query('SELECT * FROM usuarios WHERE us_email = $1', [email]);
        
        if (userResult.rows.length === 0) {
            return res.status(401).json({ erro: 'Credenciais inválidas.' });
        }

        const usuario = userResult.rows[0];

        if (usuario.us_bloqueado_ate && new Date(usuario.us_bloqueado_ate) > new Date()) {
            const minutosRestantes = Math.ceil((new Date(usuario.us_bloqueado_ate) - new Date()) / 60000);
            return res.status(403).json({ 
                erro: `Conta bloqueada. Tente novamente em ${minutosRestantes} minutos.` 
            });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.us_senha_hash);

        if (!senhaCorreta) {
            const novasTentativas = usuario.us_tentativas_falhas + 1;

            if (novasTentativas >= 5) {
                const bloqueioAte = new Date(Date.now() + 15 * 60 * 1000);
                await pool.query(
                    'UPDATE usuarios SET us_tentativas_falhas = $1, us_bloqueado_ate = $2 WHERE us_id = $3',
                    [novasTentativas, bloqueioAte, usuario.us_id]
                );
                return res.status(403).json({ erro: 'Conta bloqueada por excesso de tentativas (5).' });
            } else {
                await pool.query(
                    'UPDATE usuarios SET us_tentativas_falhas = $1 WHERE us_id = $2',
                    [novasTentativas, usuario.us_id]
                );
                return res.status(401).json({ erro: 'Credenciais inválidas.' });
            }
        }

        await pool.query(
            'UPDATE usuarios SET us_tentativas_falhas = 0, us_bloqueado_ate = NULL WHERE us_id = $1',
            [usuario.us_id]
        );

        const token = jwt.sign({ id: usuario.us_id }, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.json({ mensagem: 'Login realizado com sucesso!', token });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ erro: 'Erro interno no servidor.' });
    }
});

module.exports = router;