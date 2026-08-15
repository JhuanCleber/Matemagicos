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
import { verificarEmailApi, reenviarVerificacaoApi } from '../services/authService';
import { useUsuario } from '../context/UsuarioContext';

interface Props {
  navigation: any;
}

export default function VerificarEmailScreen({ navigation }: Props) {
  const { usuario, atualizarUsuario } = useUsuario();

  const [codigo, setCodigo] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [reenviando, setReenviando] = useState(false);

  const email = usuario?.email ?? '';

  async function handleConfirmar() {
    if (!codigo.trim()) {
      Alert.alert('Ops!', 'Digite o código que enviamos pro seu email.');
      return;
    }

    setCarregando(true);
    try {
      const resultado = await verificarEmailApi(email, codigo.trim());
      if (!resultado.ok) {
        Alert.alert('Não rolou 😕', resultado.erro || 'Código inválido ou expirado.');
        return;
      }
      atualizarUsuario({ emailVerificado: true });
      Alert.alert(
        '🎉 Email confirmado!',
        'Sua conta está com tudo certo agora.',
        [{ text: 'Show!', onPress: () => navigation.navigate('Home') }]
      );
    } catch (erro: any) {
      Alert.alert('Não rolou 😕', erro?.message || 'Não foi possível confirmar o email.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleReenviar() {
    setReenviando(true);
    try {
      await reenviarVerificacaoApi(email);
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
        <TouchableOpacity style={styles.voltar} onPress={() => navigation.navigate('Home')}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>📩</Text>
          <Text style={styles.titulo}>Confirme seu email</Text>
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

          <BotaoGrande
            titulo={carregando ? 'Confirmando...' : 'Confirmar email'}
            icone="✅"
            onPress={handleConfirmar}
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

        <Text style={styles.rodape}>
          Pode confirmar mais tarde se quiser — só não esquece! 😉
        </Text>
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
  rodape: {
    textAlign: 'center',
    color: colors.purpleLight,
    marginTop: 20,
    fontSize: 13,
  },
});