import React, { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { i18n, translateText } from '../i18n';
import { changeLanguage } from '../i18n/LanguageProvider';
import { Text, TouchableOpacity } from '../i18n/ui';
import { Btn, Msg } from './ui';
import Icon from './Icon';
import { colors } from '../theme';

export default function LanguagePicker() {
  useTranslation();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const select = async (language) => {
    try { await changeLanguage(language); setError(''); setOpen(false); }
    catch { setError('Ocurrió un error inesperado'); }
  };
  return <>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={translateText('Cambiar idioma')} onPress={() => setOpen(true)} style={styles.trigger}>
      <Text style={styles.code}>{i18n.language.toUpperCase()}</Text><Icon name="chevron-down" size={12} />
    </TouchableOpacity>
    <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.overlay}>
        <View accessibilityViewIsModal style={styles.sheet}>
          <Text style={styles.title}>Idioma</Text><Msg text={error} />
          {[['es', 'Español'], ['en', 'Inglés']].map(([code, label]) => <TouchableOpacity key={code} accessibilityRole="radio" accessibilityState={{ checked: i18n.language === code }} style={styles.option} onPress={() => select(code)}>
            <Text style={styles.optionText}>{label}</Text><Icon name={i18n.language === code ? 'checkmark-circle' : 'ellipse-outline'} />
          </TouchableOpacity>)}
          <Btn title="Cerrar" variant="ghost" onPress={() => setOpen(false)} />
        </View>
      </View>
    </Modal>
  </>;
}
const styles = StyleSheet.create({
  trigger: { alignSelf: 'flex-start', minHeight: 48, minWidth: 64, flexDirection: 'row', alignItems: 'center', gap: 6 },
  code: { color: colors.muted, fontSize: 11, fontWeight: '900' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 380, borderRadius: 28, padding: 24, backgroundColor: '#FAFAFC' },
  title: { fontSize: 24, fontWeight: '700', color: colors.text, marginBottom: 16 },
  option: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16, minHeight: 56 },
  optionText: { fontSize: 16, color: colors.text }
});
