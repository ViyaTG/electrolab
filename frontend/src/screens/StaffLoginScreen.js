import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text } from '../i18n/ui';
import GlassCard from '../components/GlassCard';
import { Btn, Field, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { apiRequest } from '../api/client';
import { colors } from '../theme';

/**
 * Guarda la sesión y finaliza la intención de navegación.
 * @param {object} props Propiedades de composición y callbacks definidos en la firma.
 * @returns {React.ReactElement|null} Vista y estados de carga correspondientes.
 */
export default function StaffLoginScreen() {
  const { login } = useAuth();
  const nav = useNav();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Credenciales incorrectas');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/staff/login', { method: 'POST', body: { email: email.trim(), password } });
      await login(data);
      nav.finishAuth();
    } catch (err) {
      setError(err.status === 401 ? 'Credenciales incorrectas' : err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen title="Acceso de personal" onBack={nav.back}>
      <GlassCard intensity={55}>
        <Text style={styles.note}>Uso exclusivo interno. Las cuentas de trabajadores y administradores las crea la administración; no existe registro público.</Text>
        <Msg text={error} />
        <Field label="Correo institucional" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="trabajador@electrolab.com" />
        <Field label="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" />
        <Btn title="Ingresar" onPress={submit} loading={loading} />
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({ note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 16 } });
