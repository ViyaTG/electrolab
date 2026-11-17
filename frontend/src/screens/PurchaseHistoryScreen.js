import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../i18n/ui';
import GlassCard from '../components/GlassCard';
import { Btn, Empty, Loading, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors, fmtDate, money } from '../theme';

export default function PurchaseHistoryScreen() {
  const { api } = useAuth();
  const nav = useNav();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setSales(await api('/sales/mine')); } catch (err) { setError(errMsg(err)); } finally { setLoading(false); }
  }, [api]);
  useEffect(() => { load(); }, [load]);

  return (
    <Screen title="Historial de compras" onBack={nav.back}>
      <Msg text={error} />
      {loading ? <Loading /> : sales.length === 0 ? <Empty text="Aún no tienes compras." /> : sales.map((sale) => {
        const inWindow = new Date() <= new Date(sale.reembolsoHasta);
        return (
          <GlassCard key={sale._id} style={{ marginBottom: 12 }} intensity={40}>
            <Text style={styles.folio}>{sale.folio}</Text>
            <Text style={styles.meta}>{fmtDate(sale.createdAt)} • Total {money(sale.total)}</Text>
            {sale.items.map((it) => {
              const refundable = it.cantidad - it.cantidadReembolsada - it.cantidadPendiente;
              return (
                <View key={it.producto} style={styles.item}>
                  <Text style={styles.itemName}>{it.cantidad} × {it.nombre}</Text>
                  <Text style={styles.meta}>{money(it.precioUnitario)} c/u{it.cantidadReembolsada ? ` • ${it.cantidadReembolsada} reembolsado(s)` : ''}{it.cantidadPendiente ? ` • ${it.cantidadPendiente} en trámite` : ''}</Text>
                  {inWindow && refundable > 0 ? (
                    <Btn title="Solicitar reembolso" small variant="ghost" style={{ marginTop: 8, alignSelf: 'flex-start' }} onPress={() => nav.push('RefundRequest', { sale, item: it })} />
                  ) : null}
                </View>
              );
            })}
            {!inWindow ? <Text style={styles.expired}>Plazo de reembolso vencido (90 días)</Text> : <Text style={styles.meta}>Reembolso disponible hasta {fmtDate(sale.reembolsoHasta)}</Text>}
          </GlassCard>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  folio: { color: colors.accent, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  item: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border },
  itemName: { color: colors.text, fontSize: 14, fontWeight: '600' },
  expired: { color: colors.dangerText, fontSize: 12, marginTop: 10 }
});
