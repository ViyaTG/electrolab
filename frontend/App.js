import React, { useCallback, useState } from 'react';
import { Platform, SafeAreaView, StatusBar as NativeStatusBar, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { NavProvider, useNav } from './src/context/NavContext';
import BottomNavBar from './src/components/BottomNavBar';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import CartScreen from './src/screens/CartScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import CustomerAuthScreen from './src/screens/CustomerAuthScreen';
import StaffLoginScreen from './src/screens/StaffLoginScreen';
import PurchaseHistoryScreen from './src/screens/PurchaseHistoryScreen';
import MyRefundsScreen from './src/screens/MyRefundsScreen';
import RefundRequestScreen from './src/screens/RefundRequestScreen';
import CategoriesScreen from './src/screens/CategoriesScreen';
import ProductFormScreen from './src/screens/ProductFormScreen';
import RefundsManageScreen from './src/screens/RefundsManageScreen';
import AdminHistoryScreen from './src/screens/AdminHistoryScreen';
import ReportsScreen from './src/screens/ReportsScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import LanguageProvider from './src/i18n/LanguageProvider';
import SkusScreen from './src/screens/SkusScreen';
import { useTranslation } from 'react-i18next';

const TABS = { home: HomeScreen, cart: CartScreen, profile: ProfileScreen };
const STACK_SCREENS = {
  Checkout: CheckoutScreen,
  CustomerAuth: CustomerAuthScreen,
  StaffLogin: StaffLoginScreen,
  PurchaseHistory: PurchaseHistoryScreen,
  MyRefunds: MyRefundsScreen,
  RefundRequest: RefundRequestScreen,
  Categories: CategoriesScreen,
  ProductForm: ProductFormScreen,
  RefundsManage: RefundsManageScreen,
  AdminHistory: AdminHistoryScreen,
  Reports: ReportsScreen,
  Notifications: NotificationsScreen,
  Skus: SkusScreen
};

function Root() {
  useTranslation();
  const { ready, user } = useAuth();
  const { tab, stack, goTab } = useNav();
  const top = stack[stack.length - 1];

  if (!ready) return <View style={styles.root} />;

  // Cambiar de usuario reinicia las pantallas para no mostrar datos del anterior.
  const sessionKey = user?.id || 'anon';
  const Content = top ? STACK_SCREENS[top.name] : TABS[tab];
  const contentKey = top ? `${sessionKey}-${stack.length}-${top.name}` : `${sessionKey}-${tab}`;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <SafeAreaView style={styles.safe}>
        <View style={styles.viewport}>
          <Content key={contentKey} {...(top ? top.params : {})} />
          {!top ? <BottomNavBar currentTab={tab} onSelectTab={goTab} /> : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const finishSplash = useCallback(() => setSplashDone(true), []);
  return (
    <LanguageProvider><AuthProvider>
      <CartProvider>
        <NavProvider>
          <View style={{ flex: 1 }}>
            <View style={{ flex: 1 }} accessibilityElementsHidden={!splashDone} importantForAccessibility={splashDone ? 'auto' : 'no-hide-descendants'}>
              <Root />
            </View>
            {!splashDone ? <SplashScreen onFinish={finishSplash} /> : null}
          </View>
        </NavProvider>
      </CartProvider>
    </AuthProvider></LanguageProvider>
  );
}

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: '#F1F1F3', paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight : 0 }, safe: { flex: 1 }, viewport: { flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center' } });
