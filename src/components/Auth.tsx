import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { LogIn, UserPlus } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type AuthMode = 'login' | 'signup';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [message, setMessage] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    // Google Sign-In native implementation requires configuration.
    // Displaying alert for now.
    Alert.alert("Bilgi", "Google ile giriş özelliği henüz bu sürümde aktif değil.");
  };

  const handleAnonymousLogin = async () => {
    try {
      setError(null);
      setMessage(null);
      setLoading(true);
      const { error: signInError } = await supabase.auth.signInAnonymously();
      if (signInError) throw signInError;
    } catch (err: any) {
      setError(err.message || 'Misafir girişi sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignUp = async () => {
    try {
      setError(null);
      setMessage(null);
      setLoading(true);

      if (password !== confirmPassword) {
        setError('Şifreler eşleşmiyor. Lütfen tekrar kontrol edin.');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      if (data.user && !data.session) {
        setMessage('Kayıt başarılı! Lütfen e-postanıza gönderilen doğrulama bağlantısına tıklayarak hesabınızı etkinleştirin.');
      } else if (data.session) {
        setMessage('Kayıt başarılı, giriş yapılıyor...');
      }

    } catch (err: any) {
      setError(err.message || 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async () => {
    try {
      setError(null);
      setMessage(null);
      setLoading(true);

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed')) {
          setMessage('Hesabınız doğrulanmamış. Lütfen e-postanıza gönderilen doğrulama bağlantısına tıklayarak hesabınızı etkinleştirin.');
        } else {
          throw signInError;
        }
      }

    } catch (err: any) {
      setError(err.message || 'Giriş sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (authMode === 'login') {
      handleEmailSignIn();
    } else {
      handleEmailSignUp();
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-system-background">
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }}>
        <View className="w-full max-w-sm self-center items-center">
          <Text className="text-6xl font-bold text-system-label mb-3">
            LogFit
          </Text>
          <Text className="text-system-label-secondary mb-12 text-lg text-center">
            Antrenmanlarını kaydet ve gelişimini izle.
          </Text>

          {error && (
            <View className="bg-system-red/20 border border-system-red/30 px-4 py-3 rounded-lg mb-4 w-full">
              <Text className="text-system-red text-sm">{error}</Text>
            </View>
          )}
          {message && (
            <View className="bg-system-blue/20 border border-system-blue/30 px-4 py-3 rounded-lg mb-4 w-full">
              <Text className="text-system-blue text-sm">{message}</Text>
            </View>
          )}

          <View className="w-full space-y-4">
            <View className="bg-system-background-secondary rounded-xl overflow-hidden">
              <TextInput
                placeholder="E-posta Adresi"
                placeholderTextColor="rgba(235, 235, 245, 0.3)"
                value={email}
                onChangeText={setEmail}
                className="w-full p-4 text-system-label border-b border-system-separator"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TextInput
                placeholder="Şifre"
                placeholderTextColor="rgba(235, 235, 245, 0.3)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                className="w-full p-4 text-system-label border-b border-system-separator"
              />
              {authMode === 'signup' && (
                <TextInput
                  placeholder="Şifreyi Tekrar Girin"
                  placeholderTextColor="rgba(235, 235, 245, 0.3)"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  className="w-full p-4 text-system-label"
                />
              )}
            </View>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              className="w-full bg-system-blue py-3 px-8 rounded-xl flex-row items-center justify-center gap-3"
            >
              {loading ? <ActivityIndicator color="white" /> : (
                <Text className="text-white font-semibold text-lg">{authMode === 'login' ? 'Giriş Yap' : 'Kaydol'}</Text>
              )}
            </TouchableOpacity>
          </View>

          <View className="my-6">
            {authMode === 'login' ? (
              <View className="flex-row items-center">
                <Text className="text-system-label-secondary">Hesabın yok mu? </Text>
                <TouchableOpacity onPress={() => { setAuthMode('signup'); setError(null); setMessage(null); }}>
                  <Text className="text-system-blue font-medium">Kaydol</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row items-center">
                <Text className="text-system-label-secondary">Zaten bir hesabın var mı? </Text>
                <TouchableOpacity onPress={() => { setAuthMode('login'); setError(null); setMessage(null); }}>
                  <Text className="text-system-blue font-medium">Giriş Yap</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View className="flex-row items-center my-6 w-full">
            <View className="flex-1 h-[1px] bg-system-separator"></View>
            <Text className="mx-4 text-system-label-secondary text-xs uppercase">Veya</Text>
            <View className="flex-1 h-[1px] bg-system-separator"></View>
          </View>

          <View className="w-full space-y-3">
            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white py-3 px-8 rounded-xl flex-row items-center justify-center gap-3"
            >
              <Text className="text-black font-semibold">Google ile Devam Et</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleAnonymousLogin}
              disabled={loading}
              className="w-full bg-system-fill py-3 px-8 rounded-xl flex-row items-center justify-center gap-3"
            >
              <Text className="text-system-label font-semibold">Misafir Olarak Devam Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Auth;