import { useCallback } from 'react';
import { useUsuario } from '../context/UsuarioContext';
import { renovarTokenApi } from '../services/authService';

/**
 * Envolve qualquer chamada de API autenticada (registrarDesempenhoApi, buscarRankingApi etc.)
 * e cuida da renovação automática do access token quando ele expira — sem o usuário perceber.
 *
 * Uso numa tela:
 *   const { chamarApiAutenticada } = useApiAutenticada();
 *   const resposta = await chamarApiAutenticada((tokenAtual) => registrarDesempenhoApi(payload, tokenAtual));
 *
 * As funções de serviço (jogoService, rankingService) precisam lançar um erro com
 * `erro.status = 401` quando o token estiver expirado/inválido — é assim que esse
 * hook sabe que deve tentar renovar em vez de só repassar o erro pra tela.
 */
export function useApiAutenticada() {
  const { token, refreshToken, atualizarTokens, deslogar } = useUsuario();

  const chamarApiAutenticada = useCallback(
    async <T,>(fazerChamada: (tokenAtual: string) => Promise<T>): Promise<T> => {
      if (!token) {
        throw new Error('Sessão não encontrada. Faça login novamente.');
      }

      try {
        return await fazerChamada(token);
      } catch (erro: any) {
        // Erro diferente de "token expirado" — não é problema nosso, repassa pra tela
        // (isso já cobre falha de conexão na chamada original: erro.status vem undefined
        // nesse caso, então cai aqui e é repassado sem mexer na sessão)
        if (erro?.status !== 401) {
          throw erro;
        }

        if (!refreshToken) {
          await deslogar();
          throw new Error('Sua sessão expirou. Faça login novamente.');
        }

        try {
          const respostaRefresh = await renovarTokenApi(refreshToken);

          if (!respostaRefresh.ok || !respostaRefresh.token || !respostaRefresh.refreshToken) {
            throw new Error(respostaRefresh.erro || 'Sessão expirada.');
          }

          await atualizarTokens(respostaRefresh.token, respostaRefresh.refreshToken);

          // Repete a chamada original, agora com o token novo
          return await fazerChamada(respostaRefresh.token);
        } catch (erroRefresh: any) {
          // Não deu pra renovar por FALTA DE CONEXÃO — não é a sessão que expirou,
          // é só falta de internet. Não desloga: o token antigo pode voltar a
          // funcionar sozinho assim que a conexão voltar (ele só está perto de
          // expirar, não necessariamente já expirou de verdade).
          if (erroRefresh?.semConexao) {
            throw erroRefresh;
          }

          // Refresh token também inválido/expirado de verdade — aí sim não tem
          // mais como recuperar, desloga de vez
          await deslogar();
          throw new Error('Sua sessão expirou. Faça login novamente.');
        }
      }
    },
    [token, refreshToken, atualizarTokens, deslogar]
  );

  return { chamarApiAutenticada };
}