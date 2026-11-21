import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../i18n/ui';
import GlassCard from '../components/GlassCard';
import { Badge, Btn, Empty, Loading, Msg, Screen, Segmented } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { refundStatus } from '../utils/refundStatus';
import { colors, fmtDateTime, money } from '../theme';

const PAGE = 20;

/**
 * Aísla datos por pestaña y descarta respuestas viejas.
 * @param {object} props Propiedades de composición y callbacks definidos en la firma.
 * @returns {React.ReactElement|null} Vista y estados de carga correspondientes.
 */
export default function AdminHistoryScreen() {
  const { api } = useAuth();
  const nav = useNav();
  const [tab, setTab] = useState('ventas');
  const [data, setData] = useState({ kind: 'ventas', items: [], total: 0 });
  const [loadingMore, setLoadingMore] = useState(false);
  const requestVersion = useRef(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPage = useCallback(async (kind, skip) => {
    const path = kind === 'ventas' ? '/sales' : '/refunds';
    const page = await api(`${path}?limit=${PAGE}&skip=${skip}`);
    if (!Array.isArray(page?.items)) throw new Error('No se pudo cargar el historial. Intenta de nuevo.');
    return { kind, items: page.items, total: Number(page.total) || 0 };
  }, [api]);

  useEffect(() => {
    const version = ++requestVersion.current;
    setLoading(true); setLoadingMore(false); setError(''); setData({ kind: tab, items: [], total: 0 });
    fetchPage(tab, 0).then((page) => { if (version === requestVersion.current) setData(page); })
      .catch((e) => { if (version === requestVersion.current) setError(errMsg(e)); })
      .finally(() => { if (version === requestVersion.current) setLoading(false); });
    return () => { requestVersion.current++; };
  }, [tab, fetchPage]);

  const more = async () => {
    if (loadingMore || loading || data.kind !== tab) return;
    const version = requestVersion.current;
    setLoadingMore(true);
    try {
      const next = await fetchPage(tab, data.items.length);
      if (version === requestVersion.current) setData((previous) => ({ kind: tab, total: next.total, items: [...new Map([...previous.items, ...next.items].map((row) => [row._id, row])).values()] }));
    } catch (e) { if (version === requestVersion.current) setError(errMsg(e)); }
    finally { if (version === requestVersion.current) setLoadingMore(false); }
  };

  return (
    <Screen title="Historial global" onBack={nav.back}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'ventas', label: 'Ventas' }, { key: 'reembolsos', label: 'Reembolsos' }]} />
      <Msg text={error} />
      {loading || data.kind !== tab ? <Loading /> : data.items.length === 0 ? <Empty text="Sin registros." /> : (
        <>
          <Text style={styles.count}>{data.total} registro(s)</Text>
          {data.items.map((row) => tab === 'ventas' ? (
            <GlassCard key={row._id} style={{ marginBottom: 10 }} intensity={40}>
              <Text style={styles.folio}>{row.folio}</Text>
              <Text style={styles.line}>{row.clienteNombre} • {fmtDateTime(row.createdAt)}</Text>
              <Text style={styles.line}>{(row.items || []).map((i) => `${i.cantidad}× ${i.nombre}`).join(', ')}</Text>
              <Text style={styles.total}>{money(row.total)}</Text>
            </GlassCard>
          ) : (
            <GlassCard key={row._id} style={{ marginBottom: 10 }} intensity={40}>
              <Text style={styles.folio}>{row.folio} <Text style={styles.type}>({row.tipo === 'app' ? 'app' : 'directo'})</Text></Text>
              <Text style={styles.line}>{row.clienteNombre} • {fmtDateTime(row.createdAt)}</Text>
              <Text style={styles.line}>{row.cantidad}× {row.nombre} (venta {row.ventaFolio})</Text>
              <Text style={styles.total}>{money(row.monto)}</Text>
              <Badge text={refundStatus(row.estado).label} color={refundStatus(row.estado).color} bg={refundStatus(row.estado).bg} />
              {row.procesadoPor ? <Text style={styles.line}>Procesó: {row.procesadoPor}{row.estado === 'aprobado' ? (row.funciona ? ' • funciona' : ' • no funciona') : ''}</Text> : null}
            </GlassCard>
          ))}
          {data.items.length < data.total ? <Btn title="Cargar más" variant="ghost" onPress={more} loading={loadingMore} /> : null}
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
