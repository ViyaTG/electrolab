import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSessionStorage } from './createSessionStorage';

export const sessionStorage = createSessionStorage({ secure: SecureStore, legacy: AsyncStorage, native: Platform.OS !== 'web' });
