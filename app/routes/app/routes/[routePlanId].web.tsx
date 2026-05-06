// app/routes/[routePlanId].web.tsx
// react-native-maps web'i desteklemiyor; bu uygulama mobile-only.
import { StyleSheet, Text, View } from 'react-native';

export default function RouteDetailWeb() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Rota detayı yalnızca mobil uygulamada kullanılabilir.</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
    text: { fontSize: 16, color: '#666', textAlign: 'center' },
});