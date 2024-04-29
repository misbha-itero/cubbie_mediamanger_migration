import { NativeModules } from 'react-native';

const { Background } = NativeModules;
console.log('NativeModules', NativeModules);
console.log('Background', Background);
export default Background;