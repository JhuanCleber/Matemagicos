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
import { editarPerfilApi } from '../services/perfilService';

interface Props {
  navigation: any;
}

const IDADES = [5, 6, 7, 8, 9, 10];

export default function EditarPerfilScreen({ navigation }: Props) {
  const { usuario, atualizarUsuario } = useUsuario();
  const { chamarApiAutenticada } = useApiAutenticada();

  const [nome, setNome] = useState(usuario?.nome ?? '');
  const [idade, setIdade] = useState<number | null>(usuario?.idade ?? null);
  const [salvando, setSalvando] = useState(false);

  async function handleSalvar() {
    if (!nome.trim() || !idade) {
      Alert.alert('Ops!', 'Preencha o nome e a idade.');
      return;
    }

    setSalvando(true);
    try {
      const resposta = await chamarApiAutenticada((tokenAtual) =>
        editarPerfilApi(nome.trim(), idade, tokenAtual)
      );

      if (!resposta.ok || !resposta.usuario) {
        Alert.alert('Não rolou 😕', resposta.erro || 'Não foi possível salvar.');
        return;
      }

      atualizarUsuario({ nome: resposta.usuario.nome, idade: resposta.usuario.idade });

      Alert.alert('✅ Perfil atualizado!', 'Suas informações foram salvas.', [
        { text: 'Ok', onPress: () => navigation.navigate('Perfil') },
      ]);
    } catch (erro: any) {
      Alert.alert('Não rolou 😕', erro?.message || 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
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
          <Text style={styles.logo}>✏️</Text>
          <Text style={styles.titulo}>Editar Perfil</Text>
          <Text style={styles.subtitulo}>Atualize seu nome ou sua idade</Text>
        </View>

        <View style={styles.card}>
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
                <Text style={[styles.idadeTexto, idade === num && styles.idadeTextoAtivo]}>
                  {num}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <BotaoGrande
            titulo={salvando ? 'Salvando...' : 'Salvar'}
            icone="💾"
            onPress={handleSalvar}
            cor={colors.success}
            desabilitado={salvando}
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
    marginBottom: 20,
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
});