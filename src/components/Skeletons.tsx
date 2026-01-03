import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

// Temel Skeleton Yapı Taşı
export const Skeleton = ({ className, style }: { className?: string, style?: any }) => {
    const opacity = useSharedValue(0.5);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.5, { duration: 1000 }),
                withTiming(1, { duration: 1000 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            className={`bg-system-fill rounded-lg ${className}`}
            style={[animatedStyle, style]}
        />
    );
};

// Alt Navigasyon için Skeleton (Sabit)
export const BottomNavSkeleton = () => (
    <View className="absolute bottom-0 left-0 right-0 bg-system-background-secondary/90 border-t border-system-separator pt-2 pb-6 flex-row justify-around">
        {[...Array(5)].map((_, i) => (
            <View key={i} className="items-center justify-center gap-1 w-1/5 py-1">
                <Skeleton className="w-6 h-6 rounded-md" />
                <Skeleton className="w-8 h-2 rounded-md" />
            </View>
        ))}
    </View>
);

// Takvim Sayfası Skeleton'ı
export const CalendarSkeleton = () => {
    return (
        <View className="p-4 space-y-6">
            {/* Header */}
            <View className="flex-row items-center justify-between py-2">
                <Skeleton className="h-8 w-48" />
                <View className="flex-row gap-1">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </View>
            </View>

            {/* Calendar Grid */}
            <View className="bg-system-background-secondary rounded-2xl p-4">
                <View className="flex-row justify-between mb-3 gap-2">
                    {[...Array(7)].map((_, i) => (
                        <Skeleton key={`head-${i}`} className="h-4 w-8" />
                    ))}
                </View>
                <View className="flex-row flex-wrap gap-2">
                    {[...Array(35)].map((_, i) => (
                        <Skeleton key={`day-${i}`} className="w-10 h-10 rounded-xl" />
                    ))}
                </View>
            </View>

            {/* Start Button */}
            <Skeleton className="w-full h-14 rounded-2xl" />

            {/* Stats */}
            <View className="bg-system-background-secondary rounded-2xl p-6">
                <Skeleton className="h-6 w-32 mb-4" />
                <View className="flex-row gap-4">
                    <Skeleton className="h-20 flex-1 rounded-xl" />
                    <Skeleton className="h-20 flex-1 rounded-xl" />
                </View>
            </View>
        </View>
    );
};

// Liste Görünümü Skeleton'ı (Rutinler ve Kütüphane için)
export const ListSkeleton = () => {
    return (
        <View>
            {/* Header */}
            <View className="pt-4 pb-4 px-4 border-b border-system-separator/20">
                <View className="flex-row justify-between items-center mb-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </View>
                {/* Search Bar Placeholder */}
                <Skeleton className="h-10 w-full rounded-xl" />
            </View>

            {/* List Items */}
            <View className="p-4 space-y-4">
                {[...Array(6)].map((_, i) => (
                    <View key={i} className="bg-system-background-secondary p-4 rounded-2xl flex-row items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg" />
                        <View className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </View>
                    </View>
                ))}
            </View>
        </View>
    );
};

// Profil Sayfası Skeleton'ı
export const ProfileSkeleton = () => {
    return (
        <View className="p-4 space-y-6">
            {/* Header */}
            <View className="flex-row justify-between items-center py-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </View>

            {/* Avatar & Name */}
            <View className="items-center space-y-4 my-6">
                <Skeleton className="w-24 h-24 rounded-full" />
            </View>

            {/* Info Rows */}
            <View className="bg-system-background-secondary rounded-xl p-4 space-y-6">
                <View className="flex-row justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32" />
                </View>
                <View className="flex-row justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                </View>
            </View>

            {/* Body Stats */}
            <View className="bg-system-background-secondary rounded-xl p-4 space-y-4">
                <View className="flex-row justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16" />
                </View>
                <View className="flex-row gap-4">
                    <View className="flex-1 space-y-2">
                        <Skeleton className="h-8 w-16 mx-auto" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                    </View>
                    <View className="flex-1 space-y-2">
                        <Skeleton className="h-8 w-16 mx-auto" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                    </View>
                </View>
                {/* BMI Bar */}
                <Skeleton className="h-3 w-full rounded-full mt-4" />
                {/* Chart Area */}
                <Skeleton className="h-48 w-full rounded-lg mt-4" />
            </View>
        </View>
    );
};