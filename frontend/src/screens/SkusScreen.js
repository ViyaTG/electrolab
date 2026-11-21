import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Alert, Text, TouchableOpacity } from '../i18n/ui';
import GlassCard from '../components/GlassCard';
import { Btn, Empty, Field, Loading, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors } from '../theme';

/**
 * Administra el registro de SKU.
 * @param {object} props Propiedades de composición y callbacks definidos en la firma.
 * @returns {React.ReactElement|null} Vista y estados de carga correspondientes.
 */
export default function SkusScreen() {
  const { api } = useAuth();
  const nav = useNav();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [editing, setEditing] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const load = useCallback(async () => {
    try { setItems(await api('/skus')); } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  }, [api]);
  useEffect(() => { load(); }, [load]);
  const clear = () => { setCode(''); setDescription(''); setEditing(null); };
  const save = async () => {
    if (!code.trim()) return setError('Escribe un código SKU.');
    setSaving(true); setError(''); setInfo('');
    try {
      await api(editing ? `/skus/${editing._id}` : '/skus', { method: editing ? 'PUT' : 'POST', body: { codigo: code.trim().toUpperCase(), descripcion: description.trim() } });
      setInfo(editing ? 'SKU actualizado.' : 'SKU creado.'); clear(); await load();
    } catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
  };
  const remove = (item) => Alert.alert('Eliminar SKU', `¿Eliminar "${item.codigo}"?`, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Eliminar', style: 'destructive', onPress: async () => {
      setError(''); setInfo(''); setSaving(true);
      try { await api(`/skus/${item._id}`, { method: 'DELETE' }); if (editing?._id === item._id) clear(); setInfo('SKU eliminado.'); await load(); }
      catch (e) { setError(errMsg(e)); } finally { setSaving(false); }
    } }
  ]);
  return <Screen title="SKU registrados" onBack={nav.back}>
    <GlassCard style={{ marginBottom: 16 }}>
      <Msg text={error} /><Msg text={info} type="ok" />
      <Field label="Código SKU" value={code} onChangeText={(value) => setCode(value.toUpperCase())} autoCapitalize="characters" autoCorrect={false} maxLength={40} placeholder="ESP32-S3" />
      <Field label="Descripción (opcional)" value={description} onChangeText={setDescription} maxLength={120} autoCapitalize="sentences" />
      <Btn title={editing ? 'Guardar cambios' : 'Agregar SKU'} onPress={save} loading={saving} />
      {editing ? <Btn title="Cancelar edición" variant="ghost" onPress={clear} disabled={saving} /> : null}
    </GlassCard>
    {loading ? <Loading /> : items.length === 0 ? <Empty text="Aún no hay SKU. Crea el primero." /> : items.map((item) => <GlassCard key={item._id} style={{ marginBottom: 12 }}>
      <Text style={styles.code}>{item.codigo}</Text>
      {item.descripcion ? <Text style={styles.description}>{item.descripcion}</Text> : null}
      <Text style={styles.description}>{item.productos} producto(s)</Text>
      <View style={styles.actions}>
        <TouchableOpacity accessibilityRole="button" disabled={saving} style={styles.action} onPress={() => { setEditing(item); setCode(item.codigo); setDescription(item.descripcion || ''); setError(''); setInfo(''); }}><Text>Editar</Text></TouchableOpacity>
        <TouchableOpacity accessibilityRole="button" disabled={saving} style={styles.action} onPress={() => remove(item)}><Text>Eliminar</Text></TouchableOpacity>
      </View>
    </GlassCard>)}
  </Screen>;
}
const styles = StyleSheet.create({ code: { fontSize: 17, color: colors.text, fontWeight: '700' }, description: { color: colors.muted, fontSize: 13, marginTop: 6 }, actions: { flexDirection: 'row', gap: 12, marginTop: 10 }, action: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 16, backgroundColor: '#EDEDEF', borderRadius: 24 } });
