import React from 'react';
import { Alert as NativeAlert, Platform, Text as NativeText, TextInput as NativeTextInput, TouchableOpacity as NativeTouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { translateText } from './index';

export function Text({ children, accessibilityLabel, ...props }) {
  useTranslation();
  const translated = React.Children.map(children, (child) => typeof child === 'string' ? translateText(child) : child);
  return <NativeText {...props} accessibilityLabel={translateText(accessibilityLabel)}>{translated}</NativeText>;
}
export const TextInput = React.forwardRef(function TextInput({ placeholder, accessibilityLabel, ...props }, ref) {
  useTranslation();
  return <NativeTextInput {...props} ref={ref} placeholder={translateText(placeholder)} accessibilityLabel={translateText(accessibilityLabel)} />;
});
export const TouchableOpacity = React.forwardRef(function TouchableOpacity({ accessibilityLabel, accessibilityHint, ...props }, ref) {
  useTranslation();
  return <NativeTouchableOpacity {...props} ref={ref} accessibilityLabel={translateText(accessibilityLabel)} accessibilityHint={translateText(accessibilityHint)} />;
});
export const Alert = {
  alert(title, message, buttons, options) {
    const translated = buttons?.map((button) => ({ ...button, text: translateText(button.text) }));
    if (Platform.OS === 'web') {
      const content = [translateText(title), translateText(message)].filter(Boolean).join('\n\n');
      if (translated?.length > 1) {
        const accepted = globalThis.confirm(content);
        const action = accepted ? translated.slice().reverse().find((button) => button.style !== 'cancel') : translated.find((button) => button.style === 'cancel');
        action?.onPress?.();
      } else { globalThis.alert(content); translated?.[0]?.onPress?.(); }
      return;
    }
    NativeAlert.alert(translateText(title), translateText(message), translated, options);
  }
};
