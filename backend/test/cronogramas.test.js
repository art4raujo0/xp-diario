const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");
const express = require("express");
const jwt = require("jsonwebtoken");

const dbPath = path.resolve(__dirname, "../src/config/db.js");
const routePath = path.resolve(__dirname, "../src/routes/cronogramas.js");

function token() {
  return jwt.sign({ id: 7, email: "aluno@teste.com" }, "chave_super_secreta_padrao");
}

function dataIsoComDias(dias) {
  const data = new Date();
  data.setDate(data.getDate() + dias);
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function dataBrComDias(dias) {
  const [ano, mes, dia] = dataIsoComDias(dias).split("-");
  return `${dia}/${mes}/${ano}`;
}

function carregarRotaComPool(pool) {
  delete require.cache[routePath];
  delete require.cache[dbPath];

  require.cache[dbPath] = {
    id: dbPath,
    filename: dbPath,
    loaded: true,
    exports: pool
  };

  return require(routePath);
}

async function request(route, { method = "GET", pathUrl = "/", body } = {}) {
  const app = express();
  app.use(express.json());
  app.use("/api/cronogramas", route);

  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  try {
    const url = `http://127.0.0.1:${server.address().port}/api/cronogramas${pathUrl}`;
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token()}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    return {
      status: response.status,
      body: await response.json()
    };
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

test("cria cronograma com dados validos", async () => {
  const queries = [];
  const dataFutura = dataIsoComDias(7);
  const route = carregarRotaComPool({
    async query(sql, params) {
      queries.push({ sql, params });

      if (sql.includes("FROM disciplina")) {
        return { rowCount: 1, rows: [{ di_id: 3, di_disciplina: "Matematica" }] };
      }

      if (sql.includes("SELECT cr_id")) {
        return { rowCount: 0, rows: [] };
      }

      if (sql.includes("INSERT INTO cronograma_estudo")) {
        return {
          rowCount: 1,
          rows: [{
            cr_id: 11,
            cr_usuario_id: 7,
            cr_disciplina: 3,
            cr_data: dataFutura,
            cr_horario_inicio: "08:30:00",
            cr_duracao_min: 60
          }]
        };
      }

      throw new Error(`Query inesperada: ${sql}`);
    }
  });

  const response = await request(route, {
    method: "POST",
    body: {
      cr_disciplina: 3,
      cr_data: dataFutura,
      cr_horario_inicio: "08:30",
      cr_duracao_min: 60
    }
  });

  assert.equal(response.status, 201);
  assert.equal(response.body.sucesso, true);
  assert.equal(response.body.dados.cr_id, 11);
  assert.equal(response.body.dados.di_disciplina, "Matematica");
  assert.equal(queries.at(-1).params[4], 60);
});

test("aceita data no formato brasileiro e persiste em formato ISO", async () => {
  const queries = [];
  const dataFuturaIso = dataIsoComDias(8);
  const dataFuturaBr = dataBrComDias(8);
  const route = carregarRotaComPool({
    async query(sql, params) {
      queries.push({ sql, params });

      if (sql.includes("FROM disciplina")) {
        return { rowCount: 1, rows: [{ di_id: 3, di_disciplina: "Matematica" }] };
      }

      if (sql.includes("SELECT cr_id")) {
        return { rowCount: 0, rows: [] };
      }

      if (sql.includes("INSERT INTO cronograma_estudo")) {
        return { rowCount: 1, rows: [{ cr_id: 12 }] };
      }

      throw new Error(`Query inesperada: ${sql}`);
    }
  });

  const response = await request(route, {
    method: "POST",
    body: {
      cr_disciplina: 3,
      cr_data: dataFuturaBr,
      cr_horario_inicio: "08:30",
      cr_duracao_min: 60
    }
  });

  assert.equal(response.status, 201);
  assert.equal(queries.at(-1).params[2], dataFuturaIso);
});

test("lista cronogramas do usuario autenticado", async () => {
  const route = carregarRotaComPool({
    async query(sql, params) {
      assert.ok(sql.includes("FROM cronograma_estudo c"));
      assert.deepEqual(params, [7]);
      return {
        rowCount: 1,
        rows: [{
          cr_id: 11,
          cr_usuario_id: 7,
          cr_disciplina: 3,
          cr_data: "2026-06-20",
          cr_horario_inicio: "08:30:00",
          cr_duracao_min: 60,
          di_disciplina: "Matematica"
        }]
      };
    }
  });

  const response = await request(route);

  assert.equal(response.status, 200);
  assert.equal(response.body.total, 1);
  assert.equal(response.body.cronogramas[0].cr_id, 11);
});

test("impede duracao menor ou igual a zero", async () => {
  const dataFutura = dataIsoComDias(7);
  const route = carregarRotaComPool({
    async query() {
      throw new Error("Banco nao deveria ser consultado");
    }
  });

  const response = await request(route, {
    method: "POST",
    body: {
      cr_disciplina: 3,
      cr_data: dataFutura,
      cr_horario_inicio: "08:30",
      cr_duracao_min: 0
    }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.erro, "Duração da sessão deve ser maior que zero");
});

test("impede cronograma com data passada", async () => {
  const route = carregarRotaComPool({
    async query() {
      throw new Error("Banco nao deveria ser consultado");
    }
  });

  const response = await request(route, {
    method: "POST",
    body: {
      cr_disciplina: 3,
      cr_data: dataIsoComDias(-1),
      cr_horario_inicio: "08:30",
      cr_duracao_min: 60
    }
  });

  assert.equal(response.status, 400);
  assert.equal(response.body.erro, "A data do cronograma deve ser hoje ou uma data futura");
});

test("impede cronograma duplicado por materia, data e horario", async () => {
  const dataFutura = dataIsoComDias(7);
  const route = carregarRotaComPool({
    async query(sql) {
      if (sql.includes("FROM disciplina")) {
        return { rowCount: 1, rows: [{ di_id: 3, di_disciplina: "Matematica" }] };
      }

      if (sql.includes("SELECT cr_id")) {
        return { rowCount: 1, rows: [{ cr_id: 4 }] };
      }

      throw new Error(`Query inesperada: ${sql}`);
    }
  });

  const response = await request(route, {
    method: "POST",
    body: {
      cr_disciplina: 3,
      cr_data: dataFutura,
      cr_horario_inicio: "08:30",
      cr_duracao_min: 60
    }
  });

  assert.equal(response.status, 409);
  assert.equal(response.body.erro, "Já existe um cronograma para esta matéria, data e horário");
});

test("atualiza cronograma existente", async () => {
  const dataFutura = dataIsoComDias(9);
  const route = carregarRotaComPool({
    async query(sql, params) {
      if (sql.includes("FROM disciplina")) {
        return { rowCount: 1, rows: [{ di_id: 3, di_disciplina: "Matematica" }] };
      }

      if (sql.includes("SELECT cr_id")) {
        assert.equal(params[4], 11);
        return { rowCount: 0, rows: [] };
      }

      if (sql.includes("UPDATE cronograma_estudo")) {
        return {
          rowCount: 1,
          rows: [{
            cr_id: 11,
            cr_usuario_id: 7,
            cr_disciplina: 3,
            cr_data: dataFutura,
            cr_horario_inicio: "09:00:00",
            cr_duracao_min: 90
          }]
        };
      }

      throw new Error(`Query inesperada: ${sql}`);
    }
  });

  const response = await request(route, {
    method: "PUT",
    pathUrl: "/11",
    body: {
      cr_disciplina: 3,
      cr_data: dataFutura,
      cr_horario_inicio: "09:00",
      cr_duracao_min: 90
    }
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.mensagem, "Cronograma atualizado com sucesso");
  assert.equal(response.body.dados.cr_duracao_min, 90);
});

test("exclui cronograma existente", async () => {
  const route = carregarRotaComPool({
    async query(sql, params) {
      assert.ok(sql.includes("DELETE FROM cronograma_estudo"));
      assert.deepEqual(params, [11, 7]);
      return { rowCount: 1, rows: [{ cr_id: 11 }] };
    }
  });

  const response = await request(route, {
    method: "DELETE",
    pathUrl: "/11"
  });

  assert.equal(response.status, 200);
  assert.equal(response.body.mensagem, "Cronograma excluído com sucesso");
});
