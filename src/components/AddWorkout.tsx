import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, Alert, Modal, Image } from 'react-native';
import { Plus, Trash2, Search, X, Star, Radar, PlusCircle, Clock, Save } from 'lucide-react-native';
import { Workout, Exercise } from '../App';
import { Routine } from './RoutinesList';
import { Exercise as LibraryExercise } from '../services/exerciseApi';
import { storage } from '../utils/storage';

const SUPABASE_PROJECT_URL = 'https://ekrhekungvoisfughwuz.supabase.co';

interface AddWorkoutProps {
  date: string;
  existingWorkout: Workout | null;
  routines: Routine[];
  workouts: Workout[];
  onSave: (workout: Omit<Workout, 'id' | 'user_id' | 'created_at'>, shouldFinish: boolean) => Promise<void>;
  onCancel: () => void;
  allLibraryExercises: LibraryExercise[];
  favoriteExercises: string[];
}

const AddWorkout: React.FC<AddWorkoutProps> = ({ date, existingWorkout, routines, workouts, onSave, onCancel, allLibraryExercises, favoriteExercises }) => {
  const [workoutExercises, setWorkoutExercises] = useState<Exercise[]>(() => {
    return existingWorkout ? existingWorkout.exercises : [];
  });

  const [workoutRoutineId, setWorkoutRoutineId] = useState<number | undefined>(() => {
    return existingWorkout ? existingWorkout.routine_id : undefined;
  });

  const [isRoutinePickerOpen, setRoutinePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [showLargeImage, setShowLargeImage] = useState(false);
  const [currentLargeImageUrl, setCurrentLargeImageUrl] = useState<string | null>(null);

  const loadedWorkoutId = useRef<string | null>(existingWorkout?.id || null);

  const isToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return date === todayStr;
  }, [date]);

  const workoutExerciseNames = useMemo(() =>
    new Set(workoutExercises.map(ex => ex.name.toLowerCase())),
    [workoutExercises]
  );

  const [favoriteLibraryExercises, otherLibraryExercises] = useMemo(() => {
    const favorites: LibraryExercise[] = [];
    const others: LibraryExercise[] = [];

    allLibraryExercises.forEach(ex => {
      if (!workoutExerciseNames.has(ex.name.toLowerCase())) {
        if (favoriteExercises.includes(ex.id)) {
          favorites.push(ex);
        } else {
          others.push(ex);
        }
      }
    });

    return [favorites, others];
  }, [allLibraryExercises, favoriteExercises, workoutExerciseNames]);

  const searchedExercises = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allLibraryExercises.filter(ex =>
      !workoutExerciseNames.has(ex.name.toLowerCase()) &&
      ex.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery, allLibraryExercises, workoutExerciseNames]);

  useEffect(() => {
    const currentId = existingWorkout?.id || 'new';

    if (loadedWorkoutId.current !== currentId) {
      setWorkoutExercises(existingWorkout ? existingWorkout.exercises : []);
      setWorkoutRoutineId(existingWorkout ? existingWorkout.routine_id : undefined);
      loadedWorkoutId.current = currentId;
    }
  }, [existingWorkout?.id]);

  useEffect(() => {
    const initTimer = async () => {
      if (!isToday) {
        if (existingWorkout && existingWorkout.duration) {
          setElapsedSeconds(existingWorkout.duration);
        } else {
          setElapsedSeconds(0);
        }
        return;
      }

      const savedStartTime = await storage.getItem('currentWorkoutStartTime');
      let currentStartTimestamp = 0;

      if (savedStartTime) {
        setStartTime(savedStartTime);
        currentStartTimestamp = new Date(savedStartTime).getTime();
      }
      else if (existingWorkout && existingWorkout.id !== 'new' && existingWorkout.duration) {
        setElapsedSeconds(existingWorkout.duration);
        return; // Don't start interval if not today's active session
      }
      else {
        const nowStr = new Date().toISOString();
        setStartTime(nowStr);
        await storage.setItem('currentWorkoutStartTime', nowStr);
        currentStartTimestamp = new Date(nowStr).getTime();
        setElapsedSeconds(0);
      }

      // Only start timer if it's today and we have a start time
      if (isToday) {
        const updateTimer = () => {
          const now = new Date().getTime();
          const diff = Math.max(0, Math.floor((now - currentStartTimestamp) / 1000));
          setElapsedSeconds(diff);

          if (diff > 7200) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleAutoFinish(diff, new Date(currentStartTimestamp).toISOString());
          }
        };

        updateTimer(); // Initial call
        timerRef.current = setInterval(updateTimer, 1000);
      }
    };

    initTimer();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [existingWorkout?.id, isToday]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getPreviousExerciseData = (exerciseName: string): Exercise | null => {
    if (!exerciseName) return null;
    const pastWorkouts = workouts
      .filter(w => new Date(w.date) < new Date(date))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const prevWorkout of pastWorkouts) {
      const exercise = prevWorkout.exercises.find(ex => ex.name.toLowerCase() === exerciseName.toLowerCase());
      if (exercise) return exercise;
    }
    return null;
  };

  const handleAddExerciseToWorkout = (exercise: LibraryExercise) => {
    const newExercise: Exercise = {
      id: `lib-${exercise.id}-${Date.now()}`,
      name: exercise.name,
      bodyPart: exercise.bodyPart,
      sets: [{ reps: 0, weight: 0, completed: false }]
    };
    setWorkoutExercises(prev => [newExercise, ...prev]);
    setSearchQuery('');
  };

  const handleSelectRoutine = (routine: Routine) => {
    const newExercisesFromRoutine = routine.exercises
      .filter(ex => !workoutExerciseNames.has(ex.name.toLowerCase()))
      .map((routineExercise, index) => {
        const libraryMatch = allLibraryExercises.find(libEx => libEx.name.toLowerCase() === routineExercise.name.toLowerCase());
        return {
          id: `routine-${routineExercise.id}-${Date.now() + index}`,
          name: routineExercise.name,
          bodyPart: routineExercise.bodyPart || libraryMatch?.bodyPart,
          sets: [{ reps: 0, weight: 0, completed: false }]
        };
      });
    if (newExercisesFromRoutine.length > 0) {
      setWorkoutExercises(prev => [...prev, ...newExercisesFromRoutine]);
      setWorkoutRoutineId(Number(routine.id));
    }
    setRoutinePickerOpen(false);
  };

  const addManualExercise = () => {
    const newExercise: Exercise = { id: `manual-${Date.now()}`, name: '', sets: [{ reps: 0, weight: 0, completed: false }] };
    setWorkoutExercises(prev => [newExercise, ...prev]);
  };

  const removeWorkoutExercise = (exerciseId: string) => setWorkoutExercises(prev => prev.filter(ex => ex.id !== exerciseId));

  const updateExerciseName = (exerciseId: string, name: string) => {
    setWorkoutExercises(prev => prev.map(ex => (ex.id === exerciseId && ex.id.startsWith('manual-')) ? { ...ex, name } : ex));
  };

  const addSet = (exerciseId: string) => {
    setWorkoutExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const lastSet = ex.sets.length > 0 ? ex.sets[ex.sets.length - 1] : { reps: 0, weight: 0, completed: false };
        return { ...ex, sets: [...ex.sets, { ...lastSet, completed: false }] };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setIndex: number) => {
    setWorkoutExercises(prev => prev.map(ex => (ex.id === exerciseId ? { ...ex, sets: ex.sets.filter((_, i) => i !== setIndex) } : ex)));
  };

  const updateSet = (exerciseId: string, setIndex: number, field: 'reps' | 'weight' | 'completed', value: any) => {
    setWorkoutExercises(prev => prev.map(ex => (ex.id === exerciseId ? { ...ex, sets: ex.sets.map((set, i) => (i === setIndex ? { ...set, [field]: value } : set)) } : ex)));
  };

  const prepareWorkoutData = () => {
    return workoutExercises
      .filter(ex => ex.name.trim())
      .map(ex => ({
        ...ex,
        sets: ex.sets.filter(set => set.reps > 0 || set.weight > 0)
      }));
  };

  const handleAutoFinish = async (finalDuration: number, finalStartTimeStr: string) => {
    const exercisesToSave = prepareWorkoutData();
    const endTime = new Date().toISOString();
    try {
      await onSave({
        date,
        exercises: exercisesToSave,
        startTime: finalStartTimeStr,
        endTime: endTime,
        duration: finalDuration,
        routine_id: workoutRoutineId
      }, true);
      await storage.removeItem('currentWorkoutStartTime');
      Alert.alert('Bilgi', 'Antrenman süresi 2 saati aştığı için otomatik olarak sonlandırıldı.');
    } catch (error) {
      console.error("Auto finish failed", error);
    }
  };

  const handleSaveAndExit = async () => {
    const exercisesToSave = prepareWorkoutData();
    const hasValidData = exercisesToSave.length > 0 && exercisesToSave.some(ex => ex.sets.length > 0);

    if (!hasValidData) {
      Alert.alert("Hata", "Kaydetmek için lütfen en az bir hareket ve set bilgisi girin.");
      return;
    }

    try {
      await onSave({
        date,
        exercises: exercisesToSave,
        startTime: startTime || undefined,
        endTime: undefined,
        duration: elapsedSeconds,
        routine_id: workoutRoutineId
      }, false);
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const handleCancel = async () => {
    if (workoutExercises.length === 0) {
      await storage.removeItem('currentWorkoutStartTime');
    }
    onCancel();
  };

  const getImageUrl = (gifPath: string | undefined) => {
    if (!gifPath) return 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const imagePath = gifPath.replace('0.jpg', '1.jpg');
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/images/exercises/${imagePath}`;
  };

  const ExerciseItem = ({ exercise, isFavorite = false, onClick }: { exercise: LibraryExercise, isFavorite?: boolean, onClick: (ex: LibraryExercise) => void }) => (
    <TouchableOpacity onPress={() => onClick(exercise)} className="w-full flex-row items-center gap-4 p-4 border-b border-system-separator/30">
      <Image source={{ uri: getImageUrl(exercise.gifUrl) }} className="w-12 h-12 rounded-lg bg-system-background-tertiary" />
      <Text className="flex-1 font-medium text-system-label text-base">{exercise.name}</Text>
      {isFavorite && <Star size={16} color="#FFD60A" fill="#FFD60A" />}
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-system-background">
      {/* Header */}
      <View className="border-b border-system-separator/30 bg-system-background/95 z-10 px-4 py-2 flex-row justify-between items-center">
        <TouchableOpacity onPress={handleCancel}>
          <Text className="text-system-blue text-[17px]">Vazgeç</Text>
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-[17px] font-semibold text-system-label">Antrenman</Text>
          {(isToday || elapsedSeconds > 0) && (
            <View className="flex-row items-center gap-1 mt-0.5">
              <Clock size={12} color={isToday ? '#30D158' : '#8E8E93'} />
              <Text className={`text-[11px] font-medium ${isToday ? 'text-system-green' : 'text-system-label-secondary'}`}>
                {formatTime(elapsedSeconds)}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleSaveAndExit}>
          <Text className="text-system-blue text-[17px] font-bold">Kaydet</Text>
        </TouchableOpacity>
      </View>

      <ScrollView ref={scrollViewRef} className="flex-1" contentContainerStyle={{ paddingBottom: 100 }}>
        <View className="p-4 space-y-8">
          {/* Workout Exercises List */}
          {workoutExercises.length > 0 && (
            <View className="space-y-6">
              {workoutExercises.map((exercise) => {
                const libraryExercise = allLibraryExercises.find(libEx => libEx.name.toLowerCase() === exercise.name.toLowerCase());
                const imageUrl = getImageUrl(libraryExercise?.gifUrl);
                const isEditable = exercise.id.startsWith('manual-');
                const previousExercise = getPreviousExerciseData(exercise.name);

                return (
                  <View key={exercise.id} className="bg-system-background-secondary rounded-2xl overflow-hidden shadow-sm border border-system-separator/10">
                    <View className="p-4 flex-row items-start gap-4 border-b border-system-separator/20 bg-system-background-tertiary/30">
                      <TouchableOpacity onPress={() => { setCurrentLargeImageUrl(imageUrl); setShowLargeImage(true); }}>
                        <Image source={{ uri: imageUrl }} className="w-14 h-14 rounded-xl" />
                      </TouchableOpacity>
                      <View className="flex-1">
                        <TextInput
                          value={exercise.name}
                          onChangeText={(text) => updateExerciseName(exercise.id, text)}
                          placeholder="Hareket Adı"
                          placeholderTextColor="rgba(235, 235, 245, 0.3)"
                          editable={isEditable}
                          className="text-xl font-bold text-system-label"
                        />
                        <Text className="text-sm text-system-blue font-medium mt-1">
                          {libraryExercise?.bodyPart ? libraryExercise.bodyPart.charAt(0).toUpperCase() + libraryExercise.bodyPart.slice(1) : 'Genel'}
                        </Text>
                      </View>
                      <TouchableOpacity onPress={() => removeWorkoutExercise(exercise.id)} className="p-2 bg-system-fill rounded-lg">
                        <X size={20} color="rgba(235, 235, 245, 0.6)" />
                      </TouchableOpacity>
                    </View>

                    {/* Headers */}
                    <View className="flex-row px-4 py-2 gap-3 items-center">
                      <Text className="w-[80px] text-center text-xs font-semibold text-system-label-secondary uppercase">Önceki</Text>
                      <Text className="flex-1 text-center text-xs font-semibold text-system-label-secondary uppercase">KG</Text>
                      <Text className="flex-1 text-center text-xs font-semibold text-system-label-secondary uppercase">Tekrar</Text>
                      <View className="w-10" />
                    </View>

                    {/* Sets */}
                    <View className="px-4 pb-4 space-y-3">
                      {exercise.sets.map((set, setIndex) => {
                        const previousSet = previousExercise?.sets[setIndex];
                        return (
                          <View key={setIndex} className="flex-row gap-3 items-center">
                            <View className="w-[80px] h-12 bg-system-fill-secondary rounded-xl items-center justify-center">
                              {previousSet ? (
                                <View className="items-center">
                                  <Text className="text-system-label text-xs">{previousSet.weight}kg</Text>
                                  <Text className="text-[10px] text-system-label-secondary">{previousSet.reps} tekrar</Text>
                                </View>
                              ) : (
                                <Text className="text-system-label-secondary">-</Text>
                              )}
                            </View>
                            <View className="flex-1">
                              <TextInput
                                keyboardType="numeric"
                                value={set.weight ? String(set.weight) : ''}
                                onChangeText={(text) => updateSet(exercise.id, setIndex, 'weight', parseFloat(text) || 0)}
                                placeholder="0"
                                placeholderTextColor="rgba(235, 235, 245, 0.3)"
                                className="w-full h-12 bg-system-background-tertiary text-system-label text-center text-lg font-bold rounded-xl"
                              />
                            </View>
                            <View className="flex-1">
                              <TextInput
                                keyboardType="number-pad"
                                value={set.reps ? String(set.reps) : ''}
                                onChangeText={(text) => updateSet(exercise.id, setIndex, 'reps', parseInt(text) || 0)}
                                placeholder="0"
                                placeholderTextColor="rgba(235, 235, 245, 0.3)"
                                className="w-full h-12 bg-system-background-tertiary text-system-label text-center text-lg font-bold rounded-xl"
                              />
                            </View>
                            <TouchableOpacity
                              onPress={() => removeSet(exercise.id, setIndex)}
                              className="h-12 w-10 items-center justify-center bg-system-fill-tertiary rounded-xl"
                            >
                              <Trash2 size={18} color="rgba(235, 235, 245, 0.3)" />
                            </TouchableOpacity>
                          </View>
                        );
                      })}
                      <TouchableOpacity
                        onPress={() => addSet(exercise.id)}
                        className="w-full py-3 mt-2 bg-system-blue/10 rounded-xl flex-row items-center justify-center gap-2"
                      >
                        <Plus size={18} color="#0A84FF" />
                        <Text className="text-system-blue font-bold text-sm">SET EKLE</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Add Exercise Section */}
          <View className="bg-system-background-secondary rounded-2xl overflow-hidden shadow-sm border border-system-separator/10">
            <View className="p-4 pb-2">
              <Text className="text-lg font-bold text-system-label mb-4">Hareket Ekle</Text>
              <View className="space-y-4">
                <View className="relative">
                  <View className="absolute left-3 top-3 z-10"><Search size={20} color="rgba(235, 235, 245, 0.3)" /></View>
                  <TextInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Hareket ara..."
                    placeholderTextColor="rgba(235, 235, 245, 0.3)"
                    className="w-full pl-10 pr-10 py-3 bg-system-background-tertiary text-system-label rounded-xl text-lg"
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} className="absolute right-3 top-3 z-10 p-1 bg-system-label-tertiary rounded-full">
                      <X size={12} color="black" />
                    </TouchableOpacity>
                  )}
                </View>
                <View className="flex-row gap-3">
                  <TouchableOpacity onPress={() => setRoutinePickerOpen(true)} className="flex-1 p-4 items-center justify-center gap-2 bg-system-background-tertiary rounded-xl">
                    <Radar size={24} color="#FF9F0A" />
                    <Text className="text-system-label font-semibold text-sm">Rutinden Seç</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addManualExercise} className="flex-1 p-4 items-center justify-center gap-2 bg-system-background-tertiary rounded-xl">
                    <PlusCircle size={24} color="#30D158" />
                    <Text className="text-system-label font-semibold text-sm">Manuel Ekle</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* List Container */}
            <View className="h-[300px]">
              <ScrollView nestedScrollEnabled>
                {searchQuery.length > 0 ? (
                  searchedExercises.length > 0 ? searchedExercises.map(ex => (
                    <ExerciseItem key={ex.id} exercise={ex} onClick={handleAddExerciseToWorkout} />
                  )) : (
                    <Text className="text-center text-system-label-secondary py-8">Sonuç bulunamadı.</Text>
                  )
                ) : (
                  <>
                    {favoriteLibraryExercises.length > 0 && (
                      <View>
                        <Text className="text-system-label-secondary px-4 py-2 text-xs font-bold uppercase bg-system-background-tertiary/50">Favoriler</Text>
                        {favoriteLibraryExercises.map(ex => (
                          <ExerciseItem key={ex.id} exercise={ex} isFavorite onClick={handleAddExerciseToWorkout} />
                        ))}
                      </View>
                    )}
                    <View>
                      <Text className="text-system-label-secondary px-4 py-2 text-xs font-bold uppercase bg-system-background-tertiary/50">Tüm Hareketler</Text>
                      {otherLibraryExercises.map(ex => (
                        <ExerciseItem key={ex.id} exercise={ex} onClick={handleAddExerciseToWorkout} />
                      ))}
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Routine Picker Modal */}
      <Modal visible={isRoutinePickerOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-system-background-secondary rounded-t-3xl p-6 h-[70%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-2xl font-bold text-system-label">Rutin Seç</Text>
              <TouchableOpacity onPress={() => setRoutinePickerOpen(false)}>
                <X size={24} color="gray" />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {routines.length > 0 ? routines.map(routine => (
                <TouchableOpacity key={routine.id} onPress={() => handleSelectRoutine(routine)} className="p-5 bg-system-background-tertiary rounded-2xl mb-3 flex-row justify-between items-center">
                  <View>
                    <Text className="font-bold text-system-label text-lg">{routine.name}</Text>
                    <Text className="text-sm text-system-label-secondary font-medium">{routine.exercises.length} hareket</Text>
                  </View>
                  <Plus size={24} color="#0A84FF" />
                </TouchableOpacity>
              )) : (
                <Text className="text-center text-system-label-secondary py-10">Kayıtlı rutin bulunmuyor.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Large Image Modal */}
      <Modal visible={showLargeImage && !!currentLargeImageUrl} animationType="fade" transparent>
        <View className="flex-1 bg-black/90 items-center justify-center p-4">
          <TouchableOpacity onPress={() => setShowLargeImage(false)} className="absolute top-10 right-4 p-2 bg-white/20 rounded-full z-10">
            <X size={24} color="white" />
          </TouchableOpacity>
          {currentLargeImageUrl && (
            <Image source={{ uri: currentLargeImageUrl }} className="w-full h-[80%] rounded-xl" resizeMode="contain" />
          )}
        </View>
      </Modal>

    </View>
  );
};

export default AddWorkout;