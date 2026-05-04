import { router } from 'expo-router';
import { useEffect } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { getUserPlaces } from '../../src/api/placeService';
import { usePlaceStore } from '../../src/store/usePlaceStore';

const USER_ID = '1c34b887-83a4-4983-9954-12bca2aa2ce1';

export default function PlacesScreen() {
    const { places, setPlaces, setSelectedPlace } = usePlaceStore();

    useEffect(() => {
        getUserPlaces(USER_ID).then(setPlaces);
    }, []);

    return (
        <View style={{ flex: 1, padding: 16 }}>
            <FlatList
                data={places}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <Pressable
                        onPress={() => {
                            setSelectedPlace(item);
                            router.back();
                        }}
                        style={{
                            padding: 16,
                            borderWidth: 1,
                            borderRadius: 10,
                            marginBottom: 10,
                        }}
                    >
                        <Text style={{ fontWeight: 'bold' }}>{item.placeName}</Text>
                        <Text>{item.address}</Text>
                    </Pressable>
                )}
            />

            <Pressable
                onPress={() => router.push('/places/create')}
                style={{ marginTop: 20, padding: 16, backgroundColor: 'black' }}
            >
                <Text style={{ color: 'white' }}>Yeni Yer Ekle</Text>
            </Pressable>
        </View>
    );
}
