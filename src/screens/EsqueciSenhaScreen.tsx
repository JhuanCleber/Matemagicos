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
import { esqueciSenhaApi } from '../services/authService';

interface Props {
  navigation: any;
}

export default function EsqueciSenhaScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleEnviar() {
    if (!email.trim()) {
      Alert.alert('Ops!', 'Digite seu email para continuar.');
      return;
    }

    setCarregando(true);
    try {
      const resultado = await esqueciSenhaApi(email.trim());
      if (!resultado.ok) {
        Alert.alert('Não rolou 😕', resultado.erro || 'Erro ao pedir o código.');
        return;
      }
      // O back-end nunca revela se o email existe ou não — a mensagem é sempre
      // a mesma, então seguimos direto pra tela de código independente do resultado.
      navigation.navigate('RedefinirSenha', { email: email.trim() });
    } catch (erro: any) {
      Alert.alert('Não rolou 😕', erro?.message || 'Erro ao pedir o código.');
    } finally {
      setCarregando(false);
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
          <Text style={styles.logo}>🔑</Text>
          <Text style={styles.titulo}>Esqueceu a senha?</Text>
          <Text style={styles.subtitulo}>Sem problema! Vamos te enviar um código.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardSubtitulo}>
            Digite o email da sua conta. Se ele estiver cadastrado, você vai
            receber um código de 6 dígitos em instantes.
          </Text>

          <CampoTexto
            label="📧 Email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <BotaoGrande
            titulo={carregando ? 'Enviando...' : 'Enviar código'}
            icone="✉️"
            onPress={handleEnviar}
            cor={colors.primary}
            desabilitado={carregando}
          />
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
  cardSubtitulo: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 20,
    lineHeight: 20,
  },
});