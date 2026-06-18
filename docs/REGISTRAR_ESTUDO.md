# Referencia de API - XP Diario

Data de referencia: 2026-06-18

Todas as rotas autenticadas requerem header:
`Authorization: Bearer <token_jwt>`

---

## Atividades (registro de estudo manual)

### Registrar estudo

`POST /api/atividades`

**Body:**
```json
{
  "at_disciplina": 1,
  "at_tempo_min": 120,
  "at_data": "2026-06-18",
  "at_descricao": "Estudo de funcoes",
  "at_tarefas_concluidas": 2
}
```

**Regras:**
- `at_disciplina`: obrigatoria, deve existir no banco
- `at_tempo_min`: obrigatorio, maior que zero
- `at_data`: opcional, padrão é data atual
- `at_tarefas_concluidas`: opcional, padrão 0
- Cada minuto gera 1 ponto de XP automaticamente
- Conquistas elegíveis são avaliadas e desbloqueadas automaticamente

**Resposta (201):**
```json
{
  "sucesso": true,
  "mensagem": "Atividade registrada com sucesso",
  "dados": { "at_id": 1, "at_disciplina": 1, "at_tempo_min": 120, ... },
  "pontuacao": {
    "pontosGanhos": 120,
    "totalPontos": 350
  },
  "conquistasDesbloqueadas": [
    { "co_titulo": "Primeira Hora", "co_codigo": "TEMPO_1H" }
  ]
}
```

### Historico de estudos

`GET /api/atividades`

Retorna todos os registros do usuario autenticado ordenados por data decrescente.

**Resposta:**
```json
{
  "sucesso": true,
  "total": 15,
  "historico": [
    {
      "at_id": 1,
      "at_disciplina": 2,
      "di_disciplina": "Matematica",
      "at_tempo_min": 60,
      "at_tarefas_concluidas": 1,
      "at_data": "2026-06-18",
      "at_descricao": "Calculo diferencial"
    }
  ]
}
```

---

## Sessoes de Estudo

### Buscar sessao ativa

`GET /api/sessoes/ativa`

Retorna a sessao em andamento (status `iniciada` ou `pausada`) do usuario autenticado.

**Resposta quando ha sessao ativa:**
```json
{
  "sucesso": true,
  "sessao": {
    "id": 5,
    "status": "iniciada",
    "disciplina": 2,
    "inicio": "2026-06-18T14:30:00.000Z",
    "fim": null,
    "segundos_focados": 180,
    "ultimo_inicio": "2026-06-18T14:30:00.000Z"
  }
}
```

**Resposta quando nao ha sessao:**
```json
{ "sucesso": true, "sessao": null }
```

### Iniciar sessao

`POST /api/sessoes/iniciar`

**Body:**
```json
{ "disciplina": 2 }
```

Se ja existe sessao ativa, retorna a existente sem criar nova.

**Resposta (201):**
```json
{
  "sucesso": true,
  "sessao": { "id": 5, "status": "iniciada", ... }
}
```

### Encerrar sessao

`PATCH /api/sessoes/:id/encerrar`

Calcula os segundos focados, converte em minutos (arredondado para baixo), registra atividade automaticamente se minutos > 0, soma XP e avalia conquistas.

**Resposta:**
```json
{
  "sucesso": true,
  "sessao": { "id": 5, "status": "encerrada", ... },
  "minutos": 45,
  "atividade": { "at_id": 20, ... },
  "totalPontos": 395,
  "conquistasDesbloqueadas": []
}
```

### Pausar / Retomar sessao

`PATCH /api/sessoes/:id/pausar` — pausa o timer, salva segundos acumulados

`PATCH /api/sessoes/:id/retomar` — retoma sessao, reinicia contagem a partir de agora

---

## Streak

`GET /api/streak`

**Resposta:**
```json
{
  "streak": 5,
  "total_registros": 23,
  "dias_registrados": 12
}
```

---

## Perfil

`GET /api/perfil`

**Resposta:**
```json
{
  "sucesso": true,
  "perfil": {
    "us_id": 3,
    "us_nome": "Arthur Araujo",
    "us_email": "arthur@email.com",
    "us_pontos_total": 395
  }
}
```

---

## Conquistas

`GET /api/conquistas`

Avalia e desbloqueia conquistas elegiveis antes de retornar.

**Resposta:**
```json
{
  "sucesso": true,
  "total": 6,
  "conquistas": [
    {
      "co_id": 1,
      "co_codigo": "TEMPO_1H",
      "co_titulo": "Primeira Hora",
      "co_descricao": "Estude por 60 minutos no total",
      "co_criterio_tipo": "tempo_total_min",
      "co_criterio_valor": 60,
      "status": "desbloqueada",
      "uc_desbloqueado_em": "2026-06-15T10:22:00.000Z"
    },
    {
      "co_id": 2,
      "co_codigo": "TEMPO_5H",
      "co_titulo": "Foco Total",
      "status": "bloqueada",
      "uc_desbloqueado_em": null
    }
  ]
}
```

---

## Relatorio

`GET /api/relatorio?inicio=2026-06-01&fim=2026-06-18`

**Resposta:**
```json
{
  "resumo": {
    "total_minutos": 420,
    "total_sessoes": 8,
    "total_tarefas": 5
  },
  "por_disciplina": [
    {
      "nome": "Matematica",
      "minutos": 240,
      "sessoes": 4,
      "cor": "#463acb"
    }
  ],
  "periodo": {
    "inicio": "2026-06-01",
    "fim": "2026-06-18"
  }
}
```
