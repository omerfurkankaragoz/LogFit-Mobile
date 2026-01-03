import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Edit, Trash2, TrendingUp, Calendar as CalendarIcon, ChevronLeft, Clock } from 'lucide-react-native';
import { Workout, Exercise } from '../App';

interface WorkoutDetailsProps {
  workout: Workout | undefined;
  date: string;
  workouts: Workout[];
  onEdit: () => void;
  onDelete: (id: string) => void;
  onCancel: () => void;
}

const WorkoutDetails: React.FC<WorkoutDetailsProps> = ({
  workout,
  date,
  workouts,
  onEdit,
  onDelete,
  onCancel
}) => {
  const [showComparison, setShowComparison] = useState(false);

  const formatDate = (dateStr: string) => {
    return format(parseISO(dateStr), 'd MMMM yyyy', { locale: tr });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}sa ${m}dk`;
    return `${m}dk`;
  };

  const getPreviousWorkout = (exerciseName: string) => {
    const sortedWorkouts = workouts
      .filter(w => w.date < date)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    for (const prevWorkout of sortedWorkouts) {
      const exercise = prevWorkout.exercises.find(ex => ex.name === exerciseName);
      if (exercise) {
        return { workout: prevWorkout, exercise };
      }
    }
    return null;
  };

  const getMaxWeight = (exercise: Exercise) => {
    if (exercise.sets.length === 0) return 0;
    return Math.max(...exercise.sets.map(set => set.weight));
  };

  const getTotalVolume = (exercise: Exercise) => {
    return exercise.sets.reduce((total, set) => total + (set.reps * set.weight), 0);
  };

  const getWorkoutStats = (w: Workout) => {
    const exercisesWithData = w.exercises.filter(ex => ex.sets.length > 0);
    const totalSets = exercisesWithData.reduce((total, ex) => total + ex.sets.length, 0);
    const totalVolume = exercisesWithData.reduce((total, ex) => total + getTotalVolume(ex), 0);
    const exerciseCount = exercisesWithData.length;
    return { totalSets, totalVolume, exerciseCount };
  };

  if (!workout) {
    return (
      <View className="flex-1 bg-system-background">
        <View className="flex-row items-center px-4 py-2 bg-system-background/95 border-b border-system-separator/20">
          <TouchableOpacity onPress={onCancel} className="p-2 -ml-2">
            <ChevronLeft size={34} strokeWidth={2.5} color="#0A84FF" />
          </TouchableOpacity>
        </View>

        <View className="p-4 items-center justify-center mt-10">
          <View className="bg-system-background-secondary rounded-2xl p-8 items-center w-full">
            <CalendarIcon size={40} color="rgba(235, 235, 245, 0.3)" className="mb-4" />
            <Text className="text-lg font-bold text-system-label mb-1">Antrenman Yok</Text>
            <Text className="text-system-label-secondary text-sm mb-6 text-center">
              {formatDate(date)} tarihinde kayıtlı bir antrenman bulunmuyor.
            </Text>
            <TouchableOpacity
              onPress={onEdit}
              className="bg-system-blue py-3 px-6 rounded-xl"
            >
              <Text className="text-white font-semibold">Antrenman Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  const stats = getWorkoutStats(workout);
  const exercisesToShow = workout.exercises.filter(ex => ex.sets && ex.sets.length > 0);

  if (exercisesToShow.length === 0) {
    return (
      <View className="flex-1 bg-system-background">
        <View className="flex-row items-center px-4 py-2 bg-system-background/95 border-b border-system-separator/20">
          <TouchableOpacity onPress={onCancel} className="p-2 -ml-2">
            <ChevronLeft size={34} strokeWidth={2.5} color="#0A84FF" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-system-label ml-1">{formatDate(date)}</Text>
        </View>

        <View className="p-4 items-center justify-center mt-10">
          <View className="bg-system-background-secondary rounded-2xl p-8 items-center w-full">
            <CalendarIcon size={40} color="rgba(235, 235, 245, 0.3)" className="mb-4" />
            <Text className="text-lg font-bold text-system-label mb-1">Henüz Veri Girilmedi</Text>
            <Text className="text-system-label-secondary text-sm mb-6 text-center">
              Bu antrenmanda henüz set bilgisi girilmiş bir hareket yok.
            </Text>
            <TouchableOpacity
              onPress={onEdit}
              className="bg-system-blue py-3 px-6 rounded-xl flex-row items-center gap-2"
            >
              <Edit size={18} color="white" />
              <Text className="text-white font-semibold">Antrenmana Devam Et</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  return (
    <View className="flex-1 bg-system-background">
      {/* Header */}
      <View className="px-4 pt-2 pb-4 bg-system-background/95 backdrop-blur-xl border-b border-system-separator/20">
        <View className="flex-row justify-between items-start">
          <View>
            <View className="flex-row items-center">
              <TouchableOpacity onPress={onCancel} className="p-2 -ml-2">
                <ChevronLeft size={34} strokeWidth={2.5} color="#0A84FF" />
              </TouchableOpacity>
              <Text className="text-2xl font-bold text-system-label tracking-tight ml-1" numberOfLines={1}>
                {formatDate(date)}
              </Text>
            </View>
            {(workout.duration || 0) > 0 && (
              <View className="flex-row items-center gap-1.5 ml-9 mt-1">
                <Clock size={14} color="rgba(235, 235, 245, 0.6)" />
                <Text className="text-sm font-medium text-system-label-secondary">{formatDuration(workout.duration)}</Text>
              </View>
            )}
          </View>

          <View className="flex-row gap-2 mt-2">
            <TouchableOpacity onPress={onEdit} className="p-2.5 bg-system-fill rounded-full">
              <Edit size={20} color="#0A84FF" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => Alert.alert("Sil", "Bu antrenmanı silmek istediğinizden emin misiniz?", [
              { text: "İptal", style: "cancel" },
              { text: "Sil", style: "destructive", onPress: () => onDelete(workout.id) }
            ])} className="p-2.5 bg-system-fill rounded-full">
              <Trash2 size={20} color="#FF453A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} className="p-4 space-y-6">
        {/* Stats */}
        <View className="bg-system-background-secondary rounded-2xl p-5 border border-system-separator/10">
          <Text className="font-bold text-system-label mb-4 text-sm uppercase tracking-wider opacity-70">Genel Özet</Text>
          <View className="flex-row justify-between divide-x divide-system-separator/20">
            <View className="flex-1 items-center px-1">
              <Text className="text-2xl font-bold text-system-blue tracking-tight">{stats.exerciseCount}</Text>
              <Text className="text-[10px] font-bold text-system-label-secondary uppercase mt-1">Hareket</Text>
            </View>
            <View className="flex-1 items-center px-1">
              <Text className="text-2xl font-bold text-system-orange tracking-tight">{stats.totalSets}</Text>
              <Text className="text-[10px] font-bold text-system-label-secondary uppercase mt-1">Set</Text>
            </View>
            <View className="flex-1 items-center px-1">
              <Text className="text-2xl font-bold text-system-green tracking-tight">{stats.totalVolume.toFixed(0)}</Text>
              <Text className="text-[10px] font-bold text-system-label-secondary uppercase mt-1">Hacim (kg)</Text>
            </View>
          </View>
        </View>

        {/* Exercises List */}
        <View>
          <View className="flex-row justify-between items-center px-1 mb-4">
            <Text className="text-xl font-bold text-system-label">Hareketler</Text>
            <TouchableOpacity
              onPress={() => setShowComparison(!showComparison)}
              className={`flex-row items-center gap-2 px-3 py-1.5 rounded-lg ${showComparison ? 'bg-system-orange' : 'bg-system-background-tertiary'}`}
            >
              <TrendingUp size={16} color={showComparison ? 'white' : 'rgba(235, 235, 245, 0.6)'} />
              <Text className={`text-xs font-semibold ${showComparison ? 'text-white' : 'text-system-label-secondary'}`}>
                {showComparison ? 'Kapat' : 'Karşılaştır'}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-4">
            {exercisesToShow.map((exercise) => {
              const previousData = getPreviousWorkout(exercise.name);
              const currentMax = getMaxWeight(exercise);
              const currentVolume = getTotalVolume(exercise);
              const previousMax = previousData ? getMaxWeight(previousData.exercise) : 0;
              const previousVolume = previousData ? getTotalVolume(previousData.exercise) : 0;

              return (
                <View key={exercise.id} className="bg-system-background-secondary rounded-2xl overflow-hidden border border-system-separator/10 shadow-sm">
                  <View className="p-4 bg-system-background-tertiary/30 border-b border-system-separator/20">
                    <Text className="font-bold text-system-label text-lg tracking-tight">{exercise.name}</Text>
                    {showComparison && previousData && (
                      <View className="flex-row items-center gap-1.5 mt-1.5">
                        <View className="w-1.5 h-1.5 rounded-full bg-system-label-tertiary" />
                        <Text className="text-xs text-system-label-secondary font-medium">Önceki: {formatDate(previousData.workout.date)}</Text>
                      </View>
                    )}
                  </View>

                  <View className="p-4">
                    <View className="flex-row justify-between mb-2">
                      <Text className="flex-1 text-center text-xs font-bold text-system-label-tertiary uppercase">Set</Text>
                      <Text className="flex-1 text-center text-xs font-bold text-system-label-tertiary uppercase">Tekrar</Text>
                      <Text className="flex-1 text-center text-xs font-bold text-system-label-tertiary uppercase">Ağırlık</Text>
                    </View>
                    <View className="space-y-1.5">
                      {exercise.sets.map((set, setIndex) => (
                        <View key={setIndex} className="flex-row justify-between py-2.5 bg-system-background-tertiary/40 rounded-xl items-center">
                          <View className="flex-1 items-center"><Text className="font-bold text-system-label-secondary text-sm bg-system-fill/50 w-6 h-6 rounded-full text-center leading-6">{setIndex + 1}</Text></View>
                          <View className="flex-1 items-center"><Text className="text-system-label font-bold text-base">{set.reps}</Text></View>
                          <View className="flex-1 flex-row justify-center items-baseline gap-0.5">
                            <Text className="text-system-label font-bold text-base">{set.weight}</Text>
                            <Text className="text-xs font-medium text-system-label-tertiary">kg</Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Comparison */}
                  {showComparison && (
                    <View className="bg-system-background-tertiary/20 border-t border-system-separator/20 p-4">
                      <View className="flex-row gap-3">
                        <View className="flex-1 bg-system-background-secondary p-3 rounded-xl border border-system-separator/10">
                          <Text className="text-[10px] font-bold text-system-label-tertiary uppercase mb-1">Maks Ağırlık</Text>
                          <View className="flex-row items-baseline gap-2">
                            <Text className="font-bold text-system-label text-lg">{currentMax}</Text>
                            {previousMax > 0 && (
                              <Text className={`text-xs font-bold ${currentMax >= previousMax ? 'text-system-green' : 'text-system-red'}`}>
                                {currentMax > previousMax ? '+' : ''}{(currentMax - previousMax).toFixed(1)}
                              </Text>
                            )}
                          </View>
                        </View>
                        <View className="flex-1 bg-system-background-secondary p-3 rounded-xl border border-system-separator/10">
                          <Text className="text-[10px] font-bold text-system-label-tertiary uppercase mb-1">Toplam Hacim</Text>
                          <View className="flex-row items-baseline gap-2">
                            <Text className="font-bold text-system-label text-lg">{currentVolume.toFixed(0)}</Text>
                            {previousVolume > 0 && (
                              <Text className={`text-xs font-bold ${currentVolume >= previousVolume ? 'text-system-green' : 'text-system-red'}`}>
                                {currentVolume > previousVolume ? '+' : ''}{(currentVolume - previousVolume).toFixed(0)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default WorkoutDetails;