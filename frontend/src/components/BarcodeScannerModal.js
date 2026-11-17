import React, { useEffect, useRef } from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Btn } from './ui';
import { colors } from '../theme';

// Escáner de códigos de barras con la cámara. Devuelve el texto leído mediante onScanned.
export default function BarcodeScannerModal({ visible, onClose, onScanned }) {
  const [permission, requestPermission] = useCameraPermissions();
  const handled = useRef(false);

  useEffect(() => {
    if (visible) {
      handled.current = false;
      if (permission && !permission.granted && permission.canAskAgain) requestPermission();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScan = ({ data }) => {
    if (handled.current) return; // evita lecturas duplicadas
    handled.current = true;
    onScanned(String(data).trim());
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            onBarcodeScanned={handleScan}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'itf14', 'qr'] }}
          />
        ) : (
          <View style={styles.center}>
            <Text style={styles.text}>Se necesita permiso para usar la cámara y leer códigos de barras.</Text>
            <Btn title="Dar permiso" onPress={requestPermission} style={{ marginTop: 14, alignSelf: 'stretch' }} />
          </View>
        )}
        <View style={styles.overlay} pointerEvents="box-none">
          {permission?.granted ? <><View style={styles.frame} pointerEvents="none" /><Text style={styles.hint}>Apunta al código de barras</Text></> : null}
          <Btn title="Cancelar" variant="ghost" onPress={onClose} style={[styles.cancel, { backgroundColor: '#FFFFFF' }]} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', padding: 28 },
  text: { color: colors.text, textAlign: 'center', fontSize: 15 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  frame: { width: 280, height: 160, borderWidth: 2, borderColor: '#FFFFFF', borderRadius: 16 },
  hint: { color: '#FFFFFF', marginTop: 16, fontWeight: '700' },
  cancel: { position: 'absolute', bottom: 50, left: 24, right: 24 }
});
