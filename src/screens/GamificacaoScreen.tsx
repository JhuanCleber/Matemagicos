import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors } from '../theme/colors';
import BotaoGrande from '../components/BotaoGrande';
import { useApiAutenticada } from '../hooks/useApiAutenticada';
import { useUsuario } from '../context/UsuarioContext';
import { comRetry } from '../utils/fetchComRetry';
import { buscarGamificacaoApi, comprarItemApi, equiparItemApi, Gamificacao, ItemLoja } from '../services/gamificacaoService';
import { obterAvatar } from '../theme/avatarVisual';
import { VISUAL_PADRAO, VISUAL_POR_TIPO } from '../theme/jogosVisual';

interface Props { navigation: any; }

export default function GamificacaoScreen({ navigation }: Props) {
  const { chamarApiAutenticada } = useApiAutenticada();
  const { atualizarUsuario } = useUsuario();
  const [dados, setDados] = useState<Gamificacao | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [processando, setProcessando] = useState<string | null>(null);

  useEffect(() => { carregar(); }, []);

  async function carregar() {
    setCarregando(true); setErro(null);
    try {
      const resposta = await comRetry(() => chamarApiAutenticada((token) => buscarGamificacaoApi(token)));
      if (!resposta.ok || !resposta.gamificacao) throw new Error(resposta.erro || 'Não foi possível carregar sua jornada.');
      aplicarDados(resposta.gamificacao);
    } catch (e: any) { setErro(e?.message || 'Não foi possível carregar sua jornada.'); }
    finally { setCarregando(false); }
  }

  function aplicarDados(gamificacao: Gamificacao) {
    setDados(gamificacao);
    atualizarUsuario({ moedasMagicas: gamificacao.moedasMagicas, avatarId: gamificacao.avatarId, molduraId: gamificacao.molduraId });
  }

  async function agirComItem(item: ItemLoja) {
    setProcessando(item.id);
    try {
      const resposta = await chamarApiAutenticada((token) => item.comprado
        ? equiparItemApi(item.id, token)
        : comprarItemApi(item.id, token));
      if (!resposta.ok || !resposta.gamificacao) throw new Error(resposta.erro || 'Não foi possível atualizar o item.');
      aplicarDados(resposta.gamificacao);
      Alert.alert(item.comprado ? '✨ Item equipado!' : '🎉 Compra realizada!', item.comprado ? 'Seu visual ficou incrível!' : 'O item já está equipado no seu perfil.');
    } catch (e: any) { Alert.alert('Não rolou 😕', e?.message || 'Tente de novo.'); }
    finally { setProcessando(null); }
  }

  if (carregando) return <View style={styles.centralizado}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (erro || !dados) return <View style={styles.centralizado}><Text style={styles.erro}>{erro}</Text><BotaoGrande titulo="Tentar de novo" icone="🔄" onPress={carregar} cor={colors.primary} /></View>;

  const avatar = obterAvatar(dados.avatarId, dados.molduraId);
  const conquistadas = dados.conquistas.filter((conquista) => conquista.desbloqueada).length;
  return (
    <View style={styles.container}>
      <View style={styles.header}><TouchableOpacity onPress={() => navigation.goBack()}><Text style={styles.voltar}>← Voltar</Text></TouchableOpacity><Text style={styles.titulo}>✨ Minha jornada</Text><View style={styles.espacador} /></View>
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <View style={styles.nivelCard}>
          <View style={[styles.avatar, { borderColor: avatar.cor }]}><Text style={styles.avatarTexto}>{avatar.emoji}</Text></View>
          <View style={styles.nivelInfo}><Text style={styles.nivelTitulo}>{dados.tituloNivel}</Text><Text style={styles.moedas}>🪙 {dados.moedasMagicas} moedas mágicas</Text></View>
          <View style={styles.barraFundo}><View style={[styles.barraNivel, { width: `${dados.percentualNivel}%` }]} /></View>
          <Text style={styles.proximoNivel}>{dados.pontosParaProximoNivel > 0 ? `Faltam ${dados.pontosParaProximoNivel} pontos para o próximo título!` : 'Você alcançou o título máximo! 🏆'}</Text>
        </View>

        <View style={styles.streakCard}><Text style={styles.streakIcone}>🔥</Text><View><Text style={styles.streakTitulo}>{dados.streakDias} {dados.streakDias === 1 ? 'dia seguido' : 'dias seguidos'}</Text><Text style={styles.streakTexto}>{dados.streakDias > 0 ? 'Continue jogando para manter sua chama acesa!' : 'Jogue hoje e comece sua sequência!'}</Text></View></View>

        <Text style={styles.secao}>🏅 Conquistas ({conquistadas}/{dados.conquistas.length})</Text>
        <View style={styles.card}>{dados.conquistas.map((conquista) => <View key={conquista.id} style={[styles.conquista, !conquista.desbloqueada && styles.conquistaBloqueada]}><Text style={styles.conquistaIcone}>{conquista.desbloqueada ? conquista.icone : '🔒'}</Text><View style={styles.flex}><Text style={styles.conquistaNome}>{conquista.nome}</Text><Text style={styles.conquistaDescricao}>{conquista.descricao}</Text></View></View>)}</View>

        <Text style={styles.secao}>🎮 Progresso dos jogos</Text>
        <View style={styles.card}>{dados.progressoJogos.map((jogo) => { const visual = VISUAL_POR_TIPO[jogo.tipoOperacao] ?? VISUAL_PADRAO; return <View key={jogo.idJogo} style={styles.progressoJogo}><View style={styles.linhaJogo}><Text style={styles.jogoNome}>{visual.icone} {jogo.nomeFase}</Text><Text style={styles.jogoPercentual}>{jogo.percentual}%</Text></View><View style={styles.barraFundo}><View style={[styles.barraJogo, { width: `${jogo.percentual}%`, backgroundColor: visual.cor }]} /></View><Text style={styles.partidas}>{jogo.partidas}/10 partidas</Text></View>; })}</View>

        <Text style={styles.secao}>🛍️ Loja mágica</Text>
        <Text style={styles.subtituloLoja}>Use suas moedas para personalizar seu avatar e sua moldura.</Text>
        {dados.itensLoja.map((item) => <View key={item.id} style={styles.itemLoja}><Text style={styles.itemIcone}>{item.icone}</Text><View style={styles.flex}><Text style={styles.itemNome}>{item.nome}</Text><Text style={styles.itemDescricao}>{item.descricao}</Text><Text style={styles.itemPreco}>{item.preco === 0 ? 'Item inicial' : `🪙 ${item.preco}`}</Text></View><TouchableOpacity disabled={item.equipado || processando === item.id} onPress={() => agirComItem(item)} style={[styles.botaoItem, item.equipado && styles.botaoEquipado]}><Text style={styles.botaoItemTexto}>{processando === item.id ? '...' : item.equipado ? 'Usando' : item.comprado ? 'Usar' : 'Comprar'}</Text></TouchableOpacity></View>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, centralizado: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background }, erro: { color: colors.text, textAlign: 'center', marginBottom: 18 },
  header: { backgroundColor: colors.primary, paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }, voltar: { color: colors.white, fontWeight: '700', width: 60 }, titulo: { color: colors.white, fontSize: 20, fontWeight: 'bold' }, espacador: { width: 60 }, conteudo: { padding: 20, paddingBottom: 36 },
  nivelCard: { backgroundColor: colors.card, borderRadius: 20, padding: 18, marginBottom: 14, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' }, avatar: { width: 62, height: 62, borderRadius: 31, borderWidth: 4, justifyContent: 'center', alignItems: 'center', marginRight: 12 }, avatarTexto: { fontSize: 34 }, nivelInfo: { flex: 1 }, nivelTitulo: { fontSize: 17, fontWeight: 'bold', color: colors.text }, moedas: { fontSize: 13, color: colors.textLight, marginTop: 3 }, barraFundo: { width: '100%', height: 10, borderRadius: 5, backgroundColor: colors.purpleLight, overflow: 'hidden', marginTop: 15 }, barraNivel: { height: '100%', backgroundColor: colors.warning, borderRadius: 5 }, proximoNivel: { width: '100%', color: colors.textLight, fontSize: 12, marginTop: 7, textAlign: 'center' },
  streakCard: { backgroundColor: '#FFF1E6', borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', marginBottom: 22 }, streakIcone: { fontSize: 42, marginRight: 14 }, streakTitulo: { color: colors.text, fontSize: 18, fontWeight: 'bold' }, streakTexto: { color: colors.textLight, fontSize: 13, marginTop: 3, flexShrink: 1 },
  secao: { fontSize: 19, fontWeight: 'bold', color: colors.text, marginBottom: 10 }, card: { backgroundColor: colors.card, borderRadius: 20, padding: 16, marginBottom: 22 }, conquista: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }, conquistaBloqueada: { opacity: 0.45 }, conquistaIcone: { fontSize: 28, marginRight: 12 }, flex: { flex: 1 }, conquistaNome: { color: colors.text, fontWeight: 'bold', fontSize: 15 }, conquistaDescricao: { color: colors.textLight, fontSize: 12, marginTop: 2 },
  progressoJogo: { marginBottom: 14 }, linhaJogo: { flexDirection: 'row', justifyContent: 'space-between' }, jogoNome: { color: colors.text, fontSize: 14, fontWeight: '600', flex: 1 }, jogoPercentual: { color: colors.text, fontWeight: 'bold' }, barraJogo: { height: '100%', borderRadius: 5 }, partidas: { color: colors.textLight, fontSize: 11, marginTop: 4 },
  subtituloLoja: { color: colors.textLight, fontSize: 13, marginBottom: 10 }, itemLoja: { backgroundColor: colors.card, borderRadius: 18, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }, itemIcone: { fontSize: 32, marginRight: 10 }, itemNome: { color: colors.text, fontWeight: 'bold' }, itemDescricao: { color: colors.textLight, fontSize: 11, marginTop: 2 }, itemPreco: { color: colors.warning, fontWeight: 'bold', fontSize: 12, marginTop: 5 }, botaoItem: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 9, marginLeft: 8 }, botaoEquipado: { backgroundColor: colors.success }, botaoItemTexto: { color: colors.white, fontSize: 12, fontWeight: 'bold' },
});
