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
import { fazerLogin } from '../data/usuarios';

interface Props {
  navigation: any;
}

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleLogin = () => {

    if (!email.trim() || !senha.trim()) {
      Alert.alert('Ops!', 'Preencha email e senha para continuar.');
      return;
    }

    setCarregando(true);

    setTimeout(() => {
      const resultado = fazerLogin(email.trim(), senha);
      setCarregando(false);

      if (!resultado.ok) {
        Alert.alert('Não rolou 😕', resultado.erro);
        return;
      }


      navigation.navigate('Home');
    }, 300);
  };

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
        <View style={styles.header}>
          <Text style={styles.logo}>🧙‍♂️</Text>
          <Text style={styles.titulo}>Matemágicos</Text>
          <Text style={styles.subtitulo}>Aprenda matemática brincando!</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitulo}>Entrar</Text>
          <Text style={styles.cardSubtitulo}>
            Bem-vindo de volta, pequeno(a) matemático(a)!
          </Text>

          <CampoTexto
            label="📧 Email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <CampoTexto
            label="🔒 Senha"
            placeholder="Digite sua senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={true}
            mostrarBotaoSenha={true}
          />

          <TouchableOpacity style={styles.esqueciSenha}>
            <Text style={styles.esqueciSenhaTexto}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <BotaoGrande
            titulo={carregando ? 'Entrando...' : 'Entrar'}
            icone="🚀"
            onPress={handleLogin}
            cor={colors.primary}
            desabilitado={carregando}
          />

          <View style={styles.divisor}>
            <View style={styles.linha} />
            <Text style={styles.divisorTexto}>ou</Text>
            <View style={styles.linha} />
          </View>

          <BotaoGrande
            titulo="Criar minha conta"
            icone="✨"
            onPress={() => navigation.navigate('Cadastro')}
            cor={colors.secondary}
          />
        </View>

        <Text style={styles.rodape}>Feito com 💜 para pequenos gênios</Text>
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
    paddingTop: 60,
    paddingBottom: 30,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 70,
    marginBottom: 10,
  },
  titulo: {
    fontSize: 38,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1,
  },
  subtitulo: {
    fontSize: 16,
    color: colors.purpleLight,
    marginTop: 6,
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
  cardTitulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 6,
  },
  cardSubtitulo: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 24,
  },
  esqueciSenha: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  esqueciSenhaTexto: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  linha: {
    flex: 1,
    height: 1,
    backgroundColor: colors.purpleLight,
  },
  divisorTexto: {
    marginHorizontal: 12,
    color: colors.textLight,
    fontWeight: '600',
  },
  rodape: {
    textAlign: 'center',
    color: colors.purpleLight,
    marginTop: 24,
    fontSize: 13,
  },
});
