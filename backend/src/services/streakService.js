const dayjs = require("dayjs");

// Variável de teste para simular avanço de dias
// const TEST_DAY_OFFSET = 0; // Ex: 1 = simula amanhã, 2 = depois de amanhã


function calcularStreak(datas) {
  if (!datas || datas.length === 0) return 0;

    const diasUnicos = [...new Set(datas.map(d => new Date(d).toISOString().split("T")[0]))].sort();


  let streak = 1;

  for (let i = diasUnicos.length - 1; i > 0; i--) {
    const atual = dayjs(diasUnicos[i]);
    const anterior = dayjs(diasUnicos[i - 1]);

    if (atual.diff(anterior, "day") === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

function calcularStreakAtual(datas) {
  if (!datas || datas.length === 0) return 0;

    const hoje = new Date().toISOString().split("T")[0];

    const diasUnicos = [...new Set(datas.map(d => new Date(d).toISOString().split("T")[0]))].sort();


  if (!diasUnicos.includes(hoje)) {
    return 0;
  }

  return calcularStreak(diasUnicos);
}

module.exports = {
  calcularStreak,
  calcularStreakAtual
};