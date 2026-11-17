import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, TextInput, TouchableOpacity, Alert } from '../i18n/ui';
import GlassCard from '../components/GlassCard';
import { apiRequest } from '../api/client';

export default function ComponentCrudScreen({ token, selectedComponent, onSaved, onClearSelection }) {
  const isEditing = Boolean(selectedComponent && selectedComponent._id);
  const [sku, setSku] = useState('');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [encapsulado, setEncapsulado] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [especificaciones, setEspecificaciones] = useState('');
  const [cantidad, setCantidad] = useState('0');
  const [version, setVersion] = useState(0);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (selectedComponent) {
      setSku(selectedComponent.sku || '');
      setNombre(selectedComponent.nombre || '');
      setCategoria(selectedComponent.categoria || '');
      setEncapsulado(selectedComponent.encapsulado || '');
      setUbicacion(selectedComponent.ubicacion || '');
      setEspecificaciones(selectedComponent.especificaciones || '');
      setCantidad(String(selectedComponent.cantidad ?? 0));
      setVersion(selectedComponent.version ?? 0);
      setFeedback({ type: '', message: '' });
    } else {
      resetForm();
    }
  }, [selectedComponent]);

  const resetForm = () => {
    setSku(''); setNombre(''); setCategoria(''); setEncapsulado('');
    setUbicacion(''); setEspecificaciones(''); setCantidad('0'); setVersion(0);
    setFeedback({ type: '', message: '' });
  };

  const handleSave = async () => {
    setFeedback({ type: '', message: '' });
    try {
      if (isEditing) {
        const updated = await apiRequest(`/components/${selectedComponent._id}`, {
          method: 'PUT',
          token,
          body: { sku, nombre, categoria, encapsulado, ubicacion, especificaciones, cantidad: Number(cantidad), version }
        });
        setVersion(updated.version);
        setFeedback({ type: 'success', message: `Pieza actualizada correctamente (Nueva versión OCC: v${updated.version}).` });
        onSaved();
      } else {
        await apiRequest('/components', {
          method: 'POST',
          token,
          body: { sku, nombre, categoria, encapsulado, ubicacion, especificaciones, cantidad: Number(cantidad) }
        });
        resetForm();
        onSaved();
      }
    } catch (err) {
      if (err.status === 409 || err.code === 'OCC_CONFLICT') {
        setFeedback({
          type: 'error',
          message: err.message || 'Conflicto OCC: Otro trabajador modificó esta pieza simultáneamente.'
        });
        if (err.currentDocument) {
          setCantidad(String(err.currentDocument.cantidad));
          setVersion(err.currentDocument.version);
        }
      } else {
        setFeedback({ type: 'error', message: err.message });
      }
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    try {
      await apiRequest(`/components/${selectedComponent._id}`, { method: 'DELETE', token });
      resetForm();
      onClearSelection();
      onSaved();
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 110 }}>
      <GlassCard intensity={50}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{isEditing ? `Editar Pieza (OCC v${version})` : 'Registrar Nuevo Componente'}</Text>
          {isEditing && (
            <TouchableOpacity onPress={onClearSelection}>
              <Text style={styles.newLink}>+ Nuevo</Text>
            </TouchableOpacity>
          )}
        </View>
        {feedback.message ? (
          <View style={[styles.alertBox, feedback.type === 'error' ? styles.alertError : styles.alertSuccess]}>
            <Text style={styles.alertText}>{feedback.message}</Text>
          </View>
        ) : null}
        <Text style={styles.label}>SKU / Código de Parte</Text>
        <TextInput style={styles.input} placeholder="Ej. ESP32-WROOM-32 o SN74LS08N" placeholderTextColor="#6B6B72" value={sku} onChangeText={setSku} />
        <Text style={styles.label}>Nombre del Componente</Text>
        <TextInput style={styles.input} placeholder="Ej. Microcontrolador Dual-Core Wi-Fi/BLE" placeholderTextColor="#6B6B72" value={nombre} onChangeText={setNombre} />
        <Text style={styles.label}>Categoría</Text>
        <TextInput style={styles.input} placeholder="Ej. Microcontroladores / Compuertas Lógicas TTL" placeholderTextColor="#6B6B72" value={categoria} onChangeText={setCategoria} />
        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Encapsulado</Text>
            <TextInput style={styles.input} placeholder="DIP-14 / SMD" placeholderTextColor="#6B6B72" value={encapsulado} onChangeText={setEncapsulado} />
          </View>
          <View style={styles.col}>
            <Text style={styles.label}>Stock Actual</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={cantidad} onChangeText={setCantidad} />
          </View>
        </View>
        <Text style={styles.label}>Ubicación en Almacén / Laboratorio</Text>
        <TextInput style={styles.input} placeholder="Ej. Estante B, Gaveta 14" placeholderTextColor="#6B6B72" value={ubicacion} onChangeText={setUbicacion} />
        <Text style={styles.label}>Especificaciones Técnicas</Text>
        <TextInput style={[styles.input, { height: 70 }]} multiline placeholder="Ej. 3.3V, 520KB SRAM, 4MB Flash" placeholderTextColor="#6B6B72" value={especificaciones} onChangeText={setEspecificaciones} />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEditing ? 'Guardar con Validación OCC' : 'Registrar Componente'}</Text>
        </TouchableOpacity>
        {isEditing && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>Eliminar del Inventario</Text>
          </TouchableOpacity>
        )}
      </GlassCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 50, backgroundColor: '#F1F1F3' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { color: '#171719', fontSize: 19, fontWeight: '800' },
  newLink: { color: '#171719', fontWeight: '700' },
  alertBox: { padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 14 },
  alertError: { backgroundColor: 'rgba(0, 0, 0, 0.08)', borderColor: 'rgba(0, 0, 0, 0.08)' },
  alertSuccess: { backgroundColor: 'rgba(0, 0, 0, 0.08)', borderColor: 'rgba(0, 0, 0, 0.08)' },
  alertText: { color: '#171719', fontSize: 13, lineHeight: 18 },
  label: { color: '#38383D', fontSize: 12, fontWeight: '600', marginBottom: 5 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, color: '#171719', marginBottom: 12
  },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  saveBtn: { backgroundColor: '#171719', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  saveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  deleteBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.08)',
    paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 10
  },
  deleteBtnText: { color: '#303035', fontWeight: '700' }
});
