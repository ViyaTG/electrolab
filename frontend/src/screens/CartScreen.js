import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Alert, Text, TouchableOpacity } from '../i18n/ui';
import GlassCard from '../components/GlassCard';
import { Btn, Empty, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNav } from '../context/NavContext';
import { colors, money } from '../theme';

/**
 * Edita cantidades desde `CartContext` y solicita login con intención de compra cuando corresponde.
 * @param {object} props Propiedades de composición y callbacks definidos en la firma.
 * @returns {React.ReactElement|null} Vista y estados de carga correspondientes.
 */
export default function CartScreen() {
  const { session, isCliente } = useAuth();
  const cart = useCart();
  const nav = useNav();

  const checkout = () => {
    if (!session) {
      Alert.alert('Inicia sesión', 'Necesitas una cuenta de cliente para pagar. Tu carrito se conservará.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Iniciar sesión', onPress: () => nav.requireLogin('checkout') }
      ]);
      return;
    }
    if (!isCliente) {
      Alert.alert('No disponible', 'Las cuentas de personal no pueden realizar compras.');
      return;
    }
    nav.push('Checkout');
  };

  const confirmClear = () =>
    Alert.alert('Vaciar carrito', '¿Quitar todos los productos del carrito?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: cart.clear }
    ]);

  return (
    <Screen title="Carrito" tab>
      {cart.items.length === 0 ? (
        <Empty text="Tu carrito está vacío. Agrega productos desde el inventario." />
      ) : (
        <>
          {cart.items.map((item) => (
            <GlassCard key={item.productoId} style={{ marginBottom: 12 }} intensity={40}>
              <Text style={styles.sku}>{item.sku}</Text>
              <Text style={styles.name}>{item.nombre}</Text>
              <View style={styles.row}>
                <Text style={styles.price}>{money(item.precio)} c/u</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => cart.setQty(item.productoId, item.cantidad - 1)}><Text style={styles.stepText}>−</Text></TouchableOpacity>
                  <Text style={styles.qty}>{item.cantidad}</Text>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => cart.setQty(item.productoId, item.cantidad + 1)}><Text style={styles.stepText}>+</Text></TouchableOpacity>
                </View>
              </View>
              <View style={styles.row}>
                <Text style={styles.subtotal}>Subtotal: {money(item.precio * item.cantidad)}</Text>
                <TouchableOpacity onPress={() => cart.remove(item.productoId)}>
                  <Text style={styles.remove}>Eliminar producto</Text>
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))}
          <GlassCard intensity={55}>
            <Text style={styles.totalLabel}>Total a pagar</Text>
            <Text style={styles.total}>{money(cart.total)}</Text>
            <Btn title="Pagar (pago simulado)" onPress={checkout} variant="ok" />
            <Btn title="Vaciar carrito" onPress={confirmClear} variant="ghost" />
          </GlassCard>
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  sku: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  name: { color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  price: { color: colors.muted, fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center' },
  stepBtn: { backgroundColor: 'rgba(0, 0, 0, 0.07)', borderRadius: 8, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.accent, fontSize: 20, fontWeight: '700' },
  qty: { color: colors.text, fontSize: 16, fontWeight: '800', minWidth: 36, textAlign: 'center' },
  subtotal: { color: colors.ok, fontWeight: '700' },
  remove: { color: colors.dangerText, fontSize: 13, fontWeight: '600' },
  totalLabel: { color: colors.muted, fontSize: 13 },
  total: { color: colors.text, fontSize: 30, fontWeight: '900', marginBottom: 8 }
});
