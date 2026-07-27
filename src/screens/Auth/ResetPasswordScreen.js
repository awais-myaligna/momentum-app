import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../context/ToastContext';
import { AUTH_ROUTES } from '../../navigation/routes';
import { resetPassword } from '../../services/authService';
import Icon from '../../components/Icon';
import { ICONS } from '../../constants/icons';
import Input from '../../components/Input';
import Button from '../../components/Button';

// Mimicking TopBar
const TopBar = ({ title, onBack }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
    <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
      <Icon name={ICONS.BACK} size={24} color="#fff" />
    </TouchableOpacity>
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>{title}</Text>
  </View>
);

// Mimicking FormField
const FormField = ({ label, value, onChangeText, error, secureTextEntry, showToggle, autoComplete }) => (
  <Input
    label={label}
    value={value}
    onChangeText={onChangeText}
    error={error}
    touched={!!error}
    secureTextEntry={secureTextEntry}
    secureToggle={showToggle}
    autoComplete={autoComplete}
    className="mb-4"
  />
);

// Mimicking PrimaryButton
const PrimaryButton = ({ title, onPress, loading }) => (
  <Button
    label={title}
    onPress={onPress}
    loading={loading}
    className="mt-2 mb-2"
  />
);

const getErrorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

export default function ResetPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const { email, resetToken } = route.params || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    setPasswordError('');
    setConfirmError('');

    if (!password) {
      setPasswordError('Password is required.');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      valid = false;
    }
    if (!confirmPassword) {
      setConfirmError('Please confirm your password.');
      valid = false;
    } else if (password && confirmPassword !== password) {
      setConfirmError('Passwords do not match.');
      valid = false;
    }
    return valid;
  };

  const handleResetPassword = async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      const result = await resetPassword({
        email,
        token: resetToken,
        password,
        password_confirmation: confirmPassword,
      });
      showToast(result?.message || 'Password reset successful', { type: 'success' });
      navigation.reset({
        index: 0,
        routes: [{ name: AUTH_ROUTES.LOGIN }],
      });
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to reset password. Please try again.');
      setApiError(message);
      showToast(message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/background.png')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <ScrollView
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View
                style={{
                  width: '88%',
                  height: "90%",
                  alignSelf: 'center',
                  marginVertical: 40,
                  borderRadius: 38,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 12,
                }}
              >
                <View
                  className="flex-1 justify-between"
                  style={{
                    borderRadius: 30,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}
                >
                  <View>
                    {/* TopBar */}
                    <TopBar
                      title="Reset Password"
                      onBack={() => navigation.goBack()}
                    />

                    {/* Hero */}
                    <View className="items-center pt-4 pb-6 px-4">
                      <Image
                        source={require('../../../assets/logo.png')}
                        style={{ width: '100%', height: undefined, aspectRatio: 1.8 }}
                        resizeMode="contain"
                      />
                      <Text
                        style={{
                          color: '#fff',
                          fontSize: 15,
                          fontWeight: '600',
                          marginTop: 20,
                          letterSpacing: 0.5,
                          textAlign: 'center',
                        }}
                      >
                        Create a new password for your account
                      </Text>
                    </View>
                  </View>

                  {/* Form panel */}
                  <View
                    className="w-full"
                    style={{
                      backgroundColor: '#fff',
                      borderTopLeftRadius: 32,
                      borderTopRightRadius: 32,
                      borderBottomLeftRadius: 30,
                      borderBottomRightRadius: 30,
                      paddingVertical: 32,
                      paddingHorizontal: 24,
                    }}
                  >
                    <FormField
                      label="New Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      showToggle
                      autoComplete="password"
                      error={passwordError}
                    />

                    <FormField
                      label="Confirm Password"
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      secureTextEntry
                      showToggle
                      autoComplete="password"
                      error={confirmError}
                    />

                    <PrimaryButton
                      title="Reset Password"
                      onPress={handleResetPassword}
                      loading={loading}
                    />

                    {apiError ? (
                      <Text className="mt-2.5 text-center text-xs text-red-600">
                        {apiError}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}
