import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, TouchableOpacity } from '../i18n/ui';
import Icon from '../components/Icon';
import GlassCard from '../components/GlassCard';
import { Badge, Btn, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { colors } from '../theme';

function MenuItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
      <GlassCard style={styles.menuCard} intensity={40}>
        <View style={styles.menuRow}>
          <Icon name={icon} style={{ marginRight: 14 }} /><Text style={styles.menuText}>{label}</Text>
          <Icon name="chevron-forward" size={18} color={colors.muted} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, isCliente, isStaff, isAdmin, logout } = useAuth();
  const nav = useNav();

  // Sin sesión: elegir tipo de acceso.
  if (!user) {
    return (
      <Screen title="Perfil" tab>
        <Text style={styles.lead}>Elige cómo quieres acceder</Text>
        <TouchableOpacity onPress={() => nav.push('CustomerAuth')}>
          <GlassCard style={{ marginBottom: 14 }} intensity={50}>
            <Text style={styles.choiceTitle}><Icon name="bag-outline" />  Cliente</Text>
            <Text style={styles.choiceText}>Inicia sesión o crea tu cuenta para comprar y gestionar tus reembolsos.</Text>
          </GlassCard>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => nav.push('StaffLogin')}>
          <GlassCard intensity={50}>
            <Text style={styles.choiceTitle}><Icon name="key-outline" />  Personal</Text>
            <Text style={styles.choiceText}>Acceso restringido para personal de ElectroLab.</Text>
          </GlassCard>
        </TouchableOpacity>
      </Screen>
    );
  }

  return (
    <Screen title="Perfil" tab>
      <GlassCard style={{ marginBottom: 16 }} intensity={50}>
        <Text style={styles.name}>{user.nombre}</Text>
        <Text style={styles.email}>{user.email}</Text>
        <View style={{ marginTop: 8 }}>
          <Badge text={isAdmin ? 'Administrador' : isStaff ? 'Trabajador' : 'Cliente'} />
        </View>
      </GlassCard>

      {isCliente ? (
        <>
          <MenuItem icon="receipt-outline" label="Historial de compras" onPress={() => nav.push('PurchaseHistory')} />
          <MenuItem icon="return-down-back-outline" label="Mis reembolsos" onPress={() => nav.push('MyRefunds')} />
        </>
      ) : null}

      {isStaff ? (
        <>
          <MenuItem icon="barcode-outline" label="SKU registrados" onPress={() => nav.push('Skus')} />
          <MenuItem icon="pricetags-outline" label="Categorías" onPress={() => nav.push('Categories')} />
          <MenuItem icon="return-down-back-outline" label="Gestión de reembolsos" onPress={() => nav.push('RefundsManage')} />
        </>
      ) : null}

      {isAdmin ? (
        <>
          <MenuItem icon="notifications-outline" label="Notificaciones de stock" onPress={() => nav.push('Notifications')} />
          <MenuItem icon="list-outline" label="Historial global de ventas y reembolsos" onPress={() => nav.push('AdminHistory')} />
          <MenuItem icon="bar-chart-outline" label="Reportes" onPress={() => nav.push('Reports')} />
        </>
      ) : null}

      <Btn title="Cerrar sesión" variant="danger" onPress={logout} style={{ marginTop: 14 }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  lead: { color: colors.muted, marginBottom: 14, fontSize: 14 },
  choiceTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  choiceText: { color: colors.muted, fontSize: 13, marginTop: 6, lineHeight: 18 },
  name: { color: colors.text, fontSize: 22, fontWeight: '800' },
  email: { color: colors.muted, marginTop: 2 },
  menuCard: { marginBottom: 10 },
  menuRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  menuText: { color: colors.text, fontSize: 15, fontWeight: '600', flex: 1 },
  chevron: { color: colors.accent, fontSize: 24 }
});
