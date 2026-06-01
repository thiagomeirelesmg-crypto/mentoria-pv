import React, { useState } from 'react';

export default function Login({ onLogin, error }) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const S = {
    root: { minHeight: '100vh', background: '#0d1117', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans',sans-serif", padding: 16 },
    card: { background: '#161b22', border: '1px solid #21262d', borderRadius: 16, padding: '40px 36px', width: '100%', maxWidth: 380, boxShadow: '0 24px 64px rgba(0,0,0,.5)' },
    logo: { textAlign: 'center', marginBottom: 32 },
    icon: { fontSize: 40, color: '#e8a838', display: 'block', marginBottom: 8 },
    title: { fontSize: 22, fontWeight: 800, color: '#e6edf3', margin: '0 0 4px' },
    sub: { fontSize: 13, color: '#7d8590', margin: 0 },
    label: { fontSize: 12, color: '#7d8590', fontWeight: 700, display: 'block', marginBottom: 6, marginTop: 16 },
    input: { width: '100%', background: '#0d1117', border: '1px solid #21262d', color: '#e6edf3', borderRadius: 8, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box' },
    btn: { width: '100%', background: '#e8a838', color: '#0d1117', border: 'none', borderRadius: 8, padding: '12px', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginTop: 24 },
    error: { background: '#2a1010', border: '1px solid #e05a5a', color: '#e05a5a', borderRadius: 8, padding: '10px 14px', fontSize: 13, marginTop: 16 },
    footer: { textAlign: 'center', marginTop: 24, fontSize: 11, color: '#7d8590' },
  };

  return (
    <div style={S.root}>
      <div style={S.card}>
        <div style={S.logo}>
          <span style={S.icon}>✦</span>
          <h1 style={S.title}>Propósito Vivo</h1>
          <p style={S.sub}>Gestão de Mentoria Parental</p>
        </div>
        <label style={S.label}>E-mail</label>
        <input style={S.input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" />
        <label style={S.label}>Senha</label>
        <input style={S.input} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === 'Enter' && onLogin(email, senha)} />
        {error && <div style={S.error}>{error}</div>}
        <button style={S.btn} onClick={() => onLogin(email, senha)}>Entrar</button>
        <p style={S.footer}>Método Pais com Propósito · Thiago Meireles</p>
      </div>
    </div>
  );
}
