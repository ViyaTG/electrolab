import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../i18n/ui';
import GlassCard from '../components/GlassCard';
import { Badge, Empty, Loading, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors, fmtDate, money } from '../theme';
import { refundStatus } from '../utils/refundStatus';

export default function MyRefundsScreen() {
  const { api } = useAuth();
  const nav = useNav();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setItems(await api('/refunds/mine')); } catch (err) { setError(errMsg(err)); } finally { setLoading(false); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  return (
    <Screen title="Mis reembolsos" onBack={nav.back}>
      <Msg text={error} />
      {loading ? <Loading /> : items.length === 0 ? <Empty text="No has solicitado reembolsos." /> : items.map((r) => {
        const st = refundStatus(r.estado);
        return (
          <GlassCard key={r._id} style={{ marginBottom: 12 }} intensity={40}>
            <Text style={styles.folio}>{r.folio}</Text>
            <Text style={styles.name}>{r.cantidad} × {r.nombre}</Text>
            <Text style={styles.meta}>Venta {r.ventaFolio} • {fmtDate(r.createdAt)} • {money(r.monto)}</Text>
            <Badge text={st.label} color={st.color} bg={st.bg} />
            {r.fechaCita ? <Text style={styles.meta}>Cita: {r.fechaCita} {r.horaCita || ''}</Text> : null}
            {r.estado === 'aprobado' ? <Text style={styles.meta}>Producto {r.funciona ? 'funciona: regresó al inventario' : 'no funciona: no se reintegra al inventario'}</Text> : null}
            {r.notas ? <Text style={styles.meta}>Nota: {r.notas}</Text> : null}
          </GlassCard>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  folio: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  name: { color: colors.text, fontSize: 15, fontWeight: '600', marginTop: 4 },
  meta: { color: colors.muted, fontSize: 12, marginVertical: 4 }
});
