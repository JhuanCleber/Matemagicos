import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import BotaoGrande from '../components/BotaoGrande';
import { useUsuario } from '../context/UsuarioContext';
import { gerarPerguntas, Pergunta } from '../game/perguntas';
import { registrarDesempenhoApi, ResultadoDesempenho } from '../services/jogoService';

const TOTAL_PERGUNTAS = 10;

interface JogoParams {
  idJogo: number;
  titulo: string;
  tipoOperacao: string;
  icone: string;
  cor: string;
}

interface Props {
  navigation: any;
  route: any;
}

export default function JogoScreen({ navigation, route }: Props) {
  const { idJogo, titulo, tipoOperacao, icone, cor } = route.params as JogoParams;
  const { token, atualizarUsuario } = useUsuario();

  const [perguntas] = useState<Pergunta[]>(() => gerarPerguntas(tipoOperacao, TOTAL_PERGUNTAS));
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

  const perguntaAtual = perguntas[indiceAtual];

  function handleResponder(opcao: string) {
    if (jaRespondeu) return;
    setOpcaoSelecionada(opcao);
    setJaRespondeu(true);
    if (opcao === perguntaAtual.respostaCorreta) {
      acertosRef.current += 1;
      setAcertos(acertosRef.current);
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
      const resposta = await registrarDesempenhoApi(
        { idJogo, acertosPartida: acertosRef.current, tempoGasto },
        token
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

    navigation.replace('Jogo', { idJogo, titulo, tipoOperacao, icone, cor });
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
          <Text style={styles.resultadoIcone}>{foiBem ? '🎉' : '💪'}</Text>
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
        {icone} {titulo} · Pergunta {indiceAtual + 1} de {perguntas.length}
      </Text>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
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
        </View>
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