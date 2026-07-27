import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ForgotPasswordScreen from '../screens/Auth/ForgotPasswordScreen';
import LoginScreen from '../screens/Auth/LoginScreen';
import RegisterScreen from '../screens/Auth/RegisterScreen';
import ResetPasswordScreen from '../screens/Auth/ResetPasswordScreen';
import VerifyOtpScreen from '../screens/Auth/VerifyOtpScreen';
import { AUTH_ROUTES } from './routes';

const Stack = createNativeStackNavigator();

const AuthNavigator = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={AUTH_ROUTES.LOGIN} component={LoginScreen} />
    <Stack.Screen name={AUTH_ROUTES.REGISTER} component={RegisterScreen} />
    <Stack.Screen name={AUTH_ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
    <Stack.Screen name={AUTH_ROUTES.VERIFY_OTP} component={VerifyOtpScreen} />
    <Stack.Screen name={AUTH_ROUTES.RESET_PASSWORD} component={ResetPasswordScreen} />
  </Stack.Navigator>
);

export default AuthNavigator;
