import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';

export async function initializeNativePlatform(darkMode: boolean) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    // Initial status bar setup
    await StatusBar.setStyle({
      style: darkMode ? Style.Light : Style.Dark,
    });
    
    // On Android, we set the background color to match the app theme
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setBackgroundColor({
        color: darkMode ? '#111827' : '#F7F4EF',
      });
    }

    // Hide the native splash screen after the JS app has hydrated
    // We wait a tiny bit to ensure the first paint is done
    setTimeout(async () => {
      await SplashScreen.hide();
    }, 500);
  } catch (e) {
    console.warn('Native platform initialization failed:', e);
  }
}

export async function updateNativeStatusBar(darkMode: boolean) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    await StatusBar.setStyle({
      style: darkMode ? Style.Light : Style.Dark,
    });
    
    if (Capacitor.getPlatform() === 'android') {
      await StatusBar.setBackgroundColor({
        color: darkMode ? '#111827' : '#F7F4EF',
      });
    }
  } catch (e) {
    console.error('Failed to update native status bar:', e);
  }
}
