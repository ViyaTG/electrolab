import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GlassCard from '../components/GlassCard';
import { Empty, Loading, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors, stockLevel } from '../theme';

export default function NotificationsScreen() {
  const { api } = useAuth();
  const nav = useNav();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api('/reports/stock-alerts').then(setData).catch((e) => setError(errMsg(e))); }, [api]);

  return (
    <Screen title="Alertas de stock" onBack={nav.back}>
      <Msg text={error} />
      {!data && !error ? <Loading /> : null}
      {data ? (
        data.total === 0 ? <Empty text={`Todo en orden: no hay productos con menos de ${data.umbral} unidades.`} /> : (
          <>
            <Text style={styles.lead}>{data.total} producto(s) con menos de {data.umbral} unidades</Text>
            {data.items.map((p) => {
              const level = stockLevel(p.cantidad);
              return (
                <GlassCard key={p._id} style={{ marginBottom: 10 }} intensity={40}>
                  <View style={styles.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sku}>{p.sku}</Text>
                      <Text style={styles.name}>{p.nombre}</Text>
                      <Text style={styles.meta}>{p.categoria?.nombre || 'Sin categoría'}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: level.bg, borderColor: level.color }]}>
                      <Text style={[styles.qty, { color: level.color }]}>{p.cantidad}</Text>
                      <Text style={[styles.qtyLabel, { color: level.color }]}>{level.label}</Text>
                    </View>
                  </View>
                </GlassCard>
              );
            })}
          </>
        )
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, marginBottom: 12, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center' },
  sku: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  badge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', minWidth: 70 },
  qty: { fontSize: 18, fontWeight: '800' },
  qtyLabel: { fontSize: 10 }
});
