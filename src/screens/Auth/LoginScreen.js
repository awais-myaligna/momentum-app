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
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AUTH_ROUTES } from '../../navigation/routes';
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
const FormField = ({ label, value, onChangeText, keyboardType, autoCapitalize, autoComplete, error, secureTextEntry, showToggle }) => (
  <Input
    label={label}
    value={value}
    onChangeText={onChangeText}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    autoComplete={autoComplete}
    error={error}
    touched={!!error}
    secureTextEntry={secureTextEntry}
    secureToggle={showToggle}
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

export default function LoginScreen() {
  const navigation = useNavigation();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passError, setPassError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    let valid = true;
    setEmailError('');
    setPassError('');

    if (!email.trim()) {
      setEmailError('Email is required.');
      valid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Please enter a valid email.');
      valid = false;
    }
    if (!password) {
      setPassError('Password is required.');
      valid = false;
    }
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      const result = await login({ email: email.trim(), password });
      showToast(result?.message || 'Login successful', { type: 'success' });
    } catch (err) {
      const message = err.message || 'Login failed. Please try again.';
      setApiError(message);
      showToast(message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/auth-background.jpg')}
      style={{ flex: 1 }}
      resizeMode="cover"
    >
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior="padding"
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
                      title="Sign in"
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
                        }}
                      >
                        Welcome back
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

                    <FormField
                      label="Password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry
                      showToggle
                      autoComplete="password"
                      error={passError}
                    />

                    <TouchableOpacity
                      onPress={() => { }}
                      style={{ alignSelf: 'flex-end', marginBottom: 8, marginTop: -4 }}
                    >
                      <Text
                        className="text-primary"
                        style={{
                          fontSize: 12,
                          fontWeight: '600',
                          textDecorationLine: 'underline',
                        }}
                      >
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>

                    <PrimaryButton
                      title="Sign in"
                      onPress={handleLogin}
                      loading={loading}
                    />

                    <View className="flex-row justify-center mt-4 gap-1 flex-wrap">
                      <Text className="text-gray-500 text-xs">
                        Don&apos;t have an account?
                      </Text>
                      <TouchableOpacity onPress={() => navigation.navigate(AUTH_ROUTES.REGISTER)}>
                        <Text
                          className="text-primary"
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            textDecorationLine: 'underline',
                          }}
                        >
                          Sign up
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {apiError ? (
                      <Text
                        style={{
                          color: '#b00020',
                          fontSize: 12,
                          textAlign: 'center',
                          marginTop: 10,
                        }}
                      >
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
