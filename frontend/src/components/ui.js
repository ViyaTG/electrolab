import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput, TouchableOpacity } from '../i18n/ui';
import { colors } from '../theme';
import Icon from './Icon';

// Contenedor de pantalla con encabezado opcional (botón atrás + título).
export function Screen({ title, onBack, right, children, tab = false, scroll = true }) {
  const Body = scroll ? ScrollView : View;
  return (
    <View style={styles.screen}>
      {(title || onBack) && (
        <View style={styles.header}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} accessibilityRole="button" accessibilityLabel="Volver" style={styles.backBtn}>
              <Icon name="chevron-back" size={25} />
            </TouchableOpacity>
          ) : null}
          <Text style={styles.title}>{title}</Text>
          {right || null}
        </View>
      )}
      <Body
        style={styles.body}
        contentContainerStyle={scroll ? { paddingBottom: tab ? 120 : 40 } : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </Body>
    </View>
  );
}

const VARIANTS = {
  primary: { backgroundColor: colors.primary },
  ok: { backgroundColor: '#171719' },
  danger: { backgroundColor: '#303035' },
  ghost: { backgroundColor: 'rgba(0, 0, 0, 0.07)', borderWidth: 1, borderColor: colors.border }
};

export function Btn({ title, onPress, variant = 'primary', loading = false, disabled = false, style, small = false }) {
  return (
    <TouchableOpacity
      style={[styles.btn, small && styles.btnSmall, VARIANTS[variant], (disabled || loading) && { opacity: 0.55 }, style]}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color={variant === 'ghost' ? colors.text : '#FFFFFF'} /> : <Text style={[styles.btnText, variant === 'ghost' && { color: colors.text }, small && { fontSize: 13 }]}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function Field({ label, style, ...props }) {
  return (
    <View style={style}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput accessibilityLabel={label || props.placeholder} style={styles.input} placeholderTextColor={colors.dim} autoCapitalize="none" {...props} />
    </View>
  );
}

export function Msg({ text, type = 'error' }) {
  if (!text) return null;
  const isError = type === 'error';
  return (
    <View accessibilityRole="alert" style={[styles.msg, isError ? styles.msgError : styles.msgOk]}>
      <Icon name={isError ? 'alert-circle-outline' : 'checkmark-circle-outline'} size={20} />
      <Text style={[styles.msgText, { color: isError ? colors.dangerText : '#303035' }]}>{text}</Text>
    </View>
  );
}

export function Chip({ label, icon, active, onPress }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityState={{ selected: !!active }} style={[styles.chip, active && styles.chipActive]} onPress={onPress}>
      {icon ? <Icon name={icon} size={18} /> : null}
      <Text style={[styles.chipText, active && { color: colors.accent }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Selector segmentado (pestañas dentro de una pantalla).
export function Segmented({ options, value, onChange }) {
  return (
    <View accessibilityRole="tablist" style={styles.segmented}>
      {options.map((o) => (
        <TouchableOpacity key={o.key} accessibilityRole="tab" accessibilityState={{ selected: value === o.key }} style={[styles.segment, value === o.key && styles.segmentActive]} onPress={() => onChange(o.key)}>
          <Text style={[styles.segmentText, value === o.key && { color: colors.accent }]}>{o.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function Empty({ text }) {
  return <Text style={styles.empty}>{text}</Text>;
}

export function Loading() {
  return <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 30 }} />;
}

export function Badge({ text, color = colors.accent, bg = 'rgba(0, 0, 0, 0.07)' }) {
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: color }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export const textStyles = StyleSheet.create({
  h2: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 6 },
  strong: { color: colors.text, fontSize: 15, fontWeight: '700' },
  muted: { color: colors.muted, fontSize: 12, marginTop: 3, lineHeight: 17 },
  accent: { color: colors.accent, fontSize: 12, fontWeight: '700' }
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, paddingTop: 12 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 20, minHeight: 52 },
  backBtn: { marginRight: 10, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.8)', borderRadius: 24 },
  backText: { color: colors.accent, fontSize: 34, lineHeight: 34, fontWeight: '300' },
  title: { color: colors.text, fontSize: 28, letterSpacing: -0.8, fontWeight: '700', flex: 1 },
  body: { flex: 1, paddingHorizontal: 16 },
  btn: { minHeight: 50, paddingVertical: 14, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  btnSmall: { minHeight: 48, paddingVertical: 8, paddingHorizontal: 14, marginTop: 0 },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  label: { color: colors.soft, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.field, borderWidth: 1, borderColor: colors.border, borderRadius: 18, minHeight: 50,
    paddingHorizontal: 14, paddingVertical: 11, color: colors.text, marginBottom: 14
  },
  msg: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14, borderRadius: 18, marginBottom: 12, borderWidth: 1 },
  msgError: { backgroundColor: 'rgba(0, 0, 0, 0.08)', borderColor: 'rgba(0, 0, 0, 0.08)' },
  msgOk: { backgroundColor: 'rgba(0, 0, 0, 0.08)', borderColor: 'rgba(0, 0, 0, 0.08)' },
  msgText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 48, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 24, borderWidth: 1, borderColor: colors.border, marginRight: 8, marginBottom: 8 },
  chipActive: { backgroundColor: 'rgba(0, 0, 0, 0.07)', borderColor: 'rgba(0, 0, 0, 0.07)' },
  chipText: { color: colors.muted, fontSize: 13, fontWeight: '600' },
  segmented: { flexDirection: 'row', backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 12, padding: 4, marginBottom: 14 },
  segment: { flex: 1, minHeight: 48, justifyContent: 'center', paddingVertical: 9, borderRadius: 9, alignItems: 'center' },
  segmentActive: { backgroundColor: 'rgba(0, 0, 0, 0.07)' },
  segmentText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  empty: { color: colors.muted, textAlign: 'center', marginTop: 48, paddingHorizontal: 24, fontSize: 15, lineHeight: 23 },
  badge: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700' }
});
