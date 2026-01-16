import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hammer, Scroll } from 'lucide-react-native'; 
import Anvil from './anvil';
import IngotList from './ingotlist';

export default function Home() {
    const [activeTab, setActiveTab] = useState('anvil');
    const insets = useSafeAreaInsets();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                {activeTab === 'anvil' ? <Anvil /> : <IngotList />}
            </View>

            {/* Bottom Navigation Bar */}
            <View style={[
                styles.bottomBar, 
                { paddingBottom: insets.bottom }
            ]}>
                <Pressable 
                    style={styles.tab} 
                    onPress={() => setActiveTab('anvil')}
                >
                    <Hammer 
                        size={24} 
                        color={activeTab === 'anvil' ? '#FFB800' : '#8A8A8A'} 
                    />
                    <Text style={[
                        styles.tabText, 
                        activeTab === 'anvil' && styles.activeTabText
                    ]}>
                        Anvil
                    </Text>
                </Pressable>

                <Pressable 
                    style={styles.tab} 
                    onPress={() => setActiveTab('ingotlist')}
                >
                    <Scroll 
                        size={24} 
                        color={activeTab === 'ingotlist' ? '#FFB800' : '#8A8A8A'} 
                    />
                    <Text style={[
                        styles.tabText, 
                        activeTab === 'ingotlist' && styles.activeTabText
                    ]}>
                        Ingot List
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    content: {
        flex: 1,
    },
    bottomBar: {
        flexDirection: 'row',
        paddingTop: 12,
        backgroundColor: '#1A1A1A',
        borderTopWidth: 1,
        borderTopColor: '#333',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -4,
        },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 10,
    },
    tab: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4,
    },
    tabText: {
        fontSize: 12,
        color: '#8A8A8A',
        fontFamily: 'Inter_500Medium',
    },
    activeTabText: {
        color: '#FFB800',
        fontFamily: 'Inter_700Bold',
    }
});
