import React, { useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from '../i18n/ui';
import * as ImagePicker from 'expo-image-picker';
import Icon from '../components/Icon';
import GlassCard from '../components/GlassCard';
import AppointmentCalendar from '../components/AppointmentCalendar';
import { Btn, Chip, Field, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors, money } from '../theme';

const MAX_PHOTO_CHARS = 1400000;

export default function RefundRequestScreen({ sale, item }) {
  const { api } = useAuth();
  const nav = useNav();
  const max = item.cantidad - item.cantidadReembolsada - (item.cantidadPendiente || 0);

  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [metodo, setMetodo] = useState('tarjeta');
  const [modalidad, setModalidad] = useState('cita_fisica');
  const [fechaCita, setFechaCita] = useState('');
  const [horaCita, setHoraCita] = useState('');
  const [slotRefresh, setSlotRefresh] = useState(0);
  const [foto, setFoto] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(null);

  const attach = (result) => {
    if (result.canceled || !result.assets?.[0]?.base64) return;
    const asset = result.assets[0];
    const uri = `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`;
    if (uri.length > MAX_PHOTO_CHARS) {
      setError('La imagen es demasiado pesada. Elige otra o toma la foto de nuevo.');
      return;
    }
    setError('');
    setFoto(uri);
  };
  const pickFromGallery = async () =>
    attach(await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.3, base64: true }));
  const takePhoto = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { setError('Se necesita permiso de cámara para tomar la foto.'); return; }
    attach(await ImagePicker.launchCameraAsync({ quality: 0.3, base64: true }));
  };

  const submit = async () => {
    setError('');
    const qty = parseInt(cantidad, 10);
    if (!qty || qty < 1 || qty > max) return setError(`La cantidad debe estar entre 1 y ${max}.`);
    if (!foto) return setError('Adjunta una foto del producto.');
    if (modalidad === 'cita_fisica' && (!fechaCita || !horaCita)) return setError('Selecciona un horario disponible.');
    setLoading(true);
    try {
      const data = await api('/refunds', {
        method: 'POST',
        body: {
          ventaId: sale._id, productoId: item.producto, cantidad: qty, motivo: motivo.trim(),
          metodoReembolso: metodo, modalidad, fechaCita: modalidad === 'cita_fisica' ? fechaCita : undefined, horaCita: modalidad === 'cita_fisica' ? horaCita : undefined, fotoEvidencia: foto
        }
      });
      setCreated(data);
    } catch (err) {
      if (err.code === 'APPOINTMENT_TAKEN') { setHoraCita(''); setSlotRefresh((value) => value + 1); }
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  if (created) {
    return (
      <Screen title="Solicitud enviada">
        <GlassCard intensity={55}>
          <Icon name="checkmark-circle-outline" size={38} /><Text style={styles.ok}>Solicitud registrada</Text>
          <Text style={styles.label}>Tu folio de reembolso</Text>
          <Text style={styles.folio}>{created.folio}</Text>
          <Text style={styles.note}>
            {created.modalidad === 'cita_fisica'
              ? `Preséntalo en tienda el ${created.fechaCita} ${created.horaCita} junto con el producto.`
              : 'Un trabajador revisará tu solicitud y te contactará por correo.'}
          </Text>
          <Text style={styles.note}>Monto a reembolsar: {money(created.monto)}</Text>
          <Btn title="Ver mis reembolsos" onPress={() => { nav.back(); nav.back(); nav.push('MyRefunds'); }} />
        </GlassCard>
      </Screen>
    );
  }

  return (
    <Screen title="Solicitar reembolso" onBack={nav.back}>
      <GlassCard intensity={50}>
        <Text style={styles.product}>{item.nombre}</Text>
        <Text style={styles.note}>Venta {sale.folio} • Reembolsables: {max}</Text>
        <Msg text={error} />
        <Field label={`Cantidad (máx. ${max})`} value={cantidad} onChangeText={(v) => setCantidad(v.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Field label="Motivo (mín. 10 caracteres)" value={motivo} onChangeText={setMotivo} multiline autoCapitalize="sentences" placeholder="Describe el problema..." style={{ marginBottom: 0 }} />

        <Text style={styles.label}>Método de reembolso</Text>
        <View style={styles.chips}>
          <Chip label="A la tarjeta" active={metodo === 'tarjeta'} onPress={() => setMetodo('tarjeta')} />
          <Chip label="Efectivo en tienda" active={metodo === 'efectivo'} onPress={() => setMetodo('efectivo')} />
        </View>

        <Text style={styles.label}>¿Cómo quieres entregar el producto?</Text>
        <View style={styles.chips}>
          <Chip label="Cita física" active={modalidad === 'cita_fisica'} onPress={() => setModalidad('cita_fisica')} />
          <Chip label="Por correo" active={modalidad === 'correo'} onPress={() => setModalidad('correo')} />
        </View>
        {modalidad === 'cita_fisica' ? <AppointmentCalendar date={fechaCita} time={horaCita} onDateChange={setFechaCita} onTimeChange={setHoraCita} refreshKey={slotRefresh} /> : null}

        <Text style={styles.label}>Foto del producto</Text>
        {foto ? <Image source={{ uri: foto }} style={styles.photo} /> : null}
        <View style={styles.chips}>
          <Chip icon="camera-outline" label="Tomar foto" onPress={takePhoto} />
          <Chip icon="images-outline" label="Galería" onPress={pickFromGallery} />
        </View>

        <Btn title="Enviar solicitud" onPress={submit} loading={loading} />
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  product: { color: colors.text, fontSize: 17, fontWeight: '800' },
  note: { color: colors.muted, fontSize: 12, marginVertical: 6, lineHeight: 18 },
  label: { color: colors.soft, fontSize: 13, fontWeight: '600', marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  photo: { width: '100%', height: 180, borderRadius: 12, marginBottom: 10 },
  ok: { color: colors.ok, fontSize: 20, fontWeight: '800', marginBottom: 10 },
  folio: { color: colors.accent, fontSize: 26, fontWeight: '900', letterSpacing: 1 }
});
