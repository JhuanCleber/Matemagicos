import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import BotaoGrande from '../components/BotaoGrande';
import { useUsuario } from '../context/UsuarioContext';
import { buscarRankingApi, RankingItem } from '../services/Rankingservice';

interface Props {
  navigation: any;
}

// Pódio com medalha pros 3 primeiros — o resto mostra só o número mesmo.
function medalhaOuPosicao(posicao: number): string {
  if (posicao === 1) return '🥇';
  if (posicao === 2) return '🥈';
  if (posicao === 3) return '🥉';
  return `${posicao}º`;
}

export default function RankingScreen({ navigation }: Props) {
  const { token } = useUsuario();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [top, setTop] = useState<RankingItem[]>([]);
  const [suaPosicao, setSuaPosicao] = useState<RankingItem | null>(null);

  useEffect(() => {
    carregarRanking();
  }, []);

  async function carregarRanking() {
    setCarregando(true);
    setErro(null);
    try {
      if (!token) {
        throw new Error('Sessão expirada. Volte e faça login de novo.');
      }
      const resposta = await buscarRankingApi(token);
      if (!resposta.ok) {
        throw new Error(resposta.erro || 'Não foi possível carregar o ranking.');
      }
      setTop(resposta.top ?? []);
      setSuaPosicao(resposta.suaPosicao ?? null);
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível carregar o ranking.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>🏆 Ranking</Text>
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
          <BotaoGrande titulo="Tentar de novo" icone="🔄" onPress={carregarRanking} cor={colors.primary} />
        </View>
      )}

      {!carregando && !erro && (
        <>
          <ScrollView contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}>
            {top.length === 0 && (
              <Text style={styles.vazioTexto}>Ainda não tem ninguém no ranking. Jogue uma partida pra ser o primeiro!</Text>
            )}

            {top.map((item) => (
              <View
                key={item.posicao}
                style={[styles.linha, item.voce && styles.linhaVoce]}
              >
                <Text style={styles.medalha}>{medalhaOuPosicao(item.posicao)}</Text>
                <Text style={[styles.nome, item.voce && styles.textoVoce]} numberOfLines={1}>
                  {item.nome}{item.voce ? ' (você)' : ''}
                </Text>
                <Text style={[styles.pontos, item.voce && styles.textoVoce]}>{item.totalPontos} pts</Text>
              </View>
            ))}
          </ScrollView>

          {suaPosicao && (
            <View style={styles.suaPosicaoBox}>
              <Text style={styles.suaPosicaoLabel}>Sua posição</Text>
              <View style={[styles.linha, styles.linhaVoce, styles.linhaSuaPosicao]}>
                <Text style={styles.medalha}>{medalhaOuPosicao(suaPosicao.posicao)}</Text>
                <Text style={[styles.nome, styles.textoVoce]} numberOfLines={1}>
                  {suaPosicao.nome} (você)
                </Text>
                <Text style={[styles.pontos, styles.textoVoce]}>{suaPosicao.totalPontos} pts</Text>
              </View>
            </View>
          )}
        </>
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
    marginTop: 40,
    paddingHorizontal: 24,
  },
  lista: {
    padding: 20,
    paddingBottom: 10,
  },
  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  linhaVoce: {
    backgroundColor: colors.primary,
  },
  linhaSuaPosicao: {
    marginBottom: 0,
  },
  medalha: {
    fontSize: 18,
    width: 40,
  },
  nome: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  pontos: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textLight,
  },
  textoVoce: {
    color: colors.white,
  },
  suaPosicaoBox: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 4,
  },
  suaPosicaoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textLight,
    marginBottom: 6,
  },
});