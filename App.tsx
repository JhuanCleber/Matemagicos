import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from './src/screens/LoginScreen';
import CadastroScreen from './src/screens/CadastroScreen';
import HomeScreen from './src/screens/HomeScreen';
import JogoScreen from './src/screens/JogoScreen';
import RankingScreen from './src/screens/RankingScreen';
import EsqueciSenhaScreen from './src/screens/EsqueciSenhaScreen';
import RedefinirSenhaScreen from './src/screens/RedefinirSenhaScreen';
import VerificarEmailScreen from './src/screens/VerificarEmailScreen';
import PerfilScreen from './src/screens/PerfilScreen';
import EditarPerfilScreen from './src/screens/EditarPerfilScreen';
import HistoricoScreen from './src/screens/HistoricoScreen';
import EvolucaoScreen from './src/screens/EvolucaoScreen';
import { UsuarioProvider, useUsuario } from './src/context/UsuarioContext';
import { useConectividade } from './src/hooks/useConectividade';
import { colors } from './src/theme/colors';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UsuarioProvider>
      <AppNavigator />
    </UsuarioProvider>
  );
}

function AppNavigator() {
  const { carregando, estaLogado } = useUsuario();


  if (carregando) {
    return (
      <View style={styles.telaCarregando}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.raiz}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={estaLogado ? 'Home' : 'Login'}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Cadastro" component={CadastroScreen} />
          <Stack.Screen name="EsqueciSenha" component={EsqueciSenhaScreen} />
          <Stack.Screen name="RedefinirSenha" component={RedefinirSenhaScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Perfil" component={PerfilScreen} />
          <Stack.Screen name="EditarPerfil" component={EditarPerfilScreen} />
          <Stack.Screen name="Historico" component={HistoricoScreen} />
          <Stack.Screen name="Evolucao" component={EvolucaoScreen} />
          <Stack.Screen name="VerificarEmail" component={VerificarEmailScreen} />
          <Stack.Screen name="Jogo" component={JogoScreen} />
          <Stack.Screen name="Ranking" component={RankingScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      <AvisoSemConexao />
    </View>
  );
}

// Banner flutuante que aparece em cima de QUALQUER tela quando o celular perde
// internet — não precisa mexer em cada tela individualmente, fica num lugar só.
function AvisoSemConexao() {
  const conectado = useConectividade();

  if (conectado) {
    return null;
  }

  return (
    <View style={styles.avisoConexao} pointerEvents="none">
      <Text style={styles.avisoConexaoTexto}>📡 Sem conexão com a internet</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: {
    flex: 1,
  },
  telaCarregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  avisoConexao: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: colors.danger,
    alignItems: 'center',
  },
  avisoConexaoTexto: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});