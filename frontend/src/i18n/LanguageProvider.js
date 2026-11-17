import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nextProvider } from 'react-i18next';
import { i18n } from './index';

export default function LanguageProvider({ children }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem('electrolab.language').then((saved) => i18n.changeLanguage(saved === 'en' ? 'en' : 'es')).catch(() => {}).finally(() => setReady(true));
    const updateDocument = (language) => { if (Platform.OS === 'web' && typeof document !== 'undefined') document.documentElement.lang = language; };
    updateDocument(i18n.language);
    i18n.on('languageChanged', updateDocument);
    return () => i18n.off('languageChanged', updateDocument);
  }, []);
  return <I18nextProvider i18n={i18n}>{ready ? children : null}</I18nextProvider>;
}

export async function changeLanguage(language) {
  await i18n.changeLanguage(language);
  await AsyncStorage.setItem('electrolab.language', language);
}
