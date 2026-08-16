import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import CampoTexto from '../components/CampoTexto';
import BotaoGrande from '../components/BotaoGrande';
import { useUsuario } from '../context/UsuarioContext';
import { useApiAutenticada } from '../hooks/useApiAutenticada';
import { excluirContaApi } from '../services/perfilService';

interface Props {
  navigation: any;
}

export default function ExcluirContaScreen({ navigation }: Props) {
  const { deslogar } = useUsuario();
  const { chamarApiAutenticada } = useApiAutenticada();

  const [senha, setSenha] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  function confirmarExclusao() {
    if (!senha.trim()) {
      Alert.alert('Ops!', 'Digite sua senha pra confirmar.');
      return;
    }

    // Segunda confirmação, separada do campo de senha — pra garantir que não
    // foi um toque acidental no botão
    Alert.alert(
      'Tem certeza?',
      'Isso vai apagar sua conta e todo o seu progresso (pontos, moedas, histórico de partidas) PRA SEMPRE. Não tem como desfazer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sim, excluir', style: 'destructive', onPress: excluirDeVerdade },
      ]
    );
  }

  async function excluirDeVerdade() {
    setExcluindo(true);
    try {
      const resposta = await chamarApiAutenticada((tokenAtual) => excluirContaApi(senha, tokenAtual));

      if (!resposta.ok) {
        Alert.alert('Não rolou 😕', resposta.erro || 'Não foi possível excluir a conta.');
        return;
      }

      await deslogar();

      Alert.alert('Conta excluída', 'Sua conta foi apagada. Sentiremos sua falta! 💜', [
        {
          text: 'Ok',
          onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' }] }),
        },
      ]);
    } catch (erro: any) {
      Alert.alert('Não rolou 😕', erro?.message || 'Não foi possível excluir a conta.');
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>⚠️</Text>
          <Text style={styles.titulo}>Excluir Conta</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.aviso}>
            Essa ação é definitiva. Ao excluir sua conta, você perde pra sempre:
          </Text>
          <Text style={styles.listaItem}>• Todos os seus pontos e moedas mágicas</Text>
          <Text style={styles.listaItem}>• Seu histórico de partidas</Text>
          <Text style={styles.listaItem}>• Sua posição no ranking</Text>

          <View style={styles.divisor} />

          <CampoTexto
            label="🔒 Confirme sua senha"
            placeholder="Digite sua senha atual"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={true}
            mostrarBotaoSenha={true}
          />

          <BotaoGrande
            titulo={excluindo ? 'Excluindo...' : 'Excluir minha conta'}
            icone="🗑️"
            onPress={confirmarExclusao}
            cor={colors.danger}
            desabilitado={excluindo}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.danger,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 50,
    paddingBottom: 30,
  },
  voltar: {
    marginBottom: 12,
  },
  voltarTexto: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 56,
    marginBottom: 8,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.white,
    textAlign: 'center',
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 30,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  aviso: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginBottom: 10,
    lineHeight: 20,
  },
  listaItem: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 4,
  },
  divisor: {
    height: 1,
    backgroundColor: colors.purpleLight,
    opacity: 0.4,
    marginVertical: 18,
  },
});