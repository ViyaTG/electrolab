import React, { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, View } from 'react-native';
import { Alert, Text, TouchableOpacity } from '../i18n/ui';
import Icon from '../components/Icon';
import GlassCard from '../components/GlassCard';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import SelectField from '../components/SelectField';
import { Btn, Field, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors } from '../theme';

const toForm = (p) => ({
  sku: p?.sku || '',
  nombre: p?.nombre || '',
  categoria: p?.categoria?._id || p?.categoria || '',
  precio: p ? String(p.precio ?? 0) : '',
  cantidad: p ? String(p.cantidad ?? 0) : '',
  encapsulado: p?.encapsulado || '',
  ubicacion: p?.ubicacion || '',
  especificaciones: p?.especificaciones || '',
  codigoBarras: p?.codigoBarras || ''
});

export default function ProductFormScreen({ product }) {
  const { api } = useAuth();
  const nav = useNav();
  const [current, setCurrent] = useState(product || null); // documento base (con su versión OCC)
  const [form, setForm] = useState(toForm(product));
  const [categories, setCategories] = useState([]);
  const [skus, setSkus] = useState([]);
  const [skusLoading, setSkusLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [error, setError] = useState('');
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api('/categories').then(setCategories).catch((e) => setError(errMsg(e))); }, [api]);
  useEffect(() => { api('/skus').then(setSkus).catch((e) => setError(errMsg(e))).finally(() => setSkusLoading(false)); }, [api]);

  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const categoryName = categories.find((c) => c._id === form.categoria)?.nombre;

  const save = async () => {
    setError('');
    if (!form.sku) return setError('Selecciona un SKU registrado.');
    if (!form.categoria) return setError('Selecciona una categoría.');
    const precio = Number(form.precio);
    const cantidad = Number(form.cantidad);
    if (form.precio === '' || Number.isNaN(precio) || precio < 0) return setError('Ingresa un precio válido.');
    if (form.cantidad === '' || !Number.isInteger(cantidad) || cantidad < 0) return setError('La cantidad debe ser un número entero (0 o más).');

    const payload = {
      sku: form.sku.trim(), nombre: form.nombre.trim(), categoria: form.categoria, precio, cantidad,
      encapsulado: form.encapsulado.trim(), ubicacion: form.ubicacion.trim(), especificaciones: form.especificaciones.trim(),
      codigoBarras: form.codigoBarras.trim()
    };
    setLoading(true);
    try {
      if (current) {
        await api(`/products/${current._id}`, { method: 'PUT', body: { ...payload, version: current.version } });
      } else {
        await api('/products', { method: 'POST', body: payload });
      }
      nav.back();
    } catch (err) {
      if (err.code === 'OCC_CONFLICT') setConflict(err.currentDocument);
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const loadLatest = () => {
    setCurrent(conflict);
    setForm(toForm(conflict));
    setConflict(null);
    setError('');
  };

  const remove = () =>
    Alert.alert('Eliminar producto', `¿Eliminar "${current.nombre}" del inventario?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          try { await api(`/products/${current._id}`, { method: 'DELETE' }); nav.back(); } catch (err) { setError(errMsg(err)); }
        } }
    ]);

  return (
    <Screen title={current ? 'Editar producto' : 'Nuevo producto'} onBack={nav.back}>
      <GlassCard intensity={50}>
        <Msg text={error} />
        {conflict ? <Btn title="Cargar la versión actual" variant="ghost" onPress={loadLatest} style={{ marginBottom: 12 }} /> : null}

        <SelectField label="SKU" placeholder="Selecciona un SKU" value={form.sku} searchable loading={skusLoading} options={skus.map((sku) => ({ value: sku.codigo, label: `${sku.codigo}${sku.descripcion ? ` — ${sku.descripcion}` : ''}`, disabled: sku.productos > 0 && sku.codigo !== current?.sku }))} onChange={set('sku')} />
        {!skusLoading && skus.length === 0 ? <Text style={styles.link}>No hay SKU disponibles. Crea uno desde el perfil.</Text> : null}
        {skus.length > 0 && skus.every((sku) => sku.productos > 0 && sku.codigo !== current?.sku) ? <Text style={styles.link}>Todos los SKU están asignados. Crea uno desde el perfil.</Text> : null}
        <Field label="Nombre" value={form.nombre} onChangeText={set('nombre')} autoCapitalize="words" placeholder="Microcontrolador ESP32-S3" />

        <Text style={styles.label}>Categoría</Text>
        <TouchableOpacity style={styles.select} onPress={() => setPickerOpen(true)}>
          <Text style={[styles.selectText, !categoryName && { color: colors.dim }]}>{categoryName || 'Selecciona una categoría ▾'}</Text>
        </TouchableOpacity>
        {categories.length === 0 ? (
          <TouchableOpacity onPress={() => nav.push('Categories')}><Text style={styles.link}>No hay categorías. Crea una aquí →</Text></TouchableOpacity>
        ) : null}

        <View style={{ flexDirection: 'row' }}>
          <Field style={{ flex: 1, marginRight: 10 }} label="Precio ($)" value={form.precio} onChangeText={set('precio')} keyboardType="decimal-pad" placeholder="0.00" />
          <Field style={{ flex: 1 }} label="Cantidad" value={form.cantidad} onChangeText={set('cantidad')} keyboardType="number-pad" placeholder="0" />
        </View>

        <Text style={styles.label}>Código de barras</Text>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <Field style={{ flex: 1 }} value={form.codigoBarras} onChangeText={set('codigoBarras')} placeholder="Escanea o escribe el código" />
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Escanear código de barras" style={styles.scanBtn} onPress={() => setScanOpen(true)}><Icon name="scan-outline" /></TouchableOpacity>
        </View>

        <Field label="Encapsulado" value={form.encapsulado} onChangeText={set('encapsulado')} placeholder="DIP-14, SOIC-8..." />
        <Field label="Ubicación" value={form.ubicacion} onChangeText={set('ubicacion')} autoCapitalize="sentences" placeholder="Gaveta A1" />
        <Field label="Especificaciones" value={form.especificaciones} onChangeText={set('especificaciones')} multiline autoCapitalize="sentences" placeholder="Voltaje, frecuencia, notas técnicas..." />

        <Btn title={current ? 'Guardar cambios' : 'Registrar producto'} onPress={save} loading={loading} />
        {current ? <Btn title="Eliminar producto" variant="danger" onPress={remove} /> : null}
      </GlassCard>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setPickerOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Categorías</Text>
            <FlatList
              data={categories}
              keyExtractor={(c) => c._id}
              ListEmptyComponent={<Text style={styles.empty}>Aún no hay categorías.</Text>}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.option} onPress={() => { set('categoria')(item._id); setPickerOpen(false); }}>
                  <Text style={[styles.optionText, item._id === form.categoria && { color: colors.accent }]}>{item.nombre}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      <BarcodeScannerModal visible={scanOpen} onClose={() => setScanOpen(false)} onScanned={(code) => { set('codigoBarras')(code); setScanOpen(false); }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  label: { color: colors.soft, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  select: { backgroundColor: colors.field, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, marginBottom: 14 },
  selectText: { color: colors.text },
  link: { color: colors.accent, fontSize: 12, marginTop: -6, marginBottom: 14 },
  scanBtn: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginLeft: 8, backgroundColor: 'rgba(0, 0, 0, 0.07)', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.07)' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: '#FAFAFC', borderRadius: 16, padding: 16, maxHeight: '70%', borderWidth: 1, borderColor: colors.border },
  sheetTitle: { color: colors.text, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  option: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  optionText: { color: colors.text, fontSize: 15 },
  empty: { color: colors.muted, textAlign: 'center', padding: 16 }
});
