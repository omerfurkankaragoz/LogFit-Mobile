// src/components/WorkoutDetails.tsx
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Edit, Trash2, TrendingUp, Calendar as CalendarIcon, ChevronLeft, Clock } from 'lucide-react'; // ArrowLeft yerine ChevronLeft
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

  // Sayfa açıldığında en üste kaydır
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

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
      <div className="min-h-full bg-system-background">
        {/* iOS Stil Header - Boş Durum */}
        <div className="sticky top-[env(safe-area-inset-top)] z-10 bg-system-background/95 backdrop-blur-xl border-b border-system-separator/20 px-4 pt-2 pb-4 transition-colors duration-200">
          <button onClick={onCancel} className="text-system-blue p-2 -ml-3 hover:opacity-70 transition-opacity rounded-full active:bg-system-fill">
            <ChevronLeft size={34} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4">
          <div className="text-center py-16 px-4 bg-system-background-secondary rounded-2xl mt-6">
            <CalendarIcon size={40} className="mx-auto text-system-label-tertiary mb-4" />
            <h3 className="text-lg font-bold text-system-label mb-1">Antrenman Yok</h3>
            <p className="text-system-label-secondary text-sm mb-6">
              {formatDate(date)} tarihinde kayıtlı bir antrenman bulunmuyor.
            </p>
            <button
              onClick={onEdit}
              className="bg-system-blue text-white py-3 px-6 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              Antrenman Ekle
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = getWorkoutStats(workout);
  const exercisesToShow = workout.exercises.filter(ex => ex.sets && ex.sets.length > 0);

  if (exercisesToShow.length === 0) {
    return (
      <div className="min-h-full bg-system-background">
        {/* iOS Stil Header - Veri Yok Durumu */}
        <div className="sticky top-[env(safe-area-inset-top)] z-10 bg-system-background/95 backdrop-blur-xl border-b border-system-separator/20 px-4 pt-2 pb-4 flex justify-between items-start transition-colors duration-200">
          <div className="flex items-center gap-1">
            <button onClick={onCancel} className="text-system-blue p-2 -ml-3 hover:opacity-70 transition-opacity rounded-full active:bg-system-fill">
              <ChevronLeft size={34} strokeWidth={2.5} />
            </button>
            <h1 className="text-2xl font-bold text-system-label tracking-tight ml-1">{formatDate(date)}</h1>
          </div>
        </div>

        <div className="p-4">
          <div className="text-center py-16 px-4 bg-system-background-secondary rounded-2xl mt-6">
            <CalendarIcon size={40} className="mx-auto text-system-label-tertiary mb-4" />
            <h3 className="text-lg font-bold text-system-label mb-1">
              Henüz Veri Girilmedi
            </h3>
            <p className="text-system-label-secondary text-sm mb-6">
              Bu antrenmanda henüz set bilgisi girilmiş bir hareket yok.
            </p>
            <button
              onClick={onEdit}
              className="bg-system-blue text-white py-3 px-6 rounded-xl font-semibold flex items-center gap-2 mx-auto active:scale-95 transition-transform"
            >
              <Edit size={18} /> Antrenmana Devam Et
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-system-background animate-in slide-in-from-right duration-200">
      {/* iOS STİLİ SABİT BAŞLIK (Sticky Large Header) */}
      <div className="sticky top-[env(safe-area-inset-top)] z-40 bg-system-background/95 backdrop-blur-xl border-b border-system-separator/20 px-4 pt-2 pb-4 shadow-sm transition-colors duration-200">
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1">
              <button
                onClick={onCancel}
                className="text-system-blue p-2 -ml-3 hover:opacity-70 transition-opacity rounded-full active:bg-system-fill"
              >
                <ChevronLeft size={34} strokeWidth={2.5} />
              </button>
              <h1 className="text-2xl font-bold text-system-label tracking-tight ml-1 line-clamp-1">
                {formatDate(date)}
              </h1>
            </div>

            {/* Süre Gösterimi (Başlık Altı) */}
            {(workout.duration || 0) > 0 && (
              <div className="flex items-center gap-1.5 ml-9 text-system-label-secondary">
                <Clock size={14} />
                <span className="text-sm font-medium">{formatDuration(workout.duration)}</span>
              </div>
            )}
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={onEdit} className="p-2.5 bg-system-fill text-system-blue rounded-full active:scale-90 transition-all hover:bg-system-fill-secondary">
              <Edit size={20} />
            </button>
            <button onClick={() => { if (confirm('Bu antrenmanı silmek istediğinizden emin misiniz?')) { onDelete(workout.id); } }} className="p-2.5 bg-system-fill text-system-red rounded-full active:scale-90 transition-all hover:bg-system-fill-secondary">
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* İÇERİK KISMI */}
      <div className="p-4 space-y-6 pb-24">

        {/* İstatistikler Kartı */}
        <div className="bg-system-background-secondary rounded-2xl p-5 shadow-sm border border-system-separator/10">
          <h2 className="font-bold text-system-label mb-4 text-sm uppercase tracking-wider opacity-70">Genel Özet</h2>
          <div className="grid grid-cols-3 gap-4 divide-x divide-system-separator/20">
            <div className="text-center px-1">
              <div className="text-2xl font-bold text-system-blue tracking-tight">{stats.exerciseCount}</div>
              <div className="text-[10px] font-bold text-system-label-secondary uppercase mt-1">Hareket</div>
            </div>
            <div className="text-center px-1">
              <div className="text-2xl font-bold text-system-orange tracking-tight">{stats.totalSets}</div>
              <div className="text-[10px] font-bold text-system-label-secondary uppercase mt-1">Set</div>
            </div>
            <div className="text-center px-1">
              <div className="text-2xl font-bold text-system-green tracking-tight">{stats.totalVolume.toFixed(0)}</div>
              <div className="text-[10px] font-bold text-system-label-secondary uppercase mt-1">Hacim (kg)</div>
            </div>
          </div>
        </div>

        {/* Hareketler Başlığı ve Karşılaştırma Butonu */}
        <div className="flex justify-between items-center px-1">
          <h2 className="text-xl font-bold text-system-label">Hareketler</h2>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95 ${showComparison
                ? 'bg-system-orange text-white shadow-lg shadow-system-orange/20'
                : 'bg-system-background-tertiary text-system-label-secondary hover:bg-system-fill'
              }`}
          >
            <TrendingUp size={16} />
            {showComparison ? 'Kapat' : 'Karşılaştır'}
          </button>
        </div>

        {/* Hareket Listesi */}
        <div className="space-y-4">
          {exercisesToShow.map((exercise) => {
            const previousData = getPreviousWorkout(exercise.name);
            const currentMax = getMaxWeight(exercise);
            const currentVolume = getTotalVolume(exercise);
            const previousMax = previousData ? getMaxWeight(previousData.exercise) : 0;
            const previousVolume = previousData ? getTotalVolume(previousData.exercise) : 0;

            return (
              <div key={exercise.id} className="bg-system-background-secondary rounded-2xl overflow-hidden border border-system-separator/10 shadow-sm">
                <div className="p-4 bg-system-background-tertiary/30 border-b border-system-separator/20">
                  <h3 className="font-bold text-system-label text-lg tracking-tight">{exercise.name}</h3>
                  {showComparison && previousData && (
                    <div className="text-xs text-system-label-secondary mt-1.5 flex items-center gap-1.5 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-system-label-tertiary"></span>
                      Önceki: {formatDate(previousData.workout.date)}
                    </div>
                  )}
                </div>

                {/* Set Tablosu */}
                <div className="p-4">
                  <div className="grid grid-cols-3 gap-3 text-xs text-center font-bold text-system-label-tertiary uppercase mb-2 tracking-wide">
                    <span>Set</span>
                    <span>Tekrar</span>
                    <span>Ağırlık</span>
                  </div>
                  <div className="space-y-1.5">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-3 gap-3 py-2.5 text-center bg-system-background-tertiary/40 rounded-xl items-center">
                        <span className="font-bold text-system-label-secondary text-sm bg-system-fill/50 w-6 h-6 rounded-full flex items-center justify-center mx-auto">{setIndex + 1}</span>
                        <span className="text-system-label font-bold text-base">{set.reps}</span>
                        <div className="flex items-baseline justify-center gap-0.5">
                          <span className="text-system-label font-bold text-base">{set.weight}</span>
                          <span className="text-xs font-medium text-system-label-tertiary">kg</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Karşılaştırma Bölümü */}
                {showComparison && (
                  <div className="bg-system-background-tertiary/20 border-t border-system-separator/20 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-system-background-secondary p-3 rounded-xl border border-system-separator/10">
                        <div className="text-[10px] font-bold text-system-label-tertiary uppercase mb-1">Maks Ağırlık</div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-system-label text-lg">{currentMax}</span>
                          {previousMax > 0 && (
                            <span className={`text-xs font-bold ${currentMax >= previousMax ? 'text-system-green' : 'text-system-red'}`}>
                              {currentMax > previousMax ? '+' : ''}{(currentMax - previousMax).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="bg-system-background-secondary p-3 rounded-xl border border-system-separator/10">
                        <div className="text-[10px] font-bold text-system-label-tertiary uppercase mb-1">Toplam Hacim</div>
                        <div className="flex items-baseline gap-2">
                          <span className="font-bold text-system-label text-lg">{currentVolume.toFixed(0)}</span>
                          {previousVolume > 0 && (
                            <span className={`text-xs font-bold ${currentVolume >= previousVolume ? 'text-system-green' : 'text-system-red'}`}>
                              {currentVolume > previousVolume ? '+' : ''}{(currentVolume - previousVolume).toFixed(0)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WorkoutDetails;