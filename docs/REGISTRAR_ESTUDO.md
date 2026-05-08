# Funcionalidade - Registrar Estudo

## Endpoint

### Registrar estudo
POST `/api/atividades`

### Body JSON

```json
{
  "at_disciplina": 1,
  "at_tempo_min": 120,
  "at_data": "2026-05-08",
  "at_descricao": "Estudo de funções",
  "at_tarefas_concluidas": 2
}
```

## Regras implementadas

- Tempo deve ser maior que zero
- Data automática caso não seja enviada
- Disciplina obrigatoriamente cadastrada
- Registro salvo no histórico
- Compatível com cálculo de progresso
- Respostas padronizadas em JSON

## Histórico de estudos
GET `/api/atividades`
