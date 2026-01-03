import React from 'react';

// Temel Skeleton Yapı Taşı
export const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-system-fill rounded-lg ${className}`} />
);

// Alt Navigasyon için Skeleton (Sabit)
export const BottomNavSkeleton = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-system-background-secondary/90 backdrop-blur-xl border-t border-system-separator z-50">
        <div className="max-w-md mx-auto flex justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            {[...Array(5)].map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1 w-1/5 py-1">
                    <Skeleton className="w-6 h-6 rounded-md" />
                    <Skeleton className="w-8 h-2 rounded-md" />
                </div>
            ))}
        </div>
    </nav>
);

// Takvim Sayfası Skeleton'ı
export const CalendarSkeleton = () => {
    return (
        <div className="p-4 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between py-2">
                <Skeleton className="h-8 w-48" />
                <div className="flex gap-1">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="bg-system-background-secondary rounded-2xl p-4 border border-system-separator/10">
                <div className="grid grid-cols-7 mb-3 gap-2">
                    {[...Array(7)].map((_, i) => (
                        <Skeleton key={`head-${i}`} className="h-4 w-full" />
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                    {[...Array(35)].map((_, i) => (
                        <Skeleton key={`day-${i}`} className="aspect-square rounded-xl" />
                    ))}
                </div>
            </div>

            {/* Start Button */}
            <Skeleton className="w-full h-14 rounded-2xl" />

            {/* Stats */}
            <div className="bg-system-background-secondary rounded-2xl p-6 border border-system-separator/10">
                <Skeleton className="h-6 w-32 mb-4" />
                <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-20 rounded-xl" />
                    <Skeleton className="h-20 rounded-xl" />
                </div>
            </div>
        </div>
    );
};

// Liste Görünümü Skeleton'ı (Rutinler ve Kütüphane için)
export const ListSkeleton = () => {
    return (
        <div className="animate-in fade-in duration-500">
            {/* Header */}
            <div className="sticky top-0 bg-system-background/95 pt-4 pb-4 px-4 border-b border-system-separator/20 z-10">
                <div className="flex justify-between items-center mb-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                </div>
                {/* Search Bar Placeholder */}
                <Skeleton className="h-10 w-full rounded-xl" />
            </div>

            {/* List Items */}
            <div className="p-4 space-y-4">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-system-background-secondary p-4 rounded-2xl flex items-center gap-4">
                        <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Profil Sayfası Skeleton'ı
export const ProfileSkeleton = () => {
    return (
        <div className="p-4 space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex justify-between items-center py-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>

            {/* Avatar & Name */}
            <div className="flex flex-col items-center space-y-4 my-6">
                <Skeleton className="w-24 h-24 rounded-full" />
            </div>

            {/* Info Rows */}
            <div className="bg-system-background-secondary rounded-xl p-4 space-y-6">
                <div className="flex justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex justify-between">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-12" />
                </div>
            </div>

            {/* Body Stats */}
            <div className="bg-system-background-secondary rounded-xl p-4 space-y-4">
                <div className="flex justify-between">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-6 w-16" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-16 mx-auto" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-16 mx-auto" />
                        <Skeleton className="h-4 w-20 mx-auto" />
                    </div>
                </div>
                {/* BMI Bar */}
                <Skeleton className="h-3 w-full rounded-full mt-4" />
                {/* Chart Area */}
                <Skeleton className="h-48 w-full rounded-lg mt-4" />
            </div>
        </div>
    );
};