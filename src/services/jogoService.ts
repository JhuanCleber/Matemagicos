import { API_URL, API_TIMEOUT_MS } from '../config/api';

export interface DesempenhoPayload {
  idJogo: number;
  acertosPartida: number;
  tempoGasto: number;
}

export interface ResultadoDesempenho {
  idDesempenho: number;
  acertosPartida: number;
  tempoGasto: number;
  pontosGanhos: number;
  totalPontosAtualizado: number;
  moedasMagicasAtualizado: number;
}

export interface RespostaDesempenho {
  ok: boolean;
  erro?: string;
  mensagem?: string;
  resultado?: ResultadoDesempenho;
}


export async function registrarDesempenhoApi(
  payload: DesempenhoPayload,
  token: string
): Promise<RespostaDesempenho> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const resposta = await fetch(`${API_URL}/desempenho`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
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

    return dados as RespostaDesempenho;
  } catch (erro: any) {
    if (erro?.name === 'AbortError') {
      throw new Error('Tempo esgotado. Verifique sua conexão e se o servidor está rodando.');
    }
    throw new Error(erro?.message || 'Não foi possível contatar o servidor.');
  } finally {
    clearTimeout(timeout);
  }
}