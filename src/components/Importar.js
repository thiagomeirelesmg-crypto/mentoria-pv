// src/components/Importar.js
import React, { useState } from 'react';

const PILARES = [
  '1. Identidade Parental','2. Comunicação com Propósito',
  '3. Vínculos e Afeto','4. Limites com Amor',
  '5. Disciplina Consciente','6. Legado e Valores',
];

const today = () => new Date().toISOString().split('T')[0];

const S = {
  page: { padding:'24px', maxWidth:1100, margin:'0 auto' },
  card: { background:'#161b22', border:'1px solid #21262d', borderRadius:12, padding:'18px 20px', marginBottom:16 },
  cardTitle: { fontSize:11, fontWeight:700, color:'#7d8590', textTransform:'uppercase', letterSpacing:1, marginBottom:14, marginTop:0 },
  label: { fontSize:12, color:'#7d8590', fontWeight:700, display:'block', marginBottom:4, marginTop:10 },
  input: { width:'100%', background:'#0d1117', border:'1px solid #21262d', color:'#e6edf3', borderRadius:7, padding:'8px 12px', fontSize:13, outline:'none', marginBottom:4, boxSizing:'border-box' },
  textarea: { width:'100%', background:'#0d1117', border:'1px solid #21262d', color:'#e6edf3', borderRadius:7, padding:'8px 12px', fontSize:13, outline:'none', resize:'vertical', minHeight:70, fontFamily:'inherit', marginBottom:4, boxSizing:'border-box' },
  btnPrimary: { background:'#e8a838', color:'#0d1117', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer' },
  btnSecondary: { background:'#21262d', color:'#e6edf3', border:'1px solid #30363d', borderRadius:8, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },
  grid2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 },
  pilarBtn: { background:'#21262d', color:'#7d8590', border:'1px solid #30363d', borderRadius:20, padding:'4px 12px', fontSize:11, cursor:'pointer', fontWeight:600 },
  pilarActive: { background:'#2a1f08', color:'#e8a838', border:'1px solid #e8a838' },
  infoBox: { background:'#0d1117', borderRadius:8, padding:14, marginBottom:12, fontSize:12, color:'#c9d1d9', lineHeight:1.8 },
  tagAmbar: { display:'inline-block', background:'#2a1f08', color:'#e8a838', borderRadius:4, padding:'2px 7px', fontSize:11, marginRight:4, marginBottom:4 },
  tagAzul: { display:'inline-block', background:'#1a2a3a', color:'#4e9af1', borderRadius:4, padding:'2px 7px', fontSize:11, marginRight:4, marginBottom:4 },
};

function detectarFormato(data) {
  if (data.prontuario && data.prontuario.caso && data.prontuario.clientes) return 'prontuario_completo';
  if (data.anamnese && data.prontuario) return 'anamnese_prontuario';
  if (Array.isArray(data)) return 'array_padrao';
  if (data.nome) return 'objeto_padrao';
  return 'desconhecido';
}

function parseProntuarioCompleto(data) {
  const p = data.prontuario;
  const caso = p.caso || {};
  const clientes = p.clientes || [];
  const avClin = p.avaliacaoClinica || {};
  const avCasal = p.avaliacaoCasal || {};
  const plano = p.planoAtendimento || {};
  const sessoes = p.sessoesRealizadas || [];
  const proximas = p.proximasSessoes || [];
  const orientacoes = p.orientacoesAtivas || {};
  const biblicas = p.ancorasBiblicasUtilizadas || [];
  const comunicacoes = p.comunicacoes || {};
  const nomes = clientes.map(c => c.nome).join(' / ');

  const perfisClinicos = clientes.map(c =>
    c.nome + ' (' + c.papel + '):\n' + (c.perfil || '') + (c.padraoRelacional ? '\nPadrao relacional: ' + c.padraoRelacional : '')
  ).join('\n\n');

  const descricaoCaso = [
    perfisClinicos ? 'PERFIS DOS CLIENTES:\n' + perfisClinicos : '',
    avClin.hipotesePrincipal ? '\nHIPOTESE CLINICA:\n' + avClin.hipotesePrincipal : '',
    avClin.padraoDeApego ? '\nPADRAO DE APEGO: ' + avClin.padraoDeApego.tipo + '\n' + avClin.padraoDeApego.justificativa : '',
    avClin.crencasCentrais && avClin.crencasCentrais.length ? '\nCRENCAX CENTRAIS:\n' + avClin.crencasCentrais.map(function(c){return '- ' + c;}).join('\n') : '',
    avCasal.dinamicaCentral ? '\nDINAMICA DO CASAL:\n' + avCasal.dinamicaCentral : '',
    avClin.fatoresDeRisco && avClin.fatoresDeRisco.length ? '\nFATORES DE RISCO:\n' + avClin.fatoresDeRisco.map(function(c){return '- ' + c;}).join('\n') : '',
    avClin.fatoresDeProtecao && avClin.fatoresDeProtecao.length ? '\nFATORES DE PROTECAO:\n' + avClin.fatoresDeProtecao.map(function(c){return '- ' + c;}).join('\n') : '',
  ].filter(Boolean).join('\n');

  const planoTerapeutico = [
    plano.abordagem ? 'ABORDAGEM: ' + plano.abordagem : '',
    plano.tresFilaresTBRI && plano.tresFilaresTBRI.length ? '\nTBRI:\n' + plano.tresFilaresTBRI.map(function(f){return f.pilar + '. ' + f.nome + ': ' + f.descricao;}).join('\n\n') : '',
    plano.estruturaSessoes && plano.estruturaSessoes.formato ? '\nESTRUTURA:\n' + plano.estruturaSessoes.formato.map(function(f){return '- ' + f;}).join('\n') : '',
  ].filter(Boolean).join('\n');

  const recursosIndicados = [
    avClin.fundamentacaoTeorica && avClin.fundamentacaoTeorica.length ? 'FUNDAMENTACAO:\n' + avClin.fundamentacaoTeorica.map(function(r){return '- ' + r;}).join('\n') : '',
    biblicas.length ? '\nANCORAS BIBLICAS:\n' + biblicas.map(function(b){return '- ' + b;}).join('\n') : '',
    comunicacoes.devolutivasEnviadas && comunicacoes.devolutivasEnviadas.length ? '\nDEVOLUTIVAS ENVIADAS:\n' + comunicacoes.devolutivasEnviadas.map(function(d){return '- ' + d;}).join('\n') : '',
  ].filter(Boolean).join('\n');

  var rotinaSemanal = orientacoes.rotinaSemanalConexao;
  var rotinaTexto = rotinaSemanal ? Object.keys(rotinaSemanal).map(function(dia){ return dia + ': ' + rotinaSemanal[dia]; }).join('\n') : '';

  var protocolo = orientacoes.sonoEDespertar && orientacoes.sonoEDespertar.protocolo ? 'PROTOCOLO DESPERTAR:\n' + orientacoes.sonoEDespertar.protocolo.map(function(o){return '- ' + o;}).join('\n') : '';
  var principios = orientacoes.principiosConexaoComHenrique && orientacoes.principiosConexaoComHenrique.length ? '\nPRINCIPIOS CONEXAO:\n' + orientacoes.principiosConexaoComHenrique.map(function(o){return '- ' + o;}).join('\n') : '';
  var tarefasEntreSessoes = [protocolo, principios, rotinaTexto ? '\nROTINA SEMANAL:\n' + rotinaTexto : ''].filter(Boolean).join('\n');

  var evolucoes = sessoes.map(function(s) {
    return {
      sessao: String(s.numero),
      data: s.data,
      pilar: s.pilarTBRI ? 'TBRI Pilar ' + s.pilarTBRI : (s.tipo || ''),
      objetivo: s.tema || s.tipo || '',
      texto: [
        s.resumo || '',
        s.observacoesClinicas && s.observacoesClinicas.length ? '\nOBSERVACOES:\n' + s.observacoesClinicas.map(function(o){return '- ' + o;}).join('\n') : '',
        s.orientacaoParaCasal ? '\nORIENTACAO: ' + s.orientacaoParaCasal : '',
        s.ancorasBiblicas && s.ancorasBiblicas.length ? '\nANCORAS: ' + s.ancorasBiblicas.join(', ') : '',
      ].filter(Boolean).join(''),
      tarefa: s.tarefas ? s.tarefas.join('\n') : '',
      participantes: s.participantes ? s.participantes.join(', ') : '',
      tipo: s.tipo || '',
    };
  });

  var valorSessao = caso.totalSessoesPrevistas ? caso.valorContrato / caso.totalSessoesPrevistas : 0;

  var sessoesAgenda = sessoes.map(function(s) {
    return {
      data: s.data,
      hora: s.participantes && s.participantes.includes('Henrique') && !s.participantes.includes('Ligia') ? '09:00' : '14:00',
      duracao: 90,
      modalidade: 'online',
      valor: valorSessao,
      status: 'realizado',
      pago: true,
      observacoes: 'Sessao ' + s.numero + ' - ' + s.tipo,
    };
  }).concat(proximas.map(function(s) {
    return {
      data: s.dataP,
      hora: s.tipo && s.tipo.includes('Henrique') ? '09:00' : '14:00',
      duracao: 90,
      modalidade: 'online',
      valor: valorSessao,
      status: 'agendado',
      pago: false,
      observacoes: 'Sessao ' + s.numero + ' - ' + s.tipo + ' - ' + (s.tema || ''),
    };
  }));

  var financeiro = sessoes.map(function(s) {
    return {
      tipo: 'receita',
      descricao: 'Sessao ' + s.numero + ' - ' + caso.identificacao,
      valor: valorSessao,
      data: s.data,
      categoria: 'mentoria',
    };
  });

  return {
    nome: caso.identificacao + ' - ' + nomes,
    telefone: clientes[0] ? clientes[0].telefone || '' : '',
    email: '',
    objetivo: plano.abordagem || caso.tipo || '',
    status: 'ativo',
    dataCadastro: caso.dataInicio || today(),
    cidade: clientes[0] ? clientes[0].cidade || '' : '',
    prontuario: {
      descricaoCaso: descricaoCaso,
      planoTerapeutico: planoTerapeutico,
      pilaresTrabalho: ['3. Vínculos e Afeto','4. Limites com Amor','2. Comunicação com Propósito','1. Identidade Parental','5. Disciplina Consciente'],
      pilarFoco: '3. Vínculos e Afeto',
      sessoesContratadas: caso.totalSessoesPrevistas || 16,
      sessaoAtual: caso.totalSessoesRealizadas || 5,
      metasEspecificas: avClin.investigacoesNecessarias ? avClin.investigacoesNecessarias.map(function(i){return '- ' + i;}).join('\n') : '',
      recursosIndicados: recursosIndicados,
      tarefasEntreSessoes: tarefasEntreSessoes,
      evolucoes: evolucoes,
      conclusao: '',
      versaoCliente: '',
      dataInicio: caso.dataInicio || today(),
      dataFim: null,
    },
    sessoes: sessoesAgenda,
    financeiro: financeiro,
    _preview: {
      caso: caso.identificacao,
      clientes: clientes.map(function(c){return c.nome + ' (' + c.papel + ')';}) ,
      sessoes_realizadas: sessoes.length,
      sessoes_agendadas: proximas.length,
      hipotese: avClin.hipotesePrincipal ? avClin.hipotesePrincipal.slice(0,100) + '...' : '',
      valor_total: caso.valorContrato,
    }
  };
}

export default function Importar({ addNotif, onImportado, addClient, addPron, addSessao, addFinanceiro }) {
  const [modo, setModo] = useState('json');
  const [preview, setPreview] = useState(null);
  const [importing, setImporting] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [form, setForm] = useState({
    nome:'', telefone:'', email:'', objetivo:'', cidade:'',
    prontuario:{ descricaoCaso:'', planoTerapeutico:'', pilaresTrabalho:[], pilarFoco:'', sessoesContratadas:10, sessaoAtual:1, metasEspecificas:'', recursosIndicados:'', tarefasEntreSessoes:'', dataInicio:today() },
  });

  const handleFile = function(e) {
    setErro(''); setPreview(null); setSucesso('');
    var file = e.target.files[0];
    if (!file) return;
    if (!file.name.endsWith('.json')) return setErro('Selecione um arquivo .json');
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        var formato = detectarFormato(data);
        if (formato === 'desconhecido') return setErro('Formato nao reconhecido.');
        var dadosConvertidos = data;
        if (formato === 'prontuario_completo') dadosConvertidos = parseProntuarioCompleto(data);
        setPreview({ data: dadosConvertidos, formato: formato, fileName: file.name });
      } catch(err) { setErro('JSON invalido: ' + err.message); }
    };
    reader.readAsText(file);
  };

  const executarImport = async function() {
    if (!preview) return;
    setImporting(true); setErro(''); setSucesso('');
    try {
      var item = preview.data;
      var arr = Array.isArray(item) ? item : [item];
      for (var i = 0; i < arr.length; i++) {
        var caso = arr[i];
        var clienteId = await addClient({
          nome: caso.nome || 'Sem nome',
          telefone: caso.telefone || '',
          email: caso.email || '',
          objetivo: caso.objetivo || '',
          status: caso.status || 'ativo',
          dataCadastro: caso.dataCadastro || today(),
          cidade: caso.cidade || '',
        });
        if (caso.prontuario) {
          await addPron({
            clienteId: clienteId,
            descricaoCaso: caso.prontuario.descricaoCaso || '',
            planoTerapeutico: caso.prontuario.planoTerapeutico || '',
            pilaresTrabalho: caso.prontuario.pilaresTrabalho || [],
            pilarFoco: caso.prontuario.pilarFoco || '',
            sessoesContratadas: caso.prontuario.sessoesContratadas || 10,
            sessaoAtual: caso.prontuario.sessaoAtual || 1,
            metasEspecificas: caso.prontuario.metasEspecificas || '',
            recursosIndicados: caso.prontuario.recursosIndicados || '',
            tarefasEntreSessoes: caso.prontuario.tarefasEntreSessoes || '',
            evolucoes: caso.prontuario.evolucoes || [],
            conclusao: caso.prontuario.conclusao || '',
            versaoCliente: caso.prontuario.versaoCliente || '',
            dataInicio: caso.prontuario.dataInicio || today(),
            dataFim: null,
          });
        }
        var sessoes = caso.sessoes || [];
        for (var j = 0; j < sessoes.length; j++) {
          var s = sessoes[j];
          await addSessao({ clienteId: clienteId, data: s.data || today(), hora: s.hora || '09:00', duracao: s.duracao || 60, modalidade: s.modalidade || 'online', valor: s.valor || 0, status: s.status || 'agendado', pago: s.pago || false, observacoes: s.observacoes || '' });
        }
        var fin = caso.financeiro || [];
        for (var k = 0; k < fin.length; k++) {
          var f = fin[k];
          await addFinanceiro({ tipo: f.tipo || 'receita', descricao: f.descricao || '', valor: f.valor || 0, data: f.data || today(), categoria: f.categoria || 'mentoria' });
        }
      }
      var msg = 'Importado com sucesso!';
      setSucesso(msg); addNotif(msg, 'ok');
      setPreview(null);
      if (onImportado) onImportado();
    } catch(e) { setErro('Erro: ' + e.message); addNotif('Erro: ' + e.message, 'warn'); }
    setImporting(false);
  };

  const importarManual = async function() {
    if (!form.nome) return addNotif('Nome e obrigatorio.', 'warn');
    setImporting(true);
    try {
      var clienteId = await addClient({ nome: form.nome, telefone: form.telefone, email: form.email, objetivo: form.objetivo, status: 'ativo', dataCadastro: today(), cidade: form.cidade });
      await addPron({ clienteId: clienteId, ...form.prontuario, evolucoes: [], conclusao: '', versaoCliente: '', dataFim: null });
      addNotif(form.nome + ' cadastrado!', 'ok');
      if (onImportado) onImportado();
    } catch(e) { addNotif('Erro: ' + e.message, 'warn'); }
    setImporting(false);
  };

  var FORMATOS_LABEL = {
    prontuario_completo: { cor:'#e8a838', texto:'Prontuario Clinico Completo' },
    anamnese_prontuario: { cor:'#4e9af1', texto:'Anamnese + Prontuario' },
    array_padrao: { cor:'#5cb85c', texto:'Array padrao' },
    objeto_padrao: { cor:'#9b59b6', texto:'Objeto padrao' },
  };

  return (
    <div style={S.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#e6edf3', margin:0 }}>Importar Dados</h1>
          <p style={{ fontSize:13, color:'#7d8590', margin:'4px 0 0' }}>Importe casos via JSON ou cadastre manualmente</p>
        </div>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {[['json','Importar JSON'],['manual','Cadastro Manual']].map(function(item) {
          var id = item[0], label = item[1];
          return <button key={id} style={{ ...S.btnSecondary, ...(modo===id ? { background:'#e8a838', color:'#0d1117', border:'1px solid #e8a838' } : {}) }} onClick={function(){setModo(id);}}>{label}</button>;
        })}
      </div>

      {modo === 'json' && (
        <div style={S.grid2}>
          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div style={S.card}>
              <h3 style={S.cardTitle}>Selecionar arquivo JSON</h3>
              <p style={{ fontSize:13, color:'#9ca3af', lineHeight:1.7, marginTop:0 }}>
                Aceita todos os seus formatos de prontuario:<br/>
                <span style={S.tagAmbar}>Prontuario Clinico Completo</span>
                <span style={S.tagAzul}>Anamnese + Prontuario</span>
              </p>
              <input type="file" accept=".json" onChange={handleFile} style={{ display:'none' }} id="json-upload" />
              <label htmlFor="json-upload" style={{ ...S.btnPrimary, display:'inline-block', cursor:'pointer', marginTop:8 }}>
                Escolher arquivo .json
              </label>
              {erro && <div style={{ background:'#2a1010', border:'1px solid #e05a5a', color:'#e05a5a', borderRadius:8, padding:'10px 14px', fontSize:13, marginTop:12 }}>{erro}</div>}
              {sucesso && <div style={{ background:'#1a3020', border:'1px solid #5cb85c', color:'#5cb85c', borderRadius:8, padding:'10px 14px', fontSize:13, marginTop:12 }}>{sucesso}</div>}
            </div>

            {preview && (
              <div style={S.card}>
                <h3 style={S.cardTitle}>Pre-visualizacao</h3>
                <div style={S.infoBox}>
                  <div style={{ marginBottom:8 }}>
                    <span style={{ fontSize:11, color:'#7d8590' }}>Formato: </span>
                    <span style={{ color: FORMATOS_LABEL[preview.formato] ? FORMATOS_LABEL[preview.formato].cor : '#e6edf3', fontWeight:700, fontSize:12 }}>
                      {FORMATOS_LABEL[preview.formato] ? FORMATOS_LABEL[preview.formato].texto : preview.formato}
                    </span>
                  </div>
                  {preview.formato === 'prontuario_completo' && preview.data._preview && (
                    <>
                      <div style={{ color:'#e8a838', fontWeight:700, fontSize:14, marginBottom:8 }}>{preview.data._preview.caso}</div>
                      <div style={{ marginBottom:6 }}>
                        {preview.data._preview.clientes.map(function(c,i){ return <span key={i} style={S.tagAmbar}>{c}</span>; })}
                      </div>
                      <div style={{ color:'#9ca3af', fontSize:12, lineHeight:1.7 }}>
                        {preview.data._preview.sessoes_realizadas} sessoes realizadas + {preview.data._preview.sessoes_agendadas} agendadas<br/>
                        Valor total: R$ {preview.data._preview.valor_total ? preview.data._preview.valor_total.toLocaleString('pt-BR',{minimumFractionDigits:2}) : '0'}<br/>
                        {preview.data._preview.hipotese}
                      </div>
                    </>
                  )}
                  {preview.formato !== 'prontuario_completo' && (
                    <div style={{ color:'#e8a838', fontWeight:700 }}>
                      {Array.isArray(preview.data) ? preview.data.map(function(item,i){return <div key={i}>{item.nome}</div>;}) : <div>{preview.data.nome}</div>}
                    </div>
                  )}
                </div>
                <button style={{ ...S.btnPrimary, width:'100%', opacity: importing ? 0.6:1 }} onClick={executarImport} disabled={importing}>
                  {importing ? 'Importando...' : 'Confirmar e Importar'}
                </button>
              </div>
            )}
          </div>

          <div style={S.card}>
            <h3 style={S.cardTitle}>Formatos aceitos</h3>
            <div style={{ marginBottom:16 }}>
              <div style={{ color:'#e8a838', fontWeight:700, fontSize:13, marginBottom:6 }}>Prontuario Clinico Completo</div>
              <div style={{ fontSize:12, color:'#9ca3af', lineHeight:1.6 }}>
                Multiplos clientes, historia de vida, avaliacao clinica, TBRI, sessoes realizadas e agendadas, orientacoes ativas, ancoras biblicas.
              </div>
              <pre style={{ fontSize:10, color:'#4e9af1', background:'#0d1117', borderRadius:6, padding:8, marginTop:8, overflow:'auto' }}>{`{ "prontuario": {\n  "caso": {...},\n  "clientes": [...],\n  "avaliacaoClinica": {...},\n  "sessoesRealizadas": [...],\n  "proximasSessoes": [...]\n}}`}</pre>
            </div>
            <div style={{ borderTop:'1px solid #21262d', paddingTop:16 }}>
              <div style={{ color:'#4e9af1', fontWeight:700, fontSize:13, marginBottom:6 }}>Anamnese + Prontuario</div>
              <pre style={{ fontSize:10, color:'#4e9af1', background:'#0d1117', borderRadius:6, padding:8, overflow:'auto' }}>{`{ "anamnese": {...},\n  "prontuario": {...} }`}</pre>
            </div>
          </div>
        </div>
      )}

      {modo === 'manual' && (
        <div style={S.grid2}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Dados do Mentorando</h3>
            <label style={S.label}>Nome completo *</label>
            <input style={S.input} value={form.nome} onChange={function(e){setForm({...form, nome:e.target.value});}} />
            <label style={S.label}>Telefone</label>
            <input style={S.input} value={form.telefone} onChange={function(e){setForm({...form, telefone:e.target.value});}} />
            <label style={S.label}>E-mail</label>
            <input style={S.input} value={form.email} onChange={function(e){setForm({...form, email:e.target.value});}} />
            <label style={S.label}>Cidade</label>
            <input style={S.input} value={form.cidade} onChange={function(e){setForm({...form, cidade:e.target.value});}} />
            <label style={S.label}>Objetivo</label>
            <textarea style={S.textarea} value={form.objetivo} onChange={function(e){setForm({...form, objetivo:e.target.value});}} />
          </div>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Prontuario Inicial</h3>
            <label style={S.label}>Pilares</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:10 }}>
              {PILARES.map(function(p) {
                var ativo = form.prontuario.pilaresTrabalho.includes(p);
                return <button key={p} style={{ ...S.pilarBtn, ...(ativo ? S.pilarActive : {}) }} onClick={function(){ var lista = form.prontuario.pilaresTrabalho; setForm({...form, prontuario:{...form.prontuario, pilaresTrabalho: ativo ? lista.filter(function(x){return x!==p;}) : [...lista,p]}}); }}>{p}</button>;
              })}
            </div>
            <label style={S.label}>Descricao do Caso</label>
            <textarea style={S.textarea} value={form.prontuario.descricaoCaso} onChange={function(e){setForm({...form, prontuario:{...form.prontuario, descricaoCaso:e.target.value}});}} />
            <label style={S.label}>Metas</label>
            <textarea style={S.textarea} value={form.prontuario.metasEspecificas} onChange={function(e){setForm({...form, prontuario:{...form.prontuario, metasEspecificas:e.target.value}});}} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={S.label}>Data inicio</label><input type="date" style={S.input} value={form.prontuario.dataInicio} onChange={function(e){setForm({...form, prontuario:{...form.prontuario, dataInicio:e.target.value}});}} /></div>
              <div><label style={S.label}>Sessoes</label><input type="number" style={S.input} value={form.prontuario.sessoesContratadas} onChange={function(e){setForm({...form, prontuario:{...form.prontuario, sessoesContratadas:Number(e.target.value)}});}} /></div>
            </div>
            <button style={{ ...S.btnPrimary, width:'100%', marginTop:12, opacity: importing ? 0.6:1 }} onClick={importarManual} disabled={importing}>
              {importing ? 'Salvando...' : 'Cadastrar Mentorando'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
