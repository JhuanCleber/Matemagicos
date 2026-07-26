import { API_URL, API_TIMEOUT_MS } from '../config/api';

export interface Usuario {
  id?: number;
  nome: string;
  idade: number;
  email: string;
  senha?: string;
  nivelEscolar?: number;
  totalPontos?: number;
  moedasMagicas?: number;
}

export interface RespostaAuth {
  ok: boolean;
  erro?: string;
  mensagem?: string;
  usuario?: Usuario;
}

interface CadastroPayload {
  nome: string;
  idade: number;
  email: string;
  senha: string;
  nivelEscolar?: number;
}

interface LoginPayload {
  email: string;
  senha: string;
}

async function requisicao<T>(caminho: string, metodo: string, corpo?: unknown): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const resposta = await fetch(`${API_URL}${caminho}`, {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: corpo ? JSON.stringify(corpo) : undefined,
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
      // O back-end manda um erro genérico em "erro" e, quando é falha de validação,
      // manda também "campos" com a mensagem específica de cada campo problemático
      // (ex: { email: "Email inválido" }). Preferimos mostrar essas mensagens
      // específicas, que são bem mais úteis pro usuário do que "Dados inválidos".
      let mensagem = dados?.erro || `Falha na requisição (HTTP ${resposta.status})`;

      if (dados?.campos && typeof dados.campos === 'object') {
        const mensagensDosCampos = Object.values(dados.campos) as string[];
        if (mensagensDosCampos.length > 0) {
          mensagem = mensagensDosCampos.join('\n');
        }
      }

      throw new Error(mensagem);
    }

    return dados as T;
  } catch (erro: any) {
    if (erro?.name === 'AbortError') {
      throw new Error('Tempo esgotado. Verifique sua conexão e se o servidor está rodando.');
    }
    throw new Error(erro?.message || 'Não foi possível contatar o servidor.');
  } finally {
    clearTimeout(timeout);
  }
}

export async function cadastrarUsuarioApi(payload: CadastroPayload): Promise<RespostaAuth> {
  return requisicao<RespostaAuth>('/auth/cadastro', 'POST', payload);
}

export async function fazerLoginApi(payload: LoginPayload): Promise<RespostaAuth> {
  return requisicao<RespostaAuth>('/auth/login', 'POST', payload);
}
