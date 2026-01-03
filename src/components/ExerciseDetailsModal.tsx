// src/components/ExerciseDetailsModal.tsx
import React from 'react';
import { Plus } from 'lucide-react';
import { Exercise } from '../services/exerciseApi';

interface ExerciseDetailsModalProps {
  exercise: Exercise;
  onClose: () => void;
  onAdd: (exercise: Exercise) => void;
  getImageUrl: (gifPath: string) => string;
}

const formatBodyPartName = (bodyPart: string) => {
  if (!bodyPart) return 'Other';
  return bodyPart.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ExerciseDetailsModal: React.FC<ExerciseDetailsModalProps> = ({ exercise, onClose, onAdd, getImageUrl }) => {

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Container: Rutin Seç ile aynı stil yapısı */}
      <div className="relative w-full max-w-md bg-system-background-secondary rounded-t-3xl p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-300 flex flex-col max-h-[80vh]">

        {/* Tutamaç ve Başlık (X butonu yok, Rutin Seç gibi) */}
        <div className="flex-shrink-0">
          <div className="w-12 h-1.5 bg-system-label-tertiary rounded-full mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-center text-system-label mb-6 leading-tight">{exercise.name}</h2>
        </div>

        {/* Kaydırılabilir İçerik */}
        <div className="overflow-y-auto scrollbar-thin space-y-6 flex-1 min-h-0">
          {/* Görsel */}
          <div className="w-full aspect-video rounded-2xl bg-system-background-tertiary overflow-hidden shadow-sm flex-shrink-0">
            <img
              src={getImageUrl(exercise.gifUrl)}
              alt={exercise.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Bilgi Kartları */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-system-background-tertiary p-4 rounded-2xl text-center border border-system-separator/5">
              <p className="text-xs font-bold text-system-label-secondary uppercase tracking-wider mb-1">Bölge</p>
              <p className="font-semibold text-system-label text-lg">{formatBodyPartName(exercise.bodyPart)}</p>
            </div>
            <div className="bg-system-background-tertiary p-4 rounded-2xl text-center border border-system-separator/5">
              <p className="text-xs font-bold text-system-label-secondary uppercase tracking-wider mb-1">Ekipman</p>
              <p className="font-semibold text-system-label text-lg">{exercise.equipment}</p>
            </div>
          </div>

          {/* Talimatlar */}
          {exercise.instructions && exercise.instructions.length > 0 && (
            <div className="bg-system-background-tertiary p-5 rounded-2xl border border-system-separator/5">
              <h3 className="font-bold text-system-label mb-4 text-sm uppercase tracking-wide opacity-80">Talimatlar</h3>
              <ul className="space-y-3 list-decimal list-inside text-system-label-secondary">
                {exercise.instructions.map((instruction, index) => (
                  <li key={index} className="text-[15px] leading-relaxed pl-1 marker:text-system-label-tertiary marker:font-bold">
                    {instruction}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Alt Buton */}
        <div className="flex-shrink-0 pt-6 mt-auto">
          <button
            onClick={() => onAdd(exercise)}
            className="w-full flex items-center justify-center gap-2 py-4 bg-system-blue text-white rounded-2xl font-bold text-lg active:scale-95 transition-transform shadow-lg shadow-system-blue/20"
          >
            <Plus size={24} />
            Antrenmana Ekle
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseDetailsModal;