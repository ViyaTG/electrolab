import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import GlassCard from '../components/GlassCard';
import { apiRequest } from '../api/client';

export default function LoginScreen({ onLoginSuccess, onBack }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setErrorMsg('');
    if (!email.trim() || !password) {
      setErrorMsg('Credenciales incorrectas');
      return;
    }
    setLoading(true);
    try {
      const data = await apiRequest('/auth/login', {
        method: 'POST',
        body: { email, password }
      });
      onLoginSuccess(data);
    } catch (err) {
      setErrorMsg('Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GlassCard intensity={55}>
        <Text style={styles.title}>Acceso de Trabajadores</Text>
        <Text style={styles.securityNote}>
          Sistema de uso exclusivo interno. Las cuentas son aprovisionadas directamente por administración.
        </Text>
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}
        <Text style={styles.label}>Correo Institucional</Text>
        <TextInput
          style={styles.input}
          placeholder="trabajador@tienda.com"
          placeholderTextColor="#6B6B72"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          placeholderTextColor="#6B6B72"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.loginButtonText}>Ingresar al Inventario</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={styles.backLink} onPress={onBack}>
          <Text style={styles.backLinkText}>Volver a Inicio</Text>
        </TouchableOpacity>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#F1F1F3' },
  title: { color: '#171719', fontSize: 24, fontWeight: '800', marginBottom: 6 },
  securityNote: { color: '#626268', fontSize: 12, marginBottom: 18, lineHeight: 18 },
  errorBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.08)', borderColor: 'rgba(0, 0, 0, 0.08)',
    borderWidth: 1, padding: 10, borderRadius: 10, marginBottom: 14
  },
  errorText: { color: '#303035', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  label: { color: '#38383D', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.78)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#171719', marginBottom: 16
  },
  loginButton: { backgroundColor: '#171719', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  loginButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  backLink: { marginTop: 16, alignItems: 'center' },
  backLinkText: { color: '#626268', fontSize: 13 }
});
