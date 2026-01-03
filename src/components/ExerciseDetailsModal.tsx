import React from 'react';
import { View, Text, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Plus } from 'lucide-react-native';
import { Exercise } from '../services/exerciseApi';

interface ExerciseDetailsModalProps {
  exercise: Exercise;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
  getImageUrl: (gifPath: string) => string;
}

const formatBodyPartName = (bodyPart: string) => {
  if (!bodyPart) return 'Other';
  return bodyPart.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({ exercise, onClose, onAdd, getImageUrl }) => {

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <TouchableOpacity className="absolute inset-0" onPress={onClose} activeOpacity={1} />

        <View className="bg-system-background-secondary rounded-t-3xl p-6 h-[85%] w-full">
          <View className="items-center mb-6">
            <View className="w-12 h-1.5 bg-system-label-tertiary rounded-full mb-4" />
            <Text className="text-2xl font-bold text-center text-system-label leading-tight">{exercise.name}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <View className="w-full aspect-video rounded-2xl bg-system-background-tertiary overflow-hidden mb-6">
              <Image
                source={{ uri: getImageUrl(exercise.gifUrl) }}
                className="w-full h-full"
                resizeMode="cover"
              />
            </View>

            <View className="flex-row gap-4 mb-6">
              <View className="flex-1 bg-system-background-tertiary p-4 rounded-2xl items-center">
                <Text className="text-xs font-bold text-system-label-secondary uppercase tracking-wider mb-1">Bölge</Text>
                <Text className="font-semibold text-system-label text-lg text-center">{formatBodyPartName(exercise.bodyPart)}</Text>
              </View>
              <View className="flex-1 bg-system-background-tertiary p-4 rounded-2xl items-center">
                <Text className="text-xs font-bold text-system-label-secondary uppercase tracking-wider mb-1">Ekipman</Text>
                <Text className="font-semibold text-system-label text-lg text-center">{exercise.equipment}</Text>
              </View>
            </View>

            {exercise.instructions && exercise.instructions.length > 0 && (
              <View className="bg-system-background-tertiary p-5 rounded-2xl mb-6">
                <Text className="font-bold text-system-label mb-4 text-sm uppercase tracking-wide opacity-80">Talimatlar</Text>
                <View className="gap-3">
                  {exercise.instructions.map((instruction, index) => (
                    <Text key={index} className="text-[15px] leading-relaxed text-system-label-secondary">
                      {index + 1}. {instruction}
                    </Text>
                  ))}
                </View>
              </View>
            )}
          </ScrollView>

          <View className="pt-4 border-t border-system-separator/10">
            <TouchableOpacity
              onPress={() => onAdd(exercise)}
              className="w-full flex-row items-center justify-center gap-2 py-4 bg-system-blue rounded-2xl shadow-lg"
            >
              <Plus size={24} color="white" />
              <Text className="text-white font-bold text-lg">Antrenmana Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ExerciseDetailsModal;