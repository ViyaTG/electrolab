import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import GlassCard from '../components/GlassCard';
import { Badge, Btn, Empty, Loading, Msg, Screen, Segmented } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { REFUND_STATE } from './MyRefundsScreen';
import { colors, fmtDateTime, money } from '../theme';

const PAGE = 20;

export default function AdminHistoryScreen() {
  const { api } = useAuth();
  const nav = useNav();
  const [tab, setTab] = useState('ventas');
  const [data, setData] = useState({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async (kind, skip) => {
    const path = kind === 'ventas' ? '/sales' : '/refunds';
    return api(`${path}?limit=${PAGE}&skip=${skip}`);
  }, [api]);

  useEffect(() => {
    setLoading(true); setError(''); setData({ items: [], total: 0 });
    fetchPage(tab, 0).then(setData).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [tab, fetchPage]);

  const more = async () => {
    try {
      const next = await fetchPage(tab, data.items.length);
      setData({ total: next.total, items: [...data.items, ...next.items] });
    } catch (e) { setError(errMsg(e)); }
  };

  return (
    <Screen title="Historial global" onBack={nav.back}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'ventas', label: 'Ventas' }, { key: 'reembolsos', label: 'Reembolsos' }]} />
      <Msg text={error} />
      {loading ? <Loading /> : data.items.length === 0 ? <Empty text="Sin registros." /> : (
        <>
          <Text style={styles.count}>{data.total} registro(s)</Text>
          {data.items.map((row) => tab === 'ventas' ? (
            <GlassCard key={row._id} style={{ marginBottom: 10 }} intensity={40}>
              <Text style={styles.folio}>{row.folio}</Text>
              <Text style={styles.line}>{row.clienteNombre} • {fmtDateTime(row.createdAt)}</Text>
              <Text style={styles.line}>{row.items.map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')}</Text>
              <Text style={styles.total}>{money(row.total)}</Text>
            </GlassCard>
          ) : (
            <GlassCard key={row._id} style={{ marginBottom: 10 }} intensity={40}>
              <Text style={styles.folio}>{row.folio} <Text style={styles.type}>({row.tipo === 'app' ? 'app' : 'directo'})</Text></Text>
              <Text style={styles.line}>{row.clienteNombre} • {fmtDateTime(row.createdAt)}</Text>
              <Text style={styles.line}>{row.cantidad}× {row.nombre} (venta {row.ventaFolio})</Text>
              <Text style={styles.total}>{money(row.monto)}</Text>
              <Badge text={REFUND_STATE[row.estado].label} color={REFUND_STATE[row.estado].color} bg={REFUND_STATE[row.estado].bg} />
              {row.procesadoPor ? <Text style={styles.line}>Procesó: {row.procesadoPor}{row.estado === 'aprobado' ? (row.funciona ? ' • funciona' : ' • no funciona') : ''}</Text> : null}
            </GlassCard>
          ))}
          {data.items.length < data.total ? <Btn title="Cargar más" variant="ghost" onPress={more} /> : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  count: { color: colors.muted, fontSize: 12, marginBottom: 10 },
  folio: { color: colors.accent, fontSize: 15, fontWeight: '800' },
  type: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  line: { color: colors.soft, fontSize: 12, marginTop: 4, lineHeight: 17 },
  total: { color: colors.ok, fontSize: 16, fontWeight: '800', marginVertical: 6 }
});
