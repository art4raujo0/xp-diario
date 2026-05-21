# Sprint - Telas para Usuario Final

## Visao geral atualizada

O backend atual atende autenticacao, organizacao de estudo e motivacao com:

1. Login/Cadastro com JWT
2. Dashboard com `streak` e `progresso`
3. CRUD de Materias
4. CRUD de Metas
5. Registro de atividades de estudo
6. Conquistas automaticas por usuario
7. Pontuacao acumulativa por usuario
8. Perfil com pontuacao total

## Endpoints principais (estado atual)

- `POST /api/login`
- `POST /api/cadastro`
- `GET|POST|PUT|DELETE /api/materias`
- `GET|POST|PUT|DELETE /api/metas` (autenticado)
- `GET|POST /api/atividades` (autenticado)
- `GET /api/streak` (autenticado)
- `GET /api/progresso` (autenticado)
- `GET /api/conquistas` (autenticado)
- `GET /api/perfil` (autenticado)

## Regras de negocio vigentes

- Dados de estudo, metas, streak e progresso sao isolados por usuario autenticado
- Conquistas sao desbloqueadas automaticamente por criterio e apenas uma vez por usuario
- Pontuacao e proporcional ao tempo registrado (`1 ponto por minuto`)
- Pontuacao e acumulativa e fica disponivel no perfil

## Valor para o usuario

O usuario consegue planejar estudos, registrar execucao e acompanhar evolucao por:

- sequencia de dias estudados
- progresso de metas
- conquistas desbloqueadas
- pontuacao total acumulada
