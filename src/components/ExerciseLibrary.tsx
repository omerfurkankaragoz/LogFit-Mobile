// src/components/ExerciseLibrary.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, Star, X, Filter } from 'lucide-react';
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
  const topRef = useRef<HTMLDivElement>(null);

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

  const handleFilterToggle = () => {
    if (!showFilters) {
      topRef.current?.scrollIntoView({ behavior: 'auto' });
    }
    setShowFilters(prev => !prev);
  };

  return (
    <div ref={topRef}>
      {/* Sticky Header - GÜNCELLENDİ: bg-system-background/80 ve backdrop-blur-md */}
      <div className="sticky top-[env(safe-area-inset-top)] z-10 bg-system-background/80 backdrop-blur-md pt-4 pb-4 px-4 transition-colors duration-200">
        <h1 className="text-3xl font-bold text-system-label">Kütüphane</h1>
        <div className="flex gap-2 items-center mt-4">
          <div className="relative flex-grow">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-system-label-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hareket adı ara..."
              className="w-full pl-10 pr-10 py-2 bg-system-background-secondary text-system-label rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-5 h-5 bg-system-label-tertiary rounded-full text-system-background active:scale-90 transition-transform"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={handleFilterToggle} className="p-2 bg-system-fill rounded-lg text-system-label">
            <Filter size={20} />
          </button>
        </div>
      </div>
      {/* Scrollable Content */}
      <div className="p-4 space-y-4">
        {showFilters && (
          <div className="bg-system-background-secondary rounded-xl p-4">
            <h2 className="font-semibold text-system-label mb-3">Vücut Bölgesi</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button onClick={() => handleSelectFilter('all')} className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${selectedBodyPart === 'all' ? 'bg-system-blue text-white' : 'bg-system-fill text-system-label'}`}>Tümü</button>
              <button onClick={() => handleSelectFilter('favorites')} className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${selectedBodyPart === 'favorites' ? 'bg-system-blue text-white' : 'bg-system-fill text-system-label'}`}><Star size={16} />Favoriler</button>
              {bodyParts.map(part => (
                <button key={part} onClick={() => handleSelectFilter(part)} className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors ${selectedBodyPart === part ? 'bg-system-blue text-white' : 'bg-system-fill text-system-label'}`}>{formatBodyPartName(part)}</button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-system-background-secondary rounded-xl divide-y divide-system-separator">
          {filteredExercises.map(exercise => {
            const isFavorited = favoriteExercises.includes(exercise.id);
            return (
              <div key={exercise.id} className="p-4 flex items-center gap-4">
                <img
                  src={getImageUrl(exercise.gifUrl)}
                  alt={exercise.name}
                  className="w-16 h-16 rounded-lg object-cover bg-system-background-tertiary flex-shrink-0"
                />
                <div onClick={() => setSelectedExercise(exercise)} className="flex-1 min-w-0 cursor-pointer">
                  <p className="font-semibold text-system-label truncate">{exercise.name}</p>
                  <p className="text-sm text-system-label-secondary truncate">{formatBodyPartName(exercise.bodyPart)}</p>
                </div>
                <button
                  onClick={() => onToggleFavorite(exercise.id)}
                  className="p-3 text-system-label-secondary"
                >
                  <Star className={`transition-all ${isFavorited ? 'fill-system-yellow text-system-yellow' : ''}`} />
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {selectedExercise && (
        <ExerciseDetailsModal
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onAdd={handleAddExercise}
          getImageUrl={getImageUrl}
        />
      )}
    </div>
  );
};

export default ExerciseLibrary;