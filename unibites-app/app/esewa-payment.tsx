import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';

const EsewaPaymentScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams();

    // The params from checkout are passed as strings.
    const esewaUrl = params.url as string;
    const formParamsRaw = params.form_params as string;
    const orderId = params.order_id as string;

    if (!esewaUrl || !formParamsRaw) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#60C271" />
            </View>
        );
    }

    const formParams = JSON.parse(formParamsRaw);

    // Generate HTML with a hidden form that auto-submits
    const htmlContent = `
        <html>
            <head>
                <style>
                    body { display: flex; justify-content: center; align-items: center; height: 100vh; font-family: sans-serif; background-color: #f7f9fc;}
                    .loader { border: 4px solid #f3f3f3; border-top: 4px solid #60C271; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    p { margin-top: 20px; color: #555; }
                </style>
            </head>
            <body>
                <div>
                    <div class="loader"></div>
                    <p>Redirecting to eSewa...</p>
                </div>
                <form id="esewa-form" action="${esewaUrl}" method="POST">
                    ${Object.keys(formParams).map(key =>
        `<input type="hidden" name="${key}" value="${formParams[key]}">`
    ).join('\n')}
                </form>
                <script>
                    document.getElementById('esewa-form').submit();
                </script>
            </body>
        </html>
    `;

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'PAYMENT_SUCCESS' || data.type === 'PAYMENT_FAILED') {
                router.replace({ pathname: '/payment-success' as any, params: { orderId: data.orderId } });
            }
        } catch (e) {
            console.error("WebView Message Error", e);
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                source={{ html: htmlContent }}
                style={styles.webview}
                onMessage={handleMessage}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                startInLoadingState={true}
                renderLoading={() => (
                    <View style={styles.loaderContainer}>
                        <ActivityIndicator size="large" color="#60C271" />
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    webview: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loaderContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    }
});

export default EsewaPaymentScreen;
