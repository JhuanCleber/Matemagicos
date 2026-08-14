import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Animated } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../theme/colors';
import BotaoGrande from '../components/BotaoGrande';
import { useUsuario } from '../context/UsuarioContext';
import { gerarPerguntas, Pergunta, Dificuldade } from '../game/perguntas';
import { registrarDesempenhoApi, ResultadoDesempenho } from '../services/jogoService';
import { useApiAutenticada } from '../hooks/useApiAutenticada';

const TOTAL_PERGUNTAS = 10;

const LABEL_DIFICULDADE: Record<Dificuldade, string> = {
  facil: 'Fácil',
  medio: 'Médio',
};

const SOM_ACERTO = require('../../assets/sounds/acerto.wav');
const SOM_ERRO = require('../../assets/sounds/erro.wav');
const SOM_VITORIA = require('../../assets/sounds/vitoria.wav');

interface JogoParams {
  idJogo: number;
  titulo: string;
  tipoOperacao: string;
  dificuldade: Dificuldade;
  icone: string;
  cor: string;
}

interface Props {
  navigation: any;
  route: any;
}

export default function JogoScreen({ navigation, route }: Props) {
  const { idJogo, titulo, tipoOperacao, dificuldade, icone, cor } = route.params as JogoParams;
  const { token, atualizarUsuario } = useUsuario();
  const { chamarApiAutenticada } = useApiAutenticada();

  // Sons de feedback. O hook cuida de carregar e liberar o player sozinho
  // quando a tela fecha — não precisa de cleanup manual.
  const somAcerto = useAudioPlayer(SOM_ACERTO);
  const somErro = useAudioPlayer(SOM_ERRO);
  const somVitoria = useAudioPlayer(SOM_VITORIA);

  // "Aquece" cada player assim que ele confirma que terminou de carregar
  // (isLoaded), tocando ele uma vez, bem baixinho, sem interromper — deixa
  // terminar sozinho (os sons são curtos). A versão anterior que pausava
  // no meio parece ter cortado o play antes do motor de áudio do celular
  // "engatar" de verdade, e por isso a primeira resposta real continuava
  // muda. `tocarSom()` sempre volta o volume pro máximo antes de tocar de
  // verdade, então não importa se esse aquecimento ainda não terminou.
  const statusAcerto = useAudioPlayerStatus(somAcerto);
  const statusErro = useAudioPlayerStatus(somErro);
  const statusVitoria = useAudioPlayerStatus(somVitoria);

  const acertoAquecido = useRef(false);
  const erroAquecido = useRef(false);
  const vitoriaAquecida = useRef(false);

  useEffect(() => {
    if (statusAcerto.isLoaded && !acertoAquecido.current) {
      acertoAquecido.current = true;
      try {
        somAcerto.volume = 0.01;
        somAcerto.play();
      } catch {
        // Sem problema se falhar — o pior caso é a primeira resposta ficar muda.
      }
    }
  }, [statusAcerto.isLoaded]);

  useEffect(() => {
    if (statusErro.isLoaded && !erroAquecido.current) {
      erroAquecido.current = true;
      try {
        somErro.volume = 0.01;
        somErro.play();
      } catch {
        // Idem.
      }
    }
  }, [statusErro.isLoaded]);

  useEffect(() => {
    if (statusVitoria.isLoaded && !vitoriaAquecida.current) {
      vitoriaAquecida.current = true;
      try {
        somVitoria.volume = 0.01;
        somVitoria.play();
      } catch {
        // Idem.
      }
    }
  }, [statusVitoria.isLoaded]);

  function tocarSom(player: typeof somAcerto) {
    try {
      player.volume = 1;
      player.seekTo(0);
      player.play();
    } catch {
      // Se o som falhar por algum motivo, o jogo continua normalmente —
      // áudio é um "extra", nunca deve travar a experiência.
    }
  }

  const [perguntas] = useState<Pergunta[]>(() =>
    gerarPerguntas(tipoOperacao, TOTAL_PERGUNTAS, dificuldade)
  );
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [jaRespondeu, setJaRespondeu] = useState(false);
  const [acertos, setAcertos] = useState(0);

  const acertosRef = useRef(0);
  const horaInicioRef = useRef(Date.now());

  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoDesempenho | null>(null);

  // Animações: fade suave a cada pergunta nova, "sacudida" no erro, e um
  // efeito de bounce no ícone da tela de resultado.
  const opacidadeCard = useRef(new Animated.Value(0)).current;
  const deslocamentoErro = useRef(new Animated.Value(0)).current;
  const escalaResultado = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    opacidadeCard.setValue(0);
    Animated.timing(opacidadeCard, {
      toValue: 1,
      duration: 280,
      useNativeDriver: true,
    }).start();
  }, [indiceAtual]);

  useEffect(() => {
    if (jogoFinalizado) {
      Animated.spring(escalaResultado, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }).start();

      const foiBem = acertosRef.current >= perguntas.length * 0.7;
      if (foiBem) {
        tocarSom(somVitoria);
      }
    }
  }, [jogoFinalizado]);

  function tocarAnimacaoErro() {
    deslocamentoErro.setValue(0);
    Animated.sequence([
      Animated.timing(deslocamentoErro, { toValue: 10, duration: 45, useNativeDriver: true }),
      Animated.timing(deslocamentoErro, { toValue: -10, duration: 45, useNativeDriver: true }),
      Animated.timing(deslocamentoErro, { toValue: 8, duration: 45, useNativeDriver: true }),
      Animated.timing(deslocamentoErro, { toValue: -8, duration: 45, useNativeDriver: true }),
      Animated.timing(deslocamentoErro, { toValue: 0, duration: 45, useNativeDriver: true }),
    ]).start();
  }

  const perguntaAtual = perguntas[indiceAtual];

  function handleResponder(opcao: string) {
    if (jaRespondeu) return;
    setOpcaoSelecionada(opcao);
    setJaRespondeu(true);
    if (opcao === perguntaAtual.respostaCorreta) {
      acertosRef.current += 1;
      setAcertos(acertosRef.current);
      tocarSom(somAcerto);
    } else {
      tocarSom(somErro);
      tocarAnimacaoErro();
    }
  }

  function handleProxima() {
    const proximoIndice = indiceAtual + 1;
    if (proximoIndice < perguntas.length) {
      setIndiceAtual(proximoIndice);
      setOpcaoSelecionada(null);
      setJaRespondeu(false);
    } else {
      setJogoFinalizado(true);
      enviarResultado();
    }
  }

  async function enviarResultado() {
    setEnviando(true);
    setErroEnvio(null);

    const tempoGasto = Math.max(1, Math.round((Date.now() - horaInicioRef.current) / 1000));

    try {
      if (!token) {
        throw new Error('Sessão expirada. Volte e faça login de novo.');
      }
      const resposta = await chamarApiAutenticada((tokenAtual) =>
        registrarDesempenhoApi(
          { idJogo, acertosPartida: acertosRef.current, tempoGasto },
          tokenAtual
        )
      );
      if (!resposta.ok || !resposta.resultado) {
        throw new Error(resposta.erro || 'Não foi possível salvar o resultado.');
      }
      setResultado(resposta.resultado);

      atualizarUsuario({
        totalPontos: resposta.resultado.totalPontosAtualizado,
        moedasMagicas: resposta.resultado.moedasMagicasAtualizado,
      });
    } catch (erro: any) {
      setErroEnvio(erro?.message || 'Não foi possível salvar o resultado.');
    } finally {
      setEnviando(false);
    }
  }

  function handleJogarDeNovo() {

    navigation.replace('Jogo', { idJogo, titulo, tipoOperacao, dificuldade, icone, cor });
  }

  function estiloDaOpcao(opcao: string) {
    if (!jaRespondeu) return styles.opcaoNeutra;
    if (opcao === perguntaAtual.respostaCorreta) return styles.opcaoCorreta;
    if (opcao === opcaoSelecionada) return styles.opcaoErrada;
    return styles.opcaoDesabilitada;
  }


  if (jogoFinalizado) {
    const acertosFinal = acertosRef.current;
    const foiBem = acertosFinal >= perguntas.length * 0.7;

    return (
      <View style={[styles.container, { backgroundColor: cor }]}>
        <ScrollView contentContainerStyle={styles.resultadoScroll}>
          <Animated.Text style={[styles.resultadoIcone, { transform: [{ scale: escalaResultado }] }]}>
            {foiBem ? '🎉' : '💪'}
          </Animated.Text>
          <Text style={styles.resultadoTitulo}>
            {foiBem ? 'Mandou muito bem!' : 'Quase lá!'}
          </Text>
          <Text style={styles.resultadoPlacar}>
            {acertosFinal} de {perguntas.length} acertos
          </Text>

          {enviando && (
            <View style={styles.statusBox}>
              <ActivityIndicator color={colors.white} />
              <Text style={styles.statusTexto}>Salvando seu resultado...</Text>
            </View>
          )}

          {erroEnvio && (
            <View style={styles.statusBox}>
              <Text style={styles.erroTexto}>{erroEnvio}</Text>
              <BotaoGrande titulo="Tentar salvar de novo" icone="🔄" onPress={enviarResultado} cor={colors.danger} />
            </View>
          )}

          {resultado && (
            <View style={styles.pontosBox}>
              <Text style={styles.pontosTexto}>+{resultado.pontosGanhos} pontos ⭐</Text>
              <Text style={styles.pontosSubtexto}>
                Total: {resultado.totalPontosAtualizado} pontos • {resultado.moedasMagicasAtualizado} moedas mágicas
              </Text>
            </View>
          )}

          <BotaoGrande titulo="Jogar de novo" icone="🔁" onPress={handleJogarDeNovo} cor={colors.success} />
          <BotaoGrande titulo="Voltar para Home" icone="🏠" onPress={() => navigation.navigate('Home')} cor={colors.secondary} />
        </ScrollView>
      </View>
    );
  }


  return (
    <View style={[styles.container, { backgroundColor: cor }]}>
      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
        <Text style={styles.voltarTexto}>← Sair do jogo</Text>
      </TouchableOpacity>

      <Text style={styles.progresso}>
        {icone} {titulo} · {LABEL_DIFICULDADE[dificuldade]} · Pergunta {indiceAtual + 1} de {perguntas.length}
      </Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacidadeCard,
              transform: [{ translateX: deslocamentoErro }],
            },
          ]}
        >
          <Text style={styles.enunciado}>{perguntaAtual.enunciado}</Text>

          <View style={styles.opcoesContainer}>
            {perguntaAtual.opcoes.map((opcao) => (
              <TouchableOpacity
                key={opcao}
                style={[styles.opcaoBotao, estiloDaOpcao(opcao)]}
                onPress={() => handleResponder(opcao)}
                disabled={jaRespondeu}
                activeOpacity={0.7}
              >
                <Text style={styles.opcaoTexto}>{opcao}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {jaRespondeu && (
            <BotaoGrande
              titulo={indiceAtual + 1 < perguntas.length ? 'Próxima pergunta' : 'Ver resultado'}
              icone="➡️"
              onPress={handleProxima}
              cor={colors.primary}
            />
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  voltar: {
    marginBottom: 8,
  },
  voltarTexto: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  progresso: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  scroll: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 24,
    padding: 22,
  },
  enunciado: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 22,
  },
  opcoesContainer: {
    marginBottom: 8,
  },
  opcaoBotao: {
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  opcaoNeutra: {
    backgroundColor: colors.white,
    borderColor: colors.purpleLight,
  },
  opcaoCorreta: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  opcaoErrada: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  opcaoDesabilitada: {
    backgroundColor: colors.white,
    borderColor: colors.purpleLight,
    opacity: 0.5,
  },
  opcaoTexto: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  resultadoScroll: {
    flexGrow: 1,
    alignItems: 'center',
    paddingBottom: 40,
  },
  resultadoIcone: {
    fontSize: 64,
    marginBottom: 8,
  },
  resultadoTitulo: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  resultadoPlacar: {
    fontSize: 18,
    color: colors.white,
    marginBottom: 20,
  },
  statusBox: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTexto: {
    color: colors.white,
    marginTop: 8,
  },
  erroTexto: {
    color: colors.white,
    textAlign: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  pontosBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  pontosTexto: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  pontosSubtexto: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
    textAlign: 'center',
  },
});