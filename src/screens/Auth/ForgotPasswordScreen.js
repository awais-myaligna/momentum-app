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
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../../context/ToastContext';
import { AUTH_ROUTES } from '../../navigation/routes';
import { sendOtp } from '../../services/authService';
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
const FormField = ({ label, value, onChangeText, keyboardType, autoCapitalize, autoComplete, error }) => (
  <Input
    label={label}
    value={value}
    onChangeText={onChangeText}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    autoComplete={autoComplete}
    error={error}
    touched={!!error}
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

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email.');
      return false;
    }
    return true;
  };

  const handleContinue = async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      const result = await sendOtp({ email: trimmedEmail });
      showToast(result?.message || 'OTP sent successfully', { type: 'success' });
      navigation.navigate(AUTH_ROUTES.VERIFY_OTP, { email: trimmedEmail });
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to send OTP. Please try again.');
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
                      title="Forgot Password"
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
                        Enter your email and we&apos;ll send you a code to reset your password
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
                      label="Email"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                      error={emailError}
                    />

                    <PrimaryButton
                      title="Continue"
                      onPress={handleContinue}
                      loading={loading}
                    />

                    <View className="flex-row justify-center mt-4 gap-1 flex-wrap">
                      <Text className="text-gray-500 text-xs">
                        Remember your password?
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}>
                        <Text
                          className="text-primary"
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            textDecorationLine: 'underline',
                          }}
                        >
                          Sign in
                        </Text>
                      </TouchableOpacity>
                    </View>

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
