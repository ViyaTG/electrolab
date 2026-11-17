import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from '../i18n/ui';
import Icon from '../components/Icon';
import GlassCard from '../components/GlassCard';
import { Btn, Field, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { colors, money } from '../theme';

const formatCard = (v) => v.replace(/\D/g, '').slice(0, 19).replace(/(.{4})/g, '$1 ').trim();
const formatExpiry = (v) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

export default function CheckoutScreen() {
  const { api, user } = useAuth();
  const cart = useCart();
  const nav = useNav();

  const [numero, setNumero] = useState('');
  const [titular, setTitular] = useState(user?.nombre || '');
  const [vencimiento, setVencimiento] = useState('');
  const [cvv, setCvv] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sale, setSale] = useState(null);

  const pay = async () => {
    setError('');
    setLoading(true);
    try {
      const data = await api('/sales/checkout', {
        method: 'POST',
        body: {
          items: cart.items.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
          pago: { numeroTarjeta: numero, titular: titular.trim(), vencimiento, cvv }
        }
      });
      setSale(data);
      cart.clear();
    } catch (err) {
      setError(errMsg(err)); // incluye "Stock insuficiente..." si alguien compró antes
    } finally {
      setLoading(false);
    }
  };

  if (sale) {
    return (
      <Screen title="Compra realizada">
        <GlassCard intensity={55}>
          <Icon name="checkmark-circle-outline" size={38} style={{ marginBottom: 12 }} /><Text style={styles.okTitle}>¡Pago simulado exitoso!</Text>
          <Text style={styles.line}>Folio de venta</Text>
          <Text style={styles.folio}>{sale.folio}</Text>
          <Text style={styles.line}>Total pagado: {money(sale.total)}</Text>
          <Text style={styles.line}>Tarjeta terminada en {sale.pago.ultimos4}</Text>
          <Text style={styles.note}>Guarda tu folio: lo necesitarás si solicitas un reembolso (hasta 90 días).</Text>
          <Btn title="Ver mis compras" onPress={() => { nav.goTab('profile'); nav.push('PurchaseHistory'); }} />
          <Btn title="Volver al catálogo" variant="ghost" onPress={() => nav.goTab('home')} />
        </GlassCard>
      </Screen>
    );
  }

  return (
    <Screen title="Pago simulado" onBack={nav.back}>
      <GlassCard intensity={50}>
        <Text style={styles.total}>{money(cart.total)}</Text>
        <Text style={styles.note}>Simulación: no se realiza ningún cargo real. Tarjeta de prueba: 4111 1111 1111 1111, cualquier fecha futura y CVV. La 4000 0000 0000 0002 simula un rechazo.</Text>
        <Msg text={error} />
        <Field label="Número de tarjeta" value={numero} onChangeText={(v) => setNumero(formatCard(v))} keyboardType="number-pad" placeholder="0000 0000 0000 0000" />
        <Field label="Nombre del titular" value={titular} onChangeText={setTitular} autoCapitalize="words" placeholder="Como aparece en la tarjeta" />
        <View style={{ flexDirection: 'row' }}>
          <Field style={{ flex: 1, marginRight: 10 }} label="Vence (MM/AA)" value={vencimiento} onChangeText={(v) => setVencimiento(formatExpiry(v))} keyboardType="number-pad" placeholder="12/28" />
          <Field style={{ flex: 1 }} label="CVV" value={cvv} onChangeText={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry placeholder="•••" />
        </View>
        <Btn title={`Pagar ${money(cart.total)}`} variant="ok" onPress={pay} loading={loading} />
        {error.includes('Stock insuficiente') ? <Btn title="Revisar carrito" variant="ghost" onPress={nav.back} /> : null}
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  total: { color: colors.text, fontSize: 30, fontWeight: '900' },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginVertical: 10 },
  okTitle: { color: colors.ok, fontSize: 20, fontWeight: '800', marginBottom: 10 },
  line: { color: colors.soft, fontSize: 14, marginTop: 6 },
  folio: { color: colors.accent, fontSize: 26, fontWeight: '900', letterSpacing: 1 }
});
