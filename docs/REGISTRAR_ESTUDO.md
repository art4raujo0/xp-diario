# Funcionalidade - Registrar Estudo

## Endpoint

### Registrar estudo
POST `/api/atividades`

Requer header de autenticacao:

`Authorization: Bearer <token>`

### Body JSON

```json
{
  "at_disciplina": 1,
  "at_tempo_min": 120,
  "at_data": "2026-05-19",
  "at_descricao": "Estudo de funcoes",
  "at_tarefas_concluidas": 2
}
```

## Regras implementadas

- Tempo deve ser maior que zero
- Data automatica caso nao seja enviada
- Disciplina obrigatoriamente cadastrada
- Registro salvo no historico do usuario autenticado
- Cada registro gera pontuacao automaticamente (`1 ponto por minuto`)
- Cada registro pode desbloquear conquistas automaticamente
- Respostas padronizadas em JSON

## Resposta esperada (resumo)

- `dados`: atividade registrada
- `pontuacao.pontosGanhos`: pontos gerados no registro
- `pontuacao.totalPontos`: total acumulado do usuario
- `conquistasDesbloqueadas`: lista de conquistas liberadas no momento

## Historico de estudos

GET `/api/atividades`

Requer autenticacao e retorna somente registros do usuario autenticado.
