import React, { useCallback, useEffect, useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import GlassCard from '../components/GlassCard';
import { Badge, Btn, Chip, Empty, Field, Msg, Screen, Segmented } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { REFUND_STATE } from './MyRefundsScreen';
import { colors, fmtDate, money } from '../theme';

// ---------- Opción A: folio generado desde la app ----------
function FolioRefunds() {
  const { api } = useAuth();
  const [folio, setFolio] = useState('');
  const [refund, setRefund] = useState(null);
  const [pending, setPending] = useState([]);
  const [funciona, setFunciona] = useState(null);
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const loadPending = useCallback(async () => {
    try { setPending((await api('/refunds?estado=pendiente&limit=50')).items); } catch (err) { setError(errMsg(err)); }
  }, [api]);
  useEffect(() => { loadPending(); }, [loadPending]);

  const search = async (value) => {
    const f = (value ?? folio).trim();
    setError(''); setInfo(''); setRefund(null); setFunciona(null); setNotas('');
    if (!f) return setError('Escribe el folio del cliente.');
    setLoading(true);
    try { setRefund(await api(`/refunds/folio/${encodeURIComponent(f)}`)); } catch (err) { setError(errMsg(err)); } finally { setLoading(false); }
  };

  const resolve = async (decision) => {
    setError('');
    if (decision === 'aprobar' && funciona === null) return setError('Indica si el producto funciona o no funciona.');
    setLoading(true);
    try {
      const updated = await api(`/refunds/${refund._id}/resolve`, {
        method: 'PATCH',
        body: { decision, funciona: decision === 'aprobar' ? funciona : undefined, notas: notas.trim() || undefined }
      });
      setRefund(updated);
      setInfo(decision === 'aprobar'
        ? (updated.reintegradoAlStock ? 'Reembolso aprobado. El producto regresó al inventario.' : 'Reembolso aprobado. El producto NO se reintegró al inventario.')
        : 'Solicitud rechazada.');
      loadPending();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlassCard style={{ marginBottom: 14 }} intensity={50}>
        <Field label="Folio del cliente" value={folio} onChangeText={setFolio} autoCapitalize="characters" placeholder="RMB-1A2B3C4D" />
        <Btn title="Buscar folio" onPress={() => search()} loading={loading && !refund} />
      </GlassCard>
      <Msg text={error} />
      <Msg text={info} type="ok" />

      {refund ? (
        <GlassCard style={{ marginBottom: 14 }} intensity={50}>
          <Text style={styles.folio}>{refund.folio}</Text>
          <Badge text={REFUND_STATE[refund.estado].label} color={REFUND_STATE[refund.estado].color} bg={REFUND_STATE[refund.estado].bg} />
          <Text style={styles.line}>Cliente: {refund.clienteNombre}</Text>
          <Text style={styles.line}>Venta: {refund.ventaFolio}</Text>
          <Text style={styles.line}>{refund.cantidad} × {refund.nombre} ({refund.sku}) — {money(refund.monto)}</Text>
          <Text style={styles.line}>Reembolso: {refund.metodoReembolso} • Entrega: {refund.modalidad === 'cita_fisica' ? `cita física ${refund.fechaCita || ''}` : 'por correo'}</Text>
          <Text style={styles.line}>Motivo: {refund.motivo}</Text>
          {refund.fotoEvidencia ? <Image source={{ uri: refund.fotoEvidencia }} style={styles.photo} /> : null}

          {refund.estado === 'pendiente' ? (
            <>
              <Text style={styles.sub}>Revisión del producto</Text>
              <View style={styles.chips}>
                <Chip icon="checkmark-circle-outline" label="Funciona" active={funciona === true} onPress={() => setFunciona(true)} />
                <Chip icon="close-circle-outline" label="No funciona" active={funciona === false} onPress={() => setFunciona(false)} />
              </View>
              <Text style={styles.hint}>Solo si funciona, las piezas regresan al inventario.</Text>
              <Field label="Notas (opcional)" value={notas} onChangeText={setNotas} placeholder="Observaciones de la revisión" />
              <Btn title="Aprobar reembolso" variant="ok" onPress={() => resolve('aprobar')} loading={loading} />
              <Btn title="Rechazar" variant="danger" onPress={() => resolve('rechazar')} disabled={loading} />
            </>
          ) : (
            <Text style={styles.line}>Resuelto por {refund.procesadoPor} • {refund.funciona === true ? 'Funciona' : refund.funciona === false ? 'No funciona' : ''}</Text>
          )}
        </GlassCard>
      ) : null}

      <Text style={styles.sub}>Pendientes ({pending.length})</Text>
      {pending.length === 0 ? <Empty text="No hay solicitudes pendientes." /> : pending.map((r) => (
        <TouchableOpacity key={r._id} onPress={() => { setFolio(r.folio); search(r.folio); }}>
          <GlassCard style={{ marginBottom: 8 }} intensity={35}>
            <Text style={styles.folioSmall}>{r.folio}</Text>
            <Text style={styles.line}>{r.clienteNombre} • {r.cantidad} × {r.nombre}</Text>
            <Text style={styles.hint}>{fmtDate(r.createdAt)}</Text>
          </GlassCard>
        </TouchableOpacity>
      ))}
    </>
  );
}

// ---------- Opción B: reembolso físico directo ----------
function DirectRefund() {
  const { api } = useAuth();
  const [nombre, setNombre] = useState('');
  const [folioVenta, setFolioVenta] = useState('');
  const [sales, setSales] = useState(null);
  const [sale, setSale] = useState(null);
  const [item, setItem] = useState(null);
  const [cantidad, setCantidad] = useState('1');
  const [funciona, setFunciona] = useState(null);
  const [metodo, setMetodo] = useState('efectivo');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const search = async () => {
    setError(''); setInfo(''); setSale(null); setItem(null);
    if (!nombre.trim() && !folioVenta.trim()) return setError('Indica el nombre del cliente o el folio de venta.');
    setLoading(true);
    try {
      const params = [];
      if (nombre.trim()) params.push(`nombre=${encodeURIComponent(nombre.trim())}`);
      if (folioVenta.trim()) params.push(`folio=${encodeURIComponent(folioVenta.trim())}`);
      setSales(await api(`/sales/search?${params.join('&')}`));
    } catch (err) { setError(errMsg(err)); } finally { setLoading(false); }
  };

  const refundable = (it) => it.cantidad - it.cantidadReembolsada - (it.cantidadPendiente || 0);

  const submit = async () => {
    setError('');
    const qty = parseInt(cantidad, 10);
    if (!item) return setError('Selecciona el producto a devolver.');
    if (!qty || qty < 1 || qty > refundable(item)) return setError(`La cantidad debe estar entre 1 y ${refundable(item)}.`);
    if (funciona === null) return setError('Indica si el producto funciona o no funciona.');
    setLoading(true);
    try {
      const created = await api('/refunds/direct', {
        method: 'POST',
        body: { ventaId: sale._id, productoId: item.producto, cantidad: qty, funciona, metodoReembolso: metodo }
      });
      setInfo(`Reembolso ${created.folio} registrado por ${money(created.monto)}. ${created.reintegradoAlStock ? 'El producto regresó al inventario.' : 'No se reintegró al inventario.'}`);
      setSale(null); setItem(null); setSales(null); setFunciona(null); setCantidad('1');
    } catch (err) { setError(errMsg(err)); } finally { setLoading(false); }
  };

  return (
    <>
      <GlassCard style={{ marginBottom: 14 }} intensity={50}>
        <Field label="Nombre del cliente" value={nombre} onChangeText={setNombre} autoCapitalize="words" placeholder="Ej. Ana Pérez" />
        <Field label="Folio de venta" value={folioVenta} onChangeText={setFolioVenta} autoCapitalize="characters" placeholder="VTA-1A2B3C4D" />
        <Btn title="Buscar ventas" onPress={search} loading={loading && !sale} />
      </GlassCard>
      <Msg text={error} />
      <Msg text={info} type="ok" />

      {!sale && sales ? (sales.length === 0 ? <Empty text="No se encontraron ventas." /> : sales.map((s) => {
        const inWindow = new Date() <= new Date(s.reembolsoHasta);
        return (
          <TouchableOpacity key={s._id} onPress={() => inWindow ? setSale(s) : setError(`La venta ${s.folio} superó el plazo de 90 días.`)}>
            <GlassCard style={{ marginBottom: 8 }} intensity={35}>
              <Text style={styles.folioSmall}>{s.folio}</Text>
              <Text style={styles.line}>{s.clienteNombre} • {fmtDate(s.createdAt)} • {money(s.total)}</Text>
              {!inWindow ? <Text style={[styles.hint, { color: colors.dangerText }]}>Plazo vencido</Text> : null}
            </GlassCard>
          </TouchableOpacity>
        );
      })) : null}

      {sale ? (
        <GlassCard intensity={50}>
          <Text style={styles.folio}>{sale.folio}</Text>
          <Text style={styles.line}>{sale.clienteNombre}</Text>
          <Text style={styles.sub}>Producto a devolver</Text>
          {sale.items.map((it) => (
            <TouchableOpacity key={it.producto} disabled={refundable(it) <= 0} onPress={() => { setItem(it); setCantidad('1'); }}>
              <View style={[styles.itemRow, item?.producto === it.producto && styles.itemRowActive, refundable(it) <= 0 && { opacity: 0.4 }]}>
                <Text style={styles.line}>{it.nombre}</Text>
                <Text style={styles.hint}>Comprados: {it.cantidad} • Reembolsables: {refundable(it)} • {money(it.precioUnitario)} c/u</Text>
              </View>
            </TouchableOpacity>
          ))}
          {item ? (
            <>
              <Field label={`Cantidad (máx. ${refundable(item)})`} value={cantidad} onChangeText={(v) => setCantidad(v.replace(/\D/g, ''))} keyboardType="number-pad" />
              <Text style={styles.sub}>Estado del producto</Text>
              <View style={styles.chips}>
                <Chip icon="checkmark-circle-outline" label="Funciona" active={funciona === true} onPress={() => setFunciona(true)} />
                <Chip icon="close-circle-outline" label="No funciona" active={funciona === false} onPress={() => setFunciona(false)} />
              </View>
              <Text style={styles.sub}>Método de reembolso</Text>
              <View style={styles.chips}>
                <Chip label="Efectivo" active={metodo === 'efectivo'} onPress={() => setMetodo('efectivo')} />
                <Chip label="A la tarjeta" active={metodo === 'tarjeta'} onPress={() => setMetodo('tarjeta')} />
              </View>
              <Btn title="Aprobar reembolso directo" variant="ok" onPress={submit} loading={loading} />
            </>
          ) : null}
          <Btn title="Elegir otra venta" variant="ghost" onPress={() => { setSale(null); setItem(null); }} />
        </GlassCard>
      ) : null}
    </>
  );
}

export default function RefundsManageScreen() {
  const nav = useNav();
  const [tab, setTab] = useState('folio');
  return (
    <Screen title="Reembolsos" onBack={nav.back}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'folio', label: 'Con folio (app)' }, { key: 'directo', label: 'Directo en tienda' }]} />
      {tab === 'folio' ? <FolioRefunds /> : <DirectRefund />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  folio: { color: colors.accent, fontSize: 20, fontWeight: '900', marginBottom: 6 },
  folioSmall: { color: colors.accent, fontSize: 14, fontWeight: '800' },
  line: { color: colors.soft, fontSize: 13, marginTop: 5, lineHeight: 18 },
  hint: { color: colors.muted, fontSize: 11, marginTop: 4, marginBottom: 6 },
  sub: { color: colors.text, fontSize: 14, fontWeight: '700', marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap' },
  photo: { width: '100%', height: 200, borderRadius: 12, marginTop: 10 },
  itemRow: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 10, marginBottom: 8 },
  itemRowActive: { borderColor: 'rgba(0, 0, 0, 0.07)', backgroundColor: 'rgba(0, 0, 0, 0.07)' }
});
