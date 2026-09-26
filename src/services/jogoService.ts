import { API_URL, API_TIMEOUT_MS } from '../config/api';
import { Conquista } from './gamificacaoService';

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
  novasConquistas?: Conquista[];
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
      const erro: any = new Error(mensagem);
      // Marca o status no erro pra quem chamou (useApiAutenticada) saber que é
      // um caso de "token expirado" e tentar renovar, em vez de só mostrar o erro
      erro.status = resposta.status;
      throw erro;
    }

    return dados as RespostaDesempenho;
  } catch (erro: any) {
    // Erro HTTP normal (já tem status) — não é falha de conexão, repassa como está.
    // IMPORTANTE: essa chamada especificamente (salvar resultado de partida) nunca
    // deve ser repetida automaticamente — ver aviso em utils/fetchComRetry.ts
    if (erro?.status !== undefined) {
      throw erro;
    }

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
