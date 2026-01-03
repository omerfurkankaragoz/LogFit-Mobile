import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Modal, FlatList } from 'react-native';
import { Search, Star, X, Filter } from 'lucide-react-native';
import { Exercise, getBodyParts } from '../services/exerciseApi';
import ExerciseDetailsModal from './ExerciseDetailsModal';

const SUPABASE_PROJECT_URL = 'https://ekrhekungvoisfughwuz.supabase.co';
const BUCKET_NAME = 'images';

interface ExerciseLibraryProps {
  onExerciseSelect: (exercise: Exercise) => void;
  allExercises: Exercise[];
  favoriteExercises: string[];
  onToggleFavorite: (exerciseId: string) => void;
}

const formatBodyPartName = (bodyPart: string) => {
  if (!bodyPart) return 'Other';
  if (bodyPart === 'all') return 'Tümü';
  if (bodyPart === 'favorites') return 'Favoriler';
  return bodyPart.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ExerciseLibrary: React.FC<ExerciseLibraryProps> = ({ onExerciseSelect, allExercises, favoriteExercises, onToggleFavorite }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState('all');

  useEffect(() => {
    const fetchBodyPartsData = async () => {
      const parts = await getBodyParts();
      setBodyParts(parts);
    };
    fetchBodyPartsData();
  }, []);

  const filteredExercises = useMemo(() => {
    let exercises = [...allExercises];
    if (searchQuery.trim()) {
      exercises = exercises.filter(ex =>
        ex.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      );
    }
    if (selectedBodyPart !== 'all') {
      if (selectedBodyPart === 'favorites') {
        exercises = exercises.filter(ex => favoriteExercises.includes(ex.id));
      } else {
        exercises = exercises.filter(ex =>
          ex.bodyPart && ex.bodyPart.toLowerCase() === selectedBodyPart.toLowerCase()
        );
      }
    }
    return exercises;
  }, [searchQuery, selectedBodyPart, allExercises, favoriteExercises]);

  const getImageUrl = (gifPath: string) => {
    if (!gifPath) return 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const imagePath = gifPath.replace('0.jpg', '1.jpg');
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET_NAME}/exercises/${imagePath}`;
  };

  const handleAddExercise = (exercise: Exercise) => {
    onExerciseSelect(exercise);
    setSelectedExercise(null);
  };

  const handleSelectFilter = (part: string) => {
    setSelectedBodyPart(part);
    setShowFilters(false);
  }

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isFavorited = favoriteExercises.includes(item.id);
    return (
      <TouchableOpacity onPress={() => setSelectedExercise(item)} className="p-4 flex-row items-center gap-4 border-b border-system-separator/10">
        <Image
          source={{ uri: getImageUrl(item.gifUrl) }}
          className="w-16 h-16 rounded-lg bg-system-background-tertiary"
          resizeMode="cover"
        />
        <View className="flex-1">
          <Text className="font-semibold text-system-label text-base" numberOfLines={1}>{item.name}</Text>
          <Text className="text-sm text-system-label-secondary mt-1" numberOfLines={1}>{formatBodyPartName(item.bodyPart)}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onToggleFavorite(item.id)}
          className="p-3"
        >
          <Star size={20} color={isFavorited ? "#FF9F0A" : "gray"} fill={isFavorited ? "#FF9F0A" : "transparent"} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-system-background">
      {/* Header */}
      <View className="px-4 py-4 bg-system-background/80 border-b border-system-separator/20">
        <Text className="text-3xl font-bold text-system-label">Kütüphane</Text>
        <View className="flex-row gap-2 items-center mt-4">
          <View className="flex-1 flex-row items-center bg-system-background-secondary rounded-lg px-3">
            <Search size={20} color="rgba(235, 235, 245, 0.3)" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Hareket adı ara..."
              placeholderTextColor="rgba(235, 235, 245, 0.3)"
              className="flex-1 py-2 pl-2 text-system-label h-10"
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={16} color="rgba(235, 235, 245, 0.6)" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={() => setShowFilters(!showFilters)} className={`p-2.5 rounded-lg ${showFilters ? 'bg-system-blue' : 'bg-system-fill'}`}>
            <Filter size={20} color={showFilters ? 'white' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters */}
      {showFilters && (
        <View className="bg-system-background-secondary p-4 border-b border-system-separator/10">
          <Text className="font-semibold text-system-label mb-3">Vücut Bölgesi</Text>
          <View className="flex-row flex-wrap gap-2">
            <TouchableOpacity onPress={() => handleSelectFilter('all')} className={`px-4 py-2 rounded-lg ${selectedBodyPart === 'all' ? 'bg-system-blue' : 'bg-system-fill'}`}>
              <Text className={`font-semibold text-sm ${selectedBodyPart === 'all' ? 'text-white' : 'text-system-label'}`}>Tümü</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleSelectFilter('favorites')} className={`px-4 py-2 rounded-lg flex-row items-center gap-2 ${selectedBodyPart === 'favorites' ? 'bg-system-blue' : 'bg-system-fill'}`}>
              <Star size={14} color={selectedBodyPart === 'favorites' ? 'white' : 'white'} fill={selectedBodyPart === 'favorites' ? 'white' : 'transparent'} />
              <Text className={`font-semibold text-sm ${selectedBodyPart === 'favorites' ? 'text-white' : 'text-system-label'}`}>Favoriler</Text>
            </TouchableOpacity>
            {bodyParts.map(part => (
              <TouchableOpacity key={part} onPress={() => handleSelectFilter(part)} className={`px-4 py-2 rounded-lg ${selectedBodyPart === part ? 'bg-system-blue' : 'bg-system-fill'}`}>
                <Text className={`font-semibold text-sm ${selectedBodyPart === part ? 'text-white' : 'text-system-label'}`}>{formatBodyPartName(part)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Content */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={renderExerciseItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        className="flex-1 bg-system-background-secondary mx-4 rounded-xl mt-4"
      />

      {selectedExercise && (
        <ExerciseDetailsModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onAdd={handleAddExercise}
          getImageUrl={getImageUrl}
        />
      )}
    </View>
  );
};

export default ExerciseLibrary;