import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIngotStore } from '../context/ingotStore';
import IngotItem from '../components/IngotItem';
import NewIngotSheet from '../components/NewIngotSheet';

export default function IngotList() {
    const ingots = useIngotStore(state => state.ingots);
    const addIngot = useIngotStore(state => state.addIngot);
    const toggleIngot = useIngotStore(state => state.toggleIngot);
    const deleteIngot = useIngotStore(state => state.deleteIngot);
    const insets = useSafeAreaInsets();

    const [isSheetVisible, setIsSheetVisible] = useState(false);

    const handleCreate = (title) => {
        addIngot(title);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Ingot List</Text>
            </View>

            <FlatList
                data={ingots}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <IngotItem 
                        item={item} 
                        onToggle={toggleIngot} 
                        onDelete={deleteIngot} 
                    />
                )}
                contentContainerStyle={[styles.listContent, { paddingBottom: 80 + insets.bottom }]}
                ListEmptyComponent={
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>No tasks yet. Temper your steel!</Text>
                    </View>
                }
            />

            <Pressable 
                style={[styles.addButton, { bottom: 16 + insets.bottom }]}
                onPress={() => setIsSheetVisible(true)}
            >
                <Text style={styles.addButtonText}>+</Text>
            </Pressable>

            <NewIngotSheet
                visible={isSheetVisible}
                onClose={() => setIsSheetVisible(false)}
                onCreate={handleCreate}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D0D0D',
    },
    header: {
        padding: 24,
        paddingTop: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontFamily: 'Inter_700Bold', 
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 100, // Space for floating button
    },
    empty: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#666',
        fontSize: 16,
        fontFamily: 'Inter_400Regular',
    },
    addButton: {
        position: 'absolute',
        bottom: 32,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: '#FF6B35',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
    },
    addButtonText: {
        fontSize: 28,
        fontFamily: 'Inter_600SemiBold',
        color: '#FFFFFF',
    },
});

