// src/components/ProgressCharts.tsx

import React, { useState, useMemo } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar,
    RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { format, parseISO, subDays, subMonths, subYears, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Workout } from '../App';
import { BarChart3 } from 'lucide-react';

type TimeRange = 'week' | 'month' | 'year' | 'all';

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        if (payload[0].payload.subject) {
            const { subject, value } = payload[0].payload;
            return (
                <div className="bg-system-background-tertiary/80 backdrop-blur-md border border-system-separator rounded-lg p-3 shadow-lg">
                    <p style={{ color: payload[0].color }} className="font-bold">{subject}: {value.toFixed(0)} kg</p>
                </div>
            )
        }

        return (
            <div className="bg-system-background-tertiary/80 backdrop-blur-md border border-system-separator rounded-lg p-3 shadow-lg">
                <p className="text-system-label-secondary font-bold mb-1">{`Tarih: ${label}`}</p>
                {payload.map((pld: any, index: number) => (
                    <p key={index} style={{ color: pld.color }} className="font-medium text-sm">
                        {`${pld.name}: ${pld.value}${pld.unit || ''}`}
                    </p>
                ))}
            </div>
        );
    }

    return null;
};

const mapToMajorGroup = (bodyPart: string): string => {
    if (!bodyPart) return 'Other';
    const lowerCaseBodyPart = bodyPart.toLowerCase();

    if (['chest'].includes(lowerCaseBodyPart)) return 'Chest';
    if (['back', 'lats', 'middle back', 'lower back'].includes(lowerCaseBodyPart)) return 'Back';
    if (['shoulders', 'traps'].includes(lowerCaseBodyPart)) return 'Shoulders';
    if (['upper arms', 'lower arms', 'biceps', 'forearms'].includes(lowerCaseBodyPart)) return 'Biceps';
    if (['triceps'].includes(lowerCaseBodyPart)) return 'Triceps';
    if (['upper legs', 'lower legs', 'quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'].includes(lowerCaseBodyPart)) return 'Legs';
    if (['waist', 'abdominals'].includes(lowerCaseBodyPart)) return 'Abs';

    return 'Other';
};


const ProgressCharts: React.FC<{ workouts: Workout[] }> = ({ workouts }) => {
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

    const chartStyles = {
        gridColor: 'rgba(84, 84, 88, 0.6)',
        tickColor: 'rgb(235 235 245 / 0.6)',
        axisLineColor: 'rgb(235 235 245 / 0.3)',
    };

    const filteredWorkouts = useMemo(() => {
        if (timeRange === 'all') return workouts;
        const now = new Date();
        let startDate: Date;
        switch (timeRange) {
            case 'week': startDate = subDays(now, 7); break;
            case 'month': startDate = subMonths(now, 1); break;
            case 'year': startDate = subYears(now, 1); break;
            default: startDate = new Date(0);
        }
        return workouts.filter(w => isAfter(parseISO(w.date), startDate));
    }, [workouts, timeRange]);

    const allExercises = useMemo(() => {
        const exerciseSet = new Set<string>();
        filteredWorkouts.forEach(w => w.exercises.forEach(ex => exerciseSet.add(ex.name)));
        return Array.from(exerciseSet).sort();
    }, [filteredWorkouts]);

    const exerciseData = useMemo(() => {
        if (!selectedExercise) return [];
        return filteredWorkouts
            .filter(w => w.exercises.some(ex => ex.name === selectedExercise))
            .map(w => {
                const exercise = w.exercises.find(ex => ex.name === selectedExercise)!;
                return {
                    date: w.date,
                    dateFormatted: format(parseISO(w.date), 'dd MMM', { locale: tr }),
                    maxWeight: Math.max(0, ...exercise.sets.map(s => s.weight)),
                    totalVolume: exercise.sets.reduce((sum, s) => sum + s.reps * s.weight, 0),
                };
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredWorkouts, selectedExercise]);

    const generalStats = useMemo(() => {
        return filteredWorkouts
            .map(w => ({
                date: w.date,
                dateFormatted: format(parseISO(w.date), 'dd MMM', { locale: tr }),
                totalVolume: w.exercises.reduce((sum, ex) => sum + ex.sets.reduce((exSum, s) => exSum + s.reps * s.weight, 0), 0),
                totalSets: w.exercises.reduce((sum, ex) => sum + ex.sets.length, 0),
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [filteredWorkouts]);

    const radarChartData = useMemo(() => {
        const distribution: { [key: string]: number } = {
            'Chest': 0, 'Back': 0, 'Shoulders': 0, 'Biceps': 0, 'Triceps': 0, 'Legs': 0, 'Abs': 0
        };

        filteredWorkouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                const volume = exercise.sets.reduce((sum, set) => sum + (set.reps * set.weight), 0);
                const majorGroup = mapToMajorGroup(exercise.bodyPart || 'Other');
                if (distribution.hasOwnProperty(majorGroup)) {
                    distribution[majorGroup] += volume;
                }
            });
        });

        const data = Object.entries(distribution).map(([subject, value]) => ({ subject, value }));
        const maxValue = Math.max(...data.map(d => d.value));

        return {
            data: data.map(d => ({ ...d, fullMark: maxValue > 0 ? maxValue * 1.2 : 100 })),
            hasData: maxValue > 0
        };
    }, [filteredWorkouts]);


    const FilterButtons = () => {
        const ranges: { key: TimeRange; label: string }[] = [
            { key: 'week', label: 'Hafta' },
            { key: 'month', label: 'Ay' },
            { key: 'year', label: 'Yıl' },
            { key: 'all', label: 'Tümü' },
        ];
        return (
            <div className="bg-system-background-tertiary p-1 rounded-xl flex items-center justify-center space-x-1">
                {ranges.map(range => (
                    <button
                        key={range.key}
                        onClick={() => setTimeRange(range.key)}
                        className={`w-full px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-200 ${timeRange === range.key ? 'bg-system-fill-secondary shadow-md text-system-label' : 'text-system-label-secondary'}`}>
                        {range.label}
                    </button>
                ))}
            </div>
        );
    };

    if (workouts.length === 0) {
        return (
            <div className="p-4 text-center py-16">
                <BarChart3 size={40} className="mx-auto text-system-label-tertiary mb-4" />
                <h3 className="text-lg font-semibold text-system-label mb-1">Henüz Veri Yok</h3>
                <p className="text-system-label-secondary text-sm">
                    Grafikleri görmek için önce antrenman kayıtları eklemelisiniz.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* Sticky Header - GÜNCELLENDİ: bg-system-background/80 ve backdrop-blur-md */}
            <div className="sticky top-[env(safe-area-inset-top)] z-10 bg-system-background/80 backdrop-blur-md pt-4 pb-4 px-4 transition-colors duration-200">
                <h1 className="text-3xl font-bold text-system-label">İlerleme</h1>
                <div className="mt-4">
                    <FilterButtons />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-4 space-y-6">
                {filteredWorkouts.length === 0 ? (
                    <div className="text-center py-16 px-4 bg-system-background-secondary rounded-xl">
                        <h3 className="text-xl font-medium text-system-label-secondary mb-2">Bu Aralıkta Veri Yok</h3>
                        <p className="text-system-label-tertiary text-md">Lütfen farklı bir zaman aralığı seçin.</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-system-background-secondary rounded-2xl p-4 space-y-6">
                            <h2 className="font-bold text-xl text-system-label">Genel İlerleme</h2>

                            {radarChartData.hasData && (
                                <div>
                                    <h3 className="text-md font-semibold text-system-label-secondary mb-3">Kas Grubu Dağılımı (Hacme Göre)</h3>
                                    <div className="h-80 w-full"><ResponsiveContainer>
                                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarChartData.data}>
                                            <PolarGrid stroke={chartStyles.gridColor} />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: chartStyles.tickColor, fontSize: 12 }} />
                                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                                            <Radar name="Hacim" dataKey="value" stroke="#0A84FF" fill="#0A84FF" fillOpacity={0.6} />
                                            <Tooltip content={<CustomTooltip />} />
                                        </RadarChart>
                                    </ResponsiveContainer></div>
                                </div>
                            )}

                            <div><h3 className="text-md font-semibold text-system-label-secondary mb-3">Toplam Hacim (kg)</h3><div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={generalStats}><CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} /><XAxis dataKey="dateFormatted" tick={{ fontSize: 12, fill: chartStyles.tickColor }} /><YAxis tick={{ fontSize: 12, fill: chartStyles.tickColor }} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="totalVolume" name="Toplam Hacim" unit=" kg" stroke="#0A84FF" strokeWidth={2.5} dot={{ fill: '#0A84FF', r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div></div>

                            <div><h3 className="text-md font-semibold text-system-label-secondary mb-3">Toplam Set Sayısı</h3><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={generalStats}><CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} /><XAxis dataKey="dateFormatted" tick={{ fontSize: 12, fill: chartStyles.tickColor }} /><YAxis tick={{ fontSize: 12, fill: chartStyles.tickColor }} allowDecimals={false} /><Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255, 159, 10, 0.1)' }} /><Bar dataKey="totalSets" name="Toplam Set" unit=" set" radius={[8, 8, 0, 0]} barSize={20} fill="#FF9F0A" /></BarChart></ResponsiveContainer></div></div>
                        </div>

                        <div className="bg-system-background-secondary rounded-2xl p-4 space-y-4">
                            <h2 className="font-bold text-xl text-system-label">Hareket Bazlı İlerleme</h2>
                            <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} className="w-full p-3 border-none bg-system-background-tertiary text-system-label rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue text-base">
                                <option value="">Hareket seçin</option>
                                {allExercises.map(exercise => (<option key={exercise} value={exercise}>{exercise}</option>))}
                            </select>

                            {selectedExercise && exerciseData.length > 0 ? (
                                <div className="space-y-6">
                                    <div><h3 className="text-md font-semibold text-system-label-secondary mb-3">Maksimum Ağırlık - {selectedExercise}</h3><div className="h-56"><ResponsiveContainer width="100%" height="100%"><LineChart data={exerciseData}><CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} /><XAxis dataKey="dateFormatted" tick={{ fontSize: 12, fill: chartStyles.tickColor }} /><YAxis type="number" domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 12, fill: chartStyles.tickColor }} /><Tooltip content={<CustomTooltip />} /><Line type="monotone" dataKey="maxWeight" name="Maks Ağırlık" unit=" kg" stroke="#30D158" strokeWidth={2.5} dot={{ fill: '#30D158', r: 4 }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div></div>
                                    <div><h3 className="text-md font-semibold text-system-label-secondary mb-3">Toplam Hacim - {selectedExercise}</h3><div className="h-56"><ResponsiveContainer width="100%" height="100%"><BarChart data={exerciseData}><CartesianGrid strokeDasharray="3 3" stroke={chartStyles.gridColor} /><XAxis dataKey="dateFormatted" tick={{ fontSize: 12, fill: chartStyles.tickColor }} /><YAxis tick={{ fontSize: 12, fill: chartStyles.tickColor }} /><Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(175, 82, 222, 0.1)' }} /><Bar dataKey="totalVolume" name="Toplam Hacim" unit=" kg" radius={[8, 8, 0, 0]} barSize={20} fill="#AF52DE" /></BarChart></ResponsiveContainer></div></div>
                                </div>
                            ) : selectedExercise && exerciseData.length === 0 ? (<div className="text-center py-8 text-system-label-secondary text-md">Bu hareket için seçili aralıkta veri bulunmuyor.</div>) : (<div className="text-center py-8 text-system-label-secondary text-md">İlerlemenizi görmek için bir hareket seçin.</div>)}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ProgressCharts;