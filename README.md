# XP Diario

Aplicacao web para organizar estudos, registrar atividades e acompanhar evolucao com metas, streak, pontuacao e conquistas.

## Estrutura

- `backend/`: API Express + PostgreSQL
- `frontend/`: telas HTML/CSS/JS servidas pelo backend
- `docs/`: documentacao funcional e diagramas

## Como executar

1. Configure `backend/.env`.
2. Instale dependencias:
   - `cd backend`
   - `npm install`
3. Inicie a API:
   - `npm start`
4. Acesse:
   - `http://localhost:3000`

## Endpoints principais

- `POST /api/login`
- `POST /api/cadastro`
- `GET|POST|PUT|DELETE /api/materias` (sem autenticacao no estado atual)
- `GET|POST|PUT|DELETE /api/metas` (autenticado)
- `GET|POST /api/atividades` (autenticado)
- `GET /api/streak` (autenticado)
- `GET /api/progresso` (autenticado)
- `GET /api/conquistas` (autenticado)
- `GET /api/perfil` (autenticado)
- `GET|PUT /api/notificacoes` (autenticado)

## Observacoes de vigencia

- A referencia oficial de regras de negocio esta em `docs/`.
- Arquivos PNG/JPEG em `docs/` podem ficar defasados em relacao ao texto Markdown/Mermaid.
