// src/hooks/useClaude.js
// Hook para comunicar com a API intermediária Vercel → Firebase

const API_URL = process.env.REACT_APP_API_URL || '';
const TOKEN = process.env.REACT_APP_CLAUDE_TOKEN || '';

async function chamarAPI(action, dados = {}, extra = {}) {
  const resp = await fetch(`${API_URL}/api/firebase`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-claude-token': TOKEN,
    },
    body: JSON.stringify({ action, ...dados, ...extra }),
  });
  const json = await resp.json();
  if (!json.ok && !json.dados) throw new Error(json.erro || 'Erro na API');
  return json;
}

export const claudeAPI = {
  // Importar caso completo no formato anamnese+prontuário
  importarCaso: (dados) => chamarAPI('importarCaso', { dados }),

  // Relatar sessão pós-atendimento
  relatarSessao: (dados) => chamarAPI('relatarSessao', { dados }),

  // Adicionar evolução avulsa
  addEvolucao: (id, dados) => chamarAPI('addEvolucao', { id, dados }),

  // Atualizar qualquer documento
  atualizar: (colecao, id, dados) => chamarAPI('atualizar', { colecao, id, dados }),

  // Gerar link WhatsApp
  whatsapp: (telefone, mensagem) => chamarAPI('whatsapp', { dados: { telefone, mensagem } }),

  // Listar coleção
  listar: (colecao) => chamarAPI('listar', { colecao }),
};
