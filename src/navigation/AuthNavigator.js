import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import { AUTH_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={AUTH_ROUTES.LOGIN} component={LoginScreen} />
    <Stack.Screen name={AUTH_ROUTES.REGISTER} component={RegisterScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
