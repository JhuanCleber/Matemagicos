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
  token?: string;
  refreshToken?: string;
}

export interface RespostaRefresh {
  ok: boolean;
  erro?: string;
  token?: string;
  refreshToken?: string;
}

export interface RespostaSimples {
  ok: boolean;
  erro?: string;
  mensagem?: string;
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

// Troca um refresh token válido por um access token novo (+ refresh token rotacionado)
export async function renovarTokenApi(refreshToken: string): Promise<RespostaRefresh> {
  return requisicao<RespostaRefresh>('/auth/refresh', 'POST', { refreshToken });
}

// Revoga o refresh token no back-end. Não lançamos erro daqui pra fora — logout
// deve sempre "funcionar" do ponto de vista do usuário, mesmo se a chamada falhar
// (ex: sem internet na hora de sair). Quem chama decide se quer saber do resultado.
export async function logoutApi(refreshToken: string): Promise<void> {
  try {
    await requisicao('/auth/logout', 'POST', { refreshToken });
  } catch (erro) {
    console.log('Não foi possível revogar a sessão no servidor:', erro);
  }
}

// Pede o código de recuperação por email. Sempre volta "ok" mesmo se o email
// não existir — o back-end não entrega essa informação de propósito.
export async function esqueciSenhaApi(email: string): Promise<RespostaSimples> {
  return requisicao<RespostaSimples>('/auth/esqueci-senha', 'POST', { email });
}

export async function redefinirSenhaApi(
  email: string,
  codigo: string,
  novaSenha: string
): Promise<RespostaSimples> {
  return requisicao<RespostaSimples>('/auth/redefinir-senha', 'POST', { email, codigo, novaSenha });
}