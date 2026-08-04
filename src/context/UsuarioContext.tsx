import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Usuario } from '../services/authService';

const CHAVE_STORAGE = '@matemagicos:sessao';

interface UsuarioContextData {
  usuario: Usuario | null;
  token: string | null;
  estaLogado: boolean;

  carregando: boolean;
  logar: (usuarioLogado: Usuario, tokenRecebido: string) => Promise<void>;
  deslogar: () => Promise<void>;
  atualizarUsuario: (dadosAtualizados: Partial<Usuario>) => void;
}

const UsuarioContext = createContext<UsuarioContextData | undefined>(undefined);

interface UsuarioProviderProps {
  children: ReactNode;
}

export function UsuarioProvider({ children }: UsuarioProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);


  useEffect(() => {
    carregarSessaoSalva();
  }, []);

  async function carregarSessaoSalva() {
    try {
      const sessaoSalva = await AsyncStorage.getItem(CHAVE_STORAGE);
      if (sessaoSalva) {
        const { usuario: usuarioSalvo, token: tokenSalvo } = JSON.parse(sessaoSalva);
        setUsuario(usuarioSalvo);
        setToken(tokenSalvo);
      }
    } catch (erro) {

      console.log('Não foi possível carregar a sessão salva:', erro);
    } finally {
      setCarregando(false);
    }
  }

  async function logar(usuarioLogado: Usuario, tokenRecebido: string) {
    setUsuario(usuarioLogado);
    setToken(tokenRecebido);
    try {
      await AsyncStorage.setItem(
        CHAVE_STORAGE,
        JSON.stringify({ usuario: usuarioLogado, token: tokenRecebido })
      );
    } catch (erro) {
      console.log('Não foi possível salvar a sessão:', erro);
    }
  }

  async function deslogar() {
    setUsuario(null);
    setToken(null);
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
        JSON.stringify({ usuario: atualizado, token })
      ).catch((erro) => console.log('Não foi possível atualizar a sessão salva:', erro));
      return atualizado;
    });
  }

  return (
    <UsuarioContext.Provider
      value={{
        usuario,
        token,
        estaLogado: usuario !== null,
        carregando,
        logar,
        deslogar,
        atualizarUsuario,
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