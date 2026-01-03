import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Alert, LayoutAnimation } from 'react-native';
import { Plus, Edit, Trash2, ChevronDown, Copy, Radar, Play, ChevronUp } from 'lucide-react-native';
import { Exercise as LibraryExercise } from '../services/exerciseApi';
import { Routine } from '../types';

interface RoutinesListProps {
  routines: Routine[];
  onAddNewRoutine: () => void;
  onEditRoutine: (routine: Routine) => void;
  onDeleteRoutine: (routineId: string) => void;
  onCopyRoutine: (routine: Routine) => void;
  allLibraryExercises: LibraryExercise[];
  onStartWorkout: (routine: Routine) => void;
  onBack: () => void;
}

const SUPABASE_PROJECT_URL = 'https://ekrhekungvoisfughwuz.supabase.co';
const BUCKET_NAME = 'images';

const RoutinesList: React.FC<RoutinesListProps> = ({ routines, onAddNewRoutine, onEditRoutine, onDeleteRoutine, onCopyRoutine, allLibraryExercises, onStartWorkout, onBack }) => {
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);

  const handleCardClick = (routineId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRoutineId(expandedRoutineId === routineId ? null : routineId);
  };

  const getImageUrl = (gifPath: string | undefined) => {
    const defaultImage = 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    if (!gifPath) return defaultImage;
    const imagePath = gifPath.replace('0.jpg', '1.jpg');
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET_NAME}/exercises/${imagePath}`;
  };

  return (
    <View className="flex-1 bg-system-background">
      {/* Header */}
      <View className="px-4 py-4 bg-system-background/80 border-b border-system-separator/20 flex-row justify-between items-center">
        <View className="flex-row items-center gap-2">
          <Text className="text-3xl font-bold text-system-label">Rutinler</Text>
        </View>
        <TouchableOpacity
          onPress={onAddNewRoutine}
          className="bg-system-blue p-2 rounded-full shadow-lg"
        >
          <Plus size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} className="flex-1">
        {routines.length === 0 ? (
          <View className="items-center py-20 px-4 bg-system-background-secondary rounded-2xl border border-system-separator/10">
            <Radar size={48} color="rgba(235, 235, 245, 0.3)" className="mb-4" />
            <Text className="text-xl font-semibold text-system-label mb-2">Henüz Rutin Yok</Text>
            <Text className="text-system-label-secondary text-base text-center">
              Kendine özel bir antrenman programı oluşturmak için '+' butonuna bas.
            </Text>
          </View>
        ) : (
          <View className="gap-4">
            {routines.map((routine) => {
              const isExpanded = expandedRoutineId === routine.id;
              return (
                <View key={routine.id} className="bg-system-background-secondary rounded-2xl overflow-hidden shadow-sm border border-system-separator/10">
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => handleCardClick(routine.id)}
                      className="flex-1 flex-row items-center p-4 pr-2"
                      activeOpacity={0.7}
                    >
                      <View className="flex-1">
                        <Text className="font-bold text-system-label text-lg tracking-tight">{routine.name}</Text>
                        <Text className="text-sm text-system-label-secondary mt-0.5 font-medium">
                          {routine.exercises?.length || 0} hareket
                        </Text>
                      </View>
                      <View className={`p-2 rounded-full ${isExpanded ? 'bg-system-fill' : ''}`}>
                        {isExpanded ? <ChevronUp size={20} color="rgba(235, 235, 245, 0.3)" /> : <ChevronDown size={20} color="rgba(235, 235, 245, 0.3)" />}
                      </View>
                    </TouchableOpacity>

                    <View className="pr-4 pl-1 py-3 border-l border-system-separator/10">
                      <TouchableOpacity
                        onPress={() => onStartWorkout(routine)}
                        className="items-center justify-center gap-1 bg-system-blue/10 px-3 py-2 rounded-xl"
                      >
                        <Play size={22} color="#0A84FF" style={{ marginLeft: 2 }} />
                        <Text className="text-[10px] font-bold text-system-blue">BAŞLAT</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {isExpanded && (
                    <View className="px-4 pb-4 bg-system-background-tertiary/30">
                      <View className="border-t border-system-separator/20 pt-3 mt-0">
                        <View className="gap-2 mb-4">
                          {(routine.exercises || []).map(ex => {
                            const libEx = allLibraryExercises.find(lib => lib.id === ex.id || lib.name === ex.name);
                            return (
                              <View key={ex.id} className="flex-row items-center gap-3 p-2 rounded-lg bg-system-background-tertiary/50">
                                <Image
                                  source={{ uri: getImageUrl(libEx?.gifUrl) }}
                                  className="w-10 h-10 rounded-md bg-system-background-tertiary"
                                  resizeMode="cover"
                                />
                                <Text className="text-sm font-medium text-system-label flex-1">{ex.name}</Text>
                              </View>
                            );
                          })}
                        </View>
                        <View className="flex-row gap-2">
                          <TouchableOpacity onPress={() => onCopyRoutine(routine)} className="flex-1 py-2.5 px-2 bg-system-background-tertiary rounded-xl flex-row items-center justify-center gap-1.5">
                            <Copy size={14} color="white" />
                            <Text className="text-system-label text-xs font-semibold">Kopyala</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => onEditRoutine(routine)} className="flex-1 py-2.5 px-2 bg-system-background-tertiary rounded-xl flex-row items-center justify-center gap-1.5">
                            <Edit size={14} color="white" />
                            <Text className="text-system-label text-xs font-semibold">Düzenle</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => Alert.alert("Sil", "Bu rutini silmek istediğinizden emin misiniz?", [{ text: "İptal", style: "cancel" }, { text: "Sil", style: "destructive", onPress: () => onDeleteRoutine(routine.id) }])} className="flex-1 py-2.5 px-2 bg-system-red/10 rounded-xl flex-row items-center justify-center gap-1.5">
                            <Trash2 size={14} color="#FF453A" />
                            <Text className="text-system-red text-xs font-semibold">Sil</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default RoutinesList;