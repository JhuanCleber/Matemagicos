import { API_URL, API_TIMEOUT_MS } from '../config/api';

export interface Conquista { id: string; nome: string; descricao: string; icone: string; desbloqueada: boolean; }
export interface ProgressoJogo { idJogo: number; nomeFase: string; tipoOperacao: string; partidas: number; percentual: number; }
export interface ItemLoja { id: string; nome: string; descricao: string; icone: string; tipo: string; preco: number; comprado: boolean; equipado: boolean; }
export interface Gamificacao {
  streakDias: number;
  tituloNivel: string;
  pontosParaProximoNivel: number;
  percentualNivel: number;
  moedasMagicas: number;
  avatarId: string;
  molduraId?: string;
  conquistas: Conquista[];
  progressoJogos: ProgressoJogo[];
  itensLoja: ItemLoja[];
}
export interface RespostaGamificacao { ok: boolean; erro?: string; mensagem?: string; gamificacao?: Gamificacao; }

async function requisicao(caminho: string, token: string, metodo = 'GET', corpo?: unknown): Promise<RespostaGamificacao> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: corpo ? JSON.stringify(corpo) : undefined,
      signal: controller.signal,
    });
    const texto = await resposta.text();
    let dados: RespostaGamificacao | null = null;
    try {
      dados = texto ? JSON.parse(texto) as RespostaGamificacao : null;
    } catch {
      const erro: any = new Error('O servidor enviou uma resposta inválida. Tente de novo.');
      erro.status = resposta.status;
      throw erro;
    }
    if (!resposta.ok) {
      const erro: any = new Error(dados?.erro || `Falha na requisição (HTTP ${resposta.status})`);
      erro.status = resposta.status;
      throw erro;
    }
    return dados as RespostaGamificacao;
  } catch (erro: any) {
    if (erro?.status !== undefined) throw erro;
    const e: any = new Error(erro?.name === 'AbortError' ? 'O servidor demorou pra responder. Tente de novo.' : 'Sem conexão com a internet. Tente de novo.');
    e.semConexao = true;
    throw e;
  } finally { clearTimeout(timeout); }
}

export function buscarGamificacaoApi(token: string) { return requisicao('/gamificacao', token); }
export function comprarItemApi(itemId: string, token: string) { return requisicao('/gamificacao/loja/comprar', token, 'POST', { itemId }); }
export function equiparItemApi(itemId: string, token: string) { return requisicao('/gamificacao/loja/equipar', token, 'POST', { itemId }); }
