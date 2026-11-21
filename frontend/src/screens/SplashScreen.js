import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, { cancelAnimation, Easing, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { colors } from '../theme';

/**
 * Monta la animación sobre `Root`.
 * @param {object} props Propiedades de composición y callbacks definidos en la firma.
 * @returns {React.ReactElement|null} Vista y estados de carga correspondientes.
 */
export default function SplashScreen({ onFinish }) {
  const { width, height } = useWindowDimensions();
  // A filled ring opens a transparent circle onto the actual interface beneath it.
  const radius = Math.hypot(width, height) / 2 + 2;
  const [reducedMotion, setReducedMotion] = useState(null);
  const left = useSharedValue(-width / 2 - 120);
  const right = useSharedValue(width / 2 + 120);
  const opacity = useSharedValue(1);
  const visible = useSharedValue(0);
  const opening = useSharedValue(0);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((value) => { if (mounted) setReducedMotion(value); }).catch(() => { if (mounted) setReducedMotion(true); });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotion);
    return () => { mounted = false; subscription.remove(); };
  }, []);

  useEffect(() => {
    if (reducedMotion === null) return;
    opacity.value = 1;
    opening.value = 0;
    visible.value = withTiming(1, { duration: 120 });
    if (reducedMotion) {
      left.value = 0;
      right.value = 0;
    } else {
      const entry = { duration: 560, easing: Easing.bezier(0.76, 0, 0.24, 1) };
      const settle = { damping: 16, stiffness: 240, mass: 0.7 };
      left.value = -width / 2 - 120;
      right.value = width / 2 + 120;
      left.value = withSequence(withTiming(8, entry), withTiming(-12, { duration: 110 }), withSpring(0, settle));
      right.value = withSequence(withTiming(-8, entry), withTiming(12, { duration: 110 }), withSpring(0, settle));
    }
    if (reducedMotion) {
      opacity.value = withDelay(380, withTiming(0, { duration: 240 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }));
    } else {
      visible.value = withSequence(withTiming(1, { duration: 120 }), withDelay(930, withTiming(0, { duration: 160 })));
      opening.value = withDelay(1100, withTiming(1, { duration: 650, easing: Easing.bezier(0.23, 1, 0.32, 1) }, (finished) => {
        if (finished) runOnJS(onFinish)();
      }));
    }
    return () => { [left, right, opacity, visible, opening].forEach(cancelAnimation); };
  }, [reducedMotion, width, height, onFinish, left, right, opacity, visible, opening]);

  const overlayStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const ringStyle = useAnimatedStyle(() => ({ borderWidth: radius * (1 - opening.value) }));
  const leftStyle = useAnimatedStyle(() => ({ opacity: visible.value, transform: [{ translateX: left.value }] }));
  const rightStyle = useAnimatedStyle(() => ({ opacity: visible.value, transform: [{ translateX: right.value }] }));

  return (
    <Animated.View style={[styles.container, overlayStyle]} accessibilityLabel="EL, bienvenida" accessibilityRole="header">
      <StatusBar style="dark" />
      <Animated.View pointerEvents="none" style={[styles.ring, { width: radius * 2, height: radius * 2, borderRadius: radius, left: width / 2 - radius, top: height / 2 - radius }, ringStyle]} />
      <View style={styles.monogram} accessible={false}>
        <Animated.Text style={[styles.letter, leftStyle]}>E</Animated.Text>
        <Animated.Text style={[styles.letter, rightStyle]}>L</Animated.Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, zIndex: 10, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  ring: { position: 'absolute', borderColor: colors.bg },
  monogram: { flexDirection: 'row', alignItems: 'center' },
  letter: { color: colors.text, fontSize: 120, fontWeight: '900', letterSpacing: -9, paddingHorizontal: 2 }
});
