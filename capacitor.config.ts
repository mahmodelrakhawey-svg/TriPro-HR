import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tripro.hr',
  appName: 'TriPro HR',
  webDir: 'build',
  server: {
     url: 'http://192.168.2.44:3000',
    androidScheme: 'https'
  }
};

export default config;