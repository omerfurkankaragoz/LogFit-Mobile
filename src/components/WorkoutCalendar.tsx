import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, SectionList, Alert } from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Dumbbell, PlayCircle, Zap, User, CheckCircle2, Eye, Activity, Calendar } from 'lucide-react-native';
import type { Workout } from '../App';
import { Routine } from './RoutinesList';
import { storage } from '../utils/storage';

interface WorkoutCalendarProps {
  workouts: Workout[];
  routines: Routine[];
  onDateSelect: (date: string) => void;
  onStartWorkout: () => void;
  onStartRoutine: (routine: Routine) => void;
  userProfile: { fullName: string | null, avatarUrl: string | null };
  onProfileClick: () => void;
  onFinishWorkout: (workout: Workout) => void;
}

const WorkoutCalendar: React.FC<WorkoutCalendarProps> = ({ workouts, routines, onDateSelect, onStartWorkout, onStartRoutine, userProfile, onProfileClick, onFinishWorkout }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [hasActiveLocalSession, setHasActiveLocalSession] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startOfCalendar = startOfWeek(monthStart, { locale: tr, weekStartsOn: 1 });
  const endOfCalendar = endOfWeek(monthEnd, { locale: tr, weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: startOfCalendar, end: endOfCalendar });
  const workoutDates = new Set(workouts.map(w => w.date));

  const todayStr = new Date().toISOString().split('T')[0];
  const workoutForToday = workouts.find(w => w.date === todayStr);

  const last5Workouts = workouts.slice(0, 5);

  const isWorkoutFinished = workoutForToday && workoutForToday.endTime;

  useEffect(() => {
    const checkSession = async () => {
      const savedStartTime = await storage.getItem('currentWorkoutStartTime');
      if (savedStartTime) {
        setHasActiveLocalSession(true);
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (showHistory && scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: false });
    }
  }, [showHistory]);

  const groupedWorkouts = useMemo(() => {
    const groups: { title: string; data: Workout[] }[] = [];
    const sortedWorkouts = [...workouts].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    sortedWorkouts.forEach((workout) => {
      const monthTitle = format(parseISO(workout.date), 'MMMM yyyy', { locale: tr });
      const lastGroup = groups[groups.length - 1];
      if (lastGroup && lastGroup.title === monthTitle) {
        lastGroup.data.push(workout);
      } else {
        groups.push({ title: monthTitle, data: [workout] });
      }
    });

    return groups;
  }, [workouts]);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    onDateSelect(dateStr);
  };

  const handleMainButtonClick = () => {
    if (isWorkoutFinished) {
      onDateSelect(todayStr);
    } else {
      onStartWorkout();
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}sa ${m}dk`;
    return `${m}dk`;
  };

  const renderWorkoutCard = ({ item }: { item: Workout }) => {
    const workout = item;
    const foundRoutine = routines.find(r => String(r.id) === String(workout.routine_id));
    const routineName = foundRoutine ? foundRoutine.name : 'Serbest Antrenman';

    return (
      <TouchableOpacity
        key={workout.id}
        onPress={() => onDateSelect(workout.date)}
        className="w-full p-4 bg-system-background-secondary rounded-2xl border border-system-separator/10 flex-row items-center justify-between mb-3"
      >
        <View className="flex-row items-center gap-4">
          <View className="w-12 h-12 rounded-full bg-system-background-tertiary items-center justify-center">
            <Activity size={24} color="#0A84FF" />
          </View>
          <View>
            <Text className="font-bold text-system-label text-base">
              {routineName}
            </Text>
            <Text className="text-xs text-system-label-secondary mt-0.5">
              {format(parseISO(workout.date), 'd MMMM yyyy, EEEE', { locale: tr })}
            </Text>
          </View>
        </View>
        <View className="items-end gap-1">
          {workout.duration && (
            <View className="px-2 py-1 bg-system-green/10 rounded-md">
              <Text className="text-xs font-medium text-system-green">
                {formatDuration(workout.duration)}
              </Text>
            </View>
          )}
          <Text className="text-xs text-system-label-tertiary">
            {workout.exercises.length} hareket
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (showHistory) {
    return (
      <View className="flex-1 bg-system-background">
        <View className="flex-row items-center gap-1 px-4 py-2 border-b border-system-separator/20 bg-system-background/95 sticky top-0 z-10">
          <TouchableOpacity
            onPress={() => setShowHistory(false)}
            className="p-2 -ml-3"
          >
            <ChevronLeft size={34} strokeWidth={2.5} color="#0A84FF" />
          </TouchableOpacity>
          <Text className="text-3xl font-bold text-system-label tracking-tight ml-1">Geçmiş</Text>
        </View>

        {workouts.length > 0 ? (
          <SectionList
            sections={groupedWorkouts}
            keyExtractor={(item) => item.id}
            renderItem={renderWorkoutCard}
            renderSectionHeader={({ section: { title } }) => (
              <View className="bg-system-background/95 py-2 px-4 border-b border-system-separator/20">
                <Text className="text-sm font-bold text-system-label-secondary uppercase tracking-wider">
                  {title}
                </Text>
              </View>
            )}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 16, paddingTop: 10 }}
            stickySectionHeadersEnabled={true}
          />
        ) : (
          <View className="items-center justify-center py-20 px-4">
            <Activity size={48} color="rgba(235, 235, 245, 0.3)" className="mb-4" />
            <Text className="text-xl font-bold text-system-label mb-2">Henüz Kayıt Yok</Text>
            <Text className="text-system-label-secondary">Tamamlanan antrenmanlarınız burada listelenecek.</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-system-background" contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-4 py-4 border-b border-system-separator/20 bg-system-background/80">
        <View>
          <Text className="text-xs text-system-label-secondary font-medium mb-0.5">Merhaba,</Text>
          <Text className="text-xl font-bold text-system-label" numberOfLines={1}>
            {userProfile.fullName || 'Kullanıcı'}
          </Text>
        </View>
        <TouchableOpacity onPress={onProfileClick} className="rounded-full overflow-hidden w-10 h-10 border border-system-separator/30">
          {userProfile.avatarUrl ? (
            <Image source={{ uri: userProfile.avatarUrl }} className="w-full h-full" />
          ) : (
            <View className="w-full h-full bg-system-fill items-center justify-center">
              <User size={32} color="rgba(235, 235, 245, 0.6)" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View className="p-4 space-y-6">
        {/* Ay Navigasyonu */}
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-3xl font-bold text-system-label capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: tr })}
          </Text>
          <View className="flex-row items-center gap-1 bg-system-fill rounded-full p-1">
            <TouchableOpacity onPress={handlePrevMonth} className="p-2 rounded-full">
              <ChevronLeft size={20} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNextMonth} className="p-2 rounded-full">
              <ChevronRight size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Takvim Grid'i */}
        <View className="bg-system-background-secondary rounded-2xl p-4 shadow-sm border border-system-separator/10">
          <View className="flex-row justify-between mb-3">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(day => (
              <Text key={day} className="text-center text-xs font-bold text-system-label-tertiary uppercase tracking-wider w-8">
                {day}
              </Text>
            ))}
          </View>
          <View className="flex-row flex-wrap gap-2">
            {monthDays.map((day, index) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const hasWorkout = workoutDates.has(dateStr);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isCurrentDay = isToday(day);

              return (
                <TouchableOpacity
                  key={`${dateStr}-${index}`}
                  onPress={() => handleDateClick(day)}
                  className={`
                    w-[12%] aspect-square rounded-xl items-center justify-center relative
                    ${isCurrentDay ? 'bg-system-blue shadow-lg shadow-system-blue/30' : ''}
                    ${!isCurrentDay && hasWorkout ? 'bg-system-green/10 border border-system-green/20' : ''} 
                  `}
                >
                  <Text className={`text-sm font-medium ${isCurrentDay ? 'text-white' : isCurrentMonth ? 'text-system-label' : 'text-system-label-quaternary'} ${!isCurrentDay && hasWorkout ? 'text-system-green font-bold' : ''}`}>
                    {format(day, 'd')}
                  </Text>
                  {!isCurrentDay && hasWorkout && (
                    <View className="absolute bottom-1 w-1 h-1 bg-system-green rounded-full"></View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Ana Aksiyon Butonu */}
        <View className="space-y-3">
          <TouchableOpacity
            onPress={handleMainButtonClick}
            className={`w-full flex-row items-center justify-center gap-3 py-4 px-6 rounded-2xl shadow-xl
              ${isWorkoutFinished
                ? 'bg-system-green'
                : (workoutForToday || hasActiveLocalSession)
                  ? 'bg-system-orange'
                  : 'bg-system-blue'
              }`}
          >
            {isWorkoutFinished ? (
              <Eye size={24} color="white" />
            ) : (workoutForToday || hasActiveLocalSession) ? (
              <Dumbbell size={24} color="white" />
            ) : (
              <PlayCircle size={24} color="white" />
            )}
            <Text className="text-white font-bold text-lg">
              {isWorkoutFinished
                ? 'Antrenmanı Görüntüle'
                : (workoutForToday || hasActiveLocalSession)
                  ? 'Antrenmana Devam Et'
                  : 'Bugünkü Antrenmanı Başlat'
              }
            </Text>
          </TouchableOpacity>

          {workoutForToday && !isWorkoutFinished && (
            <TouchableOpacity
              onPress={() => onFinishWorkout(workoutForToday)}
              className="w-full flex-row items-center justify-center gap-3 py-4 px-6 rounded-2xl bg-system-background-tertiary border border-system-red/20"
            >
              <CheckCircle2 size={24} color="#FF453A" />
              <Text className="text-system-red font-bold text-lg">Antrenmanı Bitir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Hızlı Başlangıç */}
        {routines.length > 0 && !workoutForToday && !hasActiveLocalSession && (
          <View>
            <Text className="text-sm font-bold text-system-label-secondary mb-3 uppercase tracking-wider px-1">
              Hızlı Başlat
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 px-4">
              {routines.map(routine => (
                <TouchableOpacity
                  key={routine.id}
                  onPress={() => onStartRoutine(routine)}
                  className="w-40 p-4 rounded-2xl bg-system-background-secondary border border-system-separator/10 mr-3"
                >
                  <View className="w-10 h-10 rounded-full bg-system-blue items-center justify-center mb-2">
                    <PlayCircle size={20} color="white" />
                  </View>
                  <View>
                    <Text className="font-bold text-system-label text-sm" numberOfLines={1}>{routine.name}</Text>
                    <Text className="text-xs text-system-label-secondary">{routine.exercises.length} hareket</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* İstatistikler */}
        <View className="bg-system-background-secondary rounded-2xl p-6 border border-system-separator/10">
          <Text className="font-bold text-system-label mb-4 text-lg">Bu Ayın Özeti</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 items-center justify-center bg-system-background-tertiary/50 p-4 rounded-xl">
              <Text className="text-3xl font-bold text-system-blue mb-1">
                {workouts.filter(w =>
                  format(parseISO(w.date), 'yyyy-MM') === format(currentMonth, 'yyyy-MM')
                ).length}
              </Text>
              <Text className="text-xs font-medium text-system-label-secondary uppercase tracking-wide">Antrenman</Text>
            </View>
            <View className="flex-1 items-center justify-center bg-system-background-tertiary/50 p-4 rounded-xl">
              <Text className="text-3xl font-bold text-system-orange mb-1">
                {workouts.filter(w =>
                  format(parseISO(w.date), 'yyyy-MM') === format(currentMonth, 'yyyy-MM')
                ).reduce((total, workout) =>
                  total + workout.exercises.reduce((exTotal, exercise) =>
                    exTotal + exercise.sets.length, 0), 0
                )}
              </Text>
              <Text className="text-xs font-medium text-system-label-secondary uppercase tracking-wide">Toplam Set</Text>
            </View>
          </View>
        </View>

        {/* Son 5 Antrenman */}
        {last5Workouts.length > 0 && (
          <View className="pb-4">
            <View className="flex-row items-center justify-between px-1 mb-3">
              <Text className="font-bold text-system-label text-lg">Son Antrenmanlar</Text>
              <TouchableOpacity onPress={() => setShowHistory(true)}>
                <Text className="text-system-blue text-sm font-semibold">Tümünü Gör</Text>
              </TouchableOpacity>
            </View>
            <View>
              {last5Workouts.map(workout => (
                // Here we can reuse renderWorkoutCard logic but adapted for simple View
                <TouchableOpacity
                  key={workout.id}
                  onPress={() => onDateSelect(workout.date)}
                  className="w-full p-4 bg-system-background-secondary rounded-2xl border border-system-separator/10 flex-row items-center justify-between mb-3"
                >
                  <View className="flex-row items-center gap-4">
                    <View className="w-12 h-12 rounded-full bg-system-background-tertiary items-center justify-center">
                      <Activity size={24} color="#0A84FF" />
                    </View>
                    <View>
                      <Text className="font-bold text-system-label text-base">
                        {routines.find(r => String(r.id) === String(workout.routine_id))?.name || 'Serbest Antrenman'}
                      </Text>
                      <Text className="text-xs text-system-label-secondary mt-0.5">
                        {format(parseISO(workout.date), 'd MMMM yyyy, EEEE', { locale: tr })}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default WorkoutCalendar;