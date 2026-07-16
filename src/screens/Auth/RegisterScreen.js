import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import {
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/Button';
import Icon from '../../components/Icon';
import Input from '../../components/Input';
import { ICONS } from '../../constants/icons';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AUTH_ROUTES } from '../../navigation/routes';

const TopBar = ({ title, onBack }) => (
  <View className="flex-row items-center px-4 py-3">
    <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
      <Icon name={ICONS.BACK} size={24} color="#fff" />
    </TouchableOpacity>
    <Text className="ml-2 text-lg font-bold text-white">{title}</Text>
  </View>
);

const FormField = ({ label, value, onChangeText, keyboardType, autoCapitalize, autoComplete, error, secureTextEntry, showToggle }) => (
  <Input
    label={label}
    value={value}
    onChangeText={onChangeText}
    keyboardType={keyboardType}
    autoCapitalize={autoCapitalize}
    autoComplete={autoComplete}
    error={error}
    touched={Boolean(error)}
    secureTextEntry={secureTextEntry}
    secureToggle={showToggle}
    className="mb-4"
  />
);

const LANGUAGES = ['English', 'Arabic', 'Spanish', 'French', 'Hindi', 'Chinese'];
const AGENTS = ['Peggy', 'Lotus', 'Denis'];
const GENDERS = ['Male', 'Female', 'Other'];

const DropdownField = ({ label, value, options, onSelect, error }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      <Text className="mb-2 ml-1 text-sm font-semibold text-gray-700">{label}</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        className={`h-14 justify-center rounded-2xl border bg-gray-50 px-4 ${error ? 'border-red-500' : 'border-gray-200'}`}
      >
        <Text className="text-gray-900">{value || `Select ${label}`}</Text>
      </TouchableOpacity>
      {error ? <Text className="mt-1 ml-1 text-xs text-red-500">{error}</Text> : null}
      
      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={{ backgroundColor: 'white', width: '80%', borderRadius: 16, maxHeight: '60%', overflow: 'hidden' }}>
            <FlatList
              data={options}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}
                  onPress={() => {
                    onSelect(item);
                    setVisible(false);
                  }}
                >
                  <Text style={{ textAlign: 'center', fontSize: 16, color: item === value ? '#B01488' : '#374151', fontWeight: item === value ? 'bold' : 'normal' }}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const DatePickerField = ({ label, value, onChange, error }) => {
  const [show, setShow] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (selectedDate) {
      const formattedDate = selectedDate.toISOString().split('T')[0];
      onChange(formattedDate);
    }
  };

  return (
    <View className="mb-4">
      <Text className="mb-2 ml-1 text-sm font-semibold text-gray-700">{label}</Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        className={`h-14 justify-center rounded-2xl border bg-gray-50 px-4 ${error ? 'border-red-500' : 'border-gray-200'}`}
      >
        <Text className="text-gray-900">{value || 'YYYY-MM-DD'}</Text>
      </TouchableOpacity>
      {error ? <Text className="mt-1 ml-1 text-xs text-red-500">{error}</Text> : null}
      
      {show && (
        Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade">
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
              activeOpacity={1}
              onPress={() => setShow(false)}
            >
              <View style={{ backgroundColor: 'white', paddingBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', padding: 16 }}>
                   <TouchableOpacity onPress={() => setShow(false)}>
                     <Text style={{ color: '#B01488', fontWeight: 'bold', fontSize: 16 }}>Done</Text>
                   </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={value ? new Date(value) : new Date()}
                  mode="date"
                  display="spinner"
                  maximumDate={new Date()}
                  onChange={onChangeDate}
                />
              </View>
            </TouchableOpacity>
          </Modal>
        ) : (
          <DateTimePicker
            value={value ? new Date(value) : new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onChange={onChangeDate}
          />
        )
      )}
    </View>
  );
};

const PrimaryButton = ({ title, onPress, loading }) => <Button label={title} onPress={onPress} loading={loading} className="mt-2 mb-2" />;

const initialForm = {
  first_name: '',
  last_name: '',
  nickname: '',
  date_of_birth: '',
  gender: 'Male',
  default_language: 'English',
  default_agent: 'Peggy',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
};

const RegisterScreen = () => {
  const navigation = useNavigation();
  const { register } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(initialForm);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (key) => (val) => setForm((current) => ({ ...current, [key]: val }));

  const validate = () => {
    if (!form.first_name.trim()) return 'First name is required.';
    if (!form.last_name.trim()) return 'Last name is required.';
    if (!form.email.trim()) return 'Email is required.';
    if (!/\S+@\S+\.\S+/.test(form.email)) return 'Please enter a valid email.';
    if (!form.date_of_birth.trim()) return 'Date of birth is required.';
    if (!form.password) return 'Password is required.';
    if (form.password.length < 8) return 'Password must be at least 8 characters.';
    if (form.password !== form.confirm_password) return 'Passwords do not match.';
    if (!agreeTerms) return 'You must agree to the Terms & Privacy.';
    return null;
  };

  const handleRegister = async () => {
    const error = validate();
    if (error) {
      setApiError(error);
      return;
    }

    setApiError('');
    setLoading(true);
    try {
      const result = await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        nickname: form.nickname.trim() || null,
        dob: form.date_of_birth,
        default_language: form.default_language,
        default_agent: form.default_agent,
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        password: form.password,
        password_confirmation: form.confirm_password,
        gender: form.gender,
      });
      showToast(result?.message || 'Account created successfully', { type: 'success' });
    } catch (error) {
      const message = error?.message || 'Registration failed. Please try again.';
      setApiError(message);
      showToast(message, { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground source={require('../../assets/images/auth-background.jpg')} style={{ flex: 1 }} resizeMode="cover">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <View
                style={{
                  width: '88%',
                  alignSelf: 'center',
                  marginVertical: 40,
                  borderRadius: 38,
                  backgroundColor: 'rgba(255,255,255,0.08)',
                  padding: 12,
                }}>
                <View
                  className="flex-1 justify-between"
                  style={{
                    borderRadius: 30,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    overflow: 'hidden',
                  }}>
                  <View>
                    <TopBar title="Sign up" onBack={() => navigation.goBack()} />

                    <View className="items-center px-4 py-6">
                      <Image source={require('../../../assets/logo.png')} style={{ width: '100%', height: undefined, aspectRatio: 1.8 }} resizeMode="contain" />
                      <Text className="mt-5 text-[15px] font-semibold tracking-[0.5px] text-white">Create your account</Text>
                    </View>
                  </View>

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
                    }}>
                    <View className="mb-4 flex-row">
                      <View className="mr-2 flex-1">
                        <FormField label="First name *" value={form.first_name} onChangeText={setField('first_name')} autoCapitalize="words" />
                      </View>
                      <View className="ml-2 flex-1">
                        <FormField label="Last name *" value={form.last_name} onChangeText={setField('last_name')} autoCapitalize="words" />
                      </View>
                    </View>

                    <FormField label="Nickname" value={form.nickname} onChangeText={setField('nickname')} autoCapitalize="none" />
                    <DatePickerField label="Date of birth *" value={form.date_of_birth} onChange={setField('date_of_birth')} />
                    <DropdownField label="Gender *" value={form.gender} options={GENDERS} onSelect={setField('gender')} />
                    <DropdownField label="Default language" value={form.default_language} options={LANGUAGES} onSelect={setField('default_language')} />
                    <DropdownField label="Default agent" value={form.default_agent} options={AGENTS} onSelect={setField('default_agent')} />
                    <FormField label="Email *" value={form.email} onChangeText={setField('email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
                    <FormField label="Phone (optional)" value={form.phone} onChangeText={setField('phone')} keyboardType="phone-pad" />
                    <FormField label="Password *" value={form.password} onChangeText={setField('password')} secureTextEntry showToggle autoComplete="password" />
                    <FormField label="Confirm password *" value={form.confirm_password} onChangeText={setField('confirm_password')} secureTextEntry showToggle autoComplete="password" />

                    <TouchableOpacity onPress={() => setAgreeTerms((value) => !value)} className="mb-3 flex-row items-start">
                      <View
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          borderWidth: 2,
                          borderColor: agreeTerms ? '#B01488' : '#9CA3AF',
                          backgroundColor: agreeTerms ? '#B01488' : 'transparent',
                          marginTop: 2,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                        {agreeTerms ? <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>✓</Text> : null}
                      </View>
                      <Text className="ml-2 flex-1 text-xs text-gray-600">
                        I agree to the{' '}
                        <Text style={{ color: '#B01488', fontWeight: '600' }}>Terms</Text>
                        {' & '}
                        <Text style={{ color: '#B01488', fontWeight: '600' }}>Privacy</Text>
                      </Text>
                    </TouchableOpacity>

                    <PrimaryButton title="Create account" onPress={handleRegister} loading={loading} />

                    <View className="mt-4 flex-row flex-wrap justify-center">
                      <Text className="text-xs text-gray-500">Already have an account?</Text>
                      <TouchableOpacity onPress={() => navigation.navigate(AUTH_ROUTES.LOGIN)}>
                        <Text className="ml-1 text-xs font-semibold text-primary underline">Sign in</Text>
                      </TouchableOpacity>
                    </View>

                    {apiError ? (
                      <Text style={{ color: '#b00020', fontSize: 12, textAlign: 'center', marginTop: 10 }}>
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
};

export default RegisterScreen;
