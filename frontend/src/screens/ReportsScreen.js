import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GlassCard from '../components/GlassCard';
import { Empty, Loading, Msg, Screen, Segmented } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors, money } from '../theme';

export default function ReportsScreen() {
  const { api } = useAuth();
  const nav = useNav();
  const [tab, setTab] = useState('clientes');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true); setError(''); setRows([]);
    api(tab === 'clientes' ? '/reports/customers' : '/reports/top-products')
      .then(setRows).catch((e) => setError(errMsg(e))).finally(() => setLoading(false));
  }, [tab, api]);

  return (
    <Screen title="Reportes" onBack={nav.back}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'clientes', label: 'Por cliente' }, { key: 'productos', label: 'Más vendidos' }]} />
      <Msg text={error} />
      {loading ? <Loading /> : rows.length === 0 ? <Empty text="Aún no hay ventas registradas." /> : rows.map((r, idx) => (
        <GlassCard key={r._id} style={{ marginBottom: 10 }} intensity={40}>
          <View style={styles.head}>
            <Text style={styles.rank}>#{idx + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{r.nombre}</Text>
              <Text style={styles.meta}>{tab === 'clientes' ? r.email : r.sku}</Text>
            </View>
          </View>
          {tab === 'clientes' ? (
            <>
              <Text style={styles.line}>Compras: {r.compras} • Unidades: {r.unidades}</Text>
              <Text style={styles.line}>Gastado: {money(r.totalGastado)} • Reembolsado: {money(r.reembolsado)}</Text>
              <Text style={styles.net}>Neto: {money(r.neto)}</Text>
            </>
          ) : (
            <>
              <Text style={styles.line}>Vendidas: {r.unidades} • Reembolsadas: {r.reembolsadas}</Text>
              <Text style={styles.line}>Ingresos: {money(r.ingresos)}</Text>
              <Text style={styles.net}>Unidades netas: {r.unidadesNetas}</Text>
            </>
          )}
        </GlassCard>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  rank: { color: colors.accent, fontSize: 20, fontWeight: '900', marginRight: 12 },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12 },
  line: { color: colors.soft, fontSize: 13, marginTop: 3 },
  net: { color: colors.ok, fontSize: 15, fontWeight: '800', marginTop: 6 }
});
