// src/components/AddWorkout.tsx

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, Trash2, Search, X, Star, Radar, BadgePlus, Clock, Save } from 'lucide-react';
import { Workout, Exercise } from '../App';
import { Routine } from './RoutinesList';
import { Exercise as LibraryExercise } from '../services/exerciseApi';

const SUPABASE_PROJECT_URL = 'https://ekrhekungvoisfughwuz.supabase.co';
const BUCKET_NAME = 'images';

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

  // Rutin ID State'i
  const [workoutRoutineId, setWorkoutRoutineId] = useState<number | undefined>(() => {
    return existingWorkout ? existingWorkout.routine_id : undefined;
  });

  const [isRoutinePickerOpen, setRoutinePickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // --- SAYAÇ STATE'LERİ ---
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialLoad = useRef(true);

  const [showLargeImage, setShowLargeImage] = useState(false);
  const [currentLargeImageUrl, setCurrentLargeImageUrl] = useState<string | null>(null);

  const loadedWorkoutId = useRef<string | null>(existingWorkout?.id || null);

  // Sayfa açıldığında en üste kaydır
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

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


  // --- VERİ YÜKLEME EFFECT'İ ---
  useEffect(() => {
    const currentId = existingWorkout?.id || 'new';

    if (loadedWorkoutId.current !== currentId) {
      setWorkoutExercises(existingWorkout ? existingWorkout.exercises : []);
      setWorkoutRoutineId(existingWorkout ? existingWorkout.routine_id : undefined);
      loadedWorkoutId.current = currentId;
    }
  }, [existingWorkout?.id]);


  // --- SAYAÇ EFFECT'İ ---
  useEffect(() => {
    if (!isToday) {
      if (existingWorkout && existingWorkout.duration) {
        setElapsedSeconds(existingWorkout.duration);
      } else {
        setElapsedSeconds(0);
      }
      return;
    }

    const savedStartTime = localStorage.getItem('currentWorkoutStartTime');
    let currentStartTimestamp = 0;

    if (savedStartTime) {
      setStartTime(savedStartTime);
      currentStartTimestamp = new Date(savedStartTime).getTime();
    }
    else if (existingWorkout && existingWorkout.id !== 'new' && existingWorkout.duration) {
      setElapsedSeconds(existingWorkout.duration);
      return;
    }
    else {
      const nowStr = new Date().toISOString();
      setStartTime(nowStr);
      localStorage.setItem('currentWorkoutStartTime', nowStr);
      currentStartTimestamp = new Date(nowStr).getTime();
      setElapsedSeconds(0);
    }

    const now = new Date().getTime();
    const diff = Math.max(0, Math.floor((now - currentStartTimestamp) / 1000));
    setElapsedSeconds(diff);

    timerRef.current = setInterval(() => {
      const loopNow = new Date().getTime();
      const loopDiff = Math.max(0, Math.floor((loopNow - currentStartTimestamp) / 1000));
      setElapsedSeconds(loopDiff);

      if (loopDiff > 7200) {
        if (timerRef.current) clearInterval(timerRef.current);
        handleAutoFinish(loopDiff, new Date(currentStartTimestamp).toISOString());
      }
    }, 1000);

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

  // Önceki antrenman verisini bulma fonksiyonu
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
      localStorage.removeItem('currentWorkoutStartTime');
      alert('Antrenman süresi 2 saati aştığı için otomatik olarak sonlandırıldı.');
    } catch (error) {
      console.error("Auto finish failed", error);
    }
  };

  const handleSaveAndExit = async () => {
    const exercisesToSave = prepareWorkoutData();

    // YENİ EKLENEN KONTROL: 
    // Kaydetmeden önce en az bir hareket ve o harekete ait en az bir geçerli set olup olmadığına bakar.
    const hasValidData = exercisesToSave.length > 0 && exercisesToSave.some(ex => ex.sets.length > 0);

    if (!hasValidData) {
      alert("Kaydetmek için lütfen en az bir hareket ve set bilgisi girin.");
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

      onCancel();
    } catch (error) {
      console.error("Save failed", error);
    }
  };

  const handleCancel = () => {
    if (workoutExercises.length === 0) {
      localStorage.removeItem('currentWorkoutStartTime');
    }
    onCancel();
  };

  const getImageUrl = (gifPath: string | undefined) => {
    if (!gifPath) return 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const imagePath = gifPath.replace('0.jpg', '1.jpg');
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/images/exercises/${imagePath}`;
  };

  const handleImageClick = (imageUrl: string) => {
    setCurrentLargeImageUrl(imageUrl);
    setShowLargeImage(true);
  };

  const closeLargeImage = () => {
    setShowLargeImage(false);
    setCurrentLargeImageUrl(null);
  };

  const ExerciseListItem = ({ exercise, isFavorite = false, onClick }: { exercise: LibraryExercise, isFavorite?: boolean, onClick: (ex: LibraryExercise) => void }) => (
    <button onClick={() => onClick(exercise)} className="w-full text-left p-4 flex items-center gap-4 hover:bg-system-background-tertiary transition-colors border-b border-system-separator/30 last:border-none">
      <img src={getImageUrl(exercise.gifUrl)} alt={exercise.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-system-background-tertiary" />
      <p className="flex-1 font-medium text-system-label text-base">{exercise.name}</p>
      {isFavorite && <Star size={16} className="text-system-yellow fill-system-yellow flex-shrink-0" />}
    </button>
  );

  const AddExerciseSection = (
    <div className="bg-system-background-secondary rounded-2xl overflow-hidden shadow-sm border border-system-separator/10 mb-20">
      <div className="p-4 pb-2">
        <h3 className="text-lg font-bold text-system-label mb-4 flex items-center gap-2"> <Plus className="w-5 h-5 text-system-blue" /> Hareket Ekle</h3>
        <div className="space-y-4">
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-system-label-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hareket ara..."
              className="w-full pl-10 pr-10 py-3.5 bg-system-background-tertiary text-system-label rounded-xl focus:outline-none focus:ring-2 focus:ring-system-blue text-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-6 h-6 bg-system-label-tertiary rounded-full text-system-background active:scale-90 transition-transform"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setRoutinePickerOpen(true)} className="w-full text-left p-4 flex flex-col items-center justify-center gap-2 bg-system-background-tertiary rounded-xl hover:bg-system-fill-tertiary transition-colors active:scale-95">
              <Radar size={24} className="text-system-orange" />
              <span className="text-system-label font-semibold text-sm">Rutinden Seç</span>
            </button>
            <button onClick={addManualExercise} className="w-full text-left p-4 flex flex-col items-center justify-center gap-2 bg-system-background-tertiary rounded-xl hover:bg-system-fill-tertiary transition-colors active:scale-95">
              <BadgePlus size={24} className="text-system-green" />
              <span className="text-system-label font-semibold text-sm">Manuel Ekle</span>
            </button>
          </div>
        </div>
      </div>
      <div className="max-h-[40vh] overflow-y-auto scrollbar-thin mt-2">
        {searchQuery.trim() ? (
          searchedExercises.length > 0 ? (
            searchedExercises.map(exercise => (
              <ExerciseListItem key={exercise.id} exercise={exercise} onClick={handleAddExerciseToWorkout} />
            ))
          ) : (
            <p className="text-md text-center text-system-label-secondary py-8 px-4">Sonuç bulunamadı.</p>
          )
        ) : (
          <>
            {favoriteLibraryExercises.length > 0 && (
              <div>
                <p className="text-system-label-secondary px-4 py-2 text-xs font-bold uppercase tracking-wider bg-system-background-tertiary/50 sticky top-0 backdrop-blur-md">Favoriler</p>
                {favoriteLibraryExercises.map(exercise => (
                  <ExerciseListItem key={exercise.id} exercise={exercise} isFavorite onClick={handleAddExerciseToWorkout} />
                ))}
              </div>
            )}
            <div>
              <p className="text-system-label-secondary px-4 py-2 text-xs font-bold uppercase tracking-wider bg-system-background-tertiary/50 sticky top-0 backdrop-blur-md">Tüm Hareketler</p>
              {otherLibraryExercises.map(exercise => (
                <ExerciseListItem key={exercise.id} exercise={exercise} onClick={handleAddExerciseToWorkout} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );

  const WorkoutListSection = (
    <div className="space-y-6">
      {workoutExercises.map((exercise) => {
        const libraryExercise = allLibraryExercises.find(libEx => libEx.name.toLowerCase() === exercise.name.toLowerCase());
        const imageUrl = getImageUrl(libraryExercise?.gifUrl);
        const isEditable = exercise.id.startsWith('manual-');
        const previousExercise = getPreviousExerciseData(exercise.name);

        return (
          <div key={exercise.id} className="bg-system-background-secondary rounded-2xl overflow-hidden shadow-sm border border-system-separator/10">
            <div className="p-4 flex items-start gap-4 border-b border-system-separator/20 bg-system-background-tertiary/30">
              <button onClick={() => handleImageClick(imageUrl)} className="flex-shrink-0 active:scale-95 transition-transform">
                <img src={imageUrl} alt={exercise.name} className="w-14 h-14 rounded-xl object-cover shadow-sm" />
              </button>
              <div className="flex-1 min-w-0 py-1">
                <input
                  type="text"
                  value={exercise.name}
                  onChange={(e) => updateExerciseName(exercise.id, e.target.value)}
                  placeholder="Hareket Adı Girin"
                  readOnly={!isEditable}
                  className={`w-full bg-transparent text-xl font-bold text-system-label focus:outline-none truncate ${!isEditable ? 'cursor-default' : 'cursor-text border-b border-system-blue/50 pb-1'}`}
                />
                <p className="text-sm text-system-blue font-medium mt-1">{libraryExercise?.bodyPart ? libraryExercise.bodyPart.charAt(0).toUpperCase() + libraryExercise.bodyPart.slice(1) : 'Genel'}</p>
              </div>
              <button onClick={() => removeWorkoutExercise(exercise.id)} className="p-2 text-system-label-tertiary hover:text-system-red transition-colors bg-system-fill rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-[0.8fr,1.2fr,1.2fr,auto] gap-3 px-4 py-2 text-xs font-semibold text-system-label-secondary uppercase tracking-wide text-center items-center">
              <span>Önceki</span>
              <span>KG</span>
              <span>Tekrar</span>
              <span className="w-8"></span>
            </div>

            <div className="px-4 pb-4 space-y-3">
              {exercise.sets.map((set, setIndex) => {
                const previousSet = previousExercise?.sets[setIndex];

                return (
                  <React.Fragment key={setIndex}>
                    <div className="grid grid-cols-[0.8fr,1.2fr,1.2fr,auto] gap-3 items-center">
                      <div className="h-12 bg-system-fill-secondary rounded-xl flex flex-col items-center justify-center text-xs text-system-label-secondary font-medium">
                        {previousSet ? (
                          <>
                            <span className="text-system-label">{previousSet.weight}kg</span>
                            <span className="text-[10px] opacity-70">{previousSet.reps} tekrar</span>
                          </>
                        ) : (
                          <span className="opacity-50">-</span>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          inputMode="decimal"
                          value={set.weight || ''}
                          onChange={(e) => updateSet(exercise.id, setIndex, 'weight', parseFloat(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full h-12 bg-system-background-tertiary text-system-label text-center text-lg font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-system-blue focus:bg-system-background transition-colors"
                        />
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          inputMode="numeric"
                          value={set.reps || ''}
                          onChange={(e) => updateSet(exercise.id, setIndex, 'reps', parseInt(e.target.value) || 0)}
                          placeholder="0"
                          className="w-full h-12 bg-system-background-tertiary text-system-label text-center text-lg font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-system-blue focus:bg-system-background transition-colors"
                        />
                      </div>

                      <button
                        onClick={() => removeSet(exercise.id, setIndex)}
                        className="h-12 w-10 flex items-center justify-center text-system-label-tertiary hover:text-system-red active:scale-90 transition-all bg-system-fill-tertiary rounded-xl"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </React.Fragment>
                );
              })}

              <button onClick={() => addSet(exercise.id)} className="w-full py-3 mt-2 text-system-blue text-center font-bold text-sm bg-system-blue/10 rounded-xl hover:bg-system-blue/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                <Plus size={18} /> SET EKLE
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="bg-system-background min-h-full relative">
      {/* iOS STİLİ HEADER */}
      <div className="sticky top-[env(safe-area-inset-top)] z-50 bg-system-background/95 backdrop-blur-xl border-b border-system-separator/30 transition-colors duration-200">
        <div className="flex justify-between items-center px-4 h-[52px]">
          {/* Sol Buton: İptal */}
          <button
            onClick={handleCancel}
            className="text-system-blue text-[17px] hover:opacity-70 transition-opacity active:scale-95"
          >
            Vazgeç
          </button>

          {/* Orta Kısım: Başlık ve Sayaç */}
          <div className="flex flex-col items-center">
            <h1 className="text-[17px] font-semibold text-system-label">Antrenman</h1>
            {(isToday || elapsedSeconds > 0) && (
              <div className="flex items-center gap-1 text-[11px] font-medium font-mono text-system-label-secondary mt-0.5">
                <Clock size={12} className={isToday ? "text-system-green" : "text-system-label-secondary"} />
                <span className={isToday ? 'text-system-green' : 'text-system-label-secondary'}>
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
            )}
          </div>

          {/* Sağ Buton: Kaydet */}
          <button
            onClick={handleSaveAndExit}
            className="text-system-blue text-[17px] font-bold hover:opacity-70 transition-opacity active:scale-95"
          >
            Kaydet
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-8 pb-32">
        {workoutExercises.length > 0 ? (
          <>
            {WorkoutListSection}

            <div className="relative">
              <div className="absolute inset-0 flex items-center" aria-hidden="true">
                <div className="w-full border-t border-system-separator/30"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-system-background text-sm font-medium text-system-label-secondary">Daha Fazla Hareket</span>
              </div>
            </div>

            {AddExerciseSection}
          </>
        ) : (
          <div className="space-y-6">
            <div className="text-center py-10">
              <h2 className="text-2xl font-bold text-system-label mb-2">Antrenmana Başla</h2>
              <p className="text-system-label-secondary">Aşağıdan hareket ekleyerek başla.</p>
            </div>
            {AddExerciseSection}
          </div>
        )}

      </div>

      {/* Modals */}
      {showLargeImage && currentLargeImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={closeLargeImage}>
          <div className="relative bg-system-background-secondary rounded-3xl p-2 max-w-full max-h-full overflow-hidden shadow-2xl ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <button onClick={closeLargeImage} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 z-10 backdrop-blur-md">
              <X size={24} />
            </button>
            <img src={currentLargeImageUrl} alt="Büyük Egzersiz Görseli" className="max-w-[90vw] max-h-[80vh] object-contain mx-auto rounded-2xl" />
          </div>
        </div>
      )}

      {isRoutinePickerOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRoutinePickerOpen(false)}></div>
          <div className="relative w-full max-w-md bg-system-background-secondary rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1.5 bg-system-label-tertiary rounded-full mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold text-center text-system-label mb-6">Rutin Seç</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-thin">
              {routines.length > 0 ? routines.map(routine => (
                <button key={routine.id} onClick={() => handleSelectRoutine(routine)} className="w-full text-left p-5 bg-system-background-tertiary rounded-2xl hover:bg-system-fill-tertiary transition-colors flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-system-label text-lg">{routine.name}</p>
                    <p className="text-sm text-system-label-secondary font-medium">{routine.exercises.length} hareket</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-system-blue/10 flex items-center justify-center text-system-blue group-hover:scale-110 transition-transform">
                    <Plus size={20} />
                  </div>
                </button>
              )) : (
                <p className="text-center text-system-label-secondary py-10">Kayıtlı rutin bulunmuyor.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddWorkout;