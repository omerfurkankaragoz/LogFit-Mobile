import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { format, parseISO, subDays, subMonths, subYears, isAfter } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Workout } from '../App';
import { BarChart3 } from 'lucide-react-native';
import { Svg, Line, Circle, Text as SvgText, Rect, G } from 'react-native-svg';

type TimeRange = 'week' | 'month' | 'year' | 'all';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CHART_WIDTH = SCREEN_WIDTH - 64; // padding
const CHART_HEIGHT = 200;

const SimpleLineChart = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => {
    if (data.length === 0) return null;

    const values = data.map(d => d[dataKey]);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values);

    // Normalize points
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1 || 1)) * CHART_WIDTH;
        const y = CHART_HEIGHT - ((d[dataKey] / maxVal) * CHART_HEIGHT); // 0 at bottom
        return { x, y, value: d[dataKey], label: d.dateFormatted };
    });

    return (
        <View>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20}>
                {/* Axes */}
                <Line x1="0" y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="gray" strokeOpacity={0.3} />

                {/* Line */}
                {points.map((p, i) => {
                    if (i === 0) return null;
                    const prev = points[i - 1];
                    return (
                        <Line
                            key={i}
                            x1={prev.x}
                            y1={prev.y}
                            x2={p.x}
                            y2={p.y}
                            stroke={color}
                            strokeWidth="2"
                        />
                    );
                })}

                {/* Dots */}
                {points.map((p, i) => (
                    <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r="3" fill={color} />
                ))}

                {/* X Axis Labels (Simplified) */}
                {points.filter((_, i) => i % Math.ceil(points.length / 5) === 0).map((p, i) => (
                    <SvgText
                        key={`label-${i}`}
                        x={p.x}
                        y={CHART_HEIGHT + 15}
                        fontSize="10"
                        fill="gray"
                        textAnchor="middle"
                    >
                        {p.label}
                    </SvgText>
                ))}
            </Svg>
        </View>
    );
};

const SimpleBarChart = ({ data, dataKey, color }: { data: any[], dataKey: string, color: string }) => {
    if (data.length === 0) return null;

    const values = data.map(d => d[dataKey]);
    const maxVal = Math.max(...values, 1);
    const barWidth = (CHART_WIDTH / data.length) * 0.6; // 60% of slot width

    return (
        <View>
            <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 20}>
                <Line x1="0" y1={CHART_HEIGHT} x2={CHART_WIDTH} y2={CHART_HEIGHT} stroke="gray" strokeOpacity={0.3} />
                {data.map((d, i) => {
                    const barHeight = (d[dataKey] / maxVal) * CHART_HEIGHT;
                    const x = (i * (CHART_WIDTH / data.length)) + ((CHART_WIDTH / data.length - barWidth) / 2);
                    const y = CHART_HEIGHT - barHeight;

                    return (
                        <Rect
                            key={i}
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barHeight}
                            fill={color}
                            rx={4}
                            ry={4} // Rounded top
                        />
                    );
                })}
                {/* X Axis Labels (Simplified) */}
                {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0).map((d, i) => {
                    const x = (data.indexOf(d) * (CHART_WIDTH / data.length)) + ((CHART_WIDTH / data.length) / 2);
                    return (
                        <SvgText
                            key={`label-${i}`}
                            x={x}
                            y={CHART_HEIGHT + 15}
                            fontSize="10"
                            fill="gray"
                            textAnchor="middle"
                        >
                            {d.dateFormatted}
                        </SvgText>
                    );
                })}
            </Svg>
        </View>
    );
};

const ProgressCharts: React.FC<{ workouts: Workout[] }> = ({ workouts }) => {
    const [selectedExercise, setSelectedExercise] = useState<string>('');
    const [timeRange, setTimeRange] = useState<TimeRange>('month');

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

    const FilterButtons = () => {
        const ranges: { key: TimeRange; label: string }[] = [
            { key: 'week', label: 'Hafta' },
            { key: 'month', label: 'Ay' },
            { key: 'year', label: 'Yıl' },
            { key: 'all', label: 'Tümü' },
        ];
        return (
            <View className="flex-row bg-system-background-tertiary p-1 rounded-xl">
                {ranges.map(range => (
                    <TouchableOpacity
                        key={range.key}
                        onPress={() => setTimeRange(range.key)}
                        className={`flex-1 py-1.5 rounded-lg items-center ${timeRange === range.key ? 'bg-system-fill-secondary' : ''}`}
                    >
                        <Text className={`text-sm font-semibold ${timeRange === range.key ? 'text-system-label' : 'text-system-label-secondary'}`}>
                            {range.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    };

    if (workouts.length === 0) {
        return (
            <View className="p-4 items-center justify-center py-16">
                <BarChart3 size={40} color="rgba(235, 235, 245, 0.3)" className="mb-4" />
                <Text className="text-lg font-semibold text-system-label mb-1">Henüz Veri Yok</Text>
                <Text className="text-system-label-secondary text-sm text-center">
                    Grafikleri görmek için önce antrenman kayıtları eklemelisiniz.
                </Text>
            </View>
        );
    }

    // Modal picker for exercise selection (simplified as scrollview for now)
    const [pickerVisible, setPickerVisible] = useState(false);

    return (
        <ScrollView className="flex-1 bg-system-background">
            <View className="pt-4 pb-4 px-4 bg-system-background/80 border-b border-system-separator/30">
                <Text className="text-3xl font-bold text-system-label mb-4">İlerleme</Text>
                <FilterButtons />
            </View>

            <View className="p-4 space-y-6 pb-24">
                {filteredWorkouts.length === 0 ? (
                    <View className="p-16 bg-system-background-secondary rounded-xl items-center">
                        <Text className="text-xl font-medium text-system-label-secondary mb-2">Bu Aralıkta Veri Yok</Text>
                        <Text className="text-system-label-tertiary">Lütfen farklı bir zaman aralığı seçin.</Text>
                    </View>
                ) : (
                    <>
                        {/* General Stats */}
                        <View className="bg-system-background-secondary rounded-2xl p-4 space-y-6">
                            <Text className="font-bold text-xl text-system-label">Genel İlerleme</Text>

                            <View>
                                <Text className="text-md font-semibold text-system-label-secondary mb-3">Toplam Hacim (kg)</Text>
                                <SimpleLineChart data={generalStats} dataKey="totalVolume" color="#0A84FF" />
                            </View>

                            <View>
                                <Text className="text-md font-semibold text-system-label-secondary mb-3">Toplam Set Sayısı</Text>
                                <SimpleBarChart data={generalStats} dataKey="totalSets" color="#FF9F0A" />
                            </View>
                        </View>

                        {/* Exercise Selection */}
                        <View className="bg-system-background-secondary rounded-2xl p-4 space-y-4">
                            <Text className="font-bold text-xl text-system-label">Hareket Bazlı İlerleme</Text>

                            {/* Simple Dropdown Simulator */}
                            <TouchableOpacity onPress={() => setPickerVisible(!pickerVisible)} className="p-3 bg-system-background-tertiary rounded-lg border border-system-separator/20">
                                <Text className="text-system-label text-base">{selectedExercise || "Hareket Seçin"}</Text>
                            </TouchableOpacity>

                            {pickerVisible && (
                                <View className="bg-system-background-tertiary rounded-lg p-2 max-h-40">
                                    <ScrollView nestedScrollEnabled>
                                        {allExercises.map(ex => (
                                            <TouchableOpacity key={ex} onPress={() => { setSelectedExercise(ex); setPickerVisible(false); }} className="p-2 border-b border-system-separator/10">
                                                <Text className="text-system-label">{ex}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {selectedExercise && exerciseData.length > 0 ? (
                                <View className="space-y-6">
                                    <View>
                                        <Text className="text-md font-semibold text-system-label-secondary mb-3">Maksimum Ağırlık - {selectedExercise}</Text>
                                        <SimpleLineChart data={exerciseData} dataKey="maxWeight" color="#30D158" />
                                    </View>
                                    <View>
                                        <Text className="text-md font-semibold text-system-label-secondary mb-3">Toplam Hacim - {selectedExercise}</Text>
                                        <SimpleBarChart data={exerciseData} dataKey="totalVolume" color="#AF52DE" />
                                    </View>
                                </View>
                            ) : selectedExercise ? (
                                <Text className="text-center py-8 text-system-label-secondary">Bu hareket için seçili aralıkta veri bulunmuyor.</Text>
                            ) : (
                                <Text className="text-center py-8 text-system-label-secondary">İlerlemenizi görmek için bir hareket seçin.</Text>
                            )}
                        </View>
                    </>
                )}
            </View>
        </ScrollView>
    );
};

export default ProgressCharts;