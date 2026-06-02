// src/components/Importar.js
import React, { useState } from 'react';
import { claudeAPI } from '../hooks/useClaude';

const PILARES = [
  '1. Identidade Parental','2. Comunicação com Propósito',
  '3. Vínculos e Afeto','4. Limites com Amor',
  '5. Disciplina Consciente','6. Legado e Valores',
];

const today = () => new Date().toISOString().split('T')[0];
const fmtDate = (d) => d ? new Date(d+'T12:00').toLocaleDateString('pt-BR') : '—';
const fmt = (v) => v != null ? v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'}) : '—';

const S = {
  page: { padding:'24px', maxWidth:1100, margin:'0 auto' },
  card: { background:'#161b22', border:'1px solid #21262d', borderRadius:12, padding:'18px 20px', marginBottom:16 },
  cardTitle: { fontSize:11, fontWeight:700, color:'#7d8590', textTransform:'uppercase', letterSpacing:1, marginBottom:14, marginTop:0 },
  label: { fontSize:12, color:'#7d8590', fontWeight:700, display:'block', marginBottom:4, marginTop:10 },
  input: { width:'100%', background:'#0d1117', border:'1px solid #21262d', color:'#e6edf3', borderRadius:7, padding:'8px 12px', fontSize:13, outline:'none', marginBottom:4, boxSizing:'border-box' },
  textarea: { width:'100%', background:'#0d1117', border:'1px solid #21262d', color:'#e6edf3', borderRadius:7, padding:'8px 12px', fontSize:13, outline:'none', resize:'vertical', minHeight:70, fontFamily:'inherit', marginBottom:4, boxSizing:'border-box' },
  btnPrimary: { background:'#e8a838', color:'#0d1117', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer' },
  btnSecondary: { background:'#21262d', color:'#e6edf3', border:'1px solid #30363d', borderRadius:8, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },
  btnSmall: { background:'#21262d', color:'#c9d1d9', border:'1px solid #30363d', borderRadius:6, padding:'5px 10px', fontSize:12, cursor:'pointer' },
  pill: { fontSize:11, fontWeight:600, padding:'3px 8px', borderRadius:20 },
  empty: { color:'#7d8590', fontSize:13, textAlign:'center', padding:'24px 0', margin:0 },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  pilarBtn: { background:'#21262d', color:'#7d8590', border:'1px solid #30363d', borderRadius:20, padding:'4px 12px', fontSize:11, cursor:'pointer', fontWeight:600 },
  pilarActive: { background:'#2a1f08', color:'#e8a838', border:'1px solid #e8a838' },
};

export default function Importar({ addNotif, onImportado }) {
  const [modo, setModo] = useState('json'); // 'json' | 'manual'
  const [arquivo, setArquivo] = useState(null);
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Modo manual
  const [form, setForm] = useState({
    nome:'', telefone:'', email:'', objetivo:'', cidade:'',
    prontuario:{
      descricaoCaso:'', planoTerapeutico:'', pilaresTrabalho:[],
      pilarFoco:'', sessoesContratadas:10, sessaoAtual:1,
      metasEspecificas:'', recursosIndicados:'', tarefasEntreSessoes:'',
      dataInicio: today(),
    },
  });

  // ── Detectar formato do JSON ──────────────────────────────────────────────
  const detectarFormato = (data) => {
    if (data.anamnese && data.prontuario) return 'thiago'; // formato detalhado
    if (Array.isArray(data)) return 'array';               // formato padrão array
    if (data.nome || data.nomeCompleto) return 'objeto';   // objeto único padrão
    return 'desconhecido';
  };

  const handleFile = (e) => {
    setErro(''); setPreview(null); setSucesso('');
    const file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) return setErro('Selecione um arquivo .json');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        const formato = detectarFormato(data);
        setPreview({ data, formato, fileName: file.name });
      } catch { setErro('JSON inválido. Verifique o arquivo.'); }
    };
    reader.readAsText(file);
  };

  // ── Importar via API (formato Thiago — anamnese+prontuário) ──────────────
  const importarFormatoThiago = async (data) => {
    const resp = await claudeAPI.importarCaso(data);
    return resp;
  };

  // ── Importar via Firebase direto (formato padrão array) ──────────────────
  const importarFormatoPadrao = async (arr) => {
    const lista = Array.isArray(arr) ? arr : [arr];
    let total = 0;
    for (const item of lista) {
      await claudeAPI.importarCaso({
        nome: item.nome,
        telefone: item.telefone || '',
        email: item.email || '',
        objetivo: item.objetivo || '',
        prontuario: {
          identificacao: { dataInicio: item.prontuario?.dataInicio || today(), totalSessoesContratadas: item.prontuario?.sessoesContratadas || 10 },
          pilaresTrabalho: item.prontuario?.pilaresTrabalho || [],
          pilarPrincipal: item.prontuario?.pilarFoco || '',
          planoIntervencao: {
            descricaoCaso: item.prontuario?.descricaoCaso || '',
            metasEspecificas: item.prontuario?.metasEspecificas || '',
            recursosLeituras: item.prontuario?.recursosIndicados || '',
          },
          sessoes: (item.sessoes || []).map((s, i) => ({
            numero: i+1, data: s.data, pilarTrabalhado: s.pilar || '',
            modalidade: s.modalidade || 'online',
            objetivo: s.observacoes || '',
            registroEvolucao: s.pago ? s.observacoes : '',
            tarefa: '', feedbackMentorando: '',
          })),
          conclusao: { sintese: '' },
        },
        anamnese: {
          identificacao: { nomeCompleto: item.nome, telefone: item.telefone||'', email: item.email||'' },
          disponibilidadeLogistica: { valorPorSessao: item.sessoes?.[0]?.valor || 0 },
        },
      });
      total++;
    }
    return { mensagem: `${total} mentorando(s) importado(s).` };
  };

  const executarImport = async () => {
    if (!preview) return;
    setImporting(true); setErro(''); setSucesso('');
    try {
      let resp;
      if (preview.formato === 'thiago') {
        resp = await importarFormatoThiago(preview.data);
      } else {
        resp = await importarFormatoPadrao(preview.data);
      }
      setSucesso(resp.mensagem || 'Importado com sucesso!');
      addNotif('✅ ' + (resp.mensagem || 'Importado com sucesso!'), 'ok');
      setPreview(null);
      if (onImportado) onImportado();
    } catch(e) {
      setErro('Erro: ' + e.message);
      addNotif('Erro na importação: ' + e.message, 'warn');
    }
    setImporting(false);
  };

  const importarManual = async () => {
    if (!form.nome) return addNotif('Nome é obrigatório.', 'warn');
    setImporting(true);
    try {
      await claudeAPI.importarCaso({
        nome: form.nome, telefone: form.telefone,
        email: form.email, objetivo: form.objetivo,
        anamnese: {
          identificacao: { nomeCompleto: form.nome, telefone: form.telefone, email: form.email, enderecoCidade: form.cidade },
          disponibilidadeLogistica: { valorPorSessao: 0, sessoes: form.prontuario.sessoesContratadas },
        },
        prontuario: {
          identificacao: { dataInicio: form.prontuario.dataInicio, totalSessoesContratadas: form.prontuario.sessoesContratadas },
          pilaresTrabalho: form.prontuario.pilaresTrabalho,
          pilarPrincipal: form.prontuario.pilarFoco,
          planoIntervencao: {
            descricaoCaso: form.prontuario.descricaoCaso,
            metasEspecificas: form.prontuario.metasEspecificas,
            recursosLeituras: form.prontuario.recursosIndicados,
          },
          sessoes: [],
          conclusao: { sintese: '' },
        },
      });
      addNotif(`${form.nome} cadastrado com sucesso!`, 'ok');
      setForm({ nome:'', telefone:'', email:'', objetivo:'', cidade:'', prontuario:{ descricaoCaso:'', planoTerapeutico:'', pilaresTrabalho:[], pilarFoco:'', sessoesContratadas:10, sessaoAtual:1, metasEspecificas:'', recursosIndicados:'', tarefasEntreSessoes:'', dataInicio:today() } });
      if (onImportado) onImportado();
    } catch(e) { addNotif('Erro: ' + e.message, 'warn'); }
    setImporting(false);
  };

  return (
    <div style={S.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#e6edf3', margin:0 }}>Importar Dados</h1>
          <p style={{ fontSize:13, color:'#7d8590', margin:'4px 0 0' }}>Importe casos no formato JSON ou cadastre manualmente</p>
        </div>
      </div>

      {/* Tabs de modo */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['json','📂 Importar JSON'],['manual','✎ Cadastro Manual']].map(([id,label]) => (
          <button key={id} style={{ ...S.btnSecondary, ...(modo===id ? { background:'#e8a838', color:'#0d1117', border:'1px solid #e8a838' } : {}) }}
            onClick={() => setModo(id)}>{label}</button>
        ))}
      </div>

      {/* ── Modo JSON ── */}
      {modo === 'json' && (
        <div style={S.grid2}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={S.card}>
              <h3 style={S.cardTitle}>Selecionar arquivo JSON</h3>
              <p style={{ fontSize:13, color:'#9ca3af', lineHeight:1.6, marginTop:0 }}>
                Aceita dois formatos:<br/>
                <strong style={{ color:'#e8a838' }}>① Formato detalhado</strong> — anamnese + prontuário (como o arquivo do caso Henrique)<br/>
                <strong style={{ color:'#4e9af1' }}>② Formato padrão</strong> — array de mentorandos
              </p>
              <input type="file" accept=".json" onChange={handleFile} style={{ display:'none' }} id="json-upload" />
              <label htmlFor="json-upload" style={{ ...S.btnPrimary, display:'inline-block', cursor:'pointer', marginTop:8 }}>
                📁 Escolher arquivo .json
              </label>
              {erro && <div style={{ background:'#2a1010', border:'1px solid #e05a5a', color:'#e05a5a', borderRadius:8, padding:'10px 14px', fontSize:13, marginTop:12 }}>⚠️ {erro}</div>}
              {sucesso && <div style={{ background:'#1a3020', border:'1px solid #5cb85c', color:'#5cb85c', borderRadius:8, padding:'10px 14px', fontSize:13, marginTop:12 }}>✅ {sucesso}</div>}
            </div>

            {preview && (
              <div style={S.card}>
                <h3 style={S.cardTitle}>Pré-visualização</h3>
                <div style={{ background:'#0d1117', borderRadius:8, padding:14, marginBottom:12 }}>
                  <div style={{ fontSize:12, color:'#7d8590', marginBottom:8 }}>
                    Arquivo: <span style={{ color:'#e8a838' }}>{preview.fileName}</span><br/>
                    Formato detectado: <span style={{ color: preview.formato==='thiago' ? '#e8a838' : '#4e9af1' }}>
                      {preview.formato==='thiago' ? '① Anamnese + Prontuário detalhado' : '② Formato padrão'}
                    </span>
                  </div>
                  {preview.formato === 'thiago' && (
                    <div style={{ fontSize:13, color:'#c9d1d9', lineHeight:1.8 }}>
                      <strong style={{ color:'#e8a838' }}>{preview.data.nome || preview.data.anamnese?.identificacao?.nomeCompleto}</strong><br/>
                      🎯 {preview.data.objetivo?.slice(0,80)}…<br/>
                      📅 {preview.data.prontuario?.sessoes?.length || 0} sessões<br/>
                      📋 {preview.data.prontuario?.planoIntervencao?.descricaoCaso?.slice(0,60)}…
                    </div>
                  )}
                  {preview.formato !== 'thiago' && (
                    <div style={{ fontSize:13, color:'#c9d1d9' }}>
                      {(Array.isArray(preview.data) ? preview.data : [preview.data]).map((item,i) => (
                        <div key={i}><strong style={{ color:'#e8a838' }}>{item.nome}</strong> — {item.objetivo?.slice(0,50)}…</div>
                      ))}
                    </div>
                  )}
                </div>
                <button style={{ ...S.btnPrimary, width:'100%', opacity: importing ? 0.6 : 1 }}
                  onClick={executarImport} disabled={importing}>
                  {importing ? '⏳ Importando...' : '✅ Confirmar e Importar'}
                </button>
              </div>
            )}
          </div>

          {/* Modelo para download */}
          <div style={S.card}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
              <h3 style={{ ...S.cardTitle, margin:0 }}>Modelo JSON (formato detalhado)</h3>
              <button style={{ ...S.btnSmall, color:'#e8a838', border:'1px solid #e8a838' }}
                onClick={() => {
                  const modelo = JSON.stringify(MODELO_JSON, null, 2);
                  const blob = new Blob([modelo], { type:'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'modelo_caso.json'; a.click();
                }}>⬇ Baixar Modelo</button>
            </div>
            <pre style={{ fontSize:10, color:'#7d8590', background:'#0d1117', borderRadius:8, padding:12, overflow:'auto', maxHeight:400, lineHeight:1.6, margin:0 }}>
              {JSON.stringify(MODELO_JSON, null, 2).slice(0, 1200)}…
            </pre>
          </div>
        </div>
      )}

      {/* ── Modo Manual ── */}
      {modo === 'manual' && (
        <div style={S.grid2}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Dados do Mentorando</h3>
            <label style={S.label}>Nome completo *</label>
            <input style={S.input} value={form.nome} onChange={e => setForm({...form, nome:e.target.value})} />
            <label style={S.label}>Telefone</label>
            <input style={S.input} value={form.telefone} onChange={e => setForm({...form, telefone:e.target.value})} />
            <label style={S.label}>E-mail</label>
            <input style={S.input} value={form.email} onChange={e => setForm({...form, email:e.target.value})} />
            <label style={S.label}>Cidade</label>
            <input style={S.input} value={form.cidade} onChange={e => setForm({...form, cidade:e.target.value})} />
            <label style={S.label}>Objetivo / Demanda principal</label>
            <textarea style={S.textarea} value={form.objetivo} onChange={e => setForm({...form, objetivo:e.target.value})} />
          </div>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Prontuário Inicial</h3>
            <label style={S.label}>Pilares a trabalhar</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {PILARES.map(p => {
                const ativo = form.prontuario.pilaresTrabalho.includes(p);
                return (
                  <button key={p} style={{ ...S.pilarBtn, ...(ativo ? S.pilarActive : {}) }}
                    onClick={() => {
                      const lista = form.prontuario.pilaresTrabalho;
                      setForm({...form, prontuario:{...form.prontuario, pilaresTrabalho: ativo ? lista.filter(x=>x!==p) : [...lista,p]}});
                    }}>{p}</button>
                );
              })}
            </div>
            <label style={S.label}>Descrição do Caso</label>
            <textarea style={S.textarea} value={form.prontuario.descricaoCaso} onChange={e => setForm({...form, prontuario:{...form.prontuario, descricaoCaso:e.target.value}})} />
            <label style={S.label}>Metas Específicas</label>
            <textarea style={S.textarea} value={form.prontuario.metasEspecificas} onChange={e => setForm({...form, prontuario:{...form.prontuario, metasEspecificas:e.target.value}})} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div>
                <label style={S.label}>Data de início</label>
                <input type="date" style={S.input} value={form.prontuario.dataInicio} onChange={e => setForm({...form, prontuario:{...form.prontuario, dataInicio:e.target.value}})} />
              </div>
              <div>
                <label style={S.label}>Sessões contratadas</label>
                <input type="number" style={S.input} value={form.prontuario.sessoesContratadas} onChange={e => setForm({...form, prontuario:{...form.prontuario, sessoesContratadas:Number(e.target.value)}})} />
              </div>
            </div>
            <button style={{ ...S.btnPrimary, width:'100%', marginTop:12, opacity: importing ? 0.6:1 }}
              onClick={importarManual} disabled={importing}>
              {importing ? '⏳ Salvando...' : '✅ Cadastrar Mentorando'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Modelo JSON para download ─────────────────────────────────────────────────
const MODELO_JSON = {
  nome: "Nome do Mentorando",
  telefone: "(11) 99999-0000",
  email: "email@exemplo.com",
  objetivo: "Objetivo central do processo",
  anamnese: {
    identificacao: {
      nomeCompleto: "Nome completo",
      idade: "00 anos",
      telefone: "(11) 99999-0000",
      email: "email@exemplo.com",
      enderecoCidade: "Cidade/SP",
      estadoCivil: "Casado(a)",
      profissao: "Profissão"
    },
    contextoFamiliar: {
      nomeConjuge: "Nome",
      tempoDeUniao: "X anos",
      filhos: "Nome, idade",
      configuracaoFamiliar: "Família biológica",
      comQuemReside: "Com cônjuge e filhos"
    },
    historicoEstiloParental: {
      estiloAtual: "Autoritativo",
      maioresDesafios: "Descreva os principais desafios",
      relacaoComProprioPais: "Como foi a relação com os pais",
      historicoDeTroumasPerdas: "Histórico relevante"
    },
    demandaPrincipal: {
      porqueBuscouMentoria: "Motivo da busca",
      oQueEsperaAlcancar: "Expectativas do processo"
    },
    autoavaliacao: {
      pilares: {
        "1_identidadeParental": 3,
        "2_comunicacaoComPropósito": 2,
        "3_vinculosEAfeto": 3,
        "4_limitesComAmor": 2,
        "5_disciplinaConsciente": 2,
        "6_legadoEValores": 3
      }
    },
    disponibilidadeLogistica: {
      diasDisponiveis: ["Terça"],
      horarioPreferido: "09h",
      modalidade: "Online",
      sessoes: 10,
      valorPorSessao: 180.00
    }
  },
  prontuario: {
    identificacao: {
      dataInicio: "2026-01-01",
      totalSessoesContratadas: 10,
      valorPorSessao: 180.00,
      objetivoCentral: "Objetivo central"
    },
    pilaresTrabalho: ["2. Comunicação com Propósito","3. Vínculos e Afeto"],
    pilarPrincipal: "3. Vínculos e Afeto",
    planoIntervencao: {
      descricaoCaso: "Descrição detalhada do caso",
      metasEspecificas: "1. Meta 1\n2. Meta 2",
      recursosLeituras: "Livros e recursos indicados"
    },
    sessoes: [
      {
        numero: 1,
        data: "2026-01-07",
        modalidade: "Online",
        pilarTrabalhado: "3. Vínculos e Afeto",
        objetivo: "Objetivo da sessão",
        registroEvolucao: "O que foi trabalhado e observado",
        tarefa: "Tarefa para casa",
        feedbackMentorando: "Como o mentorando recebeu a sessão"
      }
    ],
    conclusao: { sintese: "", statusEncerramento: "Em andamento" }
  }
};
