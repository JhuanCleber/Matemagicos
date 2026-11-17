import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_PREFERENCIAS = '@matemagicos:experiencia';

export type Tema = 'claro' | 'escuro';
export type TamanhoFonte = 'normal' | 'grande' | 'extraGrande';

export const PALETAS = {
  claro: {
    primary: '#6C63FF', secondary: '#FFB347', success: '#4ECDC4', danger: '#FF6B6B', warning: '#FFD93D',
    background: '#F7F8FC', card: '#FFFFFF', text: '#2D3436', textLight: '#636E72', white: '#FFFFFF',
    purpleLight: '#E8E6FF', orangeLight: '#FFE8CC', greenLight: '#D4F1EE', border: '#E8E6FF',
  },
  escuro: {
    primary: '#968FFF', secondary: '#FFC66B', success: '#67D8CF', danger: '#FF8585', warning: '#FFE16A',
    background: '#171827', card: '#25273A', text: '#F5F4FF', textLight: '#C5C3D6', white: '#FFFFFF',
    purpleLight: '#393958', orangeLight: '#4A3727', greenLight: '#254440', border: '#45456A',
  },
} as const;

export type Paleta = { [Chave in keyof typeof PALETAS.claro]: string };

interface ExperienciaContextData {
  carregandoExperiencia: boolean;
  onboardingConcluido: boolean;
  tema: Tema;
  tamanhoFonte: TamanhoFonte;
  escalaFonte: number;
  leituraAtiva: boolean;
  paleta: Paleta;
  concluirOnboarding: () => Promise<void>;
  reiniciarOnboarding: () => Promise<void>;
  definirTema: (tema: Tema) => Promise<void>;
  definirTamanhoFonte: (tamanho: TamanhoFonte) => Promise<void>;
  definirLeituraAtiva: (ativa: boolean) => Promise<void>;
}

const ExperienciaContext = createContext<ExperienciaContextData | undefined>(undefined);

const escalas: Record<TamanhoFonte, number> = { normal: 1, grande: 1.18, extraGrande: 1.34 };

export function ExperienciaProvider({ children }: { children: ReactNode }) {
  const [carregandoExperiencia, setCarregandoExperiencia] = useState(true);
  const [onboardingConcluido, setOnboardingConcluido] = useState(false);
  const [tema, setTema] = useState<Tema>('claro');
  const [tamanhoFonte, setTamanhoFonte] = useState<TamanhoFonte>('normal');
  const [leituraAtiva, setLeituraAtiva] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(CHAVE_PREFERENCIAS)
      .then((salvo) => {
        if (!salvo) return;
        const dados = JSON.parse(salvo);
        setOnboardingConcluido(Boolean(dados.onboardingConcluido));
        if (dados.tema === 'escuro' || dados.tema === 'claro') setTema(dados.tema);
        if (dados.tamanhoFonte in escalas) setTamanhoFonte(dados.tamanhoFonte);
        if (typeof dados.leituraAtiva === 'boolean') setLeituraAtiva(dados.leituraAtiva);
      })
      .catch(() => undefined)
      .finally(() => setCarregandoExperiencia(false));
  }, []);

  async function salvar(parcial: Partial<{ onboardingConcluido: boolean; tema: Tema; tamanhoFonte: TamanhoFonte; leituraAtiva: boolean }>) {
    const proximo = { onboardingConcluido, tema, tamanhoFonte, leituraAtiva, ...parcial };
    await AsyncStorage.setItem(CHAVE_PREFERENCIAS, JSON.stringify(proximo));
  }

  const value = useMemo(() => ({
    carregandoExperiencia,
    onboardingConcluido,
    tema,
    tamanhoFonte,
    escalaFonte: escalas[tamanhoFonte],
    leituraAtiva,
    paleta: PALETAS[tema],
    concluirOnboarding: async () => { setOnboardingConcluido(true); await salvar({ onboardingConcluido: true }); },
    reiniciarOnboarding: async () => { setOnboardingConcluido(false); await salvar({ onboardingConcluido: false }); },
    definirTema: async (novoTema: Tema) => { setTema(novoTema); await salvar({ tema: novoTema }); },
    definirTamanhoFonte: async (novoTamanho: TamanhoFonte) => { setTamanhoFonte(novoTamanho); await salvar({ tamanhoFonte: novoTamanho }); },
    definirLeituraAtiva: async (ativa: boolean) => { setLeituraAtiva(ativa); await salvar({ leituraAtiva: ativa }); },
  }), [carregandoExperiencia, onboardingConcluido, tema, tamanhoFonte, leituraAtiva]);

  return <ExperienciaContext.Provider value={value}>{children}</ExperienciaContext.Provider>;
}

export function useExperiencia() {
  const context = useContext(ExperienciaContext);
  if (!context) throw new Error('useExperiencia precisa ser usado dentro de ExperienciaProvider');
  return context;
}
