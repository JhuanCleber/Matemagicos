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
import { cadastrarUsuario } from '../data/usuarios';

interface Props {
  navigation: any;
}

const IDADES = [5, 6, 7, 8, 9, 10];

export default function CadastroScreen({ navigation }: Props) {
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleCadastro = () => {
    if (!nome.trim() || !idade || !email.trim() || !senha) {
      Alert.alert('Ops!', 'Preencha todos os campos para continuar.');
      return;
    }
    if (senha.length < 4) {
      Alert.alert('Senha fraca', 'A senha precisa ter pelo menos 4 caracteres.');
      return;
    }
    if (senha !== confirmarSenha) {
      Alert.alert('Ops!', 'As senhas não conferem.');
      return;
    }

    setCarregando(true);
    setTimeout(() => {
      const resultado = cadastrarUsuario({
        nome: nome.trim(),
        idade: idade!,
        email: email.trim(),
        senha,
      });
      setCarregando(false);

      if (!resultado.ok) {
        Alert.alert('Não rolou 😕', resultado.erro || 'Erro ao cadastrar.');
        return;
      }

      Alert.alert(
        '🎉 Conta criada!',
        `Bem-vindo(a) ao Matemágicos, ${nome}!`,
        [{ text: 'Bora jogar!', onPress: () => navigation.navigate('Home') }]
      );
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
        <TouchableOpacity style={styles.voltar} onPress={() => navigation.goBack()}>
          <Text style={styles.voltarTexto}>← Voltar</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.logo}>✨</Text>
          <Text style={styles.titulo}>Criar Conta</Text>
          <Text style={styles.subtitulo}>Junte-se à turma dos matemágicos!</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.secaoTitulo}>👤 Seus dados</Text>
          <CampoTexto
            label="Nome"
            placeholder="Como você se chama?"
            value={nome}
            onChangeText={setNome}
          />

          <Text style={styles.label}>🎂 Idade</Text>
          <View style={styles.idadesContainer}>
            {IDADES.map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.idadeBotao, idade === num && styles.idadeBotaoAtivo]}
                onPress={() => setIdade(num)}
              >
                <Text
                  style={[styles.idadeTexto, idade === num && styles.idadeTextoAtivo]}
                >
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.divisorCard} />

          <Text style={styles.secaoTitulo}>🔐 Sua conta</Text>
          <CampoTexto
            label="📧 Email"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />
          <CampoTexto
            label="🔒 Senha"
            placeholder="Crie uma senha"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry={true}
            mostrarBotaoSenha={true}
          />
          <CampoTexto
            label="🔒 Confirmar senha"
            placeholder="Digite a senha de novo"
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            secureTextEntry={true}
            mostrarBotaoSenha={true}
          />

          <BotaoGrande
            titulo={carregando ? 'Criando...' : 'Criar minha conta'}
            icone="🎉"
            onPress={handleCadastro}
            cor={colors.success}
            desabilitado={carregando}
          />
        </View>

        <Text style={styles.rodape}>
          Já tem conta?{' '}
          <Text style={styles.linkLogin} onPress={() => navigation.navigate('Login')}>
            Entrar
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  subtitulo: {
    fontSize: 15,
    color: colors.orangeLight,
    marginTop: 4,
  },
  card: {
    backgroundColor: colors.background,
    borderRadius: 30,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  secaoTitulo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  idadesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  idadeBotao: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.purpleLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idadeBotaoAtivo: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  idadeTexto: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  idadeTextoAtivo: {
    color: colors.white,
  },
  divisorCard: {
    height: 1,
    backgroundColor: colors.purpleLight,
    marginVertical: 18,
  },
  rodape: {
    textAlign: 'center',
    color: colors.white,
    marginTop: 20,
    fontSize: 15,
  },
  linkLogin: {
    color: colors.white,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
