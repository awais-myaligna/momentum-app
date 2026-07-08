// CommonJS export so tailwind.config.js (plain Node, no Babel) can require()
// this file directly, while app code still uses `import { COLORS } from ...`
// thanks to Babel's CJS/ESM interop.
const COLORS = {
  primary: '#2391FF',
  secondary: '#6CB7FF',
  white: '#FFFFFF',
  black: '#000000',
  text: '#1A1A1A',
  textSecondary: '#666666',
  background: '#F7F9FC',
  border: '#E5E7EB',
  success: '#2ECC71',
  warning: '#F39C12',
  danger: '#E74C3C',
  gray100: '#F5F5F5',
  gray200: '#EEEEEE',
  gray300: '#DDDDDD',
  gray400: '#CCCCCC',
  gray500: '#999999',
  transparent: 'transparent',
};

module.exports = { COLORS };
