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

function formatarData(iso: string): string {
  const data = new Date(iso);
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const hora = String(data.getHours()).padStart(2, '0');
  const minuto = String(data.getMinutes()).padStart(2, '0');
  return `${dia}/${mes} às ${hora}:${minuto}`;
}

function formatarTempo(segundos: number): string {
  if (segundos < 60) return `${segundos}s`;
  const min = Math.floor(segundos / 60);
  const seg = segundos % 60;
  return `${min}min ${seg}s`;
}

export default function HistoricoScreen({ navigation }: Props) {
  const { chamarApiAutenticada } = useApiAutenticada();

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);

  useEffect(() => {
    carregarHistorico();
  }, []);

  async function carregarHistorico() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await comRetry(() =>
        chamarApiAutenticada((tokenAtual) => buscarHistoricoApi(tokenAtual))
      );
      if (!resposta.ok) {
        throw new Error(resposta.erro || 'Não foi possível carregar o histórico.');
      }
      setHistorico(resposta.historico ?? []);
    } catch (e: any) {
      setErro(e?.message || 'Não foi possível carregar o histórico.');
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
        <Text style={styles.titulo}>📜 Histórico</Text>
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
          <BotaoGrande titulo="Tentar de novo" icone="🔄" onPress={carregarHistorico} cor={colors.primary} />
        </View>
      )}

      {!carregando && !erro && historico.length === 0 && (
        <View style={styles.centralizado}>
          <Text style={styles.vazioTexto}>
            Você ainda não jogou nenhuma partida.{'\n'}Bora começar?
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
        <ScrollView contentContainerStyle={styles.lista} showsVerticalScrollIndicator={false}>
          {historico.map((item) => {
            const visual = VISUAL_POR_TIPO[item.tipoOperacao] ?? VISUAL_PADRAO;
            return (
              <View key={item.idDesempenho} style={[styles.card, { borderLeftColor: visual.cor }]}>
                <View style={[styles.icone, { backgroundColor: visual.cor }]}>
                  <Text style={styles.iconeTexto}>{visual.icone}</Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.nomeJogo} numberOfLines={1}>{item.nomeFase}</Text>
                  <Text style={styles.data}>{formatarData(item.dataHora)}</Text>
                  <Text style={styles.detalhes}>
                    {item.acertosPartida} acertos • {formatarTempo(item.tempoGasto)}
                  </Text>
                </View>
                <Text style={styles.pontos}>+{item.pontosGanhos} ⭐</Text>
              </View>
            );
          })}
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
  lista: {
    padding: 20,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  icone: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconeTexto: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  nomeJogo: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.text,
  },
  data: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  detalhes: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  pontos: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.success,
    marginLeft: 8,
  },
});