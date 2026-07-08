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
import { registerSchema } from '../../utils/validationSchemas';

const RegisterScreen = ({ navigation }) => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const [submitError, setSubmitError] = useState('');

  const formik = useFormik({
    initialValues: { name: '', email: '', password: '', confirmPassword: '' },
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setSubmitError('');
      try {
        await register(values);
      } catch (error) {
        setSubmitError(error?.message || 'Unable to create your account right now.');
        showToast(error?.message || 'Unable to create your account right now.', { type: 'error' });
      }
    },
  });

  return (
    <ScreenWrapper background={require('../../assets/images/auth-background.jpg')} scroll>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View className="mt-16 mb-10">
          <Text className="text-3xl font-bold text-text">Create your account</Text>
          <Text className="mt-1 text-sm text-textSecondary">Start building emotional awareness today.</Text>
        </View>

        <Input
          label="Full Name"
          placeholder="Jordan Lee"
          value={formik.values.name}
          onChangeText={formik.handleChange('name')}
          onBlur={formik.handleBlur('name')}
          error={validationErrorFor(formik, 'name')}
          touched={formik.touched.name}
          autoCapitalize="words"
          testID="register-name-input"
        />

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
          testID="register-email-input"
        />

        <Input
          label="Password"
          placeholder="Create a password"
          value={formik.values.password}
          onChangeText={formik.handleChange('password')}
          onBlur={formik.handleBlur('password')}
          error={validationErrorFor(formik, 'password')}
          touched={formik.touched.password}
          secureTextEntry
          secureToggle
          autoCapitalize="none"
          testID="register-password-input"
        />

        <Input
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={formik.values.confirmPassword}
          onChangeText={formik.handleChange('confirmPassword')}
          onBlur={formik.handleBlur('confirmPassword')}
          error={validationErrorFor(formik, 'confirmPassword')}
          touched={formik.touched.confirmPassword}
          secureTextEntry
          secureToggle
          autoCapitalize="none"
          testID="register-confirm-password-input"
        />

        {submitError ? <Text className="mb-2 text-center text-sm text-danger">{submitError}</Text> : null}
      </KeyboardAvoidingView>

      <View className="mt-4 flex-1 justify-end">
        <View className="mb-4">
          <Button label="Create Account" onPress={formik.handleSubmit} loading={formik.isSubmitting} />
        </View>
        <View className="flex-row justify-center pb-2">
          <Text className="text-sm text-textSecondary">Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text className="text-sm font-semibold text-primary">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default RegisterScreen;
