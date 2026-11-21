import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

/**
 * Componente React Icon.
 * @param {object} props Propiedades de composición y callbacks definidos en la firma.
 * @returns {React.ReactElement|null} Vista y estados de carga correspondientes.
 */
export default function Icon({ name, size = 22, color = colors.text, style }) {
  return <Ionicons name={name} size={size} color={color} style={style} accessible={false} />;
}
