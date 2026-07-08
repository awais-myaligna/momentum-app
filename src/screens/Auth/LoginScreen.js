import { useFormik } from 'formik';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from 'react-native';

import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { AUTH_ROUTES } from '../../navigation/routes';
import { validationErrorFor } from '../../utils/formHelpers';
import { loginSchema } from '../../utils/validationSchemas';

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState('');

  const formik = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      setSubmitError('');
      try {
        await login(values);
      } catch (error) {
        setSubmitError(error?.message || 'Unable to sign in right now.');
        showToast(error?.message || 'Unable to sign in right now.', { type: 'error' });
      }
    },
  });

  const handleForgotPassword = () => {
    showToast("Password reset isn't available in this preview yet.", { type: 'info' });
  };

  return (
    <ScreenWrapper background={require('../../assets/images/auth-background.jpg')} scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="mt-16 mb-10">
          <Text className="text-3xl font-bold text-text">Welcome back</Text>
          <Text className="mt-1 text-sm text-textSecondary">Sign in to continue your emotional journey.</Text>
        </View>

        <Input
          label="Email"
          placeholder="you@example.com"
          value={formik.values.email}
          onChangeText={formik.handleChange('email')}
          onBlur={formik.handleBlur('email')}
          error={validationErrorFor(formik, 'email')}
          touched={formik.touched.email}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="login-email-input"
        />

        <Input
          label="Password"
          placeholder="Enter your password"
          value={formik.values.password}
          onChangeText={formik.handleChange('password')}
          onBlur={formik.handleBlur('password')}
          error={validationErrorFor(formik, 'password')}
          touched={formik.touched.password}
          secureTextEntry
          secureToggle
          autoCapitalize="none"
          testID="login-password-input"
        />

        <TouchableOpacity onPress={handleForgotPassword} className="mb-2 self-end" hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text className="text-sm font-medium text-primary">Forgot password?</Text>
        </TouchableOpacity>

        {submitError ? <Text className="mb-2 text-center text-sm text-danger">{submitError}</Text> : null}
      </KeyboardAvoidingView>

      <View className="mt-6 flex-1 justify-end">
        <View className="mb-4">
          <Button label="Sign In" onPress={formik.handleSubmit} loading={formik.isSubmitting} />
        </View>
        <View className="flex-row justify-center pb-2">
          <Text className="text-sm text-textSecondary">Don&apos;t have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(AUTH_ROUTES.REGISTER)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-sm font-semibold text-primary">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default LoginScreen;
