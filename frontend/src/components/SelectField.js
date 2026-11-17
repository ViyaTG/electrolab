import React, { useState } from 'react';
import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { Text, TextInput, TouchableOpacity } from '../i18n/ui';
import { translateText } from '../i18n';
import Icon from './Icon';
import { Btn, Empty, Loading } from './ui';
import { colors } from '../theme';

export default function SelectField({ label, placeholder, value, options, onChange, searchable = false, loading = false }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const selected = options.find((option) => option.value === value);
  const visible = options.filter((option) => option.label.toLocaleLowerCase().includes(query.toLocaleLowerCase()));
  return <View style={styles.container}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={translateText(label)} accessibilityState={{ expanded: open }} style={styles.field} onPress={() => { setQuery(''); setOpen(true); }}>
      <Text style={[styles.value, !selected && { color: colors.dim }]}>{selected?.label || placeholder}</Text><Icon name="chevron-down" size={18} />
    </TouchableOpacity>
    <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
      <View style={styles.backdrop}><View accessibilityViewIsModal style={styles.sheet}>
        <Text style={styles.title}>{label}</Text>
        {searchable ? <TextInput accessibilityLabel={translateText('Buscar SKU')} placeholder="Buscar SKU" value={query} onChangeText={setQuery} style={styles.search} autoCapitalize="none" /> : null}
        <FlatList data={visible} keyExtractor={(option) => option.value} keyboardShouldPersistTaps="handled" ListEmptyComponent={loading ? <Loading /> : <Empty text="Sin resultados." />} renderItem={({ item }) => <TouchableOpacity accessibilityRole="radio" accessibilityState={{ checked: value === item.value, disabled: !!item.disabled }} disabled={item.disabled} style={[styles.option, item.disabled && { opacity: 0.45 }]} onPress={() => { onChange(item.value); setOpen(false); }}>
          <Text style={styles.value}>{item.label}</Text><Icon size={20} name={value === item.value ? 'checkmark-circle' : 'ellipse-outline'} />
        </TouchableOpacity>} />
        <Btn title="Cerrar" variant="ghost" onPress={() => setOpen(false)} />
      </View></View>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({
  container: { marginBottom: 14 }, label: { color: colors.soft, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  field: { minHeight: 50, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.field, borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  value: { color: colors.text, flex: 1, fontSize: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', padding: 24, justifyContent: 'center', alignItems: 'center' },
  sheet: { width: '100%', maxWidth: 480, maxHeight: '85%', backgroundColor: '#FAFAFC', padding: 20, borderRadius: 28 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', marginBottom: 16 },
  search: { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 16, padding: 12, marginBottom: 12, color: colors.text },
  option: { minHeight: 52, paddingVertical: 14, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 8, alignItems: 'center' }
});
