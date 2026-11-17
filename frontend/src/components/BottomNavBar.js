import React from 'react';
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useCart } from '../context/CartContext';
import Icon from './Icon';
import { colors } from '../theme';

const TABS = [
  { key: 'home', label: 'Inventario', icon: 'cube-outline', selected: 'cube' },
  { key: 'cart', label: 'Carrito', icon: 'bag-outline', selected: 'bag' },
  { key: 'profile', label: 'Perfil', icon: 'person-outline', selected: 'person' }
];

export default function BottomNavBar({ currentTab, onSelectTab }) {
  const { count } = useCart();
  return (
    <View style={styles.container}>
      <View style={styles.clip}>
        <BlurView intensity={85} tint="light" style={styles.bar}>
          {TABS.map((tab) => {
            const active = currentTab === tab.key;
            return (
              <TouchableOpacity key={tab.key} accessibilityRole="tab" accessibilityLabel={`${tab.label}${tab.key === 'cart' ? `, ${count} productos` : ''}`} accessibilityState={{ selected: active }} style={[styles.tab, active && styles.active]} onPress={() => onSelectTab(tab.key)}>
                <Icon name={active ? tab.selected : tab.icon} size={24} color={active ? colors.text : colors.muted} />
                <Text style={[styles.label, active && styles.activeLabel]}>{tab.label}</Text>
                {tab.key === 'cart' && count > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text></View> : null}
              </TouchableOpacity>
            );
          })}
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 12, left: 20, right: 20, borderRadius: 40, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24, elevation: 8 },
  clip: { borderRadius: 40, overflow: 'hidden', borderWidth: 1, borderColor: '#FFF' },
  bar: { flexDirection: 'row', alignItems: 'center', padding: 7, gap: 8, backgroundColor: 'rgba(255,255,255,0.72)' },
  tab: { flex: 1, minHeight: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 32, paddingVertical: 8, gap: 3 },
  active: { backgroundColor: 'rgba(0,0,0,0.09)' },
  label: { color: colors.muted, fontSize: 11, fontWeight: '500' },
  activeLabel: { color: colors.text, fontWeight: '700' },
  badge: { position: 'absolute', top: 4, right: 13, backgroundColor: colors.primary, borderRadius: 12, minWidth: 20, minHeight: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' }
});
