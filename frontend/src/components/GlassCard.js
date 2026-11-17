import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';

export default function GlassCard({ children, style, intensity = 45, contentStyle }) {
  return (
    <View style={[styles.wrapper, style]}>
      <View style={styles.surface}>
        <BlurView intensity={intensity} tint="light" style={[styles.content, contentStyle]}>{children}</BlurView>
        <View pointerEvents="none" style={styles.highlight} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: 28, shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.06, shadowRadius: 18, elevation: 2 },
  surface: { borderRadius: 28, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.95)', backgroundColor: Platform.OS === 'android' ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.56)' },
  content: { padding: 20 },
  highlight: { ...StyleSheet.absoluteFillObject, borderRadius: 28, borderTopWidth: 1, borderLeftWidth: 1, borderColor: 'rgba(255,255,255,0.9)' }
});
