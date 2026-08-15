import { API_URL, API_TIMEOUT_MS } from '../config/api';

export interface RankingItem {
  posicao: number;
  nome: string;
  totalPontos: number;
  moedasMagicas: number;
  voce: boolean;
}

export interface RespostaRanking {
  ok: boolean;
  erro?: string;
  top?: RankingItem[];
  suaPosicao?: RankingItem | null;
}


export async function buscarRankingApi(token: string): Promise<RespostaRanking> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const resposta = await fetch(`${API_URL}/ranking`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });

    const texto = await resposta.text();
    let dados: any = null;
    if (texto) {
      try {
        dados = JSON.parse(texto);
      } catch {
        dados = null;
      }
    }

    if (!resposta.ok) {
      const mensagem = dados?.erro || `Falha na requisição (HTTP ${resposta.status})`;
      const erro: any = new Error(mensagem);
      // Marca o status no erro pra quem chamou (useApiAutenticada) saber que é
      // um caso de "token expirado" e tentar renovar, em vez de só mostrar o erro
      erro.status = resposta.status;
      throw erro;
    }

    return dados as RespostaRanking;
  } catch (erro: any) {
    // Erro HTTP normal (já tem status) — não é falha de conexão, repassa como está
    if (erro?.status !== undefined) {
      throw erro;
    }

    // Falha de conexão de verdade — essa chamada é segura de repetir automaticamente
    // (é só leitura), por isso marcamos semConexao: quem chamar pode envolver isso
    // com utils/fetchComRetry.ts
    if (erro?.name === 'AbortError') {
      const e: any = new Error('O servidor demorou pra responder. Verifique sua conexão.');
      e.semConexao = true;
      throw e;
    }

    const e: any = new Error('Sem conexão com a internet. Verifique o Wi-Fi ou os dados móveis e tente de novo.');
    e.semConexao = true;
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}