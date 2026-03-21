import React, { useState, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useIngotStore } from "../context/ingotStore";
import { useTheme } from "../context/themeContext";
import { useShallow } from "zustand/react/shallow";
import IngotItem from "../components/IngotItem";
import NewIngotSheet from "../components/NewIngotSheet";
import ConfirmDialog from "../components/ConfirmDialog";

export default function IngotList() {
  const { ingots, addIngot, updateIngot, toggleIngot, deleteIngot } =
    useIngotStore(
      useShallow((state) => ({
        ingots: state.ingots,
        addIngot: state.addIngot,
        updateIngot: state.updateIngot,
        toggleIngot: state.toggleIngot,
        deleteIngot: state.deleteIngot,
      }))
    );
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [editingIngot, setEditingIngot] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSubmit = useCallback(
    (title) => {
      if (editingIngot?.id) {
        updateIngot(editingIngot.id, title);
      } else {
        addIngot(title);
      }
    },
    [addIngot, editingIngot, updateIngot]
  );

  const openCreateSheet = useCallback(() => {
    setEditingIngot(null);
    setIsSheetVisible(true);
  }, []);

  const openEditSheet = useCallback((item) => {
    setEditingIngot(item);
    setIsSheetVisible(true);
  }, []);

  const closeSheet = useCallback(() => {
    setIsSheetVisible(false);
    setEditingIngot(null);
  }, []);

  const handleDelete = useCallback(
    (id) => {
      const target = ingots.find((item) => item.id === id);
      if (!target) return;
      setDeleteTarget(target);
    },
    [ingots]
  );

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget?.id) return;
    deleteIngot(deleteTarget.id);
    setDeleteTarget(null);
  }, [deleteIngot, deleteTarget]);

  const keyExtractor = useCallback((item) => item.id, []);
  const renderIngot = useCallback(
    ({ item }) => (
      <IngotItem
        item={item}
        onToggle={toggleIngot}
        onDelete={handleDelete}
        onEdit={openEditSheet}
      />
    ),
    [handleDelete, openEditSheet, toggleIngot]
  );

  const listBottomPadding = useMemo(
    () => ({ paddingBottom: 64 + insets.bottom }),
    [insets.bottom]
  );
  const addButtonBottomStyle = useMemo(
    () => ({ bottom: 16 + insets.bottom }),
    [insets.bottom]
  );
  const headerTopPadding = useMemo(
    () => ({ paddingTop: insets.top + 8, paddingBottom: 12 }),
    [insets.top]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={["left", "right"]}
    >
      <View style={[styles.header, headerTopPadding]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Ingot List</Text>
      </View>

      <FlatList
        data={ingots}
        keyExtractor={keyExtractor}
        renderItem={renderIngot}
        contentContainerStyle={[styles.listContent, listBottomPadding]}
        removeClippedSubviews
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No tasks yet. Add your first task below.</Text>
          </View>
        }
      />

      <Pressable
        style={[
          styles.addButton,
          addButtonBottomStyle,
          { backgroundColor: theme.accent, shadowColor: theme.shadow },
        ]}
        onPress={openCreateSheet}
        accessibilityRole="button"
        accessibilityLabel="Add new ingot"
      >
        <Text style={[styles.addButtonText, { color: theme.textOnAccent }]}>+</Text>
      </Pressable>

      <NewIngotSheet
        visible={isSheetVisible}
        onClose={closeSheet}
        onCreate={handleSubmit}
        initialTitle={editingIngot?.title ?? ""}
      />

      <ConfirmDialog
        visible={!!deleteTarget}
        title="Delete Task"
        message={
          deleteTarget?.title
            ? `Delete "${deleteTarget.title}"?`
            : "Delete this task?"
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        destructive
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  empty: {
    padding: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  addButton: {
    position: "absolute",
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
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
    fontFamily: "Inter_600SemiBold",
  },
});
