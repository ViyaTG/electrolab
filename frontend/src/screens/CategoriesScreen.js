import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GlassCard from '../components/GlassCard';
import { Btn, Empty, Field, Loading, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors } from '../theme';

export default function CategoriesScreen() {
  const { api } = useAuth();
  const nav = useNav();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = useCallback(async () => {
    try { setCategories(await api('/categories')); } catch (err) { setError(errMsg(err)); } finally { setLoading(false); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setError(''); setInfo('');
    try {
      if (editingId) {
        await api(`/categories/${editingId}`, { method: 'PUT', body: { nombre: name.trim() } });
        setInfo('Categoría actualizada. El cambio se refleja en todos sus productos.');
      } else {
        await api('/categories', { method: 'POST', body: { nombre: name.trim() } });
        setInfo('Categoría creada.');
      }
      setName(''); setEditingId(null);
      load();
    } catch (err) {
      setError(errMsg(err));
    }
  };

  const remove = (cat) =>
    Alert.alert('Eliminar categoría', `¿Eliminar "${cat.nombre}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          setError(''); setInfo('');
          try { await api(`/categories/${cat._id}`, { method: 'DELETE' }); setInfo('Categoría eliminada.'); load(); } catch (err) { setError(errMsg(err)); }
        }
      }
    ]);

  return (
    <Screen title="Categorías" onBack={nav.back}>
      <GlassCard style={{ marginBottom: 14 }} intensity={50}>
        <Msg text={error} />
        <Msg text={info} type="ok" />
        <Field label={editingId ? 'Nuevo nombre de la categoría' : 'Nueva categoría'} value={name} onChangeText={setName} autoCapitalize="sentences" placeholder="Ej. Resistencias" />
        <Btn title={editingId ? 'Guardar cambio' : 'Agregar categoría'} onPress={save} disabled={!name.trim()} />
        {editingId ? <Btn title="Cancelar edición" variant="ghost" onPress={() => { setEditingId(null); setName(''); }} /> : null}
      </GlassCard>

      {loading ? <Loading /> : categories.length === 0 ? <Empty text="Aún no hay categorías. Crea la primera para poder registrar productos." /> : categories.map((c) => (
        <GlassCard key={c._id} style={{ marginBottom: 10 }} intensity={40}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{c.nombre}</Text>
              <Text style={styles.meta}>{c.productos} producto(s)</Text>
            </View>
            <TouchableOpacity onPress={() => { setEditingId(c._id); setName(c.nombre); setError(''); setInfo(''); }}><Text style={styles.edit}>Editar</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => remove(c)}><Text style={styles.del}>Eliminar</Text></TouchableOpacity>
          </View>
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  edit: { color: colors.accent, fontWeight: '700', marginHorizontal: 12 },
  del: { color: colors.dangerText, fontWeight: '700' }
});
