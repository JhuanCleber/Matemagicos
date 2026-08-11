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

// Mesma estrutura de chamada usada em jogoService.ts — rota protegida,
// então exige o token.
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
      throw new Error(mensagem);
    }

    return dados as RespostaRanking;
  } catch (erro: any) {
    if (erro?.name === 'AbortError') {
      throw new Error('Tempo esgotado. Verifique sua conexão e se o servidor está rodando.');
    }
    throw new Error(erro?.message || 'Não foi possível contatar o servidor.');
  } finally {
    clearTimeout(timeout);
  }
}