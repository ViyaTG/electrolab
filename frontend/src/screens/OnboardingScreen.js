import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import GlassCard from '../components/GlassCard';

export default function OnboardingScreen({ onStartLogin }) {
  return (
    <View style={styles.container}>
      <View style={styles.glowCircleTop} />
      <View style={styles.glowCircleBottom} />
      <GlassCard style={styles.card} intensity={55}>
        <Text style={styles.badge}>MVP v0.1.0 • ACCESO INTERNO</Text>
        <Text style={styles.title}>ElectroStock Lab</Text>
        <Text style={styles.subtitle}>
          Gestión de inventario de componentes electrónicos con búsqueda difusa (Fuzzy Search) y
          Control de Concurrencia Optimista (OCC) en tiempo real.
        </Text>
        <TouchableOpacity style={styles.primaryButton} onPress={onStartLogin}>
          <Text style={styles.primaryButtonText}>Iniciar Sesión para Trabajadores</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F1F1F3' },
  glowCircleTop: {
    position: 'absolute', top: 80, left: -40, width: 220, height: 220,
    borderRadius: 110, backgroundColor: 'rgba(0, 0, 0, 0.07)'
  },
  glowCircleBottom: {
    position: 'absolute', bottom: 90, right: -30, width: 240, height: 240,
    borderRadius: 120, backgroundColor: 'rgba(0, 0, 0, 0.07)'
  },
  card: { paddingVertical: 12 },
  badge: { color: '#171719', fontSize: 11, fontWeight: '700', letterSpacing: 1.2, marginBottom: 10 },
  title: { color: '#171719', fontSize: 30, fontWeight: '800', marginBottom: 12 },
  subtitle: { color: '#38383D', fontSize: 15, lineHeight: 22, marginBottom: 28 },
  primaryButton: {
    backgroundColor: '#171719', paddingVertical: 15, borderRadius: 14,
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.07)'
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' }
});
