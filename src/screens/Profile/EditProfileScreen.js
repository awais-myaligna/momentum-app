import { useCallback, useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import Button from '../../components/Button';
import EmptyState from '../../components/EmptyState';
import Header from '../../components/Header';
import Icon from '../../components/Icon';
import Input from '../../components/Input';
import Loading from '../../components/Loading';
import Modal from '../../components/Modal';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { ICONS } from '../../constants/icons';
import ScreenWrapper from '../../layouts/ScreenWrapper';
import { getUserProfile, updateUserProfile } from '../../services/profileService';
import { COLORS } from '../../styles/colors';

const GENDERS = ['male', 'female', 'other'];
const LANGUAGES = ['English', 'Arabic', 'Spanish', 'French', 'Hindi', 'Chinese'];
const AGENTS = ['peggy', 'lotus', 'denis'];

const capitalize = (value = '') => (value ? value.charAt(0).toUpperCase() + value.slice(1) : '');

// Only these are user-editable profile fields; id/verified/timestamps etc.
// are server-owned metadata and stay off this form.
const EDITABLE_FIELDS = [
  'first_name',
  'last_name',
  'nickname',
  'email',
  'phone',
  'dob',
  'gender',
  'default_language',
  'default_agent',
];

const pickEditableFields = (user = {}) =>
  EDITABLE_FIELDS.reduce((acc, key) => {
    acc[key] = user[key] ?? '';
    return acc;
  }, {});

const SelectField = ({ label, value, options, onSelect, formatOption = (option) => option }) => {
  const [visible, setVisible] = useState(false);

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-text">{label}</Text>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="flex-row items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5">
        <Text className="text-base text-text">{value ? formatOption(value) : `Select ${label}`}</Text>
        <Icon name={ICONS.CHEVRON_RIGHT} size={16} color={COLORS.gray400} />
      </TouchableOpacity>

      <Modal visible={visible} onClose={() => setVisible(false)}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            onPress={() => {
              onSelect(option);
              setVisible(false);
            }}
            className="flex-row items-center justify-between py-3">
            <Text className={`text-base ${option === value ? 'font-semibold text-primary' : 'text-text'}`}>
              {formatOption(option)}
            </Text>
            {option === value ? <Icon name={ICONS.COMPLETE} size={18} color={COLORS.primary} /> : null}
          </TouchableOpacity>
        ))}
      </Modal>
    </View>
  );
};

const DateField = ({ label, value, onChange }) => {
  const [show, setShow] = useState(false);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) onChange(selectedDate.toISOString().split('T')[0]);
  };

  return (
    <View className="mb-4">
      <Text className="mb-1.5 text-sm font-medium text-text">{label}</Text>
      <TouchableOpacity
        onPress={() => setShow(true)}
        accessibilityRole="button"
        accessibilityLabel={label}
        className="flex-row items-center justify-between rounded-xl border border-border bg-white px-4 py-3.5">
        <Text className="text-base text-text">{value || 'YYYY-MM-DD'}</Text>
        <Icon name={ICONS.CHECK_IN} size={16} color={COLORS.gray400} />
      </TouchableOpacity>

      {show ? (
        Platform.OS === 'ios' ? (
          <Modal visible={show} onClose={() => setShow(false)}>
            <DateTimePicker
              value={value ? new Date(value) : new Date()}
              mode="date"
              display="spinner"
              maximumDate={new Date()}
              onChange={onChangeDate}
            />
            <Button label="Done" onPress={() => setShow(false)} className="mt-2" />
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
      ) : null}
    </View>
  );
};

// Fetches the live profile on open, renders it as editable fields, and
// PUTs only the fields the user actually changed on Save.
const EditProfileScreen = ({ navigation }) => {
  const { updateUser } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(null);
  const [initialForm, setInitialForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    setIsLoading(true);
    setHasError(false);
    try {
      const user = await getUserProfile();
      const editable = pickEditableFields(user);
      setForm(editable);
      setInitialForm(editable);
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const setField = (key) => (value) => setForm((current) => ({ ...current, [key]: value }));

  const handleSave = async () => {
    const changes = EDITABLE_FIELDS.reduce((acc, key) => {
      if (form[key] !== initialForm[key]) acc[key] = form[key];
      return acc;
    }, {});

    if (Object.keys(changes).length === 0) {
      showToast('No changes to save', { type: 'info' });
      return;
    }

    setIsSaving(true);
    try {
      const { message, user } = await updateUserProfile(changes);
      const editable = pickEditableFields(user);
      setForm(editable);
      setInitialForm(editable);
      await updateUser({
        name: [user.first_name, user.last_name].filter(Boolean).join(' '),
        email: user.email,
      });
      showToast(message || 'Profile updated', { type: 'success' });
    } catch (error) {
      showToast(error?.message || 'Could not update your profile. Please try again.', { type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenWrapper scroll>
      <Header title="Edit Profile" onBack={navigation.canGoBack() ? navigation.goBack : undefined} />

      {isLoading ? (
        <Loading skeleton skeletonRows={6} />
      ) : hasError || !form ? (
        <EmptyState
          icon={ICONS.ERROR}
          title="Couldn't load your profile"
          description="Something went wrong loading your details."
          actionLabel="Retry"
          onAction={loadProfile}
        />
      ) : (
        <>
          <View className="flex-row">
            <Input
              label="First name"
              value={form.first_name}
              onChangeText={setField('first_name')}
              autoCapitalize="words"
              className="mr-2 flex-1"
            />
            <Input
              label="Last name"
              value={form.last_name}
              onChangeText={setField('last_name')}
              autoCapitalize="words"
              className="ml-2 flex-1"
            />
          </View>

          <Input label="Nickname" value={form.nickname} onChangeText={setField('nickname')} autoCapitalize="none" />
          <Input
            label="Email"
            value={form.email}
            onChangeText={setField('email')}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input label="Phone" value={form.phone} onChangeText={setField('phone')} keyboardType="phone-pad" />
          <DateField label="Date of birth" value={form.dob} onChange={setField('dob')} />
          <SelectField
            label="Gender"
            value={form.gender}
            options={GENDERS}
            onSelect={setField('gender')}
            formatOption={capitalize}
          />
          <SelectField
            label="Default language"
            value={form.default_language}
            options={LANGUAGES}
            onSelect={setField('default_language')}
          />
          <SelectField
            label="Default agent"
            value={form.default_agent}
            options={AGENTS}
            onSelect={setField('default_agent')}
            formatOption={capitalize}
          />

          <Button label="Save" onPress={handleSave} loading={isSaving} className="mt-2" />
        </>
      )}
    </ScreenWrapper>
  );
};

export default EditProfileScreen;
