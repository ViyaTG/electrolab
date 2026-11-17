import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text, TextInput, TouchableOpacity } from '../i18n/ui';
import Icon from '../components/Icon';
import LanguagePicker from '../components/LanguagePicker';
import GlassCard from '../components/GlassCard';
import BarcodeScannerModal from '../components/BarcodeScannerModal';
import { Chip, Empty, Loading, Msg } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNav } from '../context/NavContext';
import { errMsg } from '../api/client';
import { clientFuzzySearch } from '../utils/fuzzySearch';
import { colors, money, stockLevel } from '../theme';

export default function HomeScreen() {
  const { api, isStaff, isAdmin } = useAuth();
  const cart = useCart();
  const nav = useNav();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [alerts, setAlerts] = useState(0);

  const load = useCallback(async () => {
    setError('');
    try {
      const [p, c] = await Promise.all([api('/products'), api('/categories')]);
      setProducts(p);
      setCategories(c);
      if (isAdmin) setAlerts((await api('/reports/stock-alerts')).total);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, isAdmin]);

  useEffect(() => { load(); }, [load]);

  const showToast = (result) => {
    setToast(result);
    setTimeout(() => setToast(null), 1800);
  };

  const visible = clientFuzzySearch(products, query).filter((p) => !categoryId || p.categoria?._id === categoryId);

  return (
    <View style={styles.container}>
      <GlassCard style={styles.searchCard} intensity={50}>
        <View style={styles.titleRow}>
          <View style={{ flex: 1, minWidth: 140 }}><LanguagePicker /><Text style={styles.headerTitle}>{isStaff ? 'Inventario' : 'Catálogo'}</Text><Text style={styles.subtitle}>Componentes para tu próximo proyecto.</Text></View>
          <View style={styles.actions}>
            {isAdmin ? (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Alertas de stock" style={styles.bell} onPress={() => nav.push('Notifications')}>
                <Icon name="notifications-outline" />
                {alerts > 0 ? <View style={styles.bellBadge}><Text style={styles.bellBadgeText}>{alerts > 99 ? '99+' : alerts}</Text></View> : null}
              </TouchableOpacity>
            ) : null}
            {isStaff ? (
              <TouchableOpacity style={styles.newBtn} onPress={() => nav.push('ProductForm', {})}>
                <Icon name="add" color="#FFFFFF" size={18} /><Text style={styles.newBtnText}>Nuevo</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
        <View style={styles.searchRow}>
          <Icon name="search-outline" size={20} style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            accessibilityLabel="Buscar componentes" placeholder="Buscar componentes o SKU"
            placeholderTextColor={colors.dim}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
          />
          {isStaff ? (
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Escanear código de barras" style={styles.scanBtn} onPress={() => setScanOpen(true)}>
              <Icon name="scan-outline" />
            </TouchableOpacity>
          ) : null}
        </View>
      </GlassCard>

      {categories.length > 0 ? (
        <View style={{ minHeight: 62 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Chip label="Todas" active={!categoryId} onPress={() => setCategoryId(null)} />
            {categories.map((c) => (
              <Chip key={c._id} label={c.nombre} active={categoryId === c._id} onPress={() => setCategoryId(c._id)} />
            ))}
          </ScrollView>
        </View>
      ) : null}

      {toast ? <Msg text={toast.message} type={toast.ok ? 'ok' : 'error'} /> : null}
      {error ? <Msg text={error} /> : null}

      {loading ? (
        <Loading />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.accent} onRefresh={() => { setRefreshing(true); load(); }} />}
          ListEmptyComponent={<Empty text={query ? `Sin resultados para "${query}".` : 'Aún no hay productos.'} />}
          renderItem={({ item }) => {
            const level = stockLevel(item.cantidad);
            return (
              <TouchableOpacity activeOpacity={isStaff ? 0.7 : 1} onPress={() => isStaff && nav.push('ProductForm', { product: item })}>
                <GlassCard style={styles.itemCard} intensity={40}>
                  <View style={styles.itemHeader}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={styles.itemSku}>{item.sku}</Text>
                      <Text style={styles.itemName}>{item.nombre}</Text>
                      <Text style={styles.price}>{money(item.precio)}</Text>
                    </View>
                    <View style={[styles.stockBadge, { backgroundColor: level.bg, borderColor: level.color }]}>
                      <Text style={[styles.stockNumber, { color: level.color }]}>{item.cantidad}</Text>
                      <Text style={[styles.stockLabel, { color: level.color }]}>{level.label}</Text>
                    </View>
                  </View>
                  <Text style={styles.itemMeta}>
                    {item.categoria?.nombre || 'Sin categoría'} • {item.encapsulado || 'N/A'}
                    {isStaff ? ` • ${item.ubicacion || 'N/A'}` : ''}
                  </Text>
                  {isStaff ? (
                    <Text style={styles.versionTag}>Toca para editar • v{item.version}</Text>
                  ) : (
                    <TouchableOpacity
                      style={[styles.addBtn, item.cantidad <= 0 && { opacity: 0.4 }]}
                      disabled={item.cantidad <= 0}
                      onPress={() => showToast(cart.add(item, 1))}
                    >
                      <Icon name="bag-add-outline" size={18} /><Text style={styles.addBtnText}>{item.cantidad <= 0 ? 'Agotado' : 'Agregar al carrito'}</Text>
                    </TouchableOpacity>
                  )}
                </GlassCard>
              </TouchableOpacity>
            );
          }}
        />
      )}

      <BarcodeScannerModal
        visible={scanOpen}
        onClose={() => setScanOpen(false)}
        onScanned={(code) => { setQuery(code); setScanOpen(false); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.bg },
  searchCard: { marginBottom: 18 },
  titleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  brand: { color: colors.muted, fontSize: 11, fontFamily: Platform.select({ ios: 'Arial Rounded MT Bold', android: 'sans-serif-rounded', default: 'ui-rounded, Arial Rounded MT Bold, sans-serif' }), fontWeight: '900', marginBottom: 8 },
  subtitle: { color: colors.muted, fontSize: 12, marginTop: 5, maxWidth: 190 },
  headerTitle: { color: colors.text, fontSize: 32, letterSpacing: -1.2, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center' },
  bell: { marginRight: 8, width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  bellBadge: { position: 'absolute', top: -2, right: -4, backgroundColor: '#29292D', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  bellBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  newBtn: { flexDirection: 'row', gap: 4, alignItems: 'center', minHeight: 48, backgroundColor: colors.primary, borderRadius: 10, paddingVertical: 7, paddingHorizontal: 12 },
  newBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  searchInput: {
    flex: 1, minWidth: 0, minHeight: 50, backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10,
    color: colors.text, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.07)'
  },
  scanBtn: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginLeft: 8, backgroundColor: 'rgba(0, 0, 0, 0.07)', borderRadius: 12, padding: 9, borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.07)' },
  itemCard: { marginBottom: 16 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemSku: { color: colors.accent, fontSize: 12, fontWeight: '700' },
  itemName: { color: colors.text, fontSize: 19, letterSpacing: -0.4, fontWeight: '600', marginTop: 2 },
  price: { color: colors.ok, fontSize: 15, fontWeight: '800', marginTop: 3 },
  stockBadge: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignItems: 'center', minWidth: 74 },
  stockNumber: { fontSize: 18, fontWeight: '800' },
  stockLabel: { fontSize: 10 },
  itemMeta: { color: colors.muted, fontSize: 12, marginTop: 8 },
  versionTag: { color: colors.dim, fontSize: 11, marginTop: 6 },
  addBtn: { flexDirection: 'row', justifyContent: 'center', gap: 8, minHeight: 48, marginTop: 10, backgroundColor: 'rgba(0, 0, 0, 0.07)', borderWidth: 1, borderColor: 'rgba(0, 0, 0, 0.07)', borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  addBtnText: { color: colors.accent, fontWeight: '700' }
});
