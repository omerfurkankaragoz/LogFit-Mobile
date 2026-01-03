// src/components/CreateRoutine.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { Save, Plus, Trash2, Search, X, GripVertical, Star } from 'lucide-react';
import { Routine } from './RoutinesList';
import { Exercise as LibraryExercise } from '../services/exerciseApi';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const SUPABASE_PROJECT_URL = 'https://ekrhekungvoisfughwuz.supabase.co';
const BUCKET_NAME = 'images';

function SortableExercise({ id, name, onRemove }: { id: string; name: string; onRemove: (id: string) => void; }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto',
    boxShadow: isDragging ? '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' : 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-4 text-system-label text-base select-none bg-system-background-secondary`}
    >
      <div className="flex items-center gap-3">
        <button {...attributes} {...listeners} className="cursor-grab touch-none p-1 text-system-label-tertiary">
            <GripVertical />
        </button>
        <span>{name}</span>
      </div>
      <button onClick={() => onRemove(id)} className="p-2 text-system-red">
        <Trash2 size={20} />
      </button>
    </div>
  );
}

interface CreateRoutineProps {
  existingRoutine: Partial<Routine> | null;
  onSaveRoutine: (id: string | null, name: string, exercises: { id: string; name: string; bodyPart?: string }[]) => void;
  onCancel: () => void;
  allLibraryExercises: LibraryExercise[];
  favoriteExercises: string[];
}

const CreateRoutine: React.FC<CreateRoutineProps> = ({ existingRoutine, onSaveRoutine, onCancel, allLibraryExercises, favoriteExercises }) => {
  const [routineName, setRoutineName] = useState('');
  const [selectedExercises, setSelectedExercises] = useState<{ id: string; name: string; bodyPart?: string }[]>([]);
  const [manualExerciseName, setManualExerciseName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const selectedExerciseNames = useMemo(() => 
    new Set(selectedExercises.map(ex => ex.name.toLowerCase())),
    [selectedExercises]
  );

  const [favoriteLibraryExercises, otherLibraryExercises] = useMemo(() => {
    const favorites: LibraryExercise[] = [];
    const others: LibraryExercise[] = [];
    
    allLibraryExercises.forEach(ex => {
      if (!selectedExerciseNames.has(ex.name.toLowerCase())) {
        if (favoriteExercises.includes(ex.id)) {
          favorites.push(ex);
        } else {
          others.push(ex);
        }
      }
    });
    
    return [favorites, others];
  }, [allLibraryExercises, favoriteExercises, selectedExerciseNames]);

  const searchedExercises = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return allLibraryExercises.filter(ex => 
      !selectedExerciseNames.has(ex.name.toLowerCase()) &&
      ex.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
    );
  }, [searchQuery, allLibraryExercises, selectedExerciseNames]);


  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (existingRoutine) {
      setRoutineName(existingRoutine.name || '');
      const initialExercises = existingRoutine.exercises?.map(ex => {
          const libEx = allLibraryExercises.find(lib => lib.name.toLowerCase() === ex.name.toLowerCase());
          return {...ex, bodyPart: ex.bodyPart || libEx?.bodyPart }
      }) || [];
      setSelectedExercises(initialExercises);
    }
  }, [existingRoutine, allLibraryExercises]);

  const handleAddExerciseFromLibrary = (exercise: LibraryExercise) => {
    if (!selectedExercises.find(e => e.name.toLowerCase() === exercise.name.toLowerCase())) {
      setSelectedExercises(prev => [...prev, { id: exercise.id, name: exercise.name, bodyPart: exercise.bodyPart }]);
    }
  };

  const handleManualAddExercise = () => {
    const trimmedName = manualExerciseName.trim();
    if (trimmedName && !selectedExercises.find(e => e.name.toLowerCase() === trimmedName.toLowerCase())) {
      const newExercise = {
        id: `manual-${Date.now()}`,
        name: trimmedName,
        bodyPart: undefined 
      };
      setSelectedExercises(prev => [...prev, newExercise]);
      setManualExerciseName('');
    }
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setSelectedExercises(prev => prev.filter(e => e.id !== exerciseId));
  };
  
  function handleDragEnd(event: DragEndEvent) {
    const {active, over} = event;
    if (active.id !== over?.id) {
      setSelectedExercises((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const handleSave = () => {
    if (!routineName.trim()) {
      alert('Lütfen rutin için bir isim girin.');
      return;
    }
    if (selectedExercises.length === 0) {
      alert('Lütfen rutine en az bir hareket ekleyin.');
      return;
    }
    onSaveRoutine(existingRoutine?.id || null, routineName, selectedExercises);
  };

  const getImageUrl = (gifPath: string) => {
    if (!gifPath) return 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&fit=crop';
    const imagePath = gifPath.replace('0.jpg', '1.jpg');
    return `${SUPABASE_PROJECT_URL}/storage/v1/object/public/${BUCKET_NAME}/exercises/${imagePath}`;
  };

  const isSaveDisabled = !routineName.trim() || selectedExercises.length === 0;

  const ExerciseListItem = ({ exercise, isFavorite = false, onClick }: { exercise: LibraryExercise, isFavorite?: boolean, onClick: (ex: LibraryExercise) => void }) => (
    <button onClick={() => onClick(exercise)} className="w-full text-left p-4 flex items-center gap-4 hover:bg-system-background-tertiary transition-colors border-t border-system-separator">
      <img src={getImageUrl(exercise.gifUrl)} alt={exercise.name} className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-system-background-tertiary" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-system-label text-base truncate">{exercise.name}</p>
      </div>
      {isFavorite && <Star size={16} className="text-system-yellow fill-system-yellow flex-shrink-0" />}
    </button>
  );

  return (
    <div>
      {/* BAŞLIK BÖLÜMÜ - SABİT */}
      <div className="sticky top-[env(safe-area-inset-top)] z-10 bg-system-background/95 backdrop-blur-md  border-system-separator">
        <div className="flex justify-between items-center p-4">
            <button onClick={onCancel} className="text-system-blue text-lg">İptal</button>
            <h1 className="text-xl font-bold text-system-label">{existingRoutine?.id ? 'Rutini Düzenle' : 'Yeni Rutin'}</h1>
            <button onClick={handleSave} disabled={isSaveDisabled} className="text-system-blue text-lg font-bold disabled:text-system-label-tertiary transition-colors">{existingRoutine?.id ? 'Bitti' : 'Ekle'}</button>
        </div>
      </div>

      {/* İÇERİK BÖLÜMÜ - KAYDIRILABİLİR */}
      <div className="p-4 space-y-6">
        {/* Rutin Adı Kartı */}
        <div className="bg-system-background-secondary rounded-xl p-4">
          <input 
            type="text" 
            value={routineName} 
            onChange={(e) => setRoutineName(e.target.value)} 
            placeholder="Rutin Adı" 
            className="w-full bg-transparent text-system-label text-lg placeholder:text-system-label-tertiary focus:outline-none" 
          />
        </div>

        {/* Seçilen Hareketler Kartı */}
        <div className="bg-system-background-secondary rounded-xl overflow-hidden">
          <p className="text-system-label-secondary px-4 pt-4 pb-2 text-sm">HAREKETLER</p>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={selectedExercises}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-system-separator">
                {selectedExercises.length > 0 ? selectedExercises.map(ex => 
                    <SortableExercise key={ex.id} id={ex.id} name={ex.name} onRemove={handleRemoveExercise} />
                ) : (
                    <p className="text-md text-center text-system-label-secondary py-10 px-4">Bu rutine hareket ekleyin.</p>
                )}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        {/* Hareket Ekleme Kartı */}
        <div className="bg-system-background-secondary rounded-xl divide-y divide-system-separator">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-system-label mb-3">Hareket Ekle</h3>
              
              {/* Manuel Ekleme */}
              <div className="flex gap-2 mb-3">
                  <input 
                      type="text" 
                      value={manualExerciseName} 
                      onChange={(e) => setManualExerciseName(e.target.value)} 
                      placeholder="Manuel Hareket Adı" 
                      className="flex-grow px-3 py-2 bg-system-background-tertiary text-system-label rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue" 
                  />
                  <button 
                      onClick={handleManualAddExercise}
                      disabled={!manualExerciseName.trim()}
                      className="p-2 bg-system-blue rounded-lg text-white disabled:bg-system-fill transition-colors"
                  >
                      <Plus size={20} />
                  </button>
              </div>

              {/* Kütüphane Arama */}
              <div className="relative">
                  <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-system-label-tertiary" />
                  <input 
                    type="text" 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    placeholder="Kütüphaneden Ara" 
                    className="w-full pl-10 pr-4 py-2 bg-system-background-tertiary text-system-label rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue" 
                  />
              </div>
            </div>
            
            <div className="max-h-[50vh] overflow-y-auto scrollbar-thin">
              {searchQuery.trim() ? (
                searchedExercises.length > 0 ? searchedExercises.map(exercise => (
                  <ExerciseListItem key={exercise.id} exercise={exercise} onClick={handleAddExerciseFromLibrary} />
                )) : <p className="text-md text-center text-system-label-secondary py-10 px-4">Sonuç bulunamadı.</p>
              ) : (
                <>
                  {favoriteLibraryExercises.length > 0 && (
                      <div>
                          <p className="text-system-label-secondary px-4 pt-4 pb-2 text-sm font-bold">FAVORİLER</p>
                          {favoriteLibraryExercises.map(exercise => (
                              <ExerciseListItem key={exercise.id} exercise={exercise} isFavorite onClick={handleAddExerciseFromLibrary} />
                          ))}
                      </div>
                  )}
                  <div>
                      <p className="text-system-label-secondary px-4 pt-4 pb-2 text-sm font-bold">TÜM HAREKETLER</p>
                      {otherLibraryExercises.map(exercise => (
                          <ExerciseListItem key={exercise.id} exercise={exercise} onClick={handleAddExerciseFromLibrary} />
                      ))}
                  </div>
                </>
              )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoutine;