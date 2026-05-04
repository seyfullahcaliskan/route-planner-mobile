import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { createPlace } from '../../src/api/placeService';

const USER_ID = '1c34b887-83a4-4983-9954-12bca2aa2ce1';

export default function CreatePlaceScreen() {
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [lat, setLat] = useState('');
    const [lng, setLng] = useState('');

    const save = async () => {
        await createPlace({
            userId: USER_ID,
            placeName: name,
            placeType: 'CUSTOM',
            address,
            latitude: Number(lat),
            longitude: Number(lng),
        });

        router.back();
    };

    return (
        <View style={{ padding: 16 }}>
            <Text>Yer Adı</Text>
            <TextInput value={name} onChangeText={setName} style={{ borderWidth: 1 }} />

            <Text>Adres</Text>
            <TextInput value={address} onChangeText={setAddress} style={{ borderWidth: 1 }} />

            <Text>Latitude</Text>
            <TextInput value={lat} onChangeText={setLat} style={{ borderWidth: 1 }} />

            <Text>Longitude</Text>
            <TextInput value={lng} onChangeText={setLng} style={{ borderWidth: 1 }} />

            <Pressable onPress={save} style={{ marginTop: 20, backgroundColor: 'black', padding: 16 }}>
                <Text style={{ color: 'white' }}>Kaydet</Text>
            </Pressable>
        </View>
    );
}
