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
      const erro: any = new Error(mensagem);
      // Marca o status no erro pra quem chamou (useApiAutenticada) saber que é
      // um caso de "token expirado" e tentar renovar, em vez de só mostrar o erro
      erro.status = resposta.status;
      throw erro;
    }

    return dados as RespostaDesempenho;
  } catch (erro: any) {
    if (erro?.name === 'AbortError') {
      throw new Error('Tempo esgotado. Verifique sua conexão e se o servidor está rodando.');
    }
    // Se já tem "status", é um erro HTTP que montamos acima (mensagem já pronta) — repassa como está
    if (erro?.status !== undefined) {
      throw erro;
    }
    throw new Error(erro?.message || 'Não foi possível contatar o servidor.');
  } finally {
    clearTimeout(timeout);
  }
}