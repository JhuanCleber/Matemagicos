import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors } from '../theme/colors';
import BotaoGrande from '../components/BotaoGrande';
import { useUsuario } from '../context/UsuarioContext';
import { Dificuldade, gerarPerguntas, Pergunta } from '../game/perguntas';
import { registrarDesempenhoApi, ResultadoDesempenho } from '../services/jogoService';
import { useApiAutenticada } from '../hooks/useApiAutenticada';

const TOTAL_PERGUNTAS = 10;

const LABEL_DIFICULDADE: Record<Dificuldade, string> = {
  facil: 'Fácil',
  medio: 'Médio',
  dificil: 'Difícil',
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

function ajustarDificuldade(atual: Dificuldade, acertou: boolean): Dificuldade {
  const niveis: Dificuldade[] = ['facil', 'medio', 'dificil'];
  const indiceAtual = niveis.indexOf(atual);
  const proximoIndice = Math.max(0, Math.min(niveis.length - 1, indiceAtual + (acertou ? 1 : -1)));
  return niveis[proximoIndice];
}

export default function JogoScreen({ navigation, route }: Props) {
  const { idJogo, titulo, tipoOperacao, dificuldade, icone, cor } = route.params as JogoParams;
  const { token, atualizarUsuario } = useUsuario();
  const { chamarApiAutenticada } = useApiAutenticada();

  const somAcerto = useAudioPlayer(SOM_ACERTO);
  const somErro = useAudioPlayer(SOM_ERRO);
  const somVitoria = useAudioPlayer(SOM_VITORIA);
  const statusAcerto = useAudioPlayerStatus(somAcerto);
  const statusErro = useAudioPlayerStatus(somErro);
  const statusVitoria = useAudioPlayerStatus(somVitoria);
  const acertoAquecido = useRef(false);
  const erroAquecido = useRef(false);
  const vitoriaAquecida = useRef(false);

  const [partidaIniciada, setPartidaIniciada] = useState(false);
  const [dificuldadeSelecionada, setDificuldadeSelecionada] = useState<Dificuldade>(dificuldade);
  const [dificuldadeAtual, setDificuldadeAtual] = useState<Dificuldade>(dificuldade);
  const [modoAdaptativo, setModoAdaptativo] = useState(false);
  const [semPressao, setSemPressao] = useState(false);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [emRevisao, setEmRevisao] = useState(false);
  const [opcaoSelecionada, setOpcaoSelecionada] = useState<string | null>(null);
  const [jaRespondeu, setJaRespondeu] = useState(false);
  const [acertos, setAcertos] = useState(0);
  const [segundosDecorridos, setSegundosDecorridos] = useState(0);
  const [jogoFinalizado, setJogoFinalizado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoDesempenho | null>(null);

  const acertosRef = useRef(0);
  const errosRef = useRef<Pergunta[]>([]);
  const horaInicioRef = useRef(Date.now());
  const opacidadeCard = useRef(new Animated.Value(0)).current;
  const deslocamentoErro = useRef(new Animated.Value(0)).current;
  const escalaResultado = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (statusAcerto.isLoaded && !acertoAquecido.current) {
      acertoAquecido.current = true;
      try {
        somAcerto.volume = 0.01;
        somAcerto.play();
      } catch {
        // O jogo continua normalmente se o áudio não puder ser preparado.
      }
    }
  }, [statusAcerto.isLoaded, somAcerto]);

  useEffect(() => {
    if (statusErro.isLoaded && !erroAquecido.current) {
      erroAquecido.current = true;
      try {
        somErro.volume = 0.01;
        somErro.play();
      } catch {
        // O jogo continua normalmente se o áudio não puder ser preparado.
      }
    }
  }, [statusErro.isLoaded, somErro]);

  useEffect(() => {
    if (statusVitoria.isLoaded && !vitoriaAquecida.current) {
      vitoriaAquecida.current = true;
      try {
        somVitoria.volume = 0.01;
        somVitoria.play();
      } catch {
        // O jogo continua normalmente se o áudio não puder ser preparado.
      }
    }
  }, [statusVitoria.isLoaded, somVitoria]);

  useEffect(() => {
    if (!partidaIniciada || semPressao || jogoFinalizado) return undefined;

    const cronometro = setInterval(() => {
      setSegundosDecorridos(Math.floor((Date.now() - horaInicioRef.current) / 1000));
    }, 1000);
    return () => clearInterval(cronometro);
  }, [partidaIniciada, semPressao, jogoFinalizado]);

  useEffect(() => {
    if (!partidaIniciada || jogoFinalizado) return;
    opacidadeCard.setValue(0);
    Animated.timing(opacidadeCard, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [indiceAtual, partidaIniciada, jogoFinalizado, opacidadeCard]);

  useEffect(() => {
    if (!jogoFinalizado) return;
    Animated.spring(escalaResultado, { toValue: 1, friction: 4, useNativeDriver: true }).start();
    if (acertosRef.current >= TOTAL_PERGUNTAS * 0.7) tocarSom(somVitoria);
  }, [jogoFinalizado, escalaResultado, somVitoria]);

  function tocarSom(player: typeof somAcerto) {
    try {
      player.volume = 1;
      player.seekTo(0);
      player.play();
    } catch {
      // Áudio é um extra e não deve interromper a partida.
    }
  }

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

  function iniciarPartida() {
    const primeiraPergunta = gerarPerguntas(tipoOperacao, 1, dificuldadeSelecionada);
    horaInicioRef.current = Date.now();
    errosRef.current = [];
    acertosRef.current = 0;
    setDificuldadeAtual(dificuldadeSelecionada);
    setPerguntas(primeiraPergunta);
    setIndiceAtual(0);
    setEmRevisao(false);
    setAcertos(0);
    setSegundosDecorridos(0);
    setOpcaoSelecionada(null);
    setJaRespondeu(false);
    setPartidaIniciada(true);
  }

  const perguntaAtual = perguntas[indiceAtual];

  function handleResponder(opcao: string) {
    if (jaRespondeu || !perguntaAtual) return;

    const acertou = opcao === perguntaAtual.respostaCorreta;
    setOpcaoSelecionada(opcao);
    setJaRespondeu(true);
    if (acertou) {
      if (!emRevisao) {
        acertosRef.current += 1;
        setAcertos(acertosRef.current);
      }
      tocarSom(somAcerto);
    } else {
      if (!emRevisao) errosRef.current.push(perguntaAtual);
      tocarSom(somErro);
      tocarAnimacaoErro();
    }

    if (!emRevisao && modoAdaptativo) {
      setDificuldadeAtual((atual) => ajustarDificuldade(atual, acertou));
    }
  }

  function finalizarPartida() {
    setJogoFinalizado(true);
    enviarResultado();
  }

  function handleProxima() {
    const proximoIndice = indiceAtual + 1;

    if (proximoIndice < perguntas.length) {
      setIndiceAtual(proximoIndice);
      setOpcaoSelecionada(null);
      setJaRespondeu(false);
      return;
    }

    if (!emRevisao && perguntas.length < TOTAL_PERGUNTAS) {
      const proximaDificuldade = modoAdaptativo ? dificuldadeAtual : dificuldadeSelecionada;
      const proximaPergunta = gerarPerguntas(tipoOperacao, 1, proximaDificuldade)[0];
      setPerguntas((atuais) => [...atuais, proximaPergunta]);
      setIndiceAtual(proximoIndice);
      setOpcaoSelecionada(null);
      setJaRespondeu(false);
      return;
    }

    if (!emRevisao && errosRef.current.length > 0) {
      setPerguntas([...errosRef.current]);
      setIndiceAtual(0);
      setEmRevisao(true);
      setOpcaoSelecionada(null);
      setJaRespondeu(false);
      return;
    }

    finalizarPartida();
  }

  async function enviarResultado() {
    setEnviando(true);
    setErroEnvio(null);
    const tempoGasto = semPressao ? 0 : Math.max(1, Math.round((Date.now() - horaInicioRef.current) / 1000));

    try {
      if (!token) throw new Error('Sessão expirada. Volte e faça login de novo.');
      const resposta = await chamarApiAutenticada((tokenAtual) =>
        registrarDesempenhoApi({ idJogo, acertosPartida: acertosRef.current, tempoGasto }, tokenAtual)
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
    if (opcao === perguntaAtual?.respostaCorreta) return styles.opcaoCorreta;
    if (opcao === opcaoSelecionada) return styles.opcaoErrada;
    return styles.opcaoDesabilitada;
  }

  if (!partidaIniciada) {
    return (
      <View style={[styles.container, { backgroundColor: cor }]}>
        <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <ScrollView contentContainerStyle={styles.configuracaoScroll}>
          <Text style={styles.configuracaoIcone}>{icone}</Text>
          <Text style={styles.configuracaoTitulo}>{titulo}</Text>
          <Text style={styles.configuracaoSubtitulo}>Prepare sua aventura matemática!</Text>

          <View style={styles.configuracaoCard}>
            <Text style={styles.configuracaoLabel}>Escolha a dificuldade</Text>
            <View style={styles.opcoesConfiguracao}>
              {(Object.keys(LABEL_DIFICULDADE) as Dificuldade[]).map((nivel) => (
                <TouchableOpacity
                  key={nivel}
                  style={[styles.botaoConfiguracao, dificuldadeSelecionada === nivel && styles.botaoConfiguracaoAtivo]}
                  onPress={() => setDificuldadeSelecionada(nivel)}
                >
                  <Text style={[styles.botaoConfiguracaoTexto, dificuldadeSelecionada === nivel && styles.botaoConfiguracaoTextoAtivo]}>
                    {LABEL_DIFICULDADE[nivel]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.linhaModo} onPress={() => setModoAdaptativo((ativo) => !ativo)}>
              <View style={styles.textoModo}>
                <Text style={styles.tituloModo}>🪄 Dificuldade adaptativa</Text>
                <Text style={styles.descricaoModo}>Os desafios sobem ou descem conforme seus acertos.</Text>
              </View>
              <Text style={styles.seletorModo}>{modoAdaptativo ? '✓' : '○'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linhaModo} onPress={() => setSemPressao((ativo) => !ativo)}>
              <View style={styles.textoModo}>
                <Text style={styles.tituloModo}>🌈 Modo sem pressão</Text>
                <Text style={styles.descricaoModo}>Jogue no seu ritmo, sem cronômetro e sem tempo no histórico.</Text>
              </View>
              <Text style={styles.seletorModo}>{semPressao ? '✓' : '○'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.notaConfiguracao}>No final, você poderá praticar de novo apenas as perguntas que errou.</Text>
          <BotaoGrande titulo="Começar partida" icone="▶️" onPress={iniciarPartida} cor={colors.primary} />
        </ScrollView>
      </View>
    );
  }

  if (jogoFinalizado) {
    const foiBem = acertos >= TOTAL_PERGUNTAS * 0.7;
    return (
      <View style={[styles.container, { backgroundColor: cor }]}>
        <ScrollView contentContainerStyle={styles.resultadoScroll}>
          <Animated.Text style={[styles.resultadoIcone, { transform: [{ scale: escalaResultado }] }]}>
            {foiBem ? '🎉' : '💪'}
          </Animated.Text>
          <Text style={styles.resultadoTitulo}>{foiBem ? 'Mandou muito bem!' : 'Quase lá!'}</Text>
          <Text style={styles.resultadoPlacar}>{acertos} de {TOTAL_PERGUNTAS} acertos</Text>
          {errosRef.current.length > 0 && <Text style={styles.revisaoConcluida}>Você também revisou as perguntas que errou. 🌟</Text>}

          {enviando && <View style={styles.statusBox}><ActivityIndicator color={colors.white} /><Text style={styles.statusTexto}>Salvando seu resultado...</Text></View>}
          {erroEnvio && <View style={styles.statusBox}><Text style={styles.erroTexto}>{erroEnvio}</Text><BotaoGrande titulo="Tentar salvar de novo" icone="🔄" onPress={enviarResultado} cor={colors.danger} /></View>}
          {resultado && <View style={styles.pontosBox}><Text style={styles.pontosTexto}>+{resultado.pontosGanhos} pontos ⭐</Text><Text style={styles.pontosSubtexto}>Total: {resultado.totalPontosAtualizado} pontos • {resultado.moedasMagicasAtualizado} moedas mágicas</Text></View>}

          <BotaoGrande titulo="Jogar de novo" icone="🔁" onPress={handleJogarDeNovo} cor={colors.success} />
          <BotaoGrande titulo="Voltar para Home" icone="🏠" onPress={() => navigation.navigate('Home')} cor={colors.secondary} />
        </ScrollView>
      </View>
    );
  }

  const progresso = emRevisao
    ? `🔁 Revisão ${indiceAtual + 1} de ${perguntas.length}`
    : `Pergunta ${indiceAtual + 1} de ${TOTAL_PERGUNTAS}`;
  const ultimaPerguntaDaEtapa = indiceAtual + 1 === perguntas.length;
  const tituloBotaoProxima = emRevisao && ultimaPerguntaDaEtapa
    ? 'Ver resultado'
    : !emRevisao && perguntas.length === TOTAL_PERGUNTAS && ultimaPerguntaDaEtapa
      ? errosRef.current.length > 0 ? 'Praticar perguntas erradas' : 'Ver resultado'
      : 'Próxima pergunta';

  return (
    <View style={[styles.container, { backgroundColor: cor }]}>
      <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
        <Text style={styles.voltarTexto}>← Sair do jogo</Text>
      </TouchableOpacity>
      <Text style={styles.progresso}>{icone} {titulo} · {progresso}</Text>
      <Text style={styles.detalhePartida}>
        {emRevisao ? 'Esta revisão não altera sua pontuação.' : modoAdaptativo ? `Dificuldade: ${LABEL_DIFICULDADE[dificuldadeAtual]} (adaptativa)` : `Dificuldade: ${LABEL_DIFICULDADE[dificuldadeSelecionada]}`}
        {!semPressao && ` · ⏱ ${segundosDecorridos}s`}
      </Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View style={[styles.card, { opacity: opacidadeCard, transform: [{ translateX: deslocamentoErro }] }]}>
          <Text style={styles.enunciado}>{perguntaAtual?.enunciado}</Text>
          <View style={styles.opcoesContainer}>
            {perguntaAtual?.opcoes.map((opcao) => (
              <TouchableOpacity key={opcao} style={[styles.opcaoBotao, estiloDaOpcao(opcao)]} onPress={() => handleResponder(opcao)} disabled={jaRespondeu} activeOpacity={0.7}>
                <Text style={styles.opcaoTexto}>{opcao}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {jaRespondeu && <BotaoGrande titulo={tituloBotaoProxima} icone="➡️" onPress={handleProxima} cor={colors.primary} />}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 50, paddingHorizontal: 20 },
  voltar: { marginBottom: 8 },
  voltarTexto: { color: colors.white, fontSize: 15, fontWeight: '600' },
  configuracaoScroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  configuracaoIcone: { fontSize: 64, marginTop: 14 },
  configuracaoTitulo: { color: colors.white, fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  configuracaoSubtitulo: { color: colors.white, fontSize: 16, opacity: 0.9, textAlign: 'center', marginTop: 6, marginBottom: 20 },
  configuracaoCard: { width: '100%', backgroundColor: colors.background, borderRadius: 24, padding: 20, marginBottom: 16 },
  configuracaoLabel: { fontSize: 17, color: colors.text, fontWeight: 'bold', marginBottom: 12 },
  opcoesConfiguracao: { flexDirection: 'row', gap: 8, marginBottom: 18 },
  botaoConfiguracao: { flex: 1, borderWidth: 2, borderColor: colors.purpleLight, borderRadius: 14, alignItems: 'center', paddingVertical: 11 },
  botaoConfiguracaoAtivo: { backgroundColor: colors.primary, borderColor: colors.primary },
  botaoConfiguracaoTexto: { color: colors.text, fontWeight: '700', fontSize: 13 },
  botaoConfiguracaoTextoAtivo: { color: colors.white },
  linhaModo: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.purpleLight },
  textoModo: { flex: 1, paddingRight: 10 },
  tituloModo: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 3 },
  descricaoModo: { color: colors.textLight, fontSize: 13, lineHeight: 18 },
  seletorModo: { color: colors.primary, fontSize: 28, fontWeight: 'bold' },
  notaConfiguracao: { color: colors.white, textAlign: 'center', fontSize: 14, lineHeight: 20, marginHorizontal: 12, marginBottom: 16 },
  progresso: { color: colors.white, fontSize: 15, fontWeight: '700', textAlign: 'center', marginBottom: 4 },
  detalhePartida: { color: colors.white, fontSize: 13, textAlign: 'center', marginBottom: 16, opacity: 0.92 },
  scroll: { flexGrow: 1, paddingBottom: 30 },
  card: { backgroundColor: colors.background, borderRadius: 24, padding: 22 },
  enunciado: { fontSize: 28, fontWeight: 'bold', color: colors.text, textAlign: 'center', marginBottom: 22, lineHeight: 38 },
  opcoesContainer: { marginBottom: 8 },
  opcaoBotao: { borderRadius: 16, paddingVertical: 16, marginBottom: 12, borderWidth: 2, alignItems: 'center' },
  opcaoNeutra: { backgroundColor: colors.white, borderColor: colors.purpleLight },
  opcaoCorreta: { backgroundColor: colors.success, borderColor: colors.success },
  opcaoErrada: { backgroundColor: colors.danger, borderColor: colors.danger },
  opcaoDesabilitada: { backgroundColor: colors.white, borderColor: colors.purpleLight, opacity: 0.5 },
  opcaoTexto: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  resultadoScroll: { flexGrow: 1, alignItems: 'center', paddingBottom: 40 },
  resultadoIcone: { fontSize: 64, marginBottom: 8 },
  resultadoTitulo: { fontSize: 26, fontWeight: 'bold', color: colors.white, marginBottom: 4, textAlign: 'center' },
  resultadoPlacar: { fontSize: 18, color: colors.white, marginBottom: 8 },
  revisaoConcluida: { color: colors.white, textAlign: 'center', fontSize: 14, marginBottom: 18 },
  statusBox: { alignItems: 'center', marginBottom: 16 },
  statusTexto: { color: colors.white, marginTop: 8 },
  erroTexto: { color: colors.white, textAlign: 'center', marginBottom: 12, paddingHorizontal: 10 },
  pontosBox: { backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', marginBottom: 24, width: '100%' },
  pontosTexto: { fontSize: 22, fontWeight: 'bold', color: colors.white, marginBottom: 4 },
  pontosSubtexto: { fontSize: 13, color: colors.white, opacity: 0.9, textAlign: 'center' },
});
