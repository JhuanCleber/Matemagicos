import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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
import { UsuarioProvider, useUsuario } from './src/context/UsuarioContext';
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
        <Stack.Screen name="VerificarEmail" component={VerificarEmailScreen} />
        <Stack.Screen name="Jogo" component={JogoScreen} />
        <Stack.Screen name="Ranking" component={RankingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  telaCarregando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});