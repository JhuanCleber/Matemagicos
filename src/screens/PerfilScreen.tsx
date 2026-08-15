import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import BotaoGrande from '../components/BotaoGrande';
import { useUsuario } from '../context/UsuarioContext';

interface Props {
  navigation: any;
}

function LinhaInfo({ label, valor }: { label: string; valor: string }) {
  return (
    <View style={styles.linhaInfo}>
      <Text style={styles.linhaInfoLabel}>{label}</Text>
      <Text style={styles.linhaInfoValor}>{valor}</Text>
    </View>
  );
}

export default function PerfilScreen({ navigation }: Props) {
  const { usuario, deslogar } = useUsuario();

  async function handleSair() {
    await deslogar();
    navigation.navigate('Login');
  }

  if (!usuario) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>👤 Meu Perfil</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarTexto}>🧒</Text>
          </View>
          <Text style={styles.nome}>{usuario.nome}</Text>
          <TouchableOpacity
            style={styles.linkEditar}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('EditarPerfil')}
          >
            <Text style={styles.linkEditarTexto}>✏️ Editar perfil</Text>
          </TouchableOpacity>
        </View>

        {usuario.emailVerificado === false && (
          <TouchableOpacity
            style={styles.avisoEmail}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('VerificarEmail')}
          >
            <Text style={styles.avisoEmailTexto}>📩 Confirme seu email — toque aqui</Text>
          </TouchableOpacity>
        )}

        <View style={styles.card}>
          <LinhaInfo label="📧 Email" valor={usuario.email} />
          <View style={styles.linhaDivisor} />
          <LinhaInfo label="🎂 Idade" valor={`${usuario.idade} anos`} />
          {usuario.nivelEscolar != null && (
            <>
              <View style={styles.linhaDivisor} />
              <LinhaInfo label="🏫 Nível escolar" valor={String(usuario.nivelEscolar)} />
            </>
          )}
        </View>

        <View style={styles.cardDestaque}>
          <View style={styles.estatistica}>
            <Text style={styles.estatisticaValor}>{usuario.totalPontos ?? 0}</Text>
            <Text style={styles.estatisticaLabel}>⭐ pontos</Text>
          </View>
          <View style={styles.divisorVertical} />
          <View style={styles.estatistica}>
            <Text style={styles.estatisticaValor}>{usuario.moedasMagicas ?? 0}</Text>
            <Text style={styles.estatisticaLabel}>🪙 moedas mágicas</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.linkRanking}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Ranking')}
        >
          <Text style={styles.linkRankingTexto}>🏆 Ver ranking geral</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRanking}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Historico')}
        >
          <Text style={styles.linkRankingTexto}>📜 Ver histórico de partidas</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkRanking}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Evolucao')}
        >
          <Text style={styles.linkRankingTexto}>📊 Ver minha evolução</Text>
        </TouchableOpacity>

        <View style={styles.espacoBotaoSair}>
          <BotaoGrande titulo="Sair" icone="🚪" onPress={handleSair} cor={colors.danger} />
        </View>
      </ScrollView>
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
  conteudo: {
    padding: 20,
    paddingBottom: 40,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: colors.warning,
    marginBottom: 10,
  },
  avatarTexto: {
    fontSize: 46,
  },
  nome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  linkEditar: {
    marginTop: 6,
  },
  linkEditarTexto: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  avisoEmail: {
    backgroundColor: colors.warning,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  avisoEmailTexto: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
  linhaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linhaInfoLabel: {
    fontSize: 14,
    color: colors.textLight,
    fontWeight: '600',
  },
  linhaInfoValor: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '700',
  },
  linhaDivisor: {
    height: 1,
    backgroundColor: colors.purpleLight,
    opacity: 0.4,
    marginVertical: 10,
  },
  cardDestaque: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  estatistica: {
    flex: 1,
    alignItems: 'center',
  },
  estatisticaValor: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  estatisticaLabel: {
    fontSize: 13,
    color: colors.white,
    opacity: 0.9,
  },
  divisorVertical: {
    width: 1,
    height: 40,
    backgroundColor: colors.white,
    opacity: 0.3,
  },
  linkRanking: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  linkRankingTexto: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  espacoBotaoSair: {
    marginTop: 4,
  },
});