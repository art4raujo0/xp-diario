const API_RELATORIO = '/api/relatorio';

let periodoAtual = 'mes';
let dadosRelatorio = null;

function token() {
  return localStorage.getItem('xp_diario_token');
}

function cabecalhos() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token()}`
  };
}

function dataHoje() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}

function calcularPeriodo(tipo) {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  const dia = hoje.getDate();

  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (tipo === 'semana') {
    const diaSemana = hoje.getDay();
    const inicio = new Date(hoje);
    inicio.setDate(dia - diaSemana);
    return { inicio: fmt(inicio), fim: dataHoje() };
  }

  if (tipo === 'mes') {
    return { inicio: `${ano}-${pad(mes + 1)}-01`, fim: dataHoje() };
  }

  if (tipo === 'trimestre') {
    const inicio = new Date(ano, mes - 2, 1);
    return { inicio: fmt(inicio), fim: dataHoje() };
  }

  return null;
}

function formatarTempo(minutos) {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function selecionarPeriodo(tipo, botao) {
  document.querySelectorAll('.periodo-btn').forEach(b => b.classList.remove('active'));
  botao.classList.add('active');
  periodoAtual = tipo;

  const filtroPersonalizado = document.getElementById('filtro-personalizado');
  if (tipo === 'personalizado') {
    filtroPersonalizado.classList.remove('d-none');
    document.getElementById('data-inicio').value = dataHoje();
    document.getElementById('data-fim').value = dataHoje();
    return;
  }

  filtroPersonalizado.classList.add('d-none');
  buscarRelatorio();
}

async function buscarRelatorio() {
  let inicio, fim;

  if (periodoAtual === 'personalizado') {
    inicio = document.getElementById('data-inicio').value;
    fim = document.getElementById('data-fim').value;
    if (!inicio || !fim) {
      mostrarErro('Selecione as datas de início e fim.');
      return;
    }
    if (inicio > fim) {
      mostrarErro('A data de início não pode ser maior que a data de fim.');
      return;
    }
  } else {
    const periodo = calcularPeriodo(periodoAtual);
    inicio = periodo.inicio;
    fim = periodo.fim;
  }

  const resultado = document.getElementById('resultado');
  resultado.innerHTML = `<div class="p-4 text-center text-muted"><i class="fas fa-spinner fa-spin me-2"></i>Carregando relatório...</div>`;
  document.getElementById('cards-resumo').style.display = 'none';

  try {
    const res = await fetch(`${API_RELATORIO}?inicio=${inicio}&fim=${fim}`, { headers: cabecalhos() });

    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }

    const dados = await res.json();

    if (!res.ok) {
      mostrarErro(dados.erro || 'Erro ao gerar relatório.');
      return;
    }

    renderizarRelatorio(dados);
  } catch (err) {
    console.error('Erro ao buscar relatório:', err);
    mostrarErro('Erro ao conectar com o servidor.');
  }
}

function renderizarRelatorio(dados) {
  dadosRelatorio = dados;
  document.getElementById('btns-exportar').style.removeProperty('display');
  const { resumo, por_disciplina, periodo } = dados;

  // Atualiza cards de resumo
  document.getElementById('resumo-tempo').textContent = formatarTempo(resumo.total_minutos);
  document.getElementById('resumo-sessoes').textContent = resumo.total_sessoes;
  document.getElementById('resumo-tarefas').textContent = resumo.total_tarefas;
  document.getElementById('cards-resumo').style.removeProperty('display');
  renderizarCardsLateraisRelatorio(resumo);

  const resultado = document.getElementById('resultado');

  if (resumo.total_sessoes === 0) {
    resultado.innerHTML = `
      <div class="p-5 text-center text-muted">
        <i class="fas fa-chart-bar fs-2 mb-3 d-block" style="color: #d1c4e9;"></i>
        <p class="mb-0 fw-semibold">Nenhum estudo registrado no período selecionado.</p>
        <p class="small mt-1">Registre uma sessão de estudo para ver seu relatório aqui.</p>
      </div>`;
    return;
  }

  const maxMinutos = por_disciplina.length > 0 ? por_disciplina[0].minutos : 1;

  const linhas = por_disciplina.map(d => {
    const pct = Math.round((d.minutos / maxMinutos) * 100);
    const corFill = d.cor || '#463acb';
    return `
      <tr>
        <td>
          <div class="d-flex align-items-center gap-2">
            <span style="width:10px;height:10px;border-radius:50%;background:${corFill};flex-shrink:0;display:inline-block;"></span>
            <span class="fw-semibold" style="word-break:break-word;">${d.nome}</span>
          </div>
        </td>
        <td style="min-width:120px;">
          <div class="disc-row-bar">
            <div class="disc-row-fill" style="width:${pct}%;background:${corFill};"></div>
          </div>
        </td>
        <td class="text-end">
          <span class="min-badge"><i class="fas fa-clock"></i> ${formatarTempo(d.minutos)}</span>
        </td>
        <td class="text-end text-muted small">${d.sessoes} sessão${d.sessoes !== 1 ? 'ões' : ''}</td>
      </tr>`;
  }).join('');

  resultado.innerHTML = `
    <div class="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
      <h6 class="fw-bold m-0" style="color:#1e293b;">Distribuição por Matéria</h6>
      <span class="text-muted small">
        <i class="fas fa-calendar me-1"></i>
        ${formatarDataExibicao(periodo.inicio)} até ${formatarDataExibicao(periodo.fim)}
      </span>
    </div>
    <div class="table-responsive">
      <table class="table align-middle mb-0">
        <thead class="table-light">
          <tr>
            <th>Matéria</th>
            <th>Progresso</th>
            <th class="text-end">Tempo</th>
            <th class="text-end">Sessões</th>
          </tr>
        </thead>
        <tbody>${linhas}</tbody>
      </table>
    </div>`;
}

async function renderizarCardsLateraisRelatorio(resumo) {
  const metaCard = document.getElementById('relatorio-meta-card');
  if (metaCard) {
    const pct = Math.min(100, Math.round((Number(resumo.total_minutos || 0) / 600) * 100));
    const valor = metaCard.querySelector('.stat-value');
    const barra = metaCard.querySelector('.progress-fill');
    if (valor) valor.textContent = `${pct}%`;
    if (barra) barra.style.width = `${pct}%`;
  }

  const conquistasCard = document.querySelector('.dashboard-side .game-card:nth-child(2)');
  if (!conquistasCard) return;

  try {
    const res = await fetch('/api/conquistas', { headers: cabecalhos() });
    const dados = res.ok ? await res.json() : { conquistas: [] };
    const conquistas = (dados.conquistas || []).filter(c => c.status === 'desbloqueada').slice(0, 3);
    const conteudo = conquistas.length ? conquistas.map(c => `
      <div class="history-item">
        <div class="badge-medal" style="background:#6d5dfb;width:46px;height:46px"><i class="fas fa-trophy"></i></div>
        <div><div class="history-title">${c.co_titulo || c.titulo || 'Conquista'}</div><div class="history-meta">${c.co_descricao || c.descricao || 'Desbloqueada pelo seu progresso'}</div></div>
      </div>`).join('') : '<p class="text-muted fw-bold mb-0">Nenhuma conquista desbloqueada ainda.</p>';

    conquistasCard.innerHTML = `<h3 class="card-title mb-3"><span class="pixel-icon icon-yellow"><i class="fas fa-star"></i></span> Conquistas recentes</h3>${conteudo}`;
  } catch (erro) {
    conquistasCard.innerHTML = '<h3 class="card-title mb-3"><span class="pixel-icon icon-yellow"><i class="fas fa-star"></i></span> Conquistas recentes</h3><p class="text-muted fw-bold mb-0">Nao foi possivel carregar conquistas.</p>';
  }
}

function mostrarErro(mensagem) {
  document.getElementById('resultado').innerHTML = `
    <div class="p-4 text-center text-danger">
      <i class="fas fa-exclamation-circle me-2"></i>${mensagem}
    </div>`;
}

function formatarDataExibicao(dataISO) {
  if (!dataISO) return '';
  const [ano, mes, dia] = dataISO.split('-');
  return `${dia}/${mes}/${ano}`;
}

function exportarPDF() {
  if (!dadosRelatorio) { alert('Carregue o relatório antes de exportar.'); return; }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ format: 'a4', unit: 'mm' });
  const { resumo, por_disciplina, periodo } = dadosRelatorio;
  const agora = new Date();
  const dataHora = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const totalMin = resumo.total_minutos || 1;

  // === CABEÇALHO ===
  doc.setFillColor(29, 29, 43);
  doc.rect(0, 0, W, 28, 'F');

  doc.setFillColor(104, 94, 212);
  doc.roundedRect(10, 6, 16, 16, 3, 3, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
  doc.text('XP', 18, 16, { align: 'center' });

  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('XP Diário', 30, 13);
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(180, 180, 200);
  doc.text('Estudo Inteligente', 30, 21);

  doc.setFillColor(70, 58, 203);
  doc.rect(0, 28, W, 2.5, 'F');

  // === TÍTULO ===
  doc.setTextColor(30, 41, 59); doc.setFontSize(16); doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Desempenho', 14, 42);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 116, 139);
  doc.text('Período: ' + formatarDataExibicao(periodo.inicio) + ' até ' + formatarDataExibicao(periodo.fim), 14, 50);

  doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
  doc.line(14, 54, W - 14, 54);

  // === CARDS DE RESUMO ===
  const boxY = 59;
  const boxW = (W - 28 - 8) / 3;
  [
    { label: 'TEMPO TOTAL',        value: formatarTempo(resumo.total_minutos), cor: [70, 58, 203] },
    { label: 'SESSÕES',            value: String(resumo.total_sessoes),         cor: [22, 163, 74] },
    { label: 'TAREFAS CONCLUÍDAS', value: String(resumo.total_tarefas),         cor: [234, 88, 12] },
  ].forEach((b, i) => {
    const x = 14 + i * (boxW + 4);
    doc.setFillColor(248, 250, 252); doc.roundedRect(x, boxY, boxW, 20, 2, 2, 'F');
    doc.setFontSize(6); doc.setFont('helvetica', 'bold'); doc.setTextColor(148, 163, 184);
    doc.text(b.label, x + boxW / 2, boxY + 7, { align: 'center' });
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...b.cor);
    doc.text(b.value, x + boxW / 2, boxY + 16, { align: 'center' });
  });

  // === TABELA ===
  doc.autoTable({
    startY: boxY + 26,
    head: [['Matéria', 'Tempo', 'Sessões', '% do Total']],
    body: por_disciplina.map(d => [
      d.nome,
      formatarTempo(d.minutos),
      String(d.sessoes),
      Math.round(d.minutos / totalMin * 100) + '%',
    ]),
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3.5, textColor: [51, 65, 85] },
    headStyles: { fillColor: [70, 58, 203], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 32, halign: 'center' },
      2: { cellWidth: 22, halign: 'center' },
      3: { cellWidth: 26, halign: 'center' },
    },
    margin: { left: 14, right: 14 },
  });

  // === RODAPÉ (em todas as páginas) ===
  const totalPgs = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPgs; p++) {
    doc.setPage(p);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.3);
    doc.line(14, H - 12, W - 14, H - 12);
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(148, 163, 184);
    doc.text('Gerado em ' + dataHora, 14, H - 6);
    doc.text('XP Diário — Estudo Inteligente', W / 2, H - 6, { align: 'center' });
    doc.text('Pág. ' + p + '/' + totalPgs, W - 14, H - 6, { align: 'right' });
  }

  doc.save('relatorio-xp-diario-' + periodo.inicio + '-' + periodo.fim + '.pdf');
}

function exportarDOCX() {
  if (!dadosRelatorio) { alert('Carregue o relatório antes de exportar.'); return; }

  const { resumo, por_disciplina, periodo } = dadosRelatorio;
  const agora = new Date();
  const dataHora = agora.toLocaleDateString('pt-BR') + ' às ' + agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const totalMin = resumo.total_minutos || 1;

  const linhasTabela = por_disciplina.length > 0
    ? por_disciplina.map((d, i) => `
        <tr style="background:${i % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="padding:8px 12px;border:1px solid #e2e8f0;font-size:11pt;">${d.nome}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;font-size:11pt;">${formatarTempo(d.minutos)}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;font-size:11pt;">${d.sessoes}</td>
          <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;font-size:11pt;">${Math.round(d.minutos / totalMin * 100)}%</td>
        </tr>`).join('')
    : `<tr><td colspan="4" style="padding:16px;text-align:center;color:#94a3b8;font-size:11pt;">Nenhum dado no período.</td></tr>`;

  const html = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office'
          xmlns:w='urn:schemas-microsoft-com:office:word'
          xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset='utf-8'>
      <!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
      <style>
        @page { margin: 2cm 2.5cm; }
        body { font-family: Calibri, Arial, sans-serif; color: #1e293b; margin: 0; padding: 0; }
        .cabecalho { background: #1d1d2b; padding: 20px 28px 16px; margin: -2cm -2.5cm 0; }
        .brand-nome { font-size: 22pt; font-weight: 700; color: #ffffff; margin: 0 0 2px 0; }
        .brand-sub  { font-size: 10pt; color: #b4b4c8; margin: 0; }
        .acento     { background: #463acb; height: 4px; margin: 0 -2.5cm 24px; display: block; }
        h1 { font-size: 18pt; color: #1e293b; margin: 0 0 5px 0; }
        .periodo { font-size: 10pt; color: #64748b; margin: 0 0 18px 0; }
        .resumo { width: 100%; border-collapse: separate; border-spacing: 8px; margin-bottom: 22px; }
        .resumo td { background: #f8fafc; padding: 12px 10px; text-align: center; border-radius: 6px; }
        .rlabel { font-size: 8pt; color: #94a3b8; font-weight: 700; text-transform: uppercase; display: block; letter-spacing: 0.3pt; }
        .rval   { font-size: 17pt; font-weight: 800; display: block; margin-top: 4px; }
        .section-title { font-size: 11pt; font-weight: 700; color: #1e293b; margin: 0 0 8px 0; }
        .tabela { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        .tabela th { background: #463acb; color: #fff; padding: 9px 12px; font-size: 9pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.3pt; border: 1px solid #3b31b0; }
        .tabela td { font-size: 11pt; }
        .rodape { border-top: 1px solid #e2e8f0; padding-top: 10px; color: #94a3b8; font-size: 9pt; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="cabecalho">
        <p class="brand-nome">XP Diário</p>
        <p class="brand-sub">Estudo Inteligente</p>
      </div>
      <div class="acento"></div>
      <h1>Relatório de Desempenho</h1>
      <p class="periodo">Período: ${formatarDataExibicao(periodo.inicio)} até ${formatarDataExibicao(periodo.fim)}</p>
      <table class="resumo">
        <tr>
          <td><span class="rlabel">Tempo Total</span><span class="rval" style="color:#463acb;">${formatarTempo(resumo.total_minutos)}</span></td>
          <td><span class="rlabel">Sessões</span><span class="rval" style="color:#16a34a;">${resumo.total_sessoes}</span></td>
          <td><span class="rlabel">Tarefas Concluídas</span><span class="rval" style="color:#ea580c;">${resumo.total_tarefas}</span></td>
        </tr>
      </table>
      <p class="section-title">Distribuição por Matéria</p>
      <table class="tabela">
        <thead>
          <tr>
            <th style="text-align:left;">Matéria</th>
            <th style="text-align:center;">Tempo</th>
            <th style="text-align:center;">Sessões</th>
            <th style="text-align:center;">% do Total</th>
          </tr>
        </thead>
        <tbody>${linhasTabela}</tbody>
      </table>
      <div class="rodape">
        Gerado em ${dataHora} &nbsp;|&nbsp; XP Diário — Estudo Inteligente
      </div>
    </body>
    </html>`;

  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'relatorio-xp-diario-' + periodo.inicio + '-' + periodo.fim + '.doc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

document.addEventListener('DOMContentLoaded', () => {
  if (!token()) {
    window.location.href = '/login';
    return;
  }
  carregarUsuarioAtual();
  buscarRelatorio();
});
