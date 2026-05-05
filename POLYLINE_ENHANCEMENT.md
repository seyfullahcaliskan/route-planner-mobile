// app/routes/[routePlanId].tsx - İyileştirilmiş Polyline

// Mevcut import'lar aynı...
import MapView, { Marker, Polyline } from 'react-native-maps';

// Component içinde polylineCoordinates'den sonra ekle:

const polylineSegments = useMemo(() => {
    if (coordinateStops.length < 2) return [];
    
    const segments: Array<{
        coordinates: Array<{ latitude: number; longitude: number }>;
        color: string;
        completed: boolean;
    }> = [];

    for (let i = 0; i < coordinateStops.length - 1; i++) {
        const current = coordinateStops[i];
        const next = coordinateStops[i + 1];

        const isCompleted = current.stopStatus === 'DELIVERED';
        
        segments.push({
            coordinates: [
                { latitude: Number(current.latitude), longitude: Number(current.longitude) },
                { latitude: Number(next.latitude), longitude: Number(next.longitude) },
            ],
            color: isCompleted ? colors.success : colors.primary,
            completed: isCompleted,
        });
    }

    return segments;
}, [coordinateStops, colors]);

// MapView içinde değiştir:
{/* Eski Polyline yerine: */}
{polylineSegments.map((segment, index) => (
    <Polyline
        key={`segment-${index}`}
        coordinates={segment.coordinates}
        strokeColor={segment.color}
        strokeWidth={segment.completed ? 3 : 4}
        lineDashPattern={segment.completed ? [10, 5] : undefined}
    />
))}