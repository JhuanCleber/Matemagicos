import { API_URL, API_TIMEOUT_MS } from '../config/api';
import { Usuario } from './authService';

export interface RespostaEditarPerfil {
  ok: boolean;
  erro?: string;
  mensagem?: string;
  usuario?: Usuario;
}

export async function editarPerfilApi(
  nome: string,
  idade: number,
  token: string
): Promise<RespostaEditarPerfil> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const resposta = await fetch(`${API_URL}/usuarios/perfil`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ nome, idade }),
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
      let mensagem = dados?.erro || `Falha na requisição (HTTP ${resposta.status})`;

      if (dados?.campos && typeof dados.campos === 'object') {
        const mensagensDosCampos = Object.values(dados.campos) as string[];
        if (mensagensDosCampos.length > 0) {
          mensagem = mensagensDosCampos.join('\n');
        }
      }

      const erro: any = new Error(mensagem);
      // Marca o status no erro pra quem chamou (useApiAutenticada) saber que é
      // um caso de "token expirado" e tentar renovar, em vez de só mostrar o erro
      erro.status = resposta.status;
      throw erro;
    }

    return dados as RespostaEditarPerfil;
  } catch (erro: any) {
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

export interface RespostaExcluirConta {
  ok: boolean;
  erro?: string;
  mensagem?: string;
}

export async function excluirContaApi(senha: string, token: string): Promise<RespostaExcluirConta> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const resposta = await fetch(`${API_URL}/usuarios/conta`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ senha }),
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
      erro.status = resposta.status;
      throw erro;
    }

    return dados as RespostaExcluirConta;
  } catch (erro: any) {
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