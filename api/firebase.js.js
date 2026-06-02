// api/firebase.js — Vercel Serverless Function
// Intermediário seguro entre Claude e Firebase

const { initializeApp, getApps, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Inicializar Firebase Admin (uma única vez)
function getDb() {
  if (!getApps().length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({ credential: cert(serviceAccount) });
  }
  return getFirestore();
}

// CORS
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Content-Type': 'application/json',
};

// Verificar token de segurança
function autenticar(req) {
  const token = req.headers['x-claude-token'] || req.query.token;
  return token === process.env.CLAUDE_API_TOKEN;
}

module.exports = async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') return res.status(200).setHeaders(headers).end();

  // Autenticação
  if (!autenticar(req)) {
    return res.status(401).json({ erro: 'Token inválido' });
  }

  const db = getDb();
  const { action, colecao, id, dados, query: q } = req.body || req.query;

  try {
    // ── LISTAR documentos ────────────────────────────────────────────────────
    if (action === 'listar') {
      const snap = await db.collection(colecao).get();
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.status(200).json({ ok: true, dados: docs, total: docs.length });
    }

    // ── BUSCAR documento por ID ──────────────────────────────────────────────
    if (action === 'buscar') {
      const doc = await db.collection(colecao).doc(id).get();
      if (!doc.exists) return res.status(404).json({ erro: 'Não encontrado' });
      return res.status(200).json({ ok: true, dados: { id: doc.id, ...doc.data() } });
    }

    // ── CRIAR documento ──────────────────────────────────────────────────────
    if (action === 'criar') {
      const ref = await db.collection(colecao).add({
        ...dados,
        createdAt: FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ ok: true, id: ref.id });
    }

    // ── ATUALIZAR documento ──────────────────────────────────────────────────
    if (action === 'atualizar') {
      await db.collection(colecao).doc(id).update({
        ...dados,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ ok: true });
    }

    // ── ADICIONAR EVOLUÇÃO (merge em array) ──────────────────────────────────
    if (action === 'addEvolucao') {
      await db.collection('prontuarios').doc(id).update({
        evolucoes: FieldValue.arrayUnion(dados),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return res.status(200).json({ ok: true });
    }

    // ── IMPORTAR caso completo (anamnese + prontuário no formato Thiago) ─────
    if (action === 'importarCaso') {
      const caso = dados;
      const anamnese = caso.anamnese || {};
      const pron = caso.prontuario || {};
      const ident = anamnese.identificacao || {};
      const disp = anamnese.disponibilidadeLogistica || {};
      const plano = pron.planoIntervencao || {};

      // 1. Criar cliente
      const clienteRef = await db.collection('clientes').add({
        nome: caso.nome || ident.nomeCompleto || 'Sem nome',
        telefone: ident.telefone || caso.telefone || '',
        email: ident.email || caso.email || '',
        objetivo: caso.objetivo || pron.identificacao?.objetivoCentral || '',
        status: 'ativo',
        dataCadastro: pron.identificacao?.dataInicio || new Date().toISOString().split('T')[0],
        cidade: ident.enderecoCidade || '',
        estadoCivil: ident.estadoCivil || '',
        profissao: ident.profissao || '',
        configuracaoFamiliar: anamnese.contextoFamiliar?.configuracaoFamiliar || '',
        createdAt: FieldValue.serverTimestamp(),
      });

      // 2. Construir evoluções das sessões
      const evolucoes = (pron.sessoes || []).map(s => ({
        sessao: String(s.numero),
        data: s.data,
        pilar: s.pilarTrabalhado || '',
        objetivo: s.objetivo || '',
        texto: [
          s.registroEvolucao,
          s.tarefa ? `\n\nTarefa: ${s.tarefa}` : '',
          s.feedbackMentorando ? `\n\nFeedback: ${s.feedbackMentorando}` : '',
        ].filter(Boolean).join(''),
        tarefa: s.tarefa || '',
        feedback: s.feedbackMentorando || '',
      }));

      // 3. Criar prontuário completo
      await db.collection('prontuarios').add({
        clienteId: clienteRef.id,
        // Dados clínicos
        descricaoCaso: plano.descricaoCaso || '',
        planoTerapeutico: plano.metasEspecificas || '',
        pilaresTrabalho: pron.pilaresTrabalho || caso.pilaresTrabalho || [],
        pilarFoco: pron.pilarPrincipal || '',
        sessoesContratadas: pron.identificacao?.totalSessoesContratadas || disp.sessoes || 10,
        sessaoAtual: evolucoes.filter(e => e.texto).length || 1,
        metasEspecificas: plano.metasEspecificas || '',
        recursosIndicados: plano.recursosLeituras || '',
        tarefasEntreSessoes: '',
        evolucoes,
        conclusao: pron.conclusao?.sintese || '',
        versaoCliente: '',
        dataInicio: pron.identificacao?.dataInicio || '',
        dataFim: null,
        // Dados da anamnese
        anamnese: {
          estiloParental: anamnese.historicoEstiloParental?.estiloAtual || '',
          maioresDesafios: anamnese.historicoEstiloParental?.maioresDesafios || '',
          historicoPais: anamnese.historicoEstiloParental?.relacaoComProprioPais || '',
          historicoTraumas: anamnese.historicoEstiloParental?.historicoDeTroumasPerdas || '',
          demandaPrincipal: anamnese.demandaPrincipal?.porqueBuscouMentoria || '',
          expectativas: anamnese.demandaPrincipal?.oQueEsperaAlcancar || '',
          avaliacaoInicial: anamnese.autoavaliacao?.pilares || {},
        },
        createdAt: FieldValue.serverTimestamp(),
      });

      // 4. Criar sessões na agenda
      for (const s of (pron.sessoes || [])) {
        await db.collection('sessoes').add({
          clienteId: clienteRef.id,
          data: s.data,
          hora: disp.horarioPreferido?.includes('14') ? '14:00' : '09:00',
          duracao: 60,
          modalidade: s.modalidade?.toLowerCase().includes('presencial') ? 'presencial' : 'online',
          valor: disp.valorPorSessao || 0,
          status: s.registroEvolucao ? 'realizado' : 'agendado',
          pago: !!s.registroEvolucao,
          observacoes: `Sessão ${s.numero} — ${s.pilarTrabalhado}`,
          pilar: s.pilarTrabalhado || '',
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // 5. Criar lançamentos financeiros das sessões realizadas
      for (const s of (pron.sessoes || []).filter(s => s.registroEvolucao)) {
        await db.collection('financeiro').add({
          tipo: 'receita',
          descricao: `Sessão ${s.numero} — ${caso.nome || ident.nomeCompleto}`,
          valor: disp.valorPorSessao || 0,
          data: s.data,
          categoria: 'mentoria',
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      return res.status(200).json({
        ok: true,
        clienteId: clienteRef.id,
        mensagem: `Caso importado: ${(pron.sessoes || []).length} sessões, ${evolucoes.filter(e => e.texto).length} evoluções registradas.`,
      });
    }

    // ── ATUALIZAR SESSÃO (relato pós-atendimento) ────────────────────────────
    if (action === 'relatarSessao') {
      const { prontuarioId, sessaoNum, evolucao, tarefa, feedback } = dados;

      // Adicionar evolução ao prontuário
      await db.collection('prontuarios').doc(prontuarioId).update({
        evolucoes: FieldValue.arrayUnion({
          sessao: String(sessaoNum),
          data: new Date().toISOString().split('T')[0],
          pilar: dados.pilar || '',
          objetivo: dados.objetivo || '',
          texto: evolucao || '',
          tarefa: tarefa || '',
          feedback: feedback || '',
        }),
        sessaoAtual: sessaoNum,
        updatedAt: FieldValue.serverTimestamp(),
      });

      // Marcar sessão como realizada
      if (dados.sessaoId) {
        await db.collection('sessoes').doc(dados.sessaoId).update({
          status: 'realizado',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }

      return res.status(200).json({ ok: true, mensagem: 'Sessão registrada com sucesso.' });
    }

    // ── ENVIAR WHATSAPP (gerar link) ─────────────────────────────────────────
    if (action === 'whatsapp') {
      const { telefone, mensagem } = dados;
      const num = telefone.replace(/\D/g, '');
      const link = `https://wa.me/55${num}?text=${encodeURIComponent(mensagem)}`;
      return res.status(200).json({ ok: true, link });
    }

    return res.status(400).json({ erro: 'Action inválida.' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: err.message });
  }
};
