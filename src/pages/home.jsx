import React, { memo, useRef, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Hammer, Scroll, Settings as SettingsIcon } from 'lucide-react-native'; 
import PagerView from 'react-native-pager-view';
import { useTheme } from '../context/themeContext';
import Anvil from './anvil';
import IngotList from './ingotlist';
import Settings from './settings';

const MemoAnvil = memo(Anvil);
const MemoIngotList = memo(IngotList);
const MemoSettings = memo(Settings);

export default function Home() {
    const [activePage, setActivePage] = useState(0);
    const [anvilBlocksPagerSwipe, setAnvilBlocksPagerSwipe] = useState(false);
    const insets = useSafeAreaInsets();
    const { theme } = useTheme();
    const pagerRef = useRef(null);

    const goToPage = useCallback((page) => {
        if (page === activePage) return;
        pagerRef.current?.setPage(page);
    }, [activePage]);

    const handlePageSelected = useCallback((event) => {
        const nextPage = event.nativeEvent.position;
        setActivePage((prevPage) => (prevPage === nextPage ? prevPage : nextPage));
    }, []);

    const handleAnvilPagerSwipeLockChange = useCallback((isLocked) => {
        setAnvilBlocksPagerSwipe(!!isLocked);
    }, []);

    const isAnvilTab = activePage === 0;
    const isIngotTab = activePage === 1;
    const isSettingsTab = activePage === 2;
    const isPagerScrollEnabled = activePage !== 0 || !anvilBlocksPagerSwipe;

    const activeTabColor = theme.accentStrong;
    const inactiveTabColor = theme.tabInactive;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.content}>
                <PagerView
                    ref={pagerRef}
                    style={styles.pager}
                    initialPage={0}
                    offscreenPageLimit={1}
                    scrollEnabled={isPagerScrollEnabled}
                    onPageSelected={handlePageSelected}
                >
                    <View key="anvil" style={styles.page}>
                        <MemoAnvil onPagerSwipeLockChange={handleAnvilPagerSwipeLockChange} />
                    </View>
                    <View key="ingotlist" style={styles.page}>
                        <MemoIngotList />
                    </View>
                    <View key="settings" style={styles.page}>
                        <MemoSettings />
                    </View>
                </PagerView>
            </View>

            {/* Bottom Navigation Bar */}
            <View style={[
                styles.bottomBar, 
                {
                    paddingBottom: insets.bottom,
                    backgroundColor: theme.surface,
                    borderTopColor: theme.divider,
                    shadowColor: theme.shadow,
                }
            ]}>
                <Pressable 
                    style={styles.tab} 
                    onPress={() => goToPage(0)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isAnvilTab }}
                    accessibilityLabel="Anvil tab"
                    hitSlop={8}
                >
                    <Hammer 
                        size={24} 
                        color={isAnvilTab ? activeTabColor : inactiveTabColor} 
                    />
                    <Text style={[
                        styles.tabText,
                        { color: inactiveTabColor },
                        isAnvilTab && [styles.activeTabText, { color: activeTabColor }]
                    ]}>
                        Anvil
                    </Text>
                </Pressable>

                <Pressable 
                    style={styles.tab} 
                    onPress={() => goToPage(1)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isIngotTab }}
                    accessibilityLabel="Ingot list tab"
                    hitSlop={8}
                >
                    <Scroll 
                        size={24} 
                        color={isIngotTab ? activeTabColor : inactiveTabColor} 
                    />
                    <Text style={[
                        styles.tabText,
                        { color: inactiveTabColor },
                        isIngotTab && [styles.activeTabText, { color: activeTabColor }]
                    ]}>
                        Ingot List
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.tab}
                    onPress={() => goToPage(2)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSettingsTab }}
                    accessibilityLabel="Settings tab"
                    hitSlop={8}
                >
                    <SettingsIcon
                        size={24}
                        color={isSettingsTab ? activeTabColor : inactiveTabColor}
                    />
                    <Text style={[
                        styles.tabText,
                        { color: inactiveTabColor },
                        isSettingsTab && [styles.activeTabText, { color: activeTabColor }]
                    ]}>
                        Settings
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    pager: {
        flex: 1,
    },
    page: {
        flex: 1,
    },
    bottomBar: {
        flexDirection: 'row',
        paddingTop: 12,
        borderTopWidth: 1,
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
        fontFamily: 'Inter_500Medium',
    },
    activeTabText: {
        fontFamily: 'Inter_700Bold',
    }
});
