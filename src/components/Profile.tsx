import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal, Alert, Dimensions } from 'react-native';
import { supabase } from '../services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { Settings, LogOut, Plus, X, ArrowLeft } from 'lucide-react-native';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Svg, Line, Circle, Text as SvgText } from 'react-native-svg';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface ProfileProps {
  session: Session;
  onLogout: () => void;
  onBack?: () => void;
}

interface Measurement {
  id?: number;
  created_at: string;
  weight: number;
}

// VKİ Hesaplama Fonksiyonu
const calculateBMI = (weight: number | null, height: number | null) => {
  if (!weight || !height || height === 0) return null;
  const heightInMeters = height / 100;
  return weight / (heightInMeters * heightInMeters);
};

// VKİ Kategorisi ve Rengi Belirleme
const getBMICategory = (bmi: number | null) => {
  if (bmi === null) return { category: 'Veri Yok', color: 'bg-system-label-tertiary', textColor: 'text-system-label' };
  if (bmi < 18.5) return { category: 'Zayıf', color: 'bg-system-blue', textColor: 'text-white' };
  if (bmi < 25) return { category: 'Normal', color: 'bg-system-green', textColor: 'text-white' };
  if (bmi < 30) return { category: 'Fazla Kilolu', color: 'bg-system-yellow', textColor: 'text-black' };
  return { category: 'Obez', color: 'bg-system-red', textColor: 'text-white' };
};

const SimpleLineChart = ({ data }: { data: any[] }) => {
  if (data.length === 0) return null;
  const CHART_WIDTH = SCREEN_WIDTH - 64;
  const CHART_HEIGHT = 200;

  const values = data.map(d => d.weight);
  const maxVal = Math.max(...values) + 2;
  const minVal = Math.min(...values) - 2;
  const range = maxVal - minVal;

  // Normalize points
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * CHART_WIDTH;
    const y = CHART_HEIGHT - (((d.weight - minVal) / range) * CHART_HEIGHT);
    return { x, y, value: d.weight, label: d.date };
  });

  return (
    <View>
      <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20}>

        {/* Line */}
        {points.map((p, i) => {
          if (i === 0) return null;
          const prev = points[i - 1];
          return (
            <Line
              key={i}
              x1={prev.x}
              y1={prev.y}
              x2={p.x}
              y2={p.y}
              stroke="#0A84FF"
              strokeWidth="2"
            />
          );
        })}

        {/* Dots */}
        {points.map((p, i) => (
          <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r="3" fill="#0A84FF" />
        ))}

        {/* X Axis Labels (Simplified) */}
        {points.filter((_, i) => i % Math.ceil(points.length / 5) === 0).map((p, i) => (
          <SvgText
            key={`label-${i}`}
            x={p.x}
            y={CHART_HEIGHT + 15}
            fontSize="10"
            fill="gray"
            textAnchor="middle"
          >
            {p.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

const Profile: React.FC<ProfileProps> = ({ session, onLogout, onBack }) => {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [age, setAge] = useState<number | ''>('');
  const [height, setHeight] = useState<number | ''>('');
  const [weight, setWeight] = useState<number | ''>('');
  const [editMode, setEditMode] = useState(false);

  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [isModalOpen, setModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState<number | ''>('');
  const [newHeight, setNewHeight] = useState<number | ''>('');

  const bmi = useMemo(() => calculateBMI(typeof weight === 'number' ? weight : null, typeof height === 'number' ? height : null), [weight, height]);
  const bmiInfo = getBMICategory(bmi);

  const bmiPercent = useMemo(() => {
    if (bmi === null) return 0;
    let position = 0;
    if (bmi < 18.5) {
      const min = 15;
      position = ((bmi - min) / (18.5 - min)) * 25;
    } else if (bmi < 25) {
      position = 25 + ((bmi - 18.5) / (25 - 18.5)) * 25;
    } else if (bmi < 30) {
      position = 50 + ((bmi - 25) / (30 - 25)) * 25;
    } else {
      const max = 40;
      position = 75 + ((bmi - 30) / (max - 30)) * 25;
    }
    return Math.max(0, Math.min(100, position));
  }, [bmi]);

  const chartData = useMemo(() => {
    const latestMeasurementsByDay: { [key: string]: Measurement } = {};
    measurements.forEach(m => {
      const day = format(parseISO(m.created_at), 'yyyy-MM-dd');
      latestMeasurementsByDay[day] = m;
    });
    const uniqueMeasurements = Object.values(latestMeasurementsByDay);
    uniqueMeasurements.sort((a, b) => parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime());
    return uniqueMeasurements.map(m => ({
      date: format(parseISO(m.created_at), 'dd MMM', { locale: tr }),
      weight: m.weight,
    }));
  }, [measurements]);

  const fetchProfileData = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    try {
      const { user } = session;
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select(`full_name, avatar_url, age, height, weight`)
        .eq('id', user.id)
        .single();
      if (profileError && profileError.status !== 406) throw profileError;
      if (profileData) {
        setFullName(profileData.full_name || user.email || '');
        setAvatarUrl(profileData.avatar_url);
        setAge(profileData.age || '');
        setHeight(profileData.height || '');
        setWeight(profileData.weight || '');
        setNewHeight(profileData.height || '');
        setNewWeight(profileData.weight || '');
      }
      const { data: measurementsData, error: measurementsError } = await supabase
        .from('measurements')
        .select('id, created_at, weight')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });
      if (measurementsError) throw measurementsError;
      if (measurementsData) setMeasurements(measurementsData);
    } catch (error: any) {
      console.error("Profil verisi çekilirken hata:", error);
      Alert.alert('Hata', error.message);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [session]);

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const { user } = session;
      const updates = { id: user.id, full_name: fullName, age: age === '' ? null : age, updated_at: new Date() };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      setEditMode(false);
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMeasurement = async () => {
    if (newWeight === '' || newHeight === '') {
      Alert.alert('Hata', 'Lütfen boy ve kilo değerlerini girin.');
      return;
    }
    try {
      setLoading(true);
      const { user } = session;
      const from = startOfDay(new Date()).toISOString();
      const to = endOfDay(new Date()).toISOString();
      const { data: existingMeasurements, error: selectError } = await supabase
        .from('measurements')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', from)
        .lte('created_at', to);
      if (selectError) throw selectError;
      if (existingMeasurements && existingMeasurements.length > 0) {
        const { error } = await supabase.from('measurements').update({ weight: newWeight, height: newHeight, created_at: new Date().toISOString() }).eq('id', existingMeasurements[0].id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('measurements').insert({ user_id: user.id, weight: newWeight, height: newHeight });
        if (error) throw error;
      }
      const { error: updateProfileError } = await supabase.from('profiles').update({ weight: newWeight, height: newHeight, updated_at: new Date() }).eq('id', user.id);
      if (updateProfileError) throw updateProfileError;
      await fetchProfileData();
      setModalOpen(false);
    } catch (error: any) {
      console.error("Ölçüm eklenirken hata:", error);
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  const renderInfoRow = (label: string, value: string | number | null) => (
    <View className="flex-row justify-between items-center h-11">
      <Text className="text-system-label-secondary text-base">{label}</Text>
      <Text className="text-system-label font-medium text-base">{value || '-'}</Text>
    </View>
  );

  const renderEditRow = (label: string, value: string | number, onChange: (val: any) => void, type: string = 'text', placeholder: string = '') => {
    const handleClear = () => { onChange(type === 'number' ? '' : ''); };
    return (
      <View className="flex-row justify-between items-center h-14">
        <Text className="text-system-label-secondary text-base">{label}</Text>
        <View className="flex-1 ml-4 relative">
          <TextInput
            value={String(value)}
            onChangeText={(text) => onChange(type === 'number' ? (text === '' ? '' : Number(text)) : text)}
            placeholder={placeholder}
            placeholderTextColor="gray"
            keyboardType={type === 'number' ? 'numeric' : 'default'}
            className="w-full bg-system-background-tertiary text-system-label font-medium rounded-lg px-3 py-2 text-right"
          />
          {String(value).length > 0 && (
            <TouchableOpacity onPress={handleClear} className="absolute left-2 top-3">
              <X size={16} color="gray" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-system-background">
      {/* Header */}
      <View className="px-4 py-4 bg-system-background/80 flex-row justify-between items-center border-b border-system-separator/30">
        <View className="flex-row items-center gap-2">
          {onBack && (
            <TouchableOpacity onPress={onBack} className="p-1 -ml-2">
              <ArrowLeft size={24} color="#0A84FF" />
            </TouchableOpacity>
          )}
          <Text className="text-3xl font-bold text-system-label">Profil</Text>
        </View>
        {editMode ? (
          <TouchableOpacity onPress={handleUpdateProfile}>
            <Text className="text-system-blue text-lg font-bold">Kaydet</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setEditMode(true)} className="p-2">
            <Settings size={24} color="#0A84FF" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        <View className="items-center mb-6">
          <Image
            source={{ uri: avatarUrl || `https://ui-avatars.com/api/?name=${fullName || 'U'}&background=2C2C2E&color=fff` }}
            className="w-24 h-24 rounded-full shadow-lg"
          />
        </View>

        <View className="bg-system-background-secondary rounded-xl overflow-hidden mb-6 p-4">
          {editMode ? renderEditRow('Ad Soyad', fullName || '', setFullName, 'text', 'Ad Soyad') : renderInfoRow('Ad Soyad', fullName)}
          <View className="h-[1px] bg-system-separator/10 my-2" />
          {editMode ? renderEditRow('Yaş', age, setAge, 'number', 'Yaş') : renderInfoRow('Yaş', age)}
        </View>

        <View className="bg-system-background-secondary rounded-xl p-4 mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-system-label">Vücut Ölçüleri</Text>
            <TouchableOpacity onPress={() => setModalOpen(true)} className="flex-row items-center gap-1">
              <Plus size={20} color="#0A84FF" />
              <Text className="text-system-blue text-lg">Ekle</Text>
            </TouchableOpacity>
          </View>

          {height && weight ? (
            <View className='space-y-4'>
              <View className="flex-row justify-between text-center">
                <View className="flex-1 items-center">
                  <Text className="text-4xl font-bold text-system-label">{weight || '-'}</Text>
                  <Text className="text-system-label-secondary text-sm">Kilo (kg)</Text>
                </View>
                <View className="flex-1 items-center">
                  <Text className="text-4xl font-bold text-system-label">{height || '-'}</Text>
                  <Text className="text-system-label-secondary text-sm">Boy (cm)</Text>
                </View>
              </View>

              <View className="items-center pt-4">
                <View className={`px-3 py-1 rounded-full ${bmiInfo.color}`}>
                  <Text className={`text-sm font-bold ${bmiInfo.textColor}`}>{bmiInfo.category}</Text>
                </View>
                <Text className="text-6xl font-bold text-system-label mt-2">{bmi ? bmi.toFixed(1) : '-'}</Text>
                <Text className="text-system-label-secondary text-sm">Vücut Kitle Endeksi</Text>
              </View>

              <View className="w-full h-2.5 flex-row rounded-full bg-system-background-tertiary overflow-hidden mt-4 relative">
                <View className="flex-1 bg-system-blue" />
                <View className="flex-1 bg-system-green" />
                <View className="flex-1 bg-system-yellow" />
                <View className="flex-1 bg-system-red" />
                {bmi && (
                  <View
                    style={{
                      position: 'absolute',
                      left: `${bmiPercent}%`,
                      marginLeft: -4,
                      height: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    <View className="w-2 h-4 bg-white rounded-full shadow-lg border-2 border-system-background-secondary" />
                  </View>
                )}
              </View>

              {chartData.length > 0 && (
                <View className="pt-4 pb-4">
                  <Text className="text-md font-semibold text-system-label-secondary mb-3 text-center">Kilo Değişimi (kg)</Text>
                  <SimpleLineChart data={chartData} />
                </View>
              )}
            </View>
          ) : (
            <Text className="text-center text-system-label-secondary py-8 px-4">Başlamak için ilk ölçümünüzü ekleyin.</Text>
          )}
        </View>

        <TouchableOpacity onPress={onLogout} className="bg-system-background-secondary rounded-xl h-14 flex-row items-center justify-center gap-2 mb-10">
          <LogOut size={20} color="#FF453A" />
          <Text className="text-system-red text-lg font-semibold">Çıkış Yap</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Add Measurement Modal */}
      <Modal
        visible={isModalOpen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalOpen(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/60">
          <View className="w-[85%] bg-system-background-secondary rounded-2xl p-6 shadow-lg">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-system-label">Yeni Ölçüm Ekle</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <X size={24} color="gray" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-sm font-medium text-system-label-secondary mb-1">Kilo (kg)</Text>
              <TextInput
                value={String(newWeight)}
                onChangeText={(text) => setNewWeight(text === '' ? '' : Number(text))}
                placeholder="Örn: 75.5"
                keyboardType="numeric"
                className="w-full p-3 bg-system-background-tertiary text-system-label rounded-lg"
              />
            </View>

            <View className="mb-6">
              <Text className="text-sm font-medium text-system-label-secondary mb-1">Boy (cm)</Text>
              <TextInput
                value={String(newHeight)}
                onChangeText={(text) => setNewHeight(text === '' ? '' : Number(text))}
                placeholder="Örn: 180"
                keyboardType="numeric"
                className="w-full p-3 bg-system-background-tertiary text-system-label rounded-lg"
              />
            </View>

            <TouchableOpacity onPress={handleAddMeasurement} disabled={loading} className="w-full py-3 bg-system-blue rounded-xl">
              <Text className="text-white text-center font-bold text-lg">{loading ? 'Kaydediliyor...' : 'Kaydet'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default Profile;