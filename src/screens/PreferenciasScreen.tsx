import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Tema, TamanhoFonte, useExperiencia } from '../context/ExperienciaContext';

interface Props { navigation: any; }

function Opcao<T extends string>({ valor, atual, titulo, onPress }: { valor: T; atual: T; titulo: string; onPress: (valor: T) => void }) {
  const { paleta, escalaFonte } = useExperiencia();
  const selecionada = valor === atual;
  return <TouchableOpacity onPress={() => onPress(valor)} style={[styles.opcao, { borderColor: selecionada ? paleta.primary : paleta.border, backgroundColor: selecionada ? paleta.purpleLight : paleta.card }]}>
    <Text style={[styles.opcaoTexto, { color: paleta.text, fontSize: 15 * escalaFonte }]}>{selecionada ? '✓ ' : ''}{titulo}</Text>
  </TouchableOpacity>;
}

export default function PreferenciasScreen({ navigation }: Props) {
  const { paleta, tema, tamanhoFonte, leituraAtiva, definirTema, definirTamanhoFonte, definirLeituraAtiva, reiniciarOnboarding, escalaFonte } = useExperiencia();
  return <View style={[styles.container, { backgroundColor: paleta.background }]}>
    <View style={[styles.header, { backgroundColor: paleta.primary }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={[styles.voltar, { color: paleta.white }]}>← Voltar</Text></TouchableOpacity>
      <Text style={[styles.titulo, { color: paleta.white, fontSize: 20 * escalaFonte }]}>⚙️ Meu jeito de jogar</Text><View style={{ width: 60 }} />
    </View>
    <ScrollView contentContainerStyle={styles.conteudo}>
      <Text style={[styles.intro, { color: paleta.text, fontSize: 16 * escalaFonte }]}>Deixe o Matemágicos do seu jeitinho!</Text>
      <Text style={[styles.secao, { color: paleta.text, fontSize: 18 * escalaFonte }]}>🌙 Aparência</Text>
      <View style={styles.linha}><Opcao<Tema> valor="claro" atual={tema} titulo="Tema claro" onPress={definirTema} /><Opcao<Tema> valor="escuro" atual={tema} titulo="Modo escuro" onPress={definirTema} /></View>
      <Text style={[styles.secao, { color: paleta.text, fontSize: 18 * escalaFonte }]}>🔤 Tamanho das letras</Text>
      <Opcao<TamanhoFonte> valor="normal" atual={tamanhoFonte} titulo="Normal" onPress={definirTamanhoFonte} />
      <Opcao<TamanhoFonte> valor="grande" atual={tamanhoFonte} titulo="Grande" onPress={definirTamanhoFonte} />
      <Opcao<TamanhoFonte> valor="extraGrande" atual={tamanhoFonte} titulo="Extra grande" onPress={definirTamanhoFonte} />
      <Text style={[styles.secao, { color: paleta.text, fontSize: 18 * escalaFonte }]}>🔊 Ajuda de voz</Text>
      <TouchableOpacity onPress={() => definirLeituraAtiva(!leituraAtiva)} style={[styles.leitura, { backgroundColor: paleta.card, borderColor: paleta.border }]}>
        <Text style={[styles.opcaoTexto, { color: paleta.text, fontSize: 15 * escalaFonte }]}>{leituraAtiva ? '✓ Leitura automática ligada' : '○ Leitura automática desligada'}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={reiniciarOnboarding} style={[styles.tutorial, { borderColor: paleta.primary }]}><Text style={[styles.tutorialTexto, { color: paleta.primary, fontSize: 15 * escalaFonte }]}>🪄 Ver o tutorial novamente</Text></TouchableOpacity>
    </ScrollView>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1 }, header: { paddingTop: 50, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  voltar: { width: 60, fontWeight: '700' }, titulo: { fontWeight: 'bold', textAlign: 'center' }, conteudo: { padding: 20, paddingBottom: 42 }, intro: { fontWeight: '600', marginBottom: 24, textAlign: 'center' },
  secao: { fontWeight: 'bold', marginTop: 14, marginBottom: 10 }, linha: { flexDirection: 'row', gap: 8 }, opcao: { flex: 1, borderRadius: 16, padding: 14, borderWidth: 2, marginBottom: 8 }, opcaoTexto: { fontWeight: '700', textAlign: 'center' },
  leitura: { borderRadius: 16, padding: 16, borderWidth: 1 }, tutorial: { marginTop: 26, borderWidth: 2, borderRadius: 16, padding: 16 }, tutorialTexto: { fontWeight: 'bold', textAlign: 'center' },
});
