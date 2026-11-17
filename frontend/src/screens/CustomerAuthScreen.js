import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Text, TouchableOpacity } from '../i18n/ui';
import GlassCard from '../components/GlassCard';
import { Btn, Field, Msg, Screen } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useNav } from '../context/NavContext';
import { apiRequest, errMsg } from '../api/client';
import { colors } from '../theme';

const TITLES = { login: 'Iniciar sesión', register: 'Crear cuenta', forgot: 'Recuperar contraseña', reset: 'Nueva contraseña' };

export default function CustomerAuthScreen() {
  const { login } = useAuth();
  const nav = useNav();
  const [mode, setMode] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [codigo, setCodigo] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = (next) => { setMode(next); setError(''); setInfo(''); setPassword(''); setConfirm(''); };

  const submit = async () => {
    setError('');
    setInfo('');
    setLoading(true);
    try {
      if (mode === 'login') {
        const data = await apiRequest('/auth/login', { method: 'POST', body: { email: email.trim(), password } });
        await login(data);
        nav.finishAuth();
      } else if (mode === 'register') {
        if (password !== confirm) throw new Error('Las contraseñas no coinciden');
        const data = await apiRequest('/auth/register', { method: 'POST', body: { nombre: nombre.trim(), email: email.trim(), password } });
        await login(data);
        nav.finishAuth();
      } else if (mode === 'forgot') {
        const data = await apiRequest('/auth/forgot-password', { method: 'POST', body: { email: email.trim() } });
        setInfo(data.message);
        setMode('reset');
      } else {
        if (password !== confirm) throw new Error('Las contraseñas no coinciden');
        const data = await apiRequest('/auth/reset-password', { method: 'POST', body: { email: email.trim(), codigo: codigo.trim(), nuevaPassword: password } });
        setMode('login');
        setPassword('');
        setConfirm('');
        setInfo(data.message);
      }
    } catch (err) {
      setError(mode === 'login' && err.status === 401 ? 'Credenciales incorrectas' : errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  const buttonLabel = { login: 'Ingresar', register: 'Registrarme', forgot: 'Enviar código', reset: 'Cambiar contraseña' }[mode];

  return (
    <Screen title={TITLES[mode]} onBack={nav.back}>
      <GlassCard intensity={55}>
        <Msg text={error} />
        <Msg text={info} type="ok" />
        {mode === 'register' ? <Field label="Nombre" value={nombre} onChangeText={setNombre} autoCapitalize="words" placeholder="Tu nombre" /> : null}
        <Field label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" placeholder="correo@ejemplo.com" />
        {mode === 'reset' ? <Field label="Código de 6 dígitos" value={codigo} onChangeText={(v) => setCodigo(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="123456" /> : null}
        {mode !== 'forgot' ? (
          <Field label={mode === 'reset' ? 'Nueva contraseña' : 'Contraseña'} value={password} onChangeText={setPassword} secureTextEntry placeholder="Mínimo 8 caracteres, con letra y número" />
        ) : null}
        {mode === 'register' || mode === 'reset' ? <Field label="Confirmar contraseña" value={confirm} onChangeText={setConfirm} secureTextEntry placeholder="Repite la contraseña" /> : null}
        <Btn title={buttonLabel} onPress={submit} loading={loading} />

        {mode === 'login' ? (
          <>
            <TouchableOpacity style={styles.link} onPress={() => switchMode('forgot')}><Text style={styles.linkText}>¿Olvidaste tu contraseña?</Text></TouchableOpacity>
            <TouchableOpacity style={styles.link} onPress={() => switchMode('register')}><Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text></TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.link} onPress={() => switchMode('login')}><Text style={styles.linkText}>Volver a iniciar sesión</Text></TouchableOpacity>
        )}
      </GlassCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: 14, alignItems: 'center' },
  linkText: { color: colors.accent, fontSize: 13, fontWeight: '600' }
});
