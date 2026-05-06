const express = require("express");
const pool = require("../config/db");

const router = express.Router();

function criarDataLocal(ano, mes, dia) {
  return new Date(ano, mes - 1, dia);
}

function obterHojeLocal() {
  const agora = new Date();
  return new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
}

function parseData(valor) {
  if (!valor) {
    return null;
  }

  if (valor instanceof Date) {
    return new Date(valor.getFullYear(), valor.getMonth(), valor.getDate());
  }

  const texto = String(valor).slice(0, 10);
  const partes = texto.split("-");

  if (partes.length !== 3) {
    return null;
  }

  const [ano, mes, dia] = partes.map(Number);

  if (!ano || !mes || !dia) {
    return null;
  }

  const data = criarDataLocal(ano, mes - 0, dia);

  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return null;
  }

  return data;
}

function formatarData(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function adicionarDias(data, quantidade) {
  const copia = new Date(data);
  copia.setDate(copia.getDate() + quantidade);
  return copia;
}

function obterTipoMeta(tipo) {
  const valor = String(tipo || "").toLowerCase();

  if (valor === "diaria" || valor === "diária") {
    return "diaria";
  }

  if (valor === "semanal") {
    return "semanal";
  }

  if (valor === "mensal") {
    return "mensal";
  }

  return "diaria";
}

function obterPeriodoBase(tipo, dataReferencia) {
  const tipoNormalizado = obterTipoMeta(tipo);
  let inicio;
  let fim;

  if (tipoNormalizado === "semanal") {
    const diaSemana = dataReferencia.getDay();
    const deslocamento = diaSemana === 0 ? -6 : 1 - diaSemana;
    inicio = adicionarDias(dataReferencia, deslocamento);
    fim = adicionarDias(inicio, 6);
  } else if (tipoNormalizado === "mensal") {
    inicio = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth(), 1);
    fim = new Date(dataReferencia.getFullYear(), dataReferencia.getMonth() + 1, 0);
  } else {
    inicio = new Date(dataReferencia);
    fim = new Date(dataReferencia);
  }

  return {
    tipo: tipoNormalizado,
    inicio,
    fim
  };
}

function obterPeriodoMeta(tipo, dataInicioMeta) {
  const hoje = obterHojeLocal();
  const tipoNormalizado = obterTipoMeta(tipo);
  const dataMeta = parseData(dataInicioMeta);

  if (!dataMeta) {
    const periodoAtual = obterPeriodoBase(tipoNormalizado, hoje);

    return {
      tipo: tipoNormalizado,
      inicio: periodoAtual.inicio,
      fim: periodoAtual.fim,
      ativa: true,
      situacao: "ativa"
    };
  }

  if (dataMeta > hoje) {
    const proximoPeriodo = obterPeriodoBase(tipoNormalizado, dataMeta);

    if (dataMeta > proximoPeriodo.inicio) {
      proximoPeriodo.inicio = dataMeta;
    }

    return {
      tipo: tipoNormalizado,
      inicio: proximoPeriodo.inicio,
      fim: proximoPeriodo.fim,
      ativa: false,
      situacao: "aguardando_inicio"
    };
  }

  const periodoAtual = obterPeriodoBase(tipoNormalizado, hoje);

  if (dataMeta > periodoAtual.inicio) {
    periodoAtual.inicio = dataMeta;
  }

  return {
    tipo: tipoNormalizado,
    inicio: periodoAtual.inicio,
    fim: periodoAtual.fim,
    ativa: true,
    situacao: "ativa"
  };
}

function calcularPercentual(valorAtual, valorMeta) {
  if (!valorMeta || valorMeta <= 0) {
    return 0;
  }

  return Number(((valorAtual / valorMeta) * 100).toFixed(2));
}

function obterIndicadorVisual(percentual, atingiuMeta, possuiAtividade, ativa) {
  if (!ativa) {
    return "aguardando_inicio";
  }

  if (atingiuMeta) {
    return "concluido";
  }

  if (!possuiAtividade) {
    return "nao_iniciado";
  }

  if (percentual >= 75) {
    return "avancado";
  }

  if (percentual >= 25) {
    return "em_andamento";
  }

  return "inicial";
}

function obterMensagemMeta({ ativa, atingiuMeta, possuiAtividade, percentual }) {
  if (!ativa) {
    return "Meta cadastrada, aguardando data de inicio para entrar no calculo de progresso.";
  }

  if (atingiuMeta) {
    return "Meta atingida no periodo atual.";
  }

  if (!possuiAtividade) {
    return "Nenhuma atividade registrada para esta meta no periodo atual.";
  }

  return `Progresso atual de ${percentual}% em relacao a meta definida.`;
}

function tratarErroDependenciaBanco(error, res) {
  if (error && error.code === "42P01") {
    return res.status(500).json({
      erro: "Tabela atividade nao encontrada. Execute o script SQL da funcionalidade de progresso."
    });
  }

  return null;
}

router.get("/", async (req, res) => {
  try {
    const metasResult = await pool.query(`
      SELECT
        m.*,
        d.di_disciplina
      FROM meta m
      LEFT JOIN disciplina d ON d.di_id = m.me_disciplina
      ORDER BY m.me_id ASC
    `);

    const metas = metasResult.rows;

    if (metas.length === 0) {
      return res.json({
        possuiMetas: false,
        mensagem: "Nao ha dados suficientes para exibir o progresso. Cadastre uma meta primeiro.",
        atualizadoEm: new Date().toISOString(),
        resumo: {
          metasCadastradas: 0,
          metasAtivas: 0,
          metasAguardandoInicio: 0,
          metasAtingidas: 0,
          totalTempoMetaMin: 0,
          totalTempoEstudadoMin: 0,
          totalTarefasConcluidas: 0,
          percentualGeral: 0
        },
        metas: []
      });
    }

    const atividadesResult = await pool.query(`
      SELECT
        at_id,
        at_disciplina,
        at_tempo_min,
        COALESCE(at_tarefas_concluidas, 0) AS at_tarefas_concluidas,
        at_data
      FROM atividade
      ORDER BY at_data DESC, at_id DESC
    `);

    const atividades = atividadesResult.rows.map((atividade) => ({
      ...atividade,
      at_data: parseData(atividade.at_data)
    }));

    const metasComProgresso = metas.map((meta) => {
      const periodo = obterPeriodoMeta(meta.me_tipo, meta.me_data_inicio);
      const tempoMetaMin = Number(meta.me_tempo_min) || 0;

      const atividadesDaMeta = periodo.ativa
        ? atividades.filter((atividade) => {
            if (Number(atividade.at_disciplina) !== Number(meta.me_disciplina)) {
              return false;
            }

            if (!atividade.at_data) {
              return false;
            }

            return atividade.at_data >= periodo.inicio && atividade.at_data <= periodo.fim;
          })
        : [];

      const tempoEstudadoMin = atividadesDaMeta.reduce(
        (acumulado, atividade) => acumulado + Number(atividade.at_tempo_min || 0),
        0
      );

      const tarefasConcluidas = atividadesDaMeta.reduce(
        (acumulado, atividade) => acumulado + Number(atividade.at_tarefas_concluidas || 0),
        0
      );

      const percentual = calcularPercentual(tempoEstudadoMin, tempoMetaMin);
      const percentualExibicao = Math.min(percentual, 100);
      const quantidadeAtividades = atividadesDaMeta.length;
      const possuiAtividade = quantidadeAtividades > 0;
      const atingiuMeta = tempoEstudadoMin >= tempoMetaMin && tempoMetaMin > 0;
      const indicadorVisual = obterIndicadorVisual(
        percentualExibicao,
        atingiuMeta,
        possuiAtividade,
        periodo.ativa
      );

      return {
        me_id: meta.me_id,
        me_tipo: meta.me_tipo,
        me_tempo_min: tempoMetaMin,
        me_disciplina: meta.me_disciplina,
        me_data_inicio: meta.me_data_inicio,
        di_disciplina: meta.di_disciplina,
        periodo: {
          tipo: periodo.tipo,
          inicio: formatarData(periodo.inicio),
          fim: formatarData(periodo.fim),
          ativa: periodo.ativa,
          situacao: periodo.situacao
        },
        progresso: {
          criterioPrincipal: "tempo_estudado",
          unidade: "minutos",
          valorAtual: tempoEstudadoMin,
          valorMeta: tempoMetaMin,
          percentual,
          percentualExibicao,
          tarefasConcluidas,
          quantidadeAtividades,
          atingiuMeta,
          indicadorVisual,
          mensagem: obterMensagemMeta({
            ativa: periodo.ativa,
            atingiuMeta,
            possuiAtividade,
            percentual: percentualExibicao
          })
        }
      };
    });

    const metasAtivas = metasComProgresso.filter((meta) => meta.periodo.ativa);
    const metasAguardandoInicio = metasComProgresso.length - metasAtivas.length;
    const totalTempoMetaMin = metasAtivas.reduce(
      (acumulado, meta) => acumulado + Number(meta.me_tempo_min || 0),
      0
    );
    const totalTempoEstudadoMin = metasAtivas.reduce(
      (acumulado, meta) => acumulado + Number(meta.progresso.valorAtual || 0),
      0
    );
    const totalTarefasConcluidas = metasAtivas.reduce(
      (acumulado, meta) => acumulado + Number(meta.progresso.tarefasConcluidas || 0),
      0
    );
    const metasAtingidas = metasAtivas.filter((meta) => meta.progresso.atingiuMeta).length;

    let mensagem = "Progresso calculado com sucesso.";

    if (metasAtivas.length === 0) {
      mensagem = "As metas cadastradas ainda nao estao ativas para calculo de progresso.";
    }

    res.json({
      possuiMetas: true,
      mensagem,
      atualizadoEm: new Date().toISOString(),
      resumo: {
        metasCadastradas: metasComProgresso.length,
        metasAtivas: metasAtivas.length,
        metasAguardandoInicio,
        metasAtingidas,
        totalTempoMetaMin,
        totalTempoEstudadoMin,
        totalTarefasConcluidas,
        percentualGeral: calcularPercentual(totalTempoEstudadoMin, totalTempoMetaMin)
      },
      metas: metasComProgresso
    });
  } catch (error) {
    console.error("Erro ao calcular progresso:", error);

    if (tratarErroDependenciaBanco(error, res)) {
      return;
    }

    res.status(500).json({
      erro: "Erro ao calcular progresso"
    });
  }
});

module.exports = router;
