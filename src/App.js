import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './hooks/useAuth';
import { useCollection } from './hooks/useCollection';
import Login from './components/Login';

// ─── Constantes ───────────────────────────────────────────────────────────────
const MENTOR = {
  nome: 'Thiago Meireles',
  empresa: 'Propósito Vivo Educação e Desenvolvimento',
  cnpj: '65.514.239/0001-25',
  email: 'contato@propositovivo.com.br',
  telefone: '(11) 99999-0000',
  metodo: 'Método Pais com Propósito',
};

const PILARES = [
  '1. Identidade Parental',
  '2. Comunicação com Propósito',
  '3. Vínculos e Afeto',
  '4. Limites com Amor',
  '5. Disciplina Consciente',
  '6. Legado e Valores',
];

const STATUS_COLORS = {
  agendado: { bg: '#1a2a3a', color: '#4e9af1' },
  realizado: { bg: '#1a3a2a', color: '#5cb85c' },
  cancelado: { bg: '#2a1a1a', color: '#e05a5a' },
  faltou: { bg: '#2a2a1a', color: '#e8a838' },
};

// ─── Utilitários ──────────────────────────────────────────────────────────────
const fmt = (v) => v != null ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—';
const fmtDate = (d) => d ? new Date(d + 'T12:00').toLocaleDateString('pt-BR') : '—';
const today = () => new Date().toISOString().split('T')[0];

// ─── Gerador PDF via jsPDF ────────────────────────────────────────────────────
const loadJsPDF = () => new Promise((resolve) => {
  if (window.jspdf) return resolve(window.jspdf.jsPDF);
  const s = document.createElement('script');
  s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  s.onload = () => resolve(window.jspdf.jsPDF);
  document.head.appendChild(s);
});

const pdfHeader = (doc, title) => {
  doc.setFillColor(13, 17, 23); doc.rect(0, 0, 210, 36, 'F');
  doc.setFillColor(232, 168, 56); doc.rect(0, 36, 210, 2, 'F');
  doc.setTextColor(232, 168, 56); doc.setFontSize(15); doc.setFont('helvetica', 'bold');
  doc.text(MENTOR.empresa, 14, 14);
  doc.setFontSize(8.5); doc.setTextColor(200, 200, 200);
  doc.text(`CNPJ: ${MENTOR.cnpj}  |  ${MENTOR.email}  |  ${MENTOR.telefone}`, 14, 22);
  doc.setFontSize(10); doc.setTextColor(255, 255, 255);
  doc.text(title, 14, 31); doc.setTextColor(50, 50, 50);
};

const pdfFooter = (doc) => {
  const pages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
    doc.text(`${MENTOR.metodo}  |  Pág. ${i}/${pages}  |  ${new Date().toLocaleDateString('pt-BR')}`, 14, 290);
    doc.setDrawColor(232, 168, 56); doc.line(14, 287, 196, 287);
  }
};

const pdfSection = (doc, title, y) => {
  doc.setFillColor(232, 168, 56); doc.rect(14, y, 182, 6, 'F');
  doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(13, 17, 23);
  doc.text(title.toUpperCase(), 16, y + 4.2);
  doc.setTextColor(50, 50, 50); doc.setFont('helvetica', 'normal');
  return y + 10;
};

const pdfText = (doc, text, x, y, maxW = 180) => {
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(text || '—', maxW);
  doc.text(lines, x, y);
  return y + lines.length * 5;
};

const pdfField = (doc, label, value, y) => {
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(80, 80, 80);
  doc.text(label + ':', 14, y);
  doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
  const lines = doc.splitTextToSize(value || '—', 150);
  doc.text(lines, 58, y);
  return y + Math.max(lines.length * 4.5, 6);
};

async function gerarRecibo(sessao, cliente) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  doc.setFillColor(13, 17, 23); doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(232, 168, 56); doc.rect(0, 0, 210, 50, 'F');
  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(13, 17, 23);
  doc.text('RECIBO DE PAGAMENTO', 105, 20, { align: 'center' });
  doc.setFontSize(10); doc.text(MENTOR.empresa, 105, 30, { align: 'center' });
  doc.setFontSize(9); doc.text(`CNPJ: ${MENTOR.cnpj}`, 105, 38, { align: 'center' });
  doc.setFillColor(30, 30, 30); doc.roundedRect(14, 58, 182, 12, 3, 3, 'F');
  doc.setFontSize(10); doc.setFont('helvetica', 'bold'); doc.setTextColor(232, 168, 56);
  doc.text(`Nº ${String(Date.now()).slice(-6)}  —  Emitido em: ${new Date().toLocaleDateString('pt-BR')}`, 105, 66, { align: 'center' });
  doc.setFillColor(232, 168, 56); doc.roundedRect(60, 78, 90, 22, 4, 4, 'F');
  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(13, 17, 23);
  doc.text(fmt(sessao.valor), 105, 93, { align: 'center' });
  let y = 112;
  const field = (label, value) => {
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(232, 168, 56);
    doc.text(label, 20, y); doc.setFont('helvetica', 'normal'); doc.setTextColor(220, 220, 220);
    doc.text(value || '—', 75, y);
    doc.setDrawColor(40, 40, 40); doc.line(20, y + 2, 190, y + 2); y += 10;
  };
  field('RECEBEMOS DE:', cliente.nome);
  field('REFERENTE A:', `Sessão de Mentoria Parental — ${MENTOR.metodo}`);
  field('DATA DA SESSÃO:', fmtDate(sessao.data));
  field('HORÁRIO:', sessao.hora);
  field('MODALIDADE:', sessao.modalidade);
  field('PRESTADOR:', MENTOR.nome);
  y += 20;
  doc.setDrawColor(232, 168, 56); doc.line(40, y, 170, y);
  doc.setFontSize(9); doc.setTextColor(200, 200, 200);
  doc.text(MENTOR.nome, 105, y + 6, { align: 'center' });
  doc.text(MENTOR.empresa, 105, y + 12, { align: 'center' });
  doc.text(`CNPJ: ${MENTOR.cnpj}`, 105, y + 18, { align: 'center' });
  doc.save(`recibo_${cliente.nome.replace(/ /g, '_')}_${sessao.data}.pdf`);
}

async function gerarContrato(cliente, sessoes) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  pdfHeader(doc, 'CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE MENTORIA PARENTAL');
  let y = 45;
  const valorSessao = sessoes.find((s) => s.clienteId === cliente.id)?.valor || 180;
  y = pdfSection(doc, 'Partes', y);
  y = pdfField(doc, 'CONTRATANTE', cliente.nome, y);
  y = pdfField(doc, 'Telefone', cliente.telefone, y);
  y = pdfField(doc, 'E-mail', cliente.email, y);
  y += 3;
  y = pdfField(doc, 'CONTRATADO', MENTOR.nome, y);
  y = pdfField(doc, 'Empresa', MENTOR.empresa, y);
  y = pdfField(doc, 'CNPJ', MENTOR.cnpj, y);
  y += 4;
  y = pdfSection(doc, 'Objeto do Contrato', y);
  y = pdfText(doc, `Prestação de serviços de mentoria parental pelo ${MENTOR.metodo}, consistindo em acompanhamento individual e personalizado voltado ao desenvolvimento das competências parentais.`, 14, y);
  y += 4;
  y = pdfSection(doc, 'Objetivo do Mentorando', y);
  y = pdfText(doc, cliente.objetivo, 14, y); y += 4;
  y = pdfSection(doc, 'Condições', y);
  [`• Cada sessão tem duração de 60 minutos.`,
    `• Valor por sessão: ${fmt(valorSessao)}.`,
    `• Cancelamentos devem ser comunicados com 24h de antecedência.`,
    `• Cancelamentos sem aviso serão cobrados integralmente.`,
    `• O conteúdo das sessões é estritamente confidencial.`,
    `• A mentoria não substitui atendimento psicológico ou psiquiátrico.`,
  ].forEach((c) => { y = pdfText(doc, c, 14, y); y += 1; });
  y += 8;
  doc.setFontSize(9); doc.setTextColor(80, 80, 80);
  doc.text(`Guarulhos/SP, ${new Date().toLocaleDateString('pt-BR')}`, 14, y); y += 14;
  doc.setDrawColor(100); doc.line(14, y, 90, y); doc.line(110, y, 196, y); y += 5;
  doc.setFontSize(8); doc.text(cliente.nome, 14, y); doc.text(MENTOR.nome, 110, y); y += 4;
  doc.setTextColor(150); doc.text('CONTRATANTE', 14, y); doc.text('CONTRATADO', 110, y);
  pdfFooter(doc);
  doc.save(`contrato_${cliente.nome.replace(/ /g, '_')}.pdf`);
}

async function gerarProntuarioPDF(pron, cliente, tipo) {
  const JsPDF = await loadJsPDF();
  const doc = new JsPDF({ unit: 'mm', format: 'a4' });
  const titulo = tipo === 'completo'
    ? 'PRONTUÁRIO CLÍNICO COMPLETO — USO INTERNO'
    : 'RELATÓRIO DE ACOMPANHAMENTO — VERSÃO DO MENTORANDO';
  pdfHeader(doc, titulo);
  let y = 45;
  y = pdfSection(doc, 'Identificação', y);
  y = pdfField(doc, 'Mentorando', cliente.nome, y);
  y = pdfField(doc, 'Método', MENTOR.metodo, y);
  y = pdfField(doc, 'Mentor', MENTOR.nome, y);
  y = pdfField(doc, 'Início', fmtDate(pron.dataInicio), y);
  y = pdfField(doc, 'Sessões', `${pron.sessaoAtual || 1} de ${pron.sessoesContratadas || '—'}`, y);
  y += 4;
  if (tipo === 'completo') {
    y = pdfSection(doc, 'Descrição do Caso', y);
    y = pdfText(doc, pron.descricaoCaso, 14, y); y += 4;
  }
  y = pdfSection(doc, 'Pilares do Método Pais com Propósito', y);
  (pron.pilaresTrabalho || []).forEach((p) => {
    doc.setFontSize(9); doc.setTextColor(232, 168, 56);
    doc.text('▸ ' + p, 16, y); y += 5;
  });
  doc.setTextColor(50, 50, 50); y += 2;
  y = pdfField(doc, 'Pilar em Foco', pron.pilarFoco, y);
  y = pdfSection(doc, tipo === 'completo' ? 'Plano de Intervenção' : 'Seu Objetivo', y);
  y = pdfText(doc, tipo === 'completo' ? pron.planoTerapeutico : cliente.objetivo, 14, y); y += 4;
  y = pdfSection(doc, 'Metas Específicas', y);
  y = pdfText(doc, pron.metasEspecificas, 14, y); y += 4;
  y = pdfSection(doc, 'Recursos Indicados', y);
  y = pdfText(doc, pron.recursosIndicados, 14, y); y += 4;
  if (tipo === 'completo') {
    y = pdfSection(doc, 'Tarefas Entre Sessões', y);
    y = pdfText(doc, pron.tarefasEntreSessoes, 14, y); y += 4;
    if (y > 220) { doc.addPage(); y = 20; }
    y = pdfSection(doc, 'Evoluções', y);
    (pron.evolucoes || []).forEach((ev, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFillColor(245, 245, 245); doc.roundedRect(14, y, 182, 5, 1, 1, 'F');
      doc.setFontSize(8.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(80, 80, 80);
      doc.text(`Sessão ${ev.sessao || i + 1}  —  ${fmtDate(ev.data)}  |  ${ev.pilar || ''}`, 16, y + 3.5);
      y += 8; doc.setFont('helvetica', 'normal'); doc.setTextColor(30, 30, 30);
      y = pdfText(doc, ev.texto, 16, y, 176); y += 4;
    });
    if (pron.conclusao) {
      if (y > 240) { doc.addPage(); y = 20; }
      y = pdfSection(doc, 'Conclusão / Alta', y);
      y = pdfText(doc, pron.conclusao, 14, y);
    }
  } else {
    const msg = pron.versaoCliente || `${cliente.nome.split(' ')[0]}, sua jornada como pai/mãe é única e cheia de propósito. Continue praticando com intenção os aprendizados de cada sessão. Você está no caminho certo!`;
    y = pdfSection(doc, 'Mensagem do seu Mentor', y);
    y = pdfText(doc, msg, 14, y); y += 10;
    doc.setFontSize(9); doc.setTextColor(150);
    doc.text('_________________________________', 40, y + 10);
    doc.text(MENTOR.nome, 44, y + 16);
    doc.text('Mentor Parental — ' + MENTOR.metodo, 38, y + 21);
  }
  pdfFooter(doc);
  doc.save(`${tipo === 'completo' ? 'prontuario' : 'relatorio'}_${cliente.nome.replace(/ /g, '_')}.pdf`);
}

// ─── App Principal ────────────────────────────────────────────────────────────
export default function App() {
  const { user, loading, login, logout, error: authError } = useAuth();
  const { data: clients, add: addClient, update: updateClient } = useCollection('clientes');
  const { data: prontuarios, add: addPron, update: updatePron } = useCollection('prontuarios');
  const { data: sessoes, add: addSessao, update: updateSessao, remove: removeSessao } = useCollection('sessoes');
  const { data: financeiro, add: addFinanceiro } = useCollection('financeiro');

  const [tab, setTab] = useState('dashboard');
  const [notifs, setNotifs] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const addNotif = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setNotifs((p) => [...p, { id, msg, type }]);
    setTimeout(() => setNotifs((p) => p.filter((n) => n.id !== id)), 4500);
  }, []);

  useEffect(() => {
    if (!user || sessoes.length === 0) return;
    const hoje = sessoes.filter((s) => s.data === today() && s.status === 'agendado');
    if (hoje.length > 0) addNotif(`📅 ${hoje.length} sessão(ões) agendada(s) para hoje!`, 'info');
    const pend = sessoes.filter((s) => !s.pago && s.status === 'realizado');
    if (pend.length > 0) addNotif(`💰 ${pend.length} sessão(ões) aguardando pagamento.`, 'warn');
  }, [user, sessoes.length]);

  // PWA: registrar service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const clienteById = (id) => clients.find((c) => c.id === id);
  const totalRecebido = financeiro.filter((f) => f.tipo === 'receita').reduce((s, f) => s + (f.valor || 0), 0);
  const totalPendente = sessoes.filter((s) => !s.pago && s.status === 'realizado').reduce((s, f) => s + (f.valor || 0), 0);

  if (loading) return <Splash />;
  if (!user) return <Login onLogin={login} error={authError} />;

  const NAV = [
    { id: 'dashboard', icon: '◈', label: 'Dashboard' },
    { id: 'clientes', icon: '◉', label: 'Mentorandos' },
    { id: 'prontuarios', icon: '◫', label: 'Prontuários' },
    { id: 'agenda', icon: '◷', label: 'Agenda' },
    { id: 'financeiro', icon: '$', label: 'Financeiro' },
    { id: 'documentos', icon: '◧', label: 'Documentos' },
  ];

  return (
    <div style={S.root}>
      {/* Notificações */}
      <div style={S.notifWrap}>
        {notifs.map((n) => (
          <div key={n.id} style={{ ...S.notif, ...(n.type === 'warn' ? S.nWarn : n.type === 'ok' ? S.nOk : S.nInfo) }}>
            {n.msg}
            <button style={S.notifX} onClick={() => setNotifs((p) => p.filter((x) => x.id !== n.id))}>✕</button>
          </div>
        ))}
      </div>

      {/* Sidebar desktop */}
      <aside style={S.sidebar}>
        <div style={S.brand}>
          <span style={{ fontSize: 22, color: '#e8a838' }}>✦</span>
          <div>
            <div style={S.brandName}>Propósito Vivo</div>
            <div style={S.brandSub}>Gestão de Mentoria</div>
          </div>
        </div>
        <nav style={S.nav}>
          {NAV.map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              style={{ ...S.navBtn, ...(tab === item.id ? S.navActive : {}) }}>
              <span style={S.navIcon}>{item.icon}</span>{item.label}
            </button>
          ))}
        </nav>
        <div style={S.sidebarFoot}>
          <div style={S.avatar}>T</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#e6edf3' }}>Thiago Meireles</div>
            <div style={{ fontSize: 10, color: '#7d8590' }}>Mentor Parental</div>
          </div>
          <button onClick={logout} style={S.logoutBtn} title="Sair">⏻</button>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav style={S.mobileNav}>
        {NAV.map((item) => (
          <button key={item.id} onClick={() => setTab(item.id)}
            style={{ ...S.mobileNavBtn, ...(tab === item.id ? S.mobileNavActive : {}) }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 9 }}>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Conteúdo */}
      <main style={S.main}>
        {tab === 'dashboard' && <Dashboard clients={clients} sessoes={sessoes} financeiro={financeiro} totalRecebido={totalRecebido} totalPendente={totalPendente} clienteById={clienteById} />}
        {tab === 'clientes' && <Clientes clients={clients} addClient={addClient} updateClient={updateClient} prontuarios={prontuarios} sessoes={sessoes} addNotif={addNotif} />}
        {tab === 'prontuarios' && <Prontuarios prontuarios={prontuarios} addPron={addPron} updatePron={updatePron} clients={clients} clienteById={clienteById} addNotif={addNotif} />}
        {tab === 'agenda' && <Agenda sessoes={sessoes} addSessao={addSessao} updateSessao={updateSessao} removeSessao={removeSessao} clients={clients} clienteById={clienteById} financeiro={financeiro} addFinanceiro={addFinanceiro} addNotif={addNotif} />}
        {tab === 'financeiro' && <Financeiro financeiro={financeiro} addFinanceiro={addFinanceiro} sessoes={sessoes} updateSessao={updateSessao} clienteById={clienteById} totalRecebido={totalRecebido} totalPendente={totalPendente} addNotif={addNotif} />}
        {tab === 'documentos' && <Documentos clients={clients} sessoes={sessoes} prontuarios={prontuarios} clienteById={clienteById} addNotif={addNotif} />}
      </main>
    </div>
  );
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function Splash() {
  return (
    <div style={{ minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ fontSize: 48, color: '#e8a838', animation: 'pulse 1.5s infinite' }}>✦</div>
      <div style={{ color: '#7d8590', fontSize: 14 }}>Carregando…</div>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({ clients, sessoes, totalRecebido, totalPendente, clienteById }) {
  const ativos = clients.filter((c) => c.status === 'ativo').length;
  const realizadas = sessoes.filter((s) => s.status === 'realizado').length;
  const proximas = sessoes.filter((s) => s.data >= today() && s.status !== 'cancelado')
    .sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)).slice(0, 5);

  return (
    <div style={S.page}>
      <PageHeader title="Dashboard" sub={new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })} />
      <div style={S.statsGrid}>
        <StatCard icon="◉" label="Ativos" value={ativos} color="#e8a838" />
        <StatCard icon="◷" label="Hoje" value={sessoes.filter((s) => s.data === today()).length} color="#4e9af1" />
        <StatCard icon="◈" label="Recebido" value={fmt(totalRecebido)} color="#5cb85c" />
        <StatCard icon="◧" label="A Receber" value={fmt(totalPendente)} color="#e05a5a" />
        <StatCard icon="◫" label="Realizadas" value={realizadas} color="#9b59b6" />
      </div>
      <div style={S.twoCol}>
        <div style={S.card}>
          <h3 style={S.cardTitle}>Próximas Sessões</h3>
          {proximas.map((s) => {
            const c = clienteById(s.clienteId);
            return (
              <div key={s.id} style={S.listItem}>
                <div style={S.avatar2}>{c?.nome?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.liName}>{c?.nome}</div>
                  <div style={S.liSub}>{fmtDate(s.data)} às {s.hora} · {s.modalidade}</div>
                </div>
                <span style={{ ...S.pill, background: s.data === today() ? '#e8a838' : '#21262d', color: s.data === today() ? '#0d1117' : '#c9d1d9' }}>
                  {s.data === today() ? 'Hoje' : fmtDate(s.data)}
                </span>
              </div>
            );
          })}
          {proximas.length === 0 && <p style={S.empty}>Sem sessões agendadas</p>}
        </div>
        <div style={S.card}>
          <h3 style={S.cardTitle}>Mentorandos</h3>
          {clients.map((c) => (
            <div key={c.id} style={S.listItem}>
              <div style={S.avatar2}>{c.nome?.[0]}</div>
              <div style={{ flex: 1 }}>
                <div style={S.liName}>{c.nome}</div>
                <div style={S.liSub}>{c.objetivo?.slice(0, 40)}…</div>
              </div>
              <span style={{ ...S.pill, background: '#1a3a2a', color: '#5cb85c' }}>{c.status}</span>
            </div>
          ))}
          {clients.length === 0 && <p style={S.empty}>Nenhum mentorando</p>}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ ...S.statCard, borderTop: `3px solid ${color}` }}>
      <div style={{ fontSize: 16, color, marginBottom: 6 }}>{icon}</div>
      <div style={S.statVal}>{value}</div>
      <div style={S.statLbl}>{label}</div>
    </div>
  );
}

// ─── Clientes ─────────────────────────────────────────────────────────────────
function Clientes({ clients, addClient, updateClient, prontuarios, sessoes, addNotif }) {
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState('');

  const save = async () => {
    if (!form.nome) return addNotif('Nome é obrigatório.', 'warn');
    if (form.id) { await updateClient(form.id, form); addNotif('Mentorando atualizado!', 'ok'); }
    else { await addClient({ ...form, status: 'ativo', dataCadastro: today() }); addNotif('Mentorando cadastrado!', 'ok'); }
    setForm(null);
  };

  const filtered = clients.filter((c) => c.nome?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={S.page}>
      <PageHeader title="Mentorandos" sub={`${clients.length} cadastrados`}>
        <button style={S.btnPrimary} onClick={() => setForm({ nome: '', telefone: '', email: '', objetivo: '' })}>+ Novo</button>
      </PageHeader>
      <input style={S.searchInput} placeholder="Buscar…" value={search} onChange={(e) => setSearch(e.target.value)} />
      <div style={S.clientGrid}>
        {filtered.map((c) => {
          const ns = sessoes.filter((s) => s.clienteId === c.id).length;
          return (
            <div key={c.id} style={S.clientCard}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
                <div style={{ ...S.avatar2, width: 40, height: 40, fontSize: 18, flexShrink: 0 }}>{c.nome?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#e6edf3' }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: '#7d8590' }}>{c.telefone}</div>
                </div>
                <span style={{ ...S.pill, background: c.status === 'ativo' ? '#1a3a2a' : '#2a1a1a', color: c.status === 'ativo' ? '#5cb85c' : '#e05a5a' }}>{c.status}</span>
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5, borderLeft: '2px solid #e8a838', paddingLeft: 10, marginBottom: 12 }}>{c.objetivo}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingTop: 8, borderTop: '1px solid #21262d' }}>
                <div style={{ textAlign: 'center' }}><div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{ns}</div><div style={{ fontSize: 10, color: '#7d8590' }}>Sessões</div></div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button style={S.btnSmall} onClick={() => setForm({ ...c })}>✎ Editar</button>
                <button style={{ ...S.btnSmall, color: '#e05a5a' }} onClick={() => updateClient(c.id, { status: c.status === 'ativo' ? 'inativo' : 'ativo' })}>
                  {c.status === 'ativo' ? 'Inativar' : 'Reativar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {form !== null && (
        <Modal title={form.id ? 'Editar' : 'Novo Mentorando'} onClose={() => setForm(null)}>
          <label style={S.label}>Nome *</label>
          <input style={S.input} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          <label style={S.label}>Telefone</label>
          <input style={S.input} value={form.telefone} onChange={(e) => setForm({ ...form, telefone: e.target.value })} />
          <label style={S.label}>E-mail</label>
          <input style={S.input} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <label style={S.label}>Objetivo / Demanda</label>
          <textarea style={S.textarea} value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} />
          <div style={S.modalActions}>
            <button style={S.btnSecondary} onClick={() => setForm(null)}>Cancelar</button>
            <button style={S.btnPrimary} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Prontuários ──────────────────────────────────────────────────────────────
function Prontuarios({ prontuarios, addPron, updatePron, clients, clienteById, addNotif }) {
  const [selected, setSelected] = useState(null);
  const [novaEv, setNovaEv] = useState({ sessao: '', pilar: '', texto: '' });
  const [formPron, setFormPron] = useState(null);
  const [gerando, setGerando] = useState('');

  useEffect(() => { if (!selected && prontuarios.length > 0) setSelected(prontuarios[0].id); }, [prontuarios]);

  const pron = prontuarios.find((p) => p.id === selected);
  const cliente = pron ? clienteById(pron.clienteId) : null;

  const salvar = (campo, valor) => pron && updatePron(pron.id, { [campo]: valor });

  const addEvolucao = async () => {
    if (!novaEv.texto.trim()) return addNotif('Informe o texto da evolução.', 'warn');
    await updatePron(pron.id, { evolucoes: [...(pron.evolucoes || []), { data: today(), ...novaEv }] });
    setNovaEv({ sessao: '', pilar: '', texto: '' });
    addNotif('Evolução registrada!', 'ok');
  };

  const savePron = async () => {
    if (!formPron.clienteId) return addNotif('Selecione um mentorando.', 'warn');
    if (formPron.id) { await updatePron(formPron.id, formPron); }
    else {
      const novo = { ...formPron, evolucoes: [], dataInicio: today(), dataFim: null, conclusao: '', versaoCliente: '' };
      await addPron(novo);
    }
    setFormPron(null);
    addNotif('Prontuário salvo!', 'ok');
  };

  const handlePDF = async (tipo) => {
    if (!pron || !cliente) return addNotif('Selecione um prontuário.', 'warn');
    setGerando(tipo);
    try { await gerarProntuarioPDF(pron, cliente, tipo); addNotif('PDF gerado!', 'ok'); }
    catch (e) { addNotif('Erro ao gerar PDF.', 'warn'); }
    setGerando('');
  };

  return (
    <div style={S.page}>
      <PageHeader title="Prontuários" sub={`${prontuarios.length} registros`}>
        <button style={S.btnPrimary} onClick={() => setFormPron({ clienteId: '', descricaoCaso: '', planoTerapeutico: '', pilaresTrabalho: [], pilarFoco: '', sessoesContratadas: 10, sessaoAtual: 1, metasEspecificas: '', recursosIndicados: '', tarefasEntreSessoes: '' })}>
          + Novo
        </button>
      </PageHeader>
      <div style={S.twoCol}>
        <div>
          {prontuarios.map((p) => {
            const c = clienteById(p.clienteId);
            return (
              <div key={p.id}
                style={{ ...S.listItem, cursor: 'pointer', padding: '10px 12px', borderRadius: 8, background: selected === p.id ? '#1a2235' : 'transparent', border: selected === p.id ? '1px solid #e8a838' : '1px solid transparent', marginBottom: 4 }}
                onClick={() => setSelected(p.id)}>
                <div style={S.avatar2}>{c?.nome?.[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={S.liName}>{c?.nome}</div>
                  <div style={S.liSub}>Sessão {p.sessaoAtual}/{p.sessoesContratadas} · {(p.evolucoes || []).length} evoluções</div>
                </div>
                <button style={S.btnSmall} onClick={(e) => { e.stopPropagation(); setFormPron({ ...p }); }}>✎</button>
              </div>
            );
          })}
          {prontuarios.length === 0 && <p style={S.empty}>Nenhum prontuário</p>}
        </div>

        {pron ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ ...S.card, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, color: '#7d8590', fontWeight: 700, alignSelf: 'center' }}>📄</span>
              <button style={S.btnExport} onClick={() => handlePDF('completo')} disabled={!!gerando}>{gerando === 'completo' ? 'Gerando…' : 'Prontuário Completo'}</button>
              <button style={{ ...S.btnExport, borderColor: '#4e9af1', color: '#4e9af1' }} onClick={() => handlePDF('cliente')} disabled={!!gerando}>{gerando === 'cliente' ? 'Gerando…' : 'Relatório p/ Mentorando'}</button>
            </div>

            <div style={S.card}>
              <h3 style={S.cardTitle}>Descrição do Caso</h3>
              <textarea style={S.textarea} value={pron.descricaoCaso || ''} onChange={(e) => salvar('descricaoCaso', e.target.value)} />
            </div>

            <div style={S.card}>
              <h3 style={S.cardTitle}>✦ Método Pais com Propósito</h3>
              <label style={S.label}>Pilares Trabalhados</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {PILARES.map((p) => {
                  const ativo = (pron.pilaresTrabalho || []).includes(p);
                  return (
                    <button key={p} style={{ ...S.pilarBtn, ...(ativo ? S.pilarActive : {}) }}
                      onClick={() => {
                        const lista = pron.pilaresTrabalho || [];
                        salvar('pilaresTrabalho', ativo ? lista.filter((x) => x !== p) : [...lista, p]);
                      }}>{p}</button>
                  );
                })}
              </div>
              <label style={S.label}>Pilar em Foco</label>
              <select style={S.input} value={pron.pilarFoco || ''} onChange={(e) => salvar('pilarFoco', e.target.value)}>
                <option value=''>Selecione…</option>
                {PILARES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
              <div style={S.twoColForm}>
                <div><label style={S.label}>Sessões Contratadas</label><input type='number' style={S.input} value={pron.sessoesContratadas || ''} onChange={(e) => salvar('sessoesContratadas', Number(e.target.value))} /></div>
                <div><label style={S.label}>Sessão Atual</label><input type='number' style={S.input} value={pron.sessaoAtual || ''} onChange={(e) => salvar('sessaoAtual', Number(e.target.value))} /></div>
              </div>
              <label style={S.label}>Metas Específicas</label>
              <textarea style={S.textarea} value={pron.metasEspecificas || ''} onChange={(e) => salvar('metasEspecificas', e.target.value)} placeholder="Ex: Reduzir conflitos, estabelecer ritual semanal…" />
              <label style={S.label}>Recursos Indicados</label>
              <textarea style={S.textarea} value={pron.recursosIndicados || ''} onChange={(e) => salvar('recursosIndicados', e.target.value)} placeholder="Livros, exercícios, vídeos…" />
              <label style={S.label}>Tarefas Entre Sessões</label>
              <textarea style={S.textarea} value={pron.tarefasEntreSessoes || ''} onChange={(e) => salvar('tarefasEntreSessoes', e.target.value)} placeholder="Exercícios práticos para casa…" />
            </div>

            <div style={S.card}>
              <h3 style={S.cardTitle}>Plano de Intervenção</h3>
              <textarea style={{ ...S.textarea, minHeight: 80 }} value={pron.planoTerapeutico || ''} onChange={(e) => salvar('planoTerapeutico', e.target.value)} />
            </div>

            <div style={S.card}>
              <h3 style={S.cardTitle}>Evoluções</h3>
              {(pron.evolucoes || []).map((ev, i) => (
                <div key={i} style={{ borderLeft: '2px solid #21262d', paddingLeft: 12, marginBottom: 14 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#e8a838', fontWeight: 700 }}>Sessão {ev.sessao || i + 1}</span>
                    <span style={{ fontSize: 11, color: '#7d8590' }}>{fmtDate(ev.data)}</span>
                    {ev.pilar && <span style={{ ...S.pill, background: '#1a2235', color: '#4e9af1', fontSize: 10 }}>{ev.pilar}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: '#c9d1d9', lineHeight: 1.6 }}>{ev.texto}</div>
                </div>
              ))}
              <div style={{ background: '#0d1117', borderRadius: 8, padding: 12, marginTop: 8 }}>
                <div style={S.twoColForm}>
                  <div><label style={S.label}>Nº Sessão</label><input type='number' style={S.input} value={novaEv.sessao} onChange={(e) => setNovaEv({ ...novaEv, sessao: e.target.value })} /></div>
                  <div><label style={S.label}>Pilar</label>
                    <select style={S.input} value={novaEv.pilar} onChange={(e) => setNovaEv({ ...novaEv, pilar: e.target.value })}>
                      <option value=''>Selecione…</option>
                      {PILARES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <label style={S.label}>Registro *</label>
                <textarea style={{ ...S.textarea, minHeight: 70 }} value={novaEv.texto} onChange={(e) => setNovaEv({ ...novaEv, texto: e.target.value })} placeholder="Avanços, dificuldades e observações da sessão…" />
                <button style={S.btnPrimary} onClick={addEvolucao}>+ Registrar</button>
              </div>
            </div>

            <div style={S.card}>
              <h3 style={S.cardTitle}>Conclusão / Alta</h3>
              <textarea style={S.textarea} value={pron.conclusao || ''} onChange={(e) => salvar('conclusao', e.target.value)} placeholder="Registro de conclusão ou encaminhamentos…" />
              <label style={S.label}>Mensagem para o relatório do mentorando</label>
              <textarea style={S.textarea} value={pron.versaoCliente || ''} onChange={(e) => salvar('versaoCliente', e.target.value)} placeholder="Mensagem de encorajamento personalizada…" />
            </div>
          </div>
        ) : (
          <div style={{ ...S.card, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
            <p style={S.empty}>Selecione um prontuário</p>
          </div>
        )}
      </div>

      {formPron !== null && (
        <Modal title={formPron.id ? 'Editar Prontuário' : 'Novo Prontuário'} onClose={() => setFormPron(null)}>
          <label style={S.label}>Mentorando *</label>
          <select style={S.input} value={formPron.clienteId} onChange={(e) => setFormPron({ ...formPron, clienteId: e.target.value })}>
            <option value=''>Selecione…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <label style={S.label}>Descrição do Caso</label>
          <textarea style={S.textarea} value={formPron.descricaoCaso} onChange={(e) => setFormPron({ ...formPron, descricaoCaso: e.target.value })} />
          <label style={S.label}>Plano de Intervenção</label>
          <textarea style={{ ...S.textarea, minHeight: 80 }} value={formPron.planoTerapeutico} onChange={(e) => setFormPron({ ...formPron, planoTerapeutico: e.target.value })} />
          <div style={S.twoColForm}>
            <div><label style={S.label}>Sessões Contratadas</label><input type='number' style={S.input} value={formPron.sessoesContratadas} onChange={(e) => setFormPron({ ...formPron, sessoesContratadas: Number(e.target.value) })} /></div>
            <div><label style={S.label}>Sessão Atual</label><input type='number' style={S.input} value={formPron.sessaoAtual} onChange={(e) => setFormPron({ ...formPron, sessaoAtual: Number(e.target.value) })} /></div>
          </div>
          <div style={S.modalActions}>
            <button style={S.btnSecondary} onClick={() => setFormPron(null)}>Cancelar</button>
            <button style={S.btnPrimary} onClick={savePron}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Agenda ───────────────────────────────────────────────────────────────────
function Agenda({ sessoes, addSessao, updateSessao, removeSessao, clients, clienteById, addFinanceiro, addNotif }) {
  const [form, setForm] = useState(null);
  const [filtroData, setFiltroData] = useState(today());

  const sessoesData = sessoes.filter((s) => !filtroData || s.data === filtroData)
    .sort((a, b) => a.hora?.localeCompare(b.hora));

  const save = async () => {
    if (!form.clienteId || !form.data || !form.hora) return addNotif('Preencha mentorando, data e horário.', 'warn');
    if (form.id) { await updateSessao(form.id, form); addNotif('Sessão atualizada!', 'ok'); }
    else { await addSessao({ ...form, status: 'agendado', pago: false }); addNotif('Sessão agendada!', 'ok'); }
    setForm(null);
  };

  const marcarRealizado = async (s) => {
    await updateSessao(s.id, { status: 'realizado' });
    addNotif(`Sessão de ${clienteById(s.clienteId)?.nome} marcada como realizada.`, 'ok');
  };

  return (
    <div style={S.page}>
      <PageHeader title="Agenda" sub={`${sessoesData.length} sessões`}>
        <button style={S.btnPrimary} onClick={() => setForm({ clienteId: '', data: today(), hora: '09:00', duracao: 60, modalidade: 'online', valor: 180, observacoes: '' })}>+ Agendar</button>
      </PageHeader>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <input type='date' style={{ ...S.input, width: 'auto' }} value={filtroData} onChange={(e) => setFiltroData(e.target.value)} />
        <button style={S.btnSecondary} onClick={() => setFiltroData(today())}>Hoje</button>
        <button style={S.btnSecondary} onClick={() => setFiltroData('')}>Todas</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sessoesData.map((s) => {
          const c = clienteById(s.clienteId);
          const sc = STATUS_COLORS[s.status] || STATUS_COLORS.agendado;
          return (
            <div key={s.id} style={S.sessaoCard}>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#e8a838', minWidth: 50 }}>{s.hora}</div>
              <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 2, background: sc.color, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e6edf3' }}>{c?.nome}</div>
                <div style={{ fontSize: 12, color: '#7d8590', marginTop: 2 }}>{fmtDate(s.data)} · {s.duracao}min · {s.modalidade} · {fmt(s.valor)}</div>
                {s.observacoes && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{s.observacoes}</div>}
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ ...S.pill, background: sc.bg, color: sc.color }}>{s.status}</span>
                {s.pago && <span style={{ ...S.pill, background: '#1a3a2a', color: '#5cb85c' }}>pago</span>}
                {s.status === 'agendado' && <button style={S.btnSmall} onClick={() => marcarRealizado(s)}>✓</button>}
                <button style={S.btnSmall} onClick={() => setForm({ ...s })}>✎</button>
                <button style={{ ...S.btnSmall, color: '#e05a5a' }} onClick={() => removeSessao(s.id)}>✕</button>
              </div>
            </div>
          );
        })}
        {sessoesData.length === 0 && <p style={S.empty}>Nenhuma sessão nesta data</p>}
      </div>
      {form !== null && (
        <Modal title={form.id ? 'Editar Sessão' : 'Nova Sessão'} onClose={() => setForm(null)}>
          <label style={S.label}>Mentorando *</label>
          <select style={S.input} value={form.clienteId} onChange={(e) => setForm({ ...form, clienteId: e.target.value })}>
            <option value=''>Selecione…</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
          <div style={S.twoColForm}>
            <div><label style={S.label}>Data *</label><input type='date' style={S.input} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
            <div><label style={S.label}>Horário *</label><input type='time' style={S.input} value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></div>
            <div><label style={S.label}>Duração (min)</label><input type='number' style={S.input} value={form.duracao} onChange={(e) => setForm({ ...form, duracao: Number(e.target.value) })} /></div>
            <div><label style={S.label}>Valor (R$)</label><input type='number' style={S.input} value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></div>
          </div>
          <label style={S.label}>Modalidade</label>
          <select style={S.input} value={form.modalidade} onChange={(e) => setForm({ ...form, modalidade: e.target.value })}>
            <option value='online'>Online</option><option value='presencial'>Presencial</option>
          </select>
          <label style={S.label}>Observações</label>
          <textarea style={S.textarea} value={form.observacoes} onChange={(e) => setForm({ ...form, observacoes: e.target.value })} />
          <div style={S.modalActions}>
            <button style={S.btnSecondary} onClick={() => setForm(null)}>Cancelar</button>
            <button style={S.btnPrimary} onClick={save}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Financeiro ───────────────────────────────────────────────────────────────
function Financeiro({ financeiro, addFinanceiro, sessoes, updateSessao, clienteById, totalRecebido, totalPendente, addNotif }) {
  const [form, setForm] = useState(null);
  const pendentes = sessoes.filter((s) => !s.pago && s.status === 'realizado');

  const registrarPagamento = async (s) => {
    await updateSessao(s.id, { pago: true });
    await addFinanceiro({ tipo: 'receita', descricao: `Sessão — ${clienteById(s.clienteId)?.nome}`, valor: s.valor, data: today(), categoria: 'mentoria', sessaoId: s.id });
    addNotif(`Pagamento de ${clienteById(s.clienteId)?.nome} confirmado!`, 'ok');
  };

  return (
    <div style={S.page}>
      <PageHeader title="Financeiro" sub="Controle de receitas">
        <button style={S.btnPrimary} onClick={() => setForm({ tipo: 'receita', descricao: '', valor: 0, data: today(), categoria: 'mentoria' })}>+ Lançamento</button>
      </PageHeader>
      <div style={S.statsGrid}>
        <StatCard icon="◈" label="Total Recebido" value={fmt(totalRecebido)} color="#5cb85c" />
        <StatCard icon="◧" label="A Receber" value={fmt(totalPendente)} color="#e8a838" />
        <StatCard icon="◉" label="Pendentes" value={pendentes.length} color="#4e9af1" />
      </div>
      {pendentes.length > 0 && (
        <div style={{ ...S.card, marginBottom: 20 }}>
          <h3 style={S.cardTitle}>Aguardando Pagamento</h3>
          {pendentes.map((s) => {
            const c = clienteById(s.clienteId);
            return (
              <div key={s.id} style={S.listItem}>
                <div style={S.avatar2}>{c?.nome?.[0]}</div>
                <div style={{ flex: 1 }}><div style={S.liName}>{c?.nome}</div><div style={S.liSub}>{fmtDate(s.data)} · {fmt(s.valor)}</div></div>
                <button style={{ ...S.btnSmall, background: '#1a3a2a', color: '#5cb85c' }} onClick={() => registrarPagamento(s)}>✓ Pago</button>
              </div>
            );
          })}
        </div>
      )}
      <div style={S.card}>
        <h3 style={S.cardTitle}>Extrato</h3>
        <table style={S.table}><thead><tr>{['Data', 'Descrição', 'Categoria', 'Valor'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr></thead>
          <tbody>{[...financeiro].reverse().map((f) => (
            <tr key={f.id} style={S.tr}>
              <td style={S.td}>{fmtDate(f.data)}</td>
              <td style={S.td}>{f.descricao}</td>
              <td style={S.td}>{f.categoria}</td>
              <td style={{ ...S.td, color: f.tipo === 'receita' ? '#5cb85c' : '#e05a5a', fontWeight: 700 }}>
                {f.tipo === 'receita' ? '+' : '−'}{fmt(f.valor)}
              </td>
            </tr>
          ))}</tbody>
        </table>
        {financeiro.length === 0 && <p style={S.empty}>Nenhum lançamento</p>}
      </div>
      {form !== null && (
        <Modal title="Novo Lançamento" onClose={() => setForm(null)}>
          <label style={S.label}>Tipo</label>
          <select style={S.input} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
            <option value='receita'>Receita</option><option value='despesa'>Despesa</option>
          </select>
          <label style={S.label}>Descrição</label>
          <input style={S.input} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
          <div style={S.twoColForm}>
            <div><label style={S.label}>Valor (R$)</label><input type='number' style={S.input} value={form.valor} onChange={(e) => setForm({ ...form, valor: Number(e.target.value) })} /></div>
            <div><label style={S.label}>Data</label><input type='date' style={S.input} value={form.data} onChange={(e) => setForm({ ...form, data: e.target.value })} /></div>
          </div>
          <div style={S.modalActions}>
            <button style={S.btnSecondary} onClick={() => setForm(null)}>Cancelar</button>
            <button style={S.btnPrimary} onClick={async () => { await addFinanceiro({ ...form }); setForm(null); addNotif('Lançamento salvo!', 'ok'); }}>Salvar</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Documentos ───────────────────────────────────────────────────────────────
function Documentos({ clients, sessoes, prontuarios, clienteById, addNotif }) {
  const [clienteSel, setClienteSel] = useState('');
  const [sessSel, setSessSel] = useState('');
  const [gerando, setGerando] = useState('');

  const c = clients.find((x) => x.id === clienteSel);
  const s = sessoes.find((x) => x.id === sessSel);
  const sessoesCliente = sessoes.filter((x) => x.clienteId === clienteSel);
  const pron = prontuarios.find((x) => x.clienteId === clienteSel);

  const gerar = async (tipo) => {
    setGerando(tipo);
    try {
      if (tipo === 'recibo') { if (!c || !s) return addNotif('Selecione mentorando e sessão.', 'warn'); await gerarRecibo(s, c); }
      else if (tipo === 'contrato') { if (!c) return addNotif('Selecione um mentorando.', 'warn'); await gerarContrato(c, sessoes); }
      else if (tipo === 'prontuario') { if (!c || !pron) return addNotif('Prontuário não encontrado.', 'warn'); await gerarProntuarioPDF(pron, c, 'completo'); }
      else if (tipo === 'relatorio') { if (!c || !pron) return addNotif('Prontuário não encontrado.', 'warn'); await gerarProntuarioPDF(pron, c, 'cliente'); }
      addNotif('PDF baixado com sucesso!', 'ok');
    } catch (e) { addNotif('Erro ao gerar PDF.', 'warn'); }
    setGerando('');
  };

  return (
    <div style={S.page}>
      <PageHeader title="Documentos" sub="Emissão de PDFs profissionais" />
      <div style={{ ...S.card, marginBottom: 20 }}>
        <h3 style={S.cardTitle}>Selecionar</h3>
        <label style={S.label}>Mentorando</label>
        <select style={S.input} value={clienteSel} onChange={(e) => { setClienteSel(e.target.value); setSessSel(''); }}>
          <option value=''>Selecione…</option>
          {clients.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
        </select>
        {clienteSel && (<>
          <label style={S.label}>Sessão (para recibo)</label>
          <select style={S.input} value={sessSel} onChange={(e) => setSessSel(e.target.value)}>
            <option value=''>Selecione a sessão…</option>
            {sessoesCliente.map((s) => <option key={s.id} value={s.id}>{fmtDate(s.data)} às {s.hora} — {fmt(s.valor)}</option>)}
          </select>
        </>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 14 }}>
        {[
          { tipo: 'recibo', icon: '📄', titulo: 'Recibo de Pagamento', desc: 'Com CNPJ, valor e dados da sessão.', cor: '#e8a838' },
          { tipo: 'contrato', icon: '📝', titulo: 'Contrato de Serviços', desc: 'Contrato formal com cláusulas e assinatura.', cor: '#4e9af1' },
          { tipo: 'prontuario', icon: '🗂️', titulo: 'Prontuário Completo', desc: 'Documento interno completo do mentor.', cor: '#9b59b6' },
          { tipo: 'relatorio', icon: '📊', titulo: 'Relatório do Mentorando', desc: 'Versão motivacional para o cliente.', cor: '#5cb85c' },
        ].map((d) => (
          <div key={d.tipo} style={{ ...S.card, borderTop: `3px solid ${d.cor}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{d.icon}</div>
            <div style={{ fontWeight: 800, color: '#e6edf3', fontSize: 13, marginBottom: 6 }}>{d.titulo}</div>
            <div style={{ fontSize: 11, color: '#7d8590', lineHeight: 1.5, flex: 1, marginBottom: 14 }}>{d.desc}</div>
            <button style={{ ...S.btnPrimary, background: d.cor, color: '#0d1117', opacity: gerando === d.tipo ? 0.6 : 1 }}
              onClick={() => gerar(d.tipo)} disabled={!!gerando}>
              {gerando === d.tipo ? 'Gerando…' : 'Gerar PDF'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Componentes auxiliares ───────────────────────────────────────────────────
function PageHeader({ title, sub, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
      <div><h1 style={S.pageTitle}>{title}</h1><p style={S.pageSub}>{sub}</p></div>
      <div style={{ display: 'flex', gap: 8 }}>{children}</div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.modalBox} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px 14px', borderBottom: '1px solid #21262d' }}>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#e6edf3', margin: 0 }}>{title}</h2>
          <button style={{ background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', fontSize: 16 }} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '16px 22px 22px', overflowY: 'auto', maxHeight: '70vh' }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const S = {
  root: { display: 'flex', height: '100vh', background: '#0d1117', color: '#e6edf3', fontFamily: "'DM Sans','Segoe UI',sans-serif", overflow: 'hidden' },
  notifWrap: { position: 'fixed', top: 16, right: 16, zIndex: 999, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' },
  notif: { padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'all', boxShadow: '0 4px 20px rgba(0,0,0,.4)', minWidth: 240 },
  nInfo: { background: '#1a2a3a', border: '1px solid #4e9af1', color: '#e6edf3' },
  nWarn: { background: '#2a2010', border: '1px solid #e8a838', color: '#e8a838' },
  nOk: { background: '#1a3020', border: '1px solid #5cb85c', color: '#5cb85c' },
  notifX: { marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 13 },
  sidebar: { width: 220, background: '#161b22', borderRight: '1px solid #21262d', display: 'flex', flexDirection: 'column', flexShrink: 0, '@media(max-width:640px)': { display: 'none' } },
  brand: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 16px 24px', borderBottom: '1px solid #21262d' },
  brandName: { fontWeight: 800, fontSize: 14, color: '#e6edf3' },
  brandSub: { fontSize: 10, color: '#7d8590' },
  nav: { flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 },
  navBtn: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', borderRadius: 8, fontSize: 13, fontWeight: 500, width: '100%', textAlign: 'left' },
  navActive: { background: '#1f2937', color: '#e8a838' },
  navIcon: { fontSize: 16, width: 20, textAlign: 'center' },
  sidebarFoot: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderTop: '1px solid #21262d' },
  avatar: { width: 32, height: 32, borderRadius: '50%', background: '#e8a838', color: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 14, flexShrink: 0 },
  avatar2: { width: 34, height: 34, borderRadius: '50%', background: '#21262d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#e8a838', flexShrink: 0 },
  logoutBtn: { background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', fontSize: 16 },
  mobileNav: { display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, background: '#161b22', borderTop: '1px solid #21262d', zIndex: 50, '@media(max-width:640px)': { display: 'flex' } },
  mobileNavBtn: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '8px 4px', background: 'none', border: 'none', color: '#7d8590', cursor: 'pointer', gap: 2 },
  mobileNavActive: { color: '#e8a838' },
  main: { flex: 1, overflow: 'auto', paddingBottom: 70 },
  page: { padding: '24px 24px', maxWidth: 1100, margin: '0 auto' },
  pageTitle: { fontSize: 22, fontWeight: 800, color: '#e6edf3', margin: 0 },
  pageSub: { fontSize: 13, color: '#7d8590', margin: '4px 0 0' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 12, marginBottom: 24 },
  statCard: { background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '14px 16px' },
  statVal: { fontSize: 20, fontWeight: 800, color: '#e6edf3', marginBottom: 2 },
  statLbl: { fontSize: 11, color: '#7d8590' },
  twoCol: { display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 20 },
  card: { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: '18px 20px' },
  cardTitle: { fontSize: 11, fontWeight: 700, color: '#7d8590', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, marginTop: 0 },
  listItem: { display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #21262d' },
  liName: { fontSize: 14, fontWeight: 600, color: '#e6edf3' },
  liSub: { fontSize: 12, color: '#7d8590', marginTop: 2 },
  pill: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, whiteSpace: 'nowrap' },
  empty: { color: '#7d8590', fontSize: 13, textAlign: 'center', padding: '24px 0', margin: 0 },
  searchInput: { width: '100%', background: '#161b22', border: '1px solid #21262d', color: '#e6edf3', borderRadius: 8, padding: '9px 14px', fontSize: 14, marginBottom: 20, boxSizing: 'border-box', outline: 'none' },
  clientGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 16 },
  clientCard: { background: '#161b22', border: '1px solid #21262d', borderRadius: 12, padding: 16 },
  sessaoCard: { background: '#161b22', border: '1px solid #21262d', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { textAlign: 'left', color: '#7d8590', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, padding: '8px 12px', borderBottom: '1px solid #21262d' },
  tr: { borderBottom: '1px solid #21262d' },
  td: { padding: '10px 12px', color: '#c9d1d9' },
  input: { width: '100%', background: '#0d1117', border: '1px solid #21262d', color: '#e6edf3', borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', marginBottom: 4, boxSizing: 'border-box' },
  textarea: { width: '100%', background: '#0d1117', border: '1px solid #21262d', color: '#e6edf3', borderRadius: 7, padding: '8px 12px', fontSize: 13, outline: 'none', resize: 'vertical', minHeight: 70, fontFamily: 'inherit', marginBottom: 4, boxSizing: 'border-box' },
  label: { fontSize: 12, color: '#7d8590', fontWeight: 700, display: 'block', marginBottom: 4, marginTop: 10 },
  twoColForm: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 },
  btnPrimary: { background: '#e8a838', color: '#0d1117', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' },
  btnSecondary: { background: '#21262d', color: '#e6edf3', border: '1px solid #30363d', borderRadius: 8, padding: '9px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' },
  btnSmall: { background: '#21262d', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: 6, padding: '5px 10px', fontSize: 12, cursor: 'pointer' },
  btnExport: { background: '#21262d', color: '#e8a838', border: '1px solid #e8a838', borderRadius: 7, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' },
  pilarBtn: { background: '#21262d', color: '#7d8590', border: '1px solid #30363d', borderRadius: 20, padding: '4px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 },
  pilarActive: { background: '#2a1f08', color: '#e8a838', border: '1px solid #e8a838' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modalBox: { background: '#161b22', border: '1px solid #30363d', borderRadius: 14, width: '100%', maxWidth: 520, maxHeight: '92vh', overflow: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,.5)' },
  modalActions: { display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
};
