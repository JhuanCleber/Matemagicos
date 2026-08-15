/**
 * Repete uma chamada automaticamente se ela falhar por motivo de CONEXÃO
 * (timeout, sem internet) — nunca por erro de negócio (senha errada, código
 * inválido, 429 etc.), que não faz sentido repetir sozinho.
 *
 * IMPORTANTE: só use isso pra chamadas seguras de repetir (leitura, tipo
 * buscar o ranking). Nunca envolva uma ação que CRIA algo no servidor (tipo
 * registrar o resultado de uma partida) — se a resposta se perder depois do
 * servidor já ter processado, repetir sozinho poderia duplicar o dado.
 */
export async function comRetry<T>(
  chamada: () => Promise<T>,
  tentativas: number = 2,
  delayBaseMs: number = 800
): Promise<T> {
  let ultimoErro: any;

  for (let tentativa = 0; tentativa <= tentativas; tentativa++) {
    try {
      return await chamada();
    } catch (erro: any) {
      ultimoErro = erro;

      if (!erro?.semConexao) {
        throw erro;
      }

      if (tentativa < tentativas) {
        await new Promise((resolve) => setTimeout(resolve, delayBaseMs * (tentativa + 1)));
      }
    }
  }

  throw ultimoErro;
}