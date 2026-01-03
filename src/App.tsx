import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, SafeAreaView, ScrollView, Alert, Platform } from 'react-native';
import { CalendarRange, Radar, LibraryBig, LineChart } from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import WorkoutCalendar from './components/WorkoutCalendar';
import AddWorkout from './components/AddWorkout';
import WorkoutDetails from './components/WorkoutDetails';
import ProgressCharts from './components/ProgressCharts';
import RoutinesList, { Routine } from './components/RoutinesList';
import CreateRoutine from './components/CreateRoutine';
import ExerciseLibrary from './components/ExerciseLibrary';
import Auth from './components/Auth';
import Profile from './components/Profile';
import { supabase } from './services/supabaseClient';
import { Session } from '@supabase/supabase-js';
import { getAllExercises, Exercise as LibraryExercise } from './services/exerciseApi';
import { CalendarSkeleton, BottomNavSkeleton } from './components/Skeletons';
import { storage } from './utils/storage';

export interface Exercise {
  id: string;
  name: string;
  bodyPart?: string;
  sets: { reps: number; weight: number; completed?: boolean }[];
}

export interface Workout {
  id: string;
  user_id: string;
  date: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  routine_id?: number;
  exercises: Exercise[];
}

type ViewType = 'calendar' | 'add' | 'details' | 'progress' | 'routines' | 'create_routine' | 'library' | 'profile';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('calendar');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [editingRoutine, setEditingRoutine] = useState<Partial<Routine> | null>(null);
  const [allLibraryExercises, setAllLibraryExercises] = useState<LibraryExercise[]>([]);
  const [favoriteExercises, setFavoriteExercises] = useState<string[]>([]);

  const [userProfile, setUserProfile] = useState<{ fullName: string | null, avatarUrl: string | null }>({ fullName: null, avatarUrl: null });

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) fetchAllData();
  }, [session]);

  const fetchAllData = async () => {
    if (!session) return;
    setLoading(true);
    try {
      const [workoutsRes, routinesRes, exercisesRes, profileRes] = await Promise.all([
        supabase.from('workouts').select('*').eq('user_id', session.user.id).order('date', { ascending: false }),
        supabase.from('routines').select('*').eq('user_id', session.user.id).order('name'),
        getAllExercises(),
        supabase.from('profiles').select('favorite_exercises, full_name, avatar_url').eq('id', session.user.id).single(),
      ]);

      if (workoutsRes.error) throw workoutsRes.error;
      if (routinesRes.error) throw routinesRes.error;
      if (profileRes.error && profileRes.status !== 406) throw profileRes.error;

      const formattedWorkouts = (workoutsRes.data || []).map((w: any) => ({
        ...w,
        startTime: w.start_time || w.startTime,
        endTime: w.end_time || w.endTime,
        routine_id: w.routine_id
      }));

      setWorkouts(formattedWorkouts as Workout[]);
      setRoutines(routinesRes.data as Routine[] || []);
      setAllLibraryExercises(exercisesRes || []);

      if (profileRes.data) {
        setFavoriteExercises(profileRes.data.favorite_exercises || []);
        setUserProfile({
          fullName: profileRes.data.full_name,
          avatarUrl: profileRes.data.avatar_url
        });
      }

      // --- EKLENDİ: Uygulama açıldığında devam eden antrenman kontrolü ---
      const savedStartTime = await storage.getItem('currentWorkoutStartTime');
      if (savedStartTime) {
        const todayStr = new Date().toISOString().split('T')[0];
        const workoutForToday = formattedWorkouts.find((w: any) => w.date === todayStr);

        setSelectedDate(todayStr);
        setEditingWorkout((workoutForToday as Workout) || null);
        setCurrentView('add');
      }

    } catch (error) { console.error("Veri çekme hatası:", error); }
    finally { setLoading(false); }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setWorkouts([]);
    setRoutines([]);
    setFavoriteExercises([]);
    setCurrentView('calendar');
  };

  const toggleFavoriteExercise = async (exerciseId: string) => {
    if (!session) return;
    const updatedFavorites = favoriteExercises.includes(exerciseId)
      ? favoriteExercises.filter(id => id !== exerciseId)
      : [...favoriteExercises, exerciseId];
    setFavoriteExercises(updatedFavorites);
    const { error } = await supabase.from('profiles').update({ favorite_exercises: updatedFavorites }).eq('id', session.user.id);
    if (error) {
      console.error('Favori güncellenirken hata oluştu:', error);
      setFavoriteExercises(favoriteExercises);
    }
  };

  const handleSaveWorkout = async (workoutData: Omit<Workout, 'id' | 'user_id' | 'created_at'>, shouldFinish: boolean = true) => {
    if (!session) return;

    try {
      const workoutToUpdate = editingWorkout;

      const dbPayload = {
        user_id: session.user.id,
        date: workoutData.date,
        exercises: workoutData.exercises,
        start_time: workoutData.startTime,
        end_time: workoutData.endTime,
        duration: workoutData.duration,
        routine_id: workoutData.routine_id
      };

      let savedWorkoutId = workoutToUpdate?.id;

      if (workoutToUpdate && workoutToUpdate.id !== 'new') {
        const { error } = await supabase
          .from('workouts')
          .update(dbPayload)
          .eq('id', workoutToUpdate.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('workouts')
          .insert([dbPayload])
          .select()
          .single();

        if (error) throw error;
        if (data) savedWorkoutId = data.id;
      }

      await fetchAllData();

      if (shouldFinish) {
        setEditingWorkout(null);
        setCurrentView('calendar');
      } else {
        if (savedWorkoutId) {
          setEditingWorkout({
            id: savedWorkoutId,
            user_id: session.user.id,
            date: workoutData.date,
            exercises: workoutData.exercises,
            startTime: workoutData.startTime,
            endTime: workoutData.endTime,
            duration: workoutData.duration,
            routine_id: workoutData.routine_id
          });
        }
      }

    } catch (error: any) {
      console.error("Antrenman kaydedilirken hata oluştu:", error);
      Alert.alert("Hata", `Kayıt sırasında bir hata oluştu: ${error.message}`);
      throw error;
    }
  };

  const handleFinishWorkoutFromCalendar = async (workout: Workout) => {
    // React Native'de confirm yerine Alert kullanıyoruz
    Alert.alert(
      "Onay",
      "Antrenmanı bitirmek istediğinize emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Evet",
          onPress: async () => {
            const now = new Date();
            let duration = workout.duration || 0;

            const savedStartTime = await storage.getItem('currentWorkoutStartTime');
            if (savedStartTime) {
              const start = new Date(savedStartTime).getTime();
              duration = Math.floor((now.getTime() - start) / 1000);
            } else if (workout.startTime) {
              const start = new Date(workout.startTime).getTime();
              duration = Math.floor((now.getTime() - start) / 1000);
            }

            try {
              const { error } = await supabase
                .from('workouts')
                .update({
                  end_time: now.toISOString(),
                  duration: duration
                })
                .eq('id', workout.id);

              if (error) throw error;

              await storage.removeItem('currentWorkoutStartTime');

              await fetchAllData();
            } catch (error: any) {
              console.error("Bitirme hatası:", error);
              Alert.alert("Hata", error.message);
            }
          }
        }
      ]
    );
  }

  const handleSaveRoutine = async (id: string | null, name: string, exercises: { id: string; name: string }[]) => {
    if (!session) return;
    const routineData = { name, exercises, user_id: session.user.id };
    if (id) {
      await supabase.from('routines').update(routineData).eq('id', id);
    } else {
      await supabase.from('routines').insert([routineData]);
    }
    await fetchAllData();
    setEditingRoutine(null);
    setCurrentView('routines');
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    const workoutToDelete = workouts.find(w => w.id === workoutId);
    const todayStr = new Date().toISOString().split('T')[0];

    if (workoutToDelete && workoutToDelete.date === todayStr) {
      await storage.removeItem('currentWorkoutStartTime');
    }

    setWorkouts(prev => prev.filter(w => w.id !== workoutId));
    setCurrentView('calendar');

    try {
      const { error } = await supabase.from('workouts').delete().eq('id', workoutId);
      if (error) throw error;
      await fetchAllData();
    } catch (error: any) {
      console.error("Silme hatası:", error);
      Alert.alert("Hata", "Antrenman silinirken bir hata oluştu.");
      await fetchAllData();
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    Alert.alert("Onay", "Bu rutini silmek istediğinizden emin misiniz?", [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil", style: "destructive", onPress: async () => {
          await supabase.from('routines').delete().eq('id', routineId);
          await fetchAllData();
        }
      }
    ]);
  };

  const handleEditRoutine = (routine: Routine) => {
    setCurrentView('create_routine');
    setEditingRoutine(routine);
  };

  const handleCopyRoutine = (routine: Routine) => {
    const { id, ...routineData } = routine;
    const copiedRoutine = { ...routineData, name: `${routine.name} (Kopya)` };
    setEditingRoutine(copiedRoutine);
    setCurrentView('create_routine');
  };

  const handleStartWorkoutFromRoutine = (routine: Routine) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const workoutForToday = workouts.find(w => w.date === todayStr);

    const newExercisesFromRoutine = routine.exercises.map((routineExercise, index) => {
      const libraryMatch = allLibraryExercises.find(libEx => libEx.name.toLowerCase() === routineExercise.name.toLowerCase());
      return {
        id: `routine-${routineExercise.id}-${Date.now() + index}`,
        name: routineExercise.name,
        bodyPart: routineExercise.bodyPart || libraryMatch?.bodyPart,
        sets: [{ reps: 0, weight: 0, completed: false }]
      };
    });

    if (workoutForToday) {
      Alert.alert(
        "Mevcut Antrenman",
        "Bugün için zaten bir antrenman kaydı var. Bu rutindeki hareketleri mevcut antrenmana eklemek ister misiniz?",
        [
          { text: "Hayır", style: "cancel" },
          {
            text: "Evet",
            onPress: () => {
              const updatedExercises = [...workoutForToday.exercises, ...newExercisesFromRoutine];
              setEditingWorkout({ ...workoutForToday, exercises: updatedExercises });
              setSelectedDate(todayStr);
              setCurrentView('add');
            }
          }
        ]
      );
    } else {
      setEditingWorkout({
        id: 'new',
        user_id: session?.user.id || '',
        date: todayStr,
        exercises: newExercisesFromRoutine,
        routine_id: Number(routine.id)
      });
      setSelectedDate(todayStr);
      setCurrentView('add');
    }
  };

  const handleAddExerciseFromLibrary = (exerciseToAdd: LibraryExercise) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const workoutForToday = workouts.find(w => w.date === todayStr);
    const workoutToEdit = editingWorkout && editingWorkout.date === todayStr ? editingWorkout : workoutForToday;
    const newExercise: Exercise = {
      id: `${exerciseToAdd.id}-${Date.now()}`,
      name: exerciseToAdd.name, bodyPart: exerciseToAdd.bodyPart, sets: [{ reps: 0, weight: 0, completed: false }]
    };
    if (workoutToEdit) {
      if (workoutToEdit.exercises.some(ex => ex.name.toLowerCase() === newExercise.name.toLowerCase())) {
        Alert.alert("Uyarı", `"${newExercise.name}" zaten bugünkü antrenmanınızda mevcut.`);
      } else {
        setEditingWorkout({ ...workoutToEdit, exercises: [newExercise, ...workoutToEdit.exercises] });
      }
    } else {
      setEditingWorkout({ id: 'new', user_id: session?.user.id || '', date: todayStr, exercises: [newExercise] });
    }
    setSelectedDate(todayStr);
    setCurrentView('add');
  };

  const handleStartOrContinueWorkout = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const workoutForToday = workouts.find(w => w.date === todayStr);
    setSelectedDate(todayStr);
    setEditingWorkout(workoutForToday || null);
    setCurrentView('add');
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-system-background">
        <View className="p-4">
          {/* Skeleton placeholder */}
          <Text className="text-white">Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) return <SafeAreaView className="flex-1 bg-system-background"><Auth /></SafeAreaView>;

  const renderContent = () => {
    switch (currentView) {
      case 'profile': return <Profile session={session} onLogout={handleLogout} onBack={() => setCurrentView('calendar')} />;
      case 'routines': return <RoutinesList routines={routines} onAddNewRoutine={() => { setEditingRoutine(null); setCurrentView('create_routine'); }} onEditRoutine={handleEditRoutine} onDeleteRoutine={handleDeleteRoutine} onCopyRoutine={handleCopyRoutine} allLibraryExercises={allLibraryExercises} onStartWorkout={handleStartWorkoutFromRoutine} onBack={() => setCurrentView('calendar')} />;
      case 'create_routine': return <CreateRoutine existingRoutine={editingRoutine} onSaveRoutine={handleSaveRoutine} onCancel={() => { setEditingRoutine(null); setCurrentView('routines'); }} allLibraryExercises={allLibraryExercises} favoriteExercises={favoriteExercises} />;
      case 'calendar': return (
        <WorkoutCalendar
          workouts={workouts}
          routines={routines}
          onDateSelect={(date) => { setSelectedDate(date); const workoutForDate = workouts.find(w => w.date === date); if (workoutForDate) { setEditingWorkout(workoutForDate); setCurrentView('details'); } else { setEditingWorkout(null); setCurrentView('add'); } }}
          onStartWorkout={handleStartOrContinueWorkout}
          onStartRoutine={handleStartWorkoutFromRoutine}
          userProfile={userProfile}
          onProfileClick={() => setCurrentView('profile')}
          onFinishWorkout={handleFinishWorkoutFromCalendar}
        />
      );
      case 'add': return <AddWorkout date={selectedDate} existingWorkout={editingWorkout} routines={routines} workouts={workouts} onSave={handleSaveWorkout} onCancel={() => { setEditingWorkout(null); setCurrentView('calendar'); }} allLibraryExercises={allLibraryExercises} favoriteExercises={favoriteExercises} />;
      case 'details':
        const selectedWorkout = workouts.find(w => w.date === selectedDate);
        return <WorkoutDetails
          workout={selectedWorkout}
          date={selectedDate}
          workouts={workouts}
          onEdit={() => { setEditingWorkout(selectedWorkout); setCurrentView('add'); }}
          onDelete={() => handleDeleteWorkout(selectedWorkout!.id)}
          onCancel={() => setCurrentView('calendar')}
        />;
      case 'progress': return <ProgressCharts workouts={workouts} />;
      case 'library': return <ExerciseLibrary onExerciseSelect={handleAddExerciseFromLibrary} allExercises={allLibraryExercises} favoriteExercises={favoriteExercises} onToggleFavorite={toggleFavoriteExercise} />;
      default: return null;
    }
  };

  const renderBottomNav = () => {
    const navItems = [
      { view: 'calendar', icon: CalendarRange, label: 'Takvim' },
      { view: 'routines', icon: Radar, label: 'Rutinler' },
      { view: 'library', icon: LibraryBig, label: 'Kütüphane' },
      { view: 'progress', icon: LineChart, label: 'İlerleme' },
    ];
    return (
      <View className="absolute bottom-0 left-0 right-0 bg-system-background-secondary/90 border-t border-system-separator pt-2 pb-6 flex-row justify-around">
        {navItems.map(item => (
          <TouchableOpacity key={item.view} onPress={() => setCurrentView(item.view as ViewType)} className={`items-center justify-center gap-1 w-1/5 py-1 ${currentView === item.view ? 'scale-105' : ''}`}>
            <item.icon size={24} color={currentView === item.view ? '#0A84FF' : 'rgba(235, 235, 245, 0.6)'} strokeWidth={currentView === item.view ? 2.5 : 2} />
            <Text className={`text-[10px] font-medium ${currentView === item.view ? 'text-system-blue' : 'text-system-label-secondary'}`}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-system-background">
      <StatusBar style="light" />
      <View className="flex-1 pb-16">
        {renderContent()}
      </View>
      {renderBottomNav()}
    </SafeAreaView>
  );
}

export default App;