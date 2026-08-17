import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { colors } from '../theme/colors';
import { useUsuario } from '../context/UsuarioContext';

interface Props {
  navigation: any;
}


const JOGOS = [
  {
    id: 1,
    titulo: 'Soma Mágica',
    descricao: 'Some os números e ganhe estrelas!',
    icone: '➕',
    cor: colors.success,
    tipoOperacao: 'soma',
    dificuldade: 'facil' as const,
  },
  {
    id: 2,
    titulo: 'Subtração Espacial',
    descricao: 'Explore o espaço subtraindo!',
    icone: '➖',
    cor: colors.secondary,
    tipoOperacao: 'subtracao',
    dificuldade: 'facil' as const,
  },
  {
    id: 3,
    titulo: 'Multiplicação Maluca',
    descricao: 'Multiplique e vire um craque!',
    icone: '✖️',
    cor: colors.primary,
    tipoOperacao: 'multiplicacao',
    dificuldade: 'medio' as const,
  },
  {
    id: 4,
    titulo: 'Divisão Divertida',
    descricao: 'Divida e vença os desafios!',
    icone: '➗',
    cor: colors.danger,
    tipoOperacao: 'divisao',
    dificuldade: 'medio' as const,
  },
  {
    id: 5,
    titulo: 'Formas Geométricas',
    descricao: 'Aprenda as formas brincando!',
    icone: '🔷',
    cor: '#9B59B6',
    tipoOperacao: 'geometria',
    dificuldade: 'facil' as const,
  },
  {
    id: 6,
    titulo: 'Contando até 100',
    descricao: 'Conte os objetos e ganhe pontos!',
    icone: '🔢',
    cor: '#3498DB',
    tipoOperacao: 'contagem',
    dificuldade: 'facil' as const,
  },
  {
    id: 7,
    titulo: 'Sequência Secreta',
    descricao: 'Descubra qual número vem depois!',
    icone: '🔮',
    cor: '#16A085',
    tipoOperacao: 'sequencia',
    dificuldade: 'facil' as const,
  },
  {
    id: 8,
    titulo: 'Símbolos Mágicos',
    descricao: 'Compare números com <, > e =!',
    icone: '⚖️',
    cor: '#E67E22',
    tipoOperacao: 'comparacao',
    dificuldade: 'facil' as const,
  },
  {
    id: 9,
    titulo: 'Hora da Aventura',
    descricao: 'Aprenda a ler as horas!',
    icone: '🕒',
    cor: '#2980B9',
    tipoOperacao: 'horas',
    dificuldade: 'facil' as const,
  },
  {
    id: 10,
    titulo: 'Cofrinho Mágico',
    descricao: 'Some moedas e notas!',
    icone: '💰',
    cor: '#D4AC0D',
    tipoOperacao: 'dinheiro',
    dificuldade: 'medio' as const,
  },
  {
    id: 11,
    titulo: 'Frações Coloridas',
    descricao: 'Descubra as partes pintadas!',
    icone: '🍕',
    cor: '#8E44AD',
    tipoOperacao: 'fracoes',
    dificuldade: 'medio' as const,
  },
];

export default function HomeScreen({ navigation }: Props) {

  const { usuario, deslogar } = useUsuario();
  const primeiroNome = usuario?.nome?.split(' ')[0] ?? 'matemágico(a)';

  async function handleSair() {
    await deslogar();
    navigation.navigate('Login');
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <View>
          <Text style={styles.saudacao}>
            Olá, {primeiroNome}! 👋
          </Text>
          <Text style={styles.nome}>Pronto para aprender?</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Perfil')}>
          <Text style={styles.avatarTexto}>🧒</Text>
        </TouchableOpacity>
      </View>

      {usuario?.emailVerificado === false && (
        <TouchableOpacity
          style={styles.avisoEmail}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('VerificarEmail')}
        >
          <Text style={styles.avisoEmailTexto}>
            📩 Confirme seu email — toque aqui
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.cardProgresso}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('Ranking')}
      >
        <View style={styles.progressoInfo}>
          <Text style={styles.progressoTitulo}>⭐ Sua jornada</Text>
          <Text style={styles.progressoSubtitulo}>
            {usuario?.totalPontos ?? 0} pontos • {usuario?.moedasMagicas ?? 0} moedas mágicas
          </Text>
        </View>
        <Text style={styles.progressoTexto}>
          🏆 Toque aqui pra ver o ranking!
        </Text>
      </TouchableOpacity>

      <Text style={styles.secaoTitulo}>🎮 Escolha um jogo</Text>

      <ScrollView
        style={styles.lista}
        contentContainerStyle={styles.listaConteudo}
        showsVerticalScrollIndicator={false}
      >
        {JOGOS.map((jogo) => (
          <TouchableOpacity
            key={jogo.id}
            style={[styles.jogoCard, { borderLeftColor: jogo.cor }]}
            activeOpacity={0.7}
            onPress={() =>
              navigation.navigate('Jogo', {
                idJogo: jogo.id,
                titulo: jogo.titulo,
                tipoOperacao: jogo.tipoOperacao,
                dificuldade: jogo.dificuldade,
                icone: jogo.icone,
                cor: jogo.cor,
              })
            }
          >
            <View style={[styles.jogoIcone, { backgroundColor: jogo.cor }]}>
              <Text style={styles.jogoIconeTexto}>{jogo.icone}</Text>
            </View>
            <View style={styles.jogoTexto}>
              <Text style={styles.jogoTitulo}>{jogo.titulo}</Text>
              <Text style={styles.jogoDescricao}>{jogo.descricao}</Text>
            </View>
            <Text style={styles.seta}>›</Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.botaoSair}
          onPress={handleSair}
        >
          <Text style={styles.botaoSairTexto}>🚪 Sair</Text>
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  saudacao: {
    color: colors.purpleLight,
    fontSize: 14,
  },
  nome: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 4,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.warning,
  },
  avatarTexto: {
    fontSize: 30,
  },
  avisoEmail: {
    backgroundColor: colors.warning,
    marginHorizontal: 24,
    marginTop: -12,
    marginBottom: 12,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  avisoEmailTexto: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  cardProgresso: {
    backgroundColor: colors.card,
    marginHorizontal: 24,
    marginTop: -12,
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  progressoInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  progressoSubtitulo: {
    fontSize: 13,
    color: colors.textLight,
  },
  barraFundo: {
    height: 12,
    backgroundColor: colors.purpleLight,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barraProgresso: {
    height: '100%',
    backgroundColor: colors.warning,
    borderRadius: 6,
  },
  progressoTexto: {
    fontSize: 13,
    color: colors.textLight,
    textAlign: 'center',
  },
  secaoTitulo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginHorizontal: 24,
    marginTop: 24,
    marginBottom: 14,
  },
  lista: {
    flex: 1,
  },
  listaConteudo: {
    paddingHorizontal: 24,
    paddingBottom: 30,
  },
  jogoCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  jogoIcone: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  jogoIconeTexto: {
    fontSize: 28,
  },
  jogoTexto: {
    flex: 1,
  },
  jogoTitulo: {
    fontSize: 17,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 2,
  },
  jogoDescricao: {
    fontSize: 13,
    color: colors.textLight,
  },
  seta: {
    fontSize: 32,
    color: colors.textLight,
    marginLeft: 8,
  },
  botaoSair: {
    marginTop: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  botaoSairTexto: {
    color: colors.danger,
    fontSize: 16,
    fontWeight: '600',
  },
});
