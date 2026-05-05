
const ENV = {
    dev: {
        apiUrl: 'http://10.0.2.2:8080/api/v1', // Android emulator
        // apiUrl: 'http://localhost:8080/api/v1', // iOS simulator
    },
    staging: {
        apiUrl: 'https://staging-api.routeplanner.com/api/v1',
    },
    prod: {
        apiUrl: 'https://api.routeplanner.com/api/v1',
    },
};

const getEnvVars = () => {
    // __DEV__ is expo default
    if (__DEV__) return ENV.dev;

    // You can also check Constants.expoConfig?.extra?.environment
    return ENV.prod;
};

export default getEnvVars();