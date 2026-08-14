import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario, logoutApi } from '../services/authService';

const CHAVE_STORAGE = '@matemagicos:sessao';

interface UsuarioContextData {
  usuario: Usuario | null;
  token: string | null;
  refreshToken: string | null;
  estaLogado: boolean;

  carregando: boolean;
  logar: (usuarioLogado: Usuario, tokenRecebido: string, refreshTokenRecebido: string) => Promise<void>;
  deslogar: () => Promise<void>;
  atualizarUsuario: (dadosAtualizados: Partial<Usuario>) => void;
  atualizarTokens: (novoToken: string, novoRefreshToken: string) => Promise<void>;
}

const UsuarioContext = createContext<UsuarioContextData | undefined>(undefined);

interface UsuarioProviderProps {
  children: ReactNode;
}

export function UsuarioProvider({ children }: UsuarioProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);


  useEffect(() => {
    carregarSessaoSalva();
  }, []);

  async function carregarSessaoSalva() {
    try {
      const sessaoSalva = await AsyncStorage.getItem(CHAVE_STORAGE);
      if (sessaoSalva) {
        const { usuario: usuarioSalvo, token: tokenSalvo, refreshToken: refreshTokenSalvo } = JSON.parse(sessaoSalva);
        setUsuario(usuarioSalvo);
        setToken(tokenSalvo);
        setRefreshToken(refreshTokenSalvo ?? null);
      }
    } catch (erro) {

      console.log('Não foi possível carregar a sessão salva:', erro);
    } finally {
      setCarregando(false);
    }
  }

  async function logar(usuarioLogado: Usuario, tokenRecebido: string, refreshTokenRecebido: string) {
    setUsuario(usuarioLogado);
    setToken(tokenRecebido);
    setRefreshToken(refreshTokenRecebido);
    try {
      await AsyncStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify({ usuario: usuarioLogado, token: tokenRecebido, refreshToken: refreshTokenRecebido })
      );
    } catch (erro) {
      console.log('Não foi possível salvar a sessão:', erro);
    }
  }

  async function deslogar() {
    // Revoga no back-end antes de limpar localmente (best-effort — não bloqueia o logout local)
    if (refreshToken) {
      logoutApi(refreshToken);
    }

    setUsuario(null);
    setToken(null);
    setRefreshToken(null);
    try {
      await AsyncStorage.removeItem(CHAVE_STORAGE);
    } catch (erro) {
      console.log('Não foi possível limpar a sessão salva:', erro);
    }
  }


  function atualizarUsuario(dadosAtualizados: Partial<Usuario>) {
    setUsuario((atual) => {
      if (!atual) return atual;
      const atualizado = { ...atual, ...dadosAtualizados };
      AsyncStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify({ usuario: atualizado, token, refreshToken })
      ).catch((erro) => console.log('Não foi possível atualizar a sessão salva:', erro));
      return atualizado;
    });
  }

  // Chamado pelo useApiAutenticada depois de renovar o access token com sucesso
  async function atualizarTokens(novoToken: string, novoRefreshToken: string) {
    setToken(novoToken);
    setRefreshToken(novoRefreshToken);
    try {
      await AsyncStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify({ usuario, token: novoToken, refreshToken: novoRefreshToken })
      );
    } catch (erro) {
      console.log('Não foi possível salvar os tokens renovados:', erro);
    }
  }

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        token,
        refreshToken,
        estaLogado: usuario !== null,
        carregando,
        logar,
        deslogar,
        atualizarUsuario,
        atualizarTokens,
      }}
    >
      {children}
    </UsuarioContext.Provider>
  );
}


export function useUsuario() {
  const context = useContext(UsuarioContext);
  if (context === undefined) {
    throw new Error('useUsuario precisa ser usado dentro de um <UsuarioProvider>');
  }
  return context;
}