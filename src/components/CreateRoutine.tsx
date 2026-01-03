import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Modal, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { Save, Plus, Trash2, Search, X, GripVertical, Star } from 'lucide-react-native';
import { Routine } from './RoutinesList';
import { Exercise as LibraryExercise } from '../services/exerciseApi';

const SUPABASE_PROJECT_URL = 'https://ekrhekungvoisfughwuz.supabase.co';
const BUCKET_NAME = 'images';

interface CreateRoutineProps {
  existingRoutine: Partial<Routine> | null;
  onSaveRoutine: (id: string | null, name: string, exercises: { id: string; name: string; bodyPart?: string }[]) => void;
  onCancel: () => void;
  allLibraryExercises: LibraryExercise[];
  favoriteExercises: string[];
}

const CreateRoutine: React.FC<CreateRoutineProps> = ({ existingRoutine, onSaveRoutine, onCancel, allLibraryExercises, favoriteExercises }) => {
  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<{ id: string; name: string; bodyPart?: string }[]>([]);
  const [manualExerciseName, setManualExerciseName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // New state for modal instead of inline expansion
  const [isAddExerciseModalVisible, setAddExerciseModalVisible] = useState(false);

  const selectedExerciseNames = useMemo(() =>
    new Set(selectedExercises.map(ex => ex.name.toLowerCase())),
    [selectedExercises]
  );

  const [favoriteLibraryExercises, otherLibraryExercises] = useMemo(() => {
    const favorites: LibraryExercise[] = [];
    const others: LibraryExercise[] = [];

    allLibraryExercises.forEach(ex => {
      if (!selectedExerciseNames.has(ex.name.toLowerCase())) {
        if (favoriteExercises.includes(ex.id)) {
          favorites.push(ex);
        } else {
          others.push(ex);
        }
      }
    });

    return [favorites, others];
  }, [allLibraryExercises, favoriteExercises, selectedExerciseNames]);

  const searchedExercises = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allLibraryExercises.filter(ex =>
      !selectedExerciseNames.has(ex.name.toLowerCase()) &&
      ex.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery, allLibraryExercises, selectedExerciseNames]);


  useEffect(() => {
    if (existingRoutine) {
      setRoutineName(existingRoutine.name || '');
      const initialExercises = existingRoutine.exercises?.map(ex => {
        const libEx = allLibraryExercises.find(lib => lib.name.toLowerCase() === ex.name.toLowerCase());
        return { ...ex, bodyPart: ex.bodyPart || libEx?.bodyPart }
      }) || [];
      setSelectedExercises(initialExercises);
    }
  }, [existingRoutine, allLibraryExercises]);

  const handleAddExerciseFromLibrary = (exercise: LibraryExercise) => {
    if (!selectedExercises.find(e => e.name.toLowerCase() === exercise.name.toLowerCase())) {
      setSelectedExercises(prev => [...prev, { id: exercise.id, name: exercise.name, bodyPart: exercise.bodyPart }]);
      setAddExerciseModalVisible(false); // Close modal on select
      setSearchQuery('');
    }
  };

  const handleManualAddExercise = () => {
    const trimmedName = manualExerciseName.trim();
    if (trimmedName && !selectedExercises.find(e => e.name.toLowerCase() === trimmedName.toLowerCase())) {
      const newExercise = {
        id: `manual-${Date.now()}`,
        name: trimmedName,
        bodyPart: undefined
      };
      setSelectedExercises(prev => [...prev, newExercise]);
      setManualExerciseName('');
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
  };

  const handleSave = () => {
    if (!routineName.trim()) {
      Alert.alert("Hata", 'Lütfen rutin için bir isim girin.');
      return;
    }
    if (selectedExercises.length === 0) {
      Alert.alert("Hata", 'Lütfen rutine en az bir hareket ekleyin.');
      return;
    }
    onSaveRoutine(existingRoutine?.id || null, routineName, selectedExercises);
  };

  const getImageUrl = (gifPath: string) => {
    if (!gifPath) return 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const imagePath = gifPath.replace('0.jpg', '1.jpg');
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET_NAME}/exercises/${imagePath}`;
  };

  const isSaveDisabled = !routineName.trim() || selectedExercises.length === 0;

  const ExerciseListItem = ({ exercise, isFavorite = false, onPress }: { exercise: LibraryExercise, isFavorite?: boolean, onPress: (ex: LibraryExercise) => void }) => (
    <TouchableOpacity onPress={() => onPress(exercise)} className="flex-row items-center gap-4 p-4 border-b border-system-separator/20 bg-system-background-secondary">
      <Image source={{ uri: getImageUrl(exercise.gifUrl) }} className="w-12 h-12 rounded-lg bg-system-background-tertiary" />
      <View className="flex-1">
        <Text className="font-medium text-system-label text-base" numberOfLines={1}>{exercise.name}</Text>
      </View>
      {isFavorite && <Star size={16} color="#FF9F0A" fill="#FF9F0A" />}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-system-background">
      {/* Header */}
      <View className="px-4 py-4 bg-system-background/95 border-b border-system-separator/30 flex-row justify-between items-center">
        <TouchableOpacity onPress={onCancel}>
          <Text className="text-system-blue text-lg">İptal</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-system-label">{existingRoutine?.id ? 'Rutini Düzenle' : 'Yeni Rutin'}</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaveDisabled}>
          <Text className={`text-lg font-bold ${isSaveDisabled ? 'text-system-label-tertiary' : 'text-system-blue'}`}>
            {existingRoutine?.id ? 'Bitti' : 'Ekle'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 p-4" contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Routine Name */}
        <View className="bg-system-background-secondary rounded-xl p-4 mb-6">
          <TextInput
            value={routineName}
            onChangeText={setRoutineName}
            placeholder="Rutin Adı"
            placeholderTextColor="rgba(235, 235, 245, 0.3)"
            className="text-system-label text-lg"
          />
        </View>

        {/* Selected Exercises */}
        <View className="bg-system-background-secondary rounded-xl overflow-hidden mb-6">
          <Text className="text-system-label-secondary px-4 pt-4 pb-2 text-sm font-bold">HAREKETLER</Text>
          <View>
            {selectedExercises.length > 0 ? selectedExercises.map((ex, index) => (
              <View key={ex.id} className={`flex-row items-center justify-between p-4 bg-system-background-secondary ${index !== selectedExercises.length - 1 ? 'border-b border-system-separator/20' : ''}`}>
                <View className="flex-row items-center gap-3">
                  <GripVertical size={20} color="rgba(235, 235, 245, 0.3)" />
                  <Text className="text-system-label text-base font-medium">{ex.name}</Text>
                </View>
                <TouchableOpacity onPress={() => handleRemoveExercise(ex.id)} className="p-2">
                  <Trash2 size={20} color="#FF453A" />
                </TouchableOpacity>
              </View>
            )) : (
              <Text className="text-center text-system-label-secondary py-10 px-4">Bu rutine hareket ekleyin.</Text>
            )}
          </View>
        </View>

        {/* Add Exercise Button */}
        <TouchableOpacity
          onPress={() => setAddExerciseModalVisible(true)}
          className="bg-system-blue/10 py-3 rounded-xl flex-row items-center justify-center gap-2"
        >
          <Plus size={20} color="#0A84FF" />
          <Text className="text-system-blue font-semibold">Hareket Ekle</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Add Exercise Modal */}
      <Modal
        visible={isAddExerciseModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddExerciseModalVisible(false)}
      >
        <View className="flex-1 bg-system-background">
          <View className="flex-row justify-between items-center p-4 border-b border-system-separator/20">
            <Text className="text-lg font-bold text-system-label">Hareket Ekle</Text>
            <TouchableOpacity onPress={() => setAddExerciseModalVisible(false)} className="p-2 bg-system-fill rounded-full">
              <X size={20} color="white" />
            </TouchableOpacity>
          </View>

          <View className="p-4 border-b border-system-separator/20">
            {/* Manual Add */}
            <View className="flex-row gap-2 mb-4">
              <TextInput
                value={manualExerciseName}
                onChangeText={setManualExerciseName}
                placeholder="Manuel Hareket Adı"
                placeholderTextColor="rgba(235, 235, 245, 0.3)"
                className="flex-1 px-3 py-2 bg-system-background-tertiary text-system-label rounded-lg"
              />
              <TouchableOpacity
                onPress={handleManualAddExercise}
                disabled={!manualExerciseName.trim()}
                className={`p-2 rounded-lg items-center justify-center ${!manualExerciseName.trim() ? 'bg-system-fill' : 'bg-system-blue'}`}
              >
                <Plus size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Search */}
            <View className="flex-row items-center bg-system-background-tertiary px-3 rounded-lg">
              <Search size={20} color="rgba(235, 235, 245, 0.3)" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Kütüphaneden Ara"
                placeholderTextColor="rgba(235, 235, 245, 0.3)"
                className="flex-1 py-2 pl-2 text-system-label h-10"
              />
              {searchQuery !== '' && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color="rgba(235, 235, 245, 0.6)" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView className="flex-1">
            {searchQuery.trim() ? (
              searchedExercises.length > 0 ? searchedExercises.map(exercise => (
                <ExerciseListItem key={exercise.id} exercise={exercise} onPress={handleAddExerciseFromLibrary} />
              )) : <Text className="text-center text-system-label-secondary py-10">Sonuç bulunamadı.</Text>
            ) : (
              <>
                {favoriteLibraryExercises.length > 0 && (
                  <View>
                    <Text className="text-system-label-secondary px-4 pt-4 pb-2 text-sm font-bold bg-system-background-tertiary/20">FAVORİLER</Text>
                    {favoriteLibraryExercises.map(exercise => (
                      <ExerciseListItem key={exercise.id} exercise={exercise} isFavorite onPress={handleAddExerciseFromLibrary} />
                    ))}
                  </View>
                )}
                <View>
                  <Text className="text-system-label-secondary px-4 pt-4 pb-2 text-sm font-bold bg-system-background-tertiary/20">TÜM HAREKETLER</Text>
                  {otherLibraryExercises.map(exercise => (
                    <ExerciseListItem key={exercise.id} exercise={exercise} onPress={handleAddExerciseFromLibrary} />
                  ))}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
};

export default CreateRoutine;