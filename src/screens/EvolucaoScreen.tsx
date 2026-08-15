import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import BotaoGrande from '../components/BotaoGrande';
import { useApiAutenticada } from '../hooks/useApiAutenticada';
import { comRetry } from '../utils/fetchComRetry';
import { buscarHistoricoApi, HistoricoItem } from '../services/historicoService';
import { VISUAL_POR_TIPO, VISUAL_PADRAO } from '../theme/jogosVisual';

interface Props {
  navigation: any;
}

// Mesmo valor fixo usado em JogoScreen (TOTAL_PERGUNTAS) — o back não guarda o
// total de perguntas por partida, só os acertos, então assumimos 10 (sempre foi
// esse o valor em todo o app) pra calcular o percentual de acerto por tipo.
const PERGUNTAS_POR_PARTIDA = 10;

interface PontosDoDia {
  chave: string;
  label: string;
  pontos: number;
}

interface DesempenhoPorTipo {
  tipo: string;
  totalPartidas: number;
  percentual: number;
}

// Só considera um tipo pra gerar o insight se já foi jogado pelo menos essa
// quantidade de vezes — evita tirar conclusão de uma partida só (pode ter sido
// azar/sorte pontual, não é representativo ainda)
const LIMIAR_PARTIDAS_PARA_INSIGHT = 2;

// Diferença mínima de percentual pra valer a pena destacar um "ponto forte" vs
// "praticar mais" — se estiver tudo muito parecido, é mais honesto dizer que
// está equilibrado do que forçar uma comparação
const DIFERENCA_MINIMA_PARA_DESTACAR = 10;

function agruparPontosPorDia(historico: HistoricoItem[]): PontosDoDia[] {
  const mapa = new Map<string, number>();

  historico.forEach((item) => {
    const d = new Date(item.dataHora);
    const chave = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    mapa.set(chave, (mapa.get(chave) ?? 0) + item.pontosGanhos);
  });

  const dias = Array.from(mapa.entries())
    .map(([chave, pontos]) => {
      const [, mes, dia] = chave.split('-');
      return { chave, label: `${dia}/${mes}`, pontos };
    })
    .sort((a, b) => (a.chave < b.chave ? -1 : 1));

  // Só os últimos 7 dias com atividade — não faz sentido mostrar tudo se o
  // histórico tiver meses de partidas
  return dias.slice(-7);
}

function agruparPorTipo(historico: HistoricoItem[]): DesempenhoPorTipo[] {
  const mapa = new Map<string, { totalAcertos: number; totalPartidas: number }>();

  historico.forEach((item) => {
    const atual = mapa.get(item.tipoOperacao) ?? { totalAcertos: 0, totalPartidas: 0 };
    atual.totalAcertos += item.acertosPartida;
    atual.totalPartidas += 1;
    mapa.set(item.tipoOperacao, atual);
  });

  return Array.from(mapa.entries())
    .map(([tipo, { totalAcertos, totalPartidas }]) => ({
      tipo,
      totalPartidas,
      percentual: Math.round((totalAcertos / (totalPartidas * PERGUNTAS_POR_PARTIDA)) * 100),
    }))
    .sort((a, b) => b.totalPartidas - a.totalPartidas);
}

function CartaoInsight({ porTipo }: { porTipo: DesempenhoPorTipo[] }) {
  const elegiveis = porTipo.filter((d) => d.totalPartidas >= LIMIAR_PARTIDAS_PARA_INSIGHT);

  if (elegiveis.length < 2) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>💡 Seus destaques</Text>
        <Text style={styles.insightTextoNeutro}>
          Jogue mais alguns tipos diferentes pra gente descobrir seu ponto forte! 🔍
        </Text>
      </View>
    );
  }

  const ordenado = [...elegiveis].sort((a, b) => b.percentual - a.percentual);
  const pontoForte = ordenado[0];
  const pontoAMelhorar = ordenado[ordenado.length - 1];
  const diferenca = pontoForte.percentual - pontoAMelhorar.percentual;

  if (diferenca < DIFERENCA_MINIMA_PARA_DESTACAR) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitulo}>💡 Seus destaques</Text>
        <Text style={styles.insightTextoNeutro}>
          Seu desempenho está bem equilibrado entre os tipos de jogo! 🎉
        </Text>
      </View>
    );
  }

  const visualForte = VISUAL_POR_TIPO[pontoForte.tipo] ?? VISUAL_PADRAO;
  const visualAMelhorar = VISUAL_POR_TIPO[pontoAMelhorar.tipo] ?? VISUAL_PADRAO;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>💡 Seus destaques</Text>
      <View style={styles.linhaInsight}>
        <Text style={styles.insightIcone}>🌟</Text>
        <Text style={styles.insightTexto}>
          Seu ponto forte é <Text style={styles.insightDestaque}>{visualForte.nome}</Text>{' '}
          ({pontoForte.percentual}% de acerto)
        </Text>
      </View>
      <View style={styles.linhaInsight}>
        <Text style={styles.insightIcone}>🎯</Text>
        <Text style={styles.insightTexto}>
          Praticar mais <Text style={styles.insightDestaque}>{visualAMelhorar.nome}</Text> pode ajudar ainda
          mais ({pontoAMelhorar.percentual}%)
        </Text>
      </View>
    </View>
  );
}

function GraficoPontosPorDia({ dados }: { dados: PontosDoDia[] }) {
  const maxPontos = Math.max(...dados.map((d) => d.pontos), 1);
  const ALTURA_MAX = 110;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>📈 Pontos por dia</Text>
      <View style={styles.graficoBarras}>
        {dados.map((d) => {
          const altura = Math.max(6, (d.pontos / maxPontos) * ALTURA_MAX);
          return (
            <View key={d.chave} style={styles.colunaBarra}>
              <Text style={styles.valorBarra}>{d.pontos}</Text>
              <View style={[styles.barraVertical, { height: altura }]} />
              <Text style={styles.labelBarra}>{d.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function GraficoPorTipo({ dados }: { dados: DesempenhoPorTipo[] }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitulo}>🎯 Acerto por tipo de jogo</Text>
      {dados.map((d) => {
        const visual = VISUAL_POR_TIPO[d.tipo] ?? VISUAL_PADRAO;
        return (
          <View key={d.tipo} style={styles.linhaTipo}>
            <View style={styles.linhaTipoHeader}>
              <Text style={styles.linhaTipoIcone}>{visual.icone}</Text>
              <Text style={styles.linhaTipoNome}>{visual.nome}</Text>
              <Text style={styles.linhaTipoPercentual}>{d.percentual}%</Text>
            </View>
            <View style={styles.barraFundoHorizontal}>
              <View
                style={[
                  styles.barraPreenchidaHorizontal,
                  { width: `${d.percentual}%`, backgroundColor: visual.cor },
                ]}
              />
            </View>
            <Text style={styles.linhaTipoPartidas}>
              {d.totalPartidas} {d.totalPartidas === 1 ? 'partida' : 'partidas'}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

export default function EvolucaoScreen({ navigation }: Props) {
  const { chamarApiAutenticada } = useApiAutenticada();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await comRetry(() =>
        chamarApiAutenticada((tokenAtual) => buscarHistoricoApi(tokenAtual))
      );
      if (!resposta.ok) {
        throw new Error(resposta.erro || 'Não foi possível carregar sua evolução.');
      }
      setHistorico(resposta.historico ?? []);
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível carregar sua evolução.');
    } finally {
      setCarregando(false);
    }
  }

  const pontosPorDia = agruparPontosPorDia(historico);
  const porTipo = agruparPorTipo(historico);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>📊 Evolução</Text>
        <View style={{ width: 60 }} />
      </View>

      {carregando && (
        <View style={styles.centralizado}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!carregando && erro && (
        <View style={styles.centralizado}>
          <Text style={styles.erroTexto}>{erro}</Text>
          <BotaoGrande titulo="Tentar de novo" icone="🔄" onPress={carregarDados} cor={colors.primary} />
        </View>
      )}

      {!carregando && !erro && historico.length === 0 && (
        <View style={styles.centralizado}>
          <Text style={styles.vazioTexto}>
            Ainda não tem dados suficientes pra mostrar sua evolução.{'\n'}Jogue algumas partidas!
          </Text>
          <BotaoGrande
            titulo="Ir pra Home"
            icone="🏠"
            onPress={() => navigation.navigate('Home')}
            cor={colors.primary}
          />
        </View>
      )}

      {!carregando && !erro && historico.length > 0 && (
        <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
          <CartaoInsight porTipo={porTipo} />
          <GraficoPontosPorDia dados={pontosPorDia} />
          <GraficoPorTipo dados={porTipo} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  voltarTexto: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    width: 60,
  },
  titulo: {
    color: colors.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  centralizado: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  erroTexto: {
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  vazioTexto: {
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 15,
    lineHeight: 22,
  },
  conteudo: {
    padding: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  insightTextoNeutro: {
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
  linhaInsight: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  insightIcone: {
    fontSize: 18,
    marginRight: 10,
  },
  insightTexto: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  insightDestaque: {
    fontWeight: 'bold',
  },
  graficoBarras: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
  },
  colunaBarra: {
    alignItems: 'center',
    flex: 1,
  },
  valorBarra: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  barraVertical: {
    width: 22,
    backgroundColor: colors.primary,
    borderRadius: 6,
  },
  labelBarra: {
    fontSize: 10,
    color: colors.textLight,
    marginTop: 6,
  },
  linhaTipo: {
    marginBottom: 16,
  },
  linhaTipoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  linhaTipoIcone: {
    fontSize: 16,
    marginRight: 8,
  },
  linhaTipoNome: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  linhaTipoPercentual: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  barraFundoHorizontal: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.purpleLight,
    overflow: 'hidden',
    marginBottom: 4,
  },
  barraPreenchidaHorizontal: {
    height: '100%',
    borderRadius: 5,
  },
  linhaTipoPartidas: {
    fontSize: 11,
    color: colors.textLight,
  },
});