// src/components/WhatsApp.js
import React, { useState } from 'react';
const TEMPLATES = [
  { id:'tarefa', label:'Tarefa da Sessão', texto: (nome, tarefa) =>
    `Olá, ${nome}! 🌟\n\nFoi um prazer nossa sessão hoje!\n\nSua tarefa para essa semana:\n\n${tarefa}\n\nQualquer dúvida, pode me chamar. Você está no caminho certo! 💛\n\n— Thiago Meireles\nPropósito Vivo | Método Pais com Propósito` },
  { id:'lembrete', label:'Lembrete de Sessão', texto: (nome, data, hora) =>
    `Olá, ${nome}! 😊\n\nPassando para lembrar que temos nossa sessão *${data}* às *${hora}*.\n\nSe precisar reagendar, me avise com antecedência.\n\nAté lá! 💛\n\n— Thiago Meireles\nPropósito Vivo` },
  { id:'boas_vindas', label:'Boas-vindas ao Processo', texto: (nome) =>
    `Olá, ${nome}! 🌟\n\nSeja muito bem-vindo(a) ao *Método Pais com Propósito*!\n\nEstou muito feliz em caminhar com você nessa jornada de transformação parental. Nosso foco será construir uma parentalidade intencional, com vínculos fortes e comunicação que transforma.\n\nFico à disposição para qualquer dúvida.\n\nComeçamos juntos! 💛\n\n— Thiago Meireles\nPropósito Vivo` },
  { id:'encerramento', label:'Encerramento do Processo', texto: (nome) =>
    `Olá, ${nome}! 🎉\n\nChegamos ao final do nosso processo juntos e quero te dizer: foi uma honra acompanhar sua jornada!\n\nVocê cresceu muito como pai/mãe e as mudanças que implementou na sua família são reais e duradouras.\n\nContinue aplicando o que aprendeu. Você tem tudo o que precisa! 💛\n\n— Thiago Meireles\nPropósito Vivo | Método Pais com Propósito` },
  { id:'livre', label:'Mensagem Livre', texto: () => '' },
];

const S = {
  page: { padding:'24px', maxWidth:900, margin:'0 auto' },
  card: { background:'#161b22', border:'1px solid #21262d', borderRadius:12, padding:'18px 20px', marginBottom:16 },
  cardTitle: { fontSize:11, fontWeight:700, color:'#7d8590', textTransform:'uppercase', letterSpacing:1, marginBottom:14, marginTop:0 },
  label: { fontSize:12, color:'#7d8590', fontWeight:700, display:'block', marginBottom:4, marginTop:10 },
  input: { width:'100%', background:'#0d1117', border:'1px solid #21262d', color:'#e6edf3', borderRadius:7, padding:'8px 12px', fontSize:13, outline:'none', marginBottom:4, boxSizing:'border-box' },
  textarea: { width:'100%', background:'#0d1117', border:'1px solid #21262d', color:'#e6edf3', borderRadius:7, padding:'8px 12px', fontSize:13, outline:'none', resize:'vertical', minHeight:160, fontFamily:'inherit', marginBottom:4, boxSizing:'border-box' },
  btnPrimary: { background:'#e8a838', color:'#0d1117', border:'none', borderRadius:8, padding:'9px 18px', fontSize:13, fontWeight:700, cursor:'pointer' },
  btnSecondary: { background:'#21262d', color:'#e6edf3', border:'1px solid #30363d', borderRadius:8, padding:'9px 14px', fontSize:13, fontWeight:600, cursor:'pointer' },
  templateBtn: { background:'#21262d', color:'#7d8590', border:'1px solid #30363d', borderRadius:8, padding:'7px 12px', fontSize:12, cursor:'pointer', fontWeight:600, textAlign:'left' },
  templateBtnActive: { background:'#1a2a0a', color:'#5cb85c', border:'1px solid #5cb85c' },
};

export default function WhatsApp({ clients, prontuarios, sessoes, addNotif }) {
  const [clienteSel, setClienteSel] = useState('');
  const [template, setTemplate] = useState('livre');
  const [mensagem, setMensagem] = useState('');
  const [extras, setExtras] = useState({ tarefa:'', data:'', hora:'' });
  const [historico, setHistorico] = useState([]);

  const cliente = clients.find(c => c.id === clienteSel);

  const aplicarTemplate = (tpl) => {
    setTemplate(tpl.id);
    if (!cliente) return;
    const nome = cliente.nome.split(' ')[0];
    if (tpl.id === 'tarefa') setMensagem(tpl.texto(nome, extras.tarefa || '[descreva a tarefa]'));
    else if (tpl.id === 'lembrete') setMensagem(tpl.texto(nome, extras.data || '[data]', extras.hora || '[hora]'));
    else if (tpl.id === 'livre') setMensagem('');
    else setMensagem(tpl.texto(nome));
  };

  const enviar = () => {
    if (!cliente?.telefone) return addNotif('Mentorando sem telefone cadastrado.', 'warn');
    if (!mensagem.trim()) return addNotif('Escreva uma mensagem.', 'warn');
    const num = cliente.telefone.replace(/\D/g, '');
    const link = `https://wa.me/55${num}?text=${encodeURIComponent(mensagem)}`;
    window.open(link, '_blank');
    setHistorico(h => [{ nome: cliente.nome, msg: mensagem.slice(0,80)+'…', hora: new Date().toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'}), data: new Date().toLocaleDateString('pt-BR') }, ...h.slice(0,9)]);
    addNotif(`WhatsApp aberto para ${cliente.nome}!`, 'ok');
  };

  return (
    <div style={S.page}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h1 style={{ fontSize:22, fontWeight:800, color:'#e6edf3', margin:0 }}>WhatsApp</h1>
          <p style={{ fontSize:13, color:'#7d8590', margin:'4px 0 0' }}>Envie mensagens aos mentorandos via WhatsApp Web</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.2fr', gap:20 }}>
        {/* Configuração */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Destinatário</h3>
            <label style={S.label}>Mentorando</label>
            <select style={S.input} value={clienteSel} onChange={e => { setClienteSel(e.target.value); setMensagem(''); }}>
              <option value=''>Selecione…</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nome} {c.telefone ? '' : '⚠️ sem tel.'}</option>)}
            </select>
            {cliente && (
              <div style={{ background:'#0d1117', borderRadius:8, padding:10, marginTop:8, fontSize:12, color:'#7d8590' }}>
                📞 {cliente.telefone || 'Telefone não cadastrado'}<br/>
                🎯 {cliente.objetivo?.slice(0,60)}…
              </div>
            )}
          </div>

          <div style={S.card}>
            <h3 style={S.cardTitle}>Template</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {TEMPLATES.map(tpl => (
                <button key={tpl.id}
                  style={{ ...S.templateBtn, ...(template===tpl.id ? S.templateBtnActive : {}) }}
                  onClick={() => aplicarTemplate(tpl)}>
                  {tpl.label}
                </button>
              ))}
            </div>
            {template === 'tarefa' && (
              <>
                <label style={S.label}>Tarefa da sessão</label>
                <textarea style={{ ...S.textarea, minHeight:80 }} value={extras.tarefa}
                  onChange={e => { setExtras({...extras, tarefa:e.target.value}); if(cliente) aplicarTemplate(TEMPLATES.find(t=>t.id==='tarefa')); }} />
              </>
            )}
            {template === 'lembrete' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                <div><label style={S.label}>Data</label><input type="date" style={S.input} value={extras.data} onChange={e => setExtras({...extras, data:e.target.value})} /></div>
                <div><label style={S.label}>Horário</label><input type="time" style={S.input} value={extras.hora} onChange={e => setExtras({...extras, hora:e.target.value})} /></div>
              </div>
            )}
          </div>
        </div>

        {/* Editor de mensagem */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div style={S.card}>
            <h3 style={S.cardTitle}>Mensagem</h3>
            <textarea style={{ ...S.textarea, minHeight:220, fontFamily:'inherit', lineHeight:1.7 }}
              value={mensagem} onChange={e => setMensagem(e.target.value)}
              placeholder="Selecione um template ou escreva sua mensagem…" />
            <div style={{ display:'flex', gap:10, marginTop:8 }}>
              <button style={{ ...S.btnPrimary, flex:1, background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}
                onClick={enviar}>
                <span style={{ fontSize:18 }}>💬</span> Abrir WhatsApp Web
              </button>
              <button style={S.btnSecondary} onClick={() => setMensagem('')}>Limpar</button>
            </div>
            <p style={{ fontSize:11, color:'#7d8590', marginTop:8 }}>
              Abre o WhatsApp Web com a mensagem preenchida. Você confirma o envio clicando em Enviar no WhatsApp.
            </p>
          </div>

          {/* Histórico */}
          {historico.length > 0 && (
            <div style={S.card}>
              <h3 style={S.cardTitle}>Histórico da sessão</h3>
              {historico.map((h,i) => (
                <div key={i} style={{ borderBottom:'1px solid #21262d', paddingBottom:8, marginBottom:8 }}>
                  <div style={{ fontSize:12, color:'#e8a838', fontWeight:700 }}>{h.nome}</div>
                  <div style={{ fontSize:11, color:'#7d8590' }}>{h.data} às {h.hora}</div>
                  <div style={{ fontSize:12, color:'#c9d1d9', marginTop:2 }}>{h.msg}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
