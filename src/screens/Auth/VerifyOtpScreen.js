import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useToast } from '../../context/ToastContext';
import { AUTH_ROUTES } from '../../navigation/routes';
import { sendOtp, verifyOtp } from '../../services/authService';
import Icon from '../../components/Icon';
import { ICONS } from '../../constants/icons';
import Button from '../../components/Button';

const OTP_LENGTH = 6;

// Mimicking TopBar
const TopBar = ({ title, onBack }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10 }}>
    <TouchableOpacity onPress={onBack} style={{ padding: 8 }}>
      <Icon name={ICONS.BACK} size={24} color="#fff" />
    </TouchableOpacity>
    <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginLeft: 8 }}>{title}</Text>
  </View>
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

const OtpField = ({ digits, onChangeDigit, onKeyPressDigit, error, inputRefs }) => (
  <View className="mb-4">
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          value={digit}
          onChangeText={(text) => onChangeDigit(index, text)}
          onKeyPress={(e) => onKeyPressDigit(index, e)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          className={`text-text text-lg font-semibold rounded-xl border bg-white ${error ? 'border-danger' : 'border-border'}`}
          style={{ width: 44, height: 52 }}
        />
      ))}
    </View>
    {error ? <Text className="mt-1 text-xs text-danger">{error}</Text> : null}
  </View>
);

const getErrorMessage = (err, fallback) => err?.response?.data?.message || err?.message || fallback;

export default function VerifyOtpScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { showToast } = useToast();
  const email = route.params?.email || '';

  const [digits, setDigits] = useState(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef([]);

  const handleChangeDigit = (index, text) => {
    const value = text.replace(/[^0-9]/g, '');
    setDigits((current) => {
      const next = [...current];
      next[index] = value.slice(-1);
      return next;
    });
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPressDigit = (index, e) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const otp = digits.join('');
    setOtpError('');

    if (otp.length !== OTP_LENGTH) {
      setOtpError(`Please enter the ${OTP_LENGTH}-digit code.`);
      return;
    }

    setApiError('');
    setLoading(true);
    try {
      const result = await verifyOtp({ email, otp });
      showToast(result?.message || 'OTP verified successfully', { type: 'success' });
      navigation.navigate(AUTH_ROUTES.RESET_PASSWORD, { email, resetToken: result.resetToken });
    } catch (err) {
      const message = getErrorMessage(err, 'Invalid OTP. Please try again.');
      setApiError(message);
      showToast(message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setApiError('');
    setResending(true);
    try {
      const result = await sendOtp({ email });
      showToast(result?.message || 'OTP sent successfully', { type: 'success' });
    } catch (err) {
      const message = getErrorMessage(err, 'Failed to resend OTP. Please try again.');
      setApiError(message);
      showToast(message, { type: 'error' });
    } finally {
      setResending(false);
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
                      title="Verify OTP"
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
                        Enter the code sent to{'\n'}{email}
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
                    <OtpField
                      digits={digits}
                      onChangeDigit={handleChangeDigit}
                      onKeyPressDigit={handleKeyPressDigit}
                      error={otpError}
                      inputRefs={inputRefs}
                    />

                    <PrimaryButton
                      title="Verify"
                      onPress={handleVerify}
                      loading={loading}
                    />

                    <View className="flex-row justify-center mt-4 gap-1 flex-wrap">
                      <Text className="text-gray-500 text-xs">
                        Didn&apos;t receive the code?
                      </Text>
                      <TouchableOpacity onPress={handleResend} disabled={resending}>
                        <Text
                          className="text-primary"
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            textDecorationLine: 'underline',
                            opacity: resending ? 0.5 : 1,
                          }}
                        >
                          {resending ? 'Resending...' : 'Resend'}
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
