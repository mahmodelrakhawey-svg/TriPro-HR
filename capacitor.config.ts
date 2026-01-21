import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tripro.hr',
  appName: 'TriPro HR',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;