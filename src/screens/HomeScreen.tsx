import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../api/client';


export default function HomeScreen() {
    const [message, setMessage] = useState('Yükleniyor...');

    useEffect(() => {
        api.get('/health')
            .then((res) => setMessage(res.data.message || 'Bağlandı'))
            .catch(() => setMessage('Backend bağlantısı başarısız'));
    }, []);

    return (
        <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
            <Text>{message}</Text>
        </SafeAreaView>
    );
}