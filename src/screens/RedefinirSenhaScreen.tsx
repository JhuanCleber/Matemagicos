import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { colors } from '../theme/colors';
import CampoTexto from '../components/CampoTexto';
import BotaoGrande from '../components/BotaoGrande';
import { esqueciSenhaApi, redefinirSenhaApi } from '../services/authService';

interface Props {
  navigation: any;
  route: any;
}

export default function RedefinirSenhaScreen({ navigation, route }: Props) {
  const { email } = route.params as { email: string };

  const [codigo, setCodigo] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  async function handleRedefinir() {
    if (!codigo.trim() || !novaSenha || !confirmarSenha) {
      Alert.alert('Ops!', 'Preencha todos os campos para continuar.');
      return;
    }
    if (novaSenha.length < 4) {
      Alert.alert('Senha fraca', 'A senha precisa ter pelo menos 4 caracteres.');
      return;
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Ops!', 'As senhas não conferem.');
      return;
    }

    setCarregando(true);
    try {
      const resultado = await redefinirSenhaApi(email, codigo.trim(), novaSenha);
      if (!resultado.ok) {
        Alert.alert('Não rolou 😕', resultado.erro || 'Código inválido ou expirado.');
        return;
      }
      Alert.alert(
        '🎉 Senha redefinida!',
        'Sua senha foi alterada. Faça login com a senha nova.',
        [{ text: 'Ir para o login', onPress: () => navigation.navigate('Login') }]
      );
    } catch (erro: any) {
      Alert.alert('Não rolou 😕', erro?.message || 'Não foi possível redefinir a senha.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleReenviar() {
    setReenviando(true);
    try {
      await esqueciSenhaApi(email);
      Alert.alert('Código reenviado 📩', 'Confira sua caixa de entrada de novo.');
    } catch (erro: any) {
      Alert.alert('Não rolou 😕', erro?.message || 'Não foi possível reenviar o código.');
    } finally {
      setReenviando(false);
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
          <Text style={styles.logo}>📩</Text>
          <Text style={styles.titulo}>Digite o código</Text>
          <Text style={styles.subtitulo}>Enviamos um código de 6 dígitos para{'\n'}{email}</Text>
        </View>

        <View style={styles.card}>
          <CampoTexto
            label="🔢 Código"
            placeholder="000000"
            value={codigo}
            onChangeText={setCodigo}
            keyboardType="number-pad"
          />
          <CampoTexto
            label="🔒 Senha nova"
            placeholder="Crie uma senha nova"
            value={novaSenha}
            onChangeText={setNovaSenha}
            secureTextEntry={true}
            mostrarBotaoSenha={true}
          />
          <CampoTexto
            label="🔒 Confirmar senha nova"
            placeholder="Digite a senha nova de novo"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry={true}
            mostrarBotaoSenha={true}
          />

          <BotaoGrande
            titulo={carregando ? 'Redefinindo...' : 'Redefinir senha'}
            icone="✅"
            onPress={handleRedefinir}
            cor={colors.success}
            desabilitado={carregando}
          />

          <TouchableOpacity
            style={styles.reenviar}
            onPress={handleReenviar}
            disabled={reenviando}
          >
            <Text style={styles.reenviarTexto}>
              {reenviando ? 'Reenviando...' : 'Não recebeu? Reenviar código'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
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
  subtitulo: {
    fontSize: 15,
    color: colors.purpleLight,
    marginTop: 6,
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
  reenviar: {
    alignSelf: 'center',
    marginTop: 16,
  },
  reenviarTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});