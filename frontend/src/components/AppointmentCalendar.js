import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity } from '../i18n/ui';
import { locale, translateText } from '../i18n';
import { useAuth } from '../context/AuthContext';
import { addDays, calendarDays, moveMonth, storeToday } from '../utils/storeCalendar';
import { Btn, Loading, Msg } from './ui';
import Icon from './Icon';
import { colors } from '../theme';

/**
 * Componente React AppointmentCalendar.
 * @param {object} props Propiedades de composición y callbacks definidos en la firma.
 * @returns {React.ReactElement|null} Vista y estados de carga correspondientes.
 */
export default function AppointmentCalendar({ date, time, onDateChange, onTimeChange, refreshKey = 0 }) {
  useTranslation();
  const { api } = useAuth();
  const today = storeToday();
  const [month, setMonth] = useState((date || addDays(today, 1)).slice(0, 7));
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setError('');
    if (!date) { setResult(null); return () => { active = false; }; }
    setLoading(true);
    api(`/refunds/availability?fecha=${encodeURIComponent(date)}`)
      .then((response) => { if (active) setResult(response); })
      .catch(() => { if (active) { setResult(null); setError('No se pudieron cargar los horarios.'); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [api, date, retry, refreshKey]);
  const [year, number] = month.split('-').map(Number);
  const monthTitle = new Intl.DateTimeFormat(locale(), { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(year, number - 1, 1, 12)));
  const weekdays = Array.from({ length: 7 }, (_, index) => new Intl.DateTimeFormat(locale(), { weekday: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2023, 0, 2 + index, 12))));
  const ready = result?.fecha === date && !loading;
  const slots = ready ? result.horarios : [];
  return <View style={styles.container}>
    <Text style={styles.label}>Día de la cita</Text>
    <Text style={styles.hint}>Elige un día posterior a hoy.</Text>
    <View style={styles.monthRow}>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={translateText('Mes anterior')} disabled={moveMonth(month, -1) < today.slice(0, 7)} onPress={() => setMonth(moveMonth(month, -1))} style={styles.monthButton}><Icon name="chevron-back" /></TouchableOpacity>
      <Text style={styles.month}>{monthTitle}</Text>
      <TouchableOpacity accessibilityRole="button" accessibilityLabel={translateText('Mes siguiente')} onPress={() => setMonth(moveMonth(month, 1))} style={styles.monthButton}><Icon name="chevron-forward" /></TouchableOpacity>
    </View>
    <ScrollView horizontal contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <View style={styles.calendar}>
        {weekdays.map((day, index) => <Text key={`weekday-${index}`} style={styles.weekday}>{day}</Text>)}
        {calendarDays(month).map((day, index) => day ? <TouchableOpacity key={day} accessibilityRole="button" accessibilityLabel={day} accessibilityState={{ disabled: day <= today, selected: date === day }} disabled={day <= today} style={[styles.day, day <= today && styles.past, date === day && styles.selected]} onPress={() => { onDateChange(day); onTimeChange(''); }}>
          <Text style={[styles.dayText, date === day && styles.selectedText]}>{Number(day.slice(-2))}</Text>
        </TouchableOpacity> : <View key={`blank-${index}`} style={styles.day} />)}
      </View>
    </ScrollView>
    <Text style={styles.label}>Horarios disponibles</Text>
    <Text style={styles.hint}>Cada cita dura 20 minutos. Horario de Ciudad de México.</Text>
    {!date ? <Text style={styles.hint}>Elige un día para consultar los horarios.</Text> : null}
    {date && loading ? <Loading /> : null}
    <Msg text={error} />
    {error ? <Btn title="Reintentar" variant="ghost" onPress={() => setRetry((value) => value + 1)} /> : null}
    {ready ? <View accessibilityRole="radiogroup" style={styles.slots}>
      {slots.map((slot) => <TouchableOpacity key={slot.hora} accessibilityRole="radio" accessibilityLabel={`${slot.hora}${slot.disponible ? '' : ` ${translateText('Ocupado')}`}`} accessibilityState={{ checked: time === slot.hora, disabled: !slot.disponible }} disabled={!slot.disponible} style={[styles.slot, !slot.disponible && styles.past, time === slot.hora && styles.selected]} onPress={() => onTimeChange(slot.hora)}>
        <Text style={[styles.dayText, time === slot.hora && styles.selectedText]}>{slot.hora}</Text>{!slot.disponible ? <Text style={styles.hint}>Ocupado</Text> : null}
      </TouchableOpacity>)}
    </View> : null}
    {ready && !slots.some((slot) => slot.disponible) ? <Text style={styles.hint}>No hay horarios disponibles para este día.</Text> : null}
  </View>;
}
const styles = StyleSheet.create({
  container: { marginVertical: 14 }, label: { fontSize: 14, fontWeight: '700', color: colors.text, marginTop: 14, marginBottom: 6 },
  hint: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: 8 },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  monthButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  month: { flex: 1, textAlign: 'center', color: colors.text, fontSize: 16, fontWeight: '600' },
  calendar: { width: 336, flexDirection: 'row', flexWrap: 'wrap' },
  weekday: { width: 48, textAlign: 'center', color: colors.muted, fontSize: 12, paddingVertical: 8 },
  day: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 24 },
  dayText: { fontSize: 14, color: colors.text }, selected: { backgroundColor: colors.primary }, selectedText: { color: '#FFFFFF', fontWeight: '700' },
  past: { opacity: 0.35 }, slots: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  slot: { minWidth: 76, minHeight: 48, padding: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 18 }
});
