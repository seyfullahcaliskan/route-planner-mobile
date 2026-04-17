export const getStatusColor = (status: string) => {
    switch (status) {
        case 'DELIVERED':
            return '#16a34a'; // yeşil
        case 'FAILED':
            return '#dc2626'; // kırmızı
        case 'SKIPPED':
            return '#f59e0b'; // sarı
        case 'PENDING':
            return '#6b7280'; // gri
        case 'NAVIGATING':
            return '#2563eb'; // mavi
        default:
            return '#111';
    }
};