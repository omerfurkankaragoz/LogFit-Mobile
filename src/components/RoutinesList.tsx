// src/components/RoutinesList.tsx
import React, { useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown, Copy, Radar, Play, ArrowLeft } from 'lucide-react';
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
    setExpandedRoutineId(expandedRoutineId === routineId ? null : routineId);
  };

  const getImageUrl = (gifPath: string | undefined) => {
    const defaultImage = 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    if (!gifPath) return defaultImage;
    const imagePath = gifPath.replace('0.jpg', '1.jpg');
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET_NAME}/exercises/${imagePath}`;
  };

  return (
    <div>
      {/* Sticky Header - GÜNCELLENDİ: bg-system-background/80 ve backdrop-blur-md */}
      <div className="sticky top-[env(safe-area-inset-top)] z-10 bg-system-background/80 backdrop-blur-md pt-4 pb-4 px-4 border-b border-system-separator/20 transition-colors duration-200">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold text-system-label">Rutinler</h1>
          </div>
          <button
            onClick={onAddNewRoutine}
            className="bg-system-blue text-white p-2 rounded-full hover:bg-system-blue/80 transition-colors active:scale-95 shadow-lg shadow-system-blue/20"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="p-4 space-y-4">
        {routines.length === 0 ? (
          <div className="text-center py-20 px-4 bg-system-background-secondary rounded-2xl border border-system-separator/10">
            <Radar size={48} className="mx-auto text-system-label-tertiary mb-4" />
            <h3 className="text-xl font-semibold text-system-label mb-2">Henüz Rutin Yok</h3>
            <p className="text-system-label-secondary text-base max-w-[250px] mx-auto">
              Kendine özel bir antrenman programı oluşturmak için '+' butonuna bas.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {routines.map((routine) => {
              const isExpanded = expandedRoutineId === routine.id;
              return (
                <div key={routine.id} className="bg-system-background-secondary rounded-2xl overflow-hidden transition-all duration-300 shadow-sm border border-system-separator/10">
                  <div className="flex items-center">
                    <button
                      onClick={() => handleCardClick(routine.id)}
                      className="flex-1 text-left p-4 pr-2 flex items-center active:bg-system-fill transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-system-label text-lg tracking-tight">{routine.name}</h3>
                        <p className="text-sm text-system-label-secondary mt-0.5 font-medium">
                          {routine.exercises?.length || 0} hareket
                        </p>
                      </div>
                      <div className={`p-2 rounded-full text-system-label-tertiary transition-transform duration-300 ${isExpanded ? 'rotate-180 bg-system-fill' : ''}`}>
                        <ChevronDown size={20} />
                      </div>
                    </button>

                    <div className="pr-4 pl-1 py-3 border-l border-system-separator/10">
                      <button
                        onClick={() => onStartWorkout(routine)}
                        className="flex flex-col items-center justify-center gap-1 bg-system-blue/10 text-system-blue px-3 py-2 rounded-xl active:scale-95 transition-transform hover:bg-system-blue/20"
                      >
                        <Play size={22} fill="currentColor" className="ml-0.5" />
                        <span className="text-[10px] font-bold">BAŞLAT</span>
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 bg-system-background-tertiary/30">
                      <div className="border-t border-system-separator/20 pt-3 mt-0">
                        <div className="space-y-2 mb-4">
                          {(routine.exercises || []).map(ex => {
                            const libEx = allLibraryExercises.find(lib => lib.id === ex.id || lib.name === ex.name);
                            return (
                              <div key={ex.id} className="flex items-center gap-3 p-2 rounded-lg bg-system-background-tertiary/50">
                                <img
                                  src={getImageUrl(libEx?.gifUrl)}
                                  alt={ex.name}
                                  className="w-10 h-10 rounded-md object-cover flex-shrink-0 bg-system-background-tertiary"
                                />
                                <span className="text-sm font-medium text-system-label">{ex.name}</span>
                              </div>
                            );
                          })}
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={(e) => { e.stopPropagation(); onCopyRoutine(routine); }} className="py-2.5 px-2 bg-system-background-tertiary text-system-label rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-system-fill active:scale-95 transition-all"> <Copy size={14} /> Kopyala </button>
                          <button onClick={(e) => { e.stopPropagation(); onEditRoutine(routine); }} className="py-2.5 px-2 bg-system-background-tertiary text-system-label rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-system-fill active:scale-95 transition-all"> <Edit size={14} /> Düzenle </button>
                          <button onClick={(e) => { e.stopPropagation(); onDeleteRoutine(routine.id); }} className="py-2.5 px-2 bg-system-red/10 text-system-red rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-system-red/20 active:scale-95 transition-all"> <Trash2 size={14} /> Sil </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RoutinesList;