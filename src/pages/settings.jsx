import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Alert, ScrollView, Modal } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { useHabitStore } from "../context/habitStore";
import { useIngotStore } from "../context/ingotStore";
import { useTheme } from "../context/themeContext";
import { useShallow } from "zustand/react/shallow";
import { buildExportData, normalizeImportData } from "../utils/dataTransfer";
import { triggerBubblePopHaptic } from "../utils/haptics";

const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
const MAX_FILE_NAME_LENGTH = 80;

const truncateText = (value, maxLength) => {
  const text = String(value ?? "");
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1)}...`;
};

export default function Settings() {
  const { habits, setHabits } = useHabitStore(
    useShallow((state) => ({
      habits: state.habits,
      setHabits: state.setHabits,
    }))
  );
  const { ingots, setIngots } = useIngotStore(
    useShallow((state) => ({
      ingots: state.ingots,
      setIngots: state.setIngots,
    }))
  );
  const { theme, themeId, setThemeId, themeOptions } = useTheme();
  const insets = useSafeAreaInsets();

  const [busyAction, setBusyAction] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [dialogType, setDialogType] = useState(null);

  const headerTopPadding = useMemo(() => ({ paddingTop: insets.top + 8 }), [insets.top]);
  const contentBottomPadding = useMemo(() => ({ paddingBottom: 16 + insets.bottom }), [insets.bottom]);
  const selectedThemeName = useMemo(
    () => themeOptions.find((option) => option.id === themeId)?.name || "Unknown",
    [themeId, themeOptions]
  );

  const openDialog = (type) => {
    if (busyAction) return;
    setDialogType(type);
  };

  const closeDialog = () => {
    setDialogType(null);
  };

  const handleExport = async () => {
    if (busyAction) return;

    try {
      setBusyAction("export");
      const payload = buildExportData({ habits, ingots });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `Forge-Export-${timestamp}.json`;

      if (!FileSystem.documentDirectory) {
        throw new Error("Document directory is not available on this device.");
      }

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;
      const content = JSON.stringify(payload, null, 2);
      await FileSystem.writeAsStringAsync(fileUri, content);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          UTI: "public.json",
          dialogTitle: "Export Forge Data",
        });
      } else {
        Alert.alert("Exported", `Saved to:\n${fileUri}`);
      }

      setStatusMessage(`Exported ${payload.habits.length} habits and ${payload.ingots.length} ingots.`);
      void triggerBubblePopHaptic();
    } catch (error) {
      setStatusMessage(`Export failed${error?.message ? `: ${error.message}` : "."}`);
      Alert.alert("Export failed", error?.message || "Unable to export data.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleImport = async () => {
    if (busyAction) return;

    try {
      setBusyAction("import");
      const picked = await DocumentPicker.getDocumentAsync({
        type: ["application/json", "text/json"],
        copyToCacheDirectory: true,
      });

      if (picked.canceled || !picked.assets?.length) return;

      const fileAsset = picked.assets[0];
      if (typeof fileAsset.size === "number" && fileAsset.size > MAX_IMPORT_FILE_BYTES) {
        throw new Error("File is too large. Please import a file under 5 MB.");
      }

      const fileContent = await FileSystem.readAsStringAsync(fileAsset.uri);
      let parsed;
      try {
        parsed = JSON.parse(fileContent);
      } catch {
        throw new Error("Invalid JSON file. Please choose a valid backup.");
      }

      const imported = normalizeImportData(parsed);

      setHabits(imported.habits);
      setIngots(imported.ingots);

      setStatusMessage(
        `Imported ${imported.habits.length} habits and ${imported.ingots.length} ingots from ${truncateText(fileAsset.name, MAX_FILE_NAME_LENGTH)}.`
      );
      Alert.alert("Import complete", "Your data has been restored from JSON.");
      void triggerBubblePopHaptic();
    } catch (error) {
      setStatusMessage(`Import failed${error?.message ? `: ${error.message}` : "."}`);
      Alert.alert("Import failed", error?.message || "Unable to import data.");
    } finally {
      setBusyAction(null);
    }
  };

  const renderThemeDialog = () => (
    <>
      <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>Color Theme</Text>
      <Text style={[styles.dialogDescription, { color: theme.textSecondary }]}>Select the color palette for the entire app.</Text>

      <ScrollView style={styles.dialogList} contentContainerStyle={styles.dialogListContent} showsVerticalScrollIndicator={false}>
        {themeOptions.map((option) => {
          const selected = option.id === themeId;
          return (
            <Pressable
              key={option.id}
              onPress={() => {
                setThemeId(option.id);
                setStatusMessage(`Theme changed to ${option.name}.`);
                closeDialog();
              }}
              style={[
                styles.dialogThemeOption,
                {
                  backgroundColor: selected ? theme.accentSoft : theme.surfaceMuted,
                  borderColor: selected ? theme.accentStrong : theme.border,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Apply ${option.name} theme`}
            >
              <View style={[styles.themeDot, { backgroundColor: option.previewColor }]} />
              <Text style={[styles.dialogThemeName, { color: selected ? theme.accentStrong : theme.textPrimary }]}>
                {option.name}
              </Text>
              {selected ? <Text style={[styles.dialogThemeSelectedMark, { color: theme.accentStrong }]}>✓</Text> : null}
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.dialogActions}>
        <Pressable
          style={[
            styles.dialogButton,
            styles.dialogSecondaryButton,
            {
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.border,
            },
          ]}
          onPress={closeDialog}
          accessibilityRole="button"
          accessibilityLabel="Close theme dialog"
        >
          <Text style={[styles.dialogSecondaryButtonText, { color: theme.textSecondary }]}>Close</Text>
        </Pressable>
      </View>
    </>
  );

  const renderBackupDialog = () => (
    <>
      <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>Backup</Text>
      <Text style={[styles.dialogDescription, { color: theme.textSecondary }]}>Export your data to JSON or restore from a backup file.</Text>

      <View style={styles.backupActionList}>
        <Pressable
          style={[
            styles.backupActionButton,
            {
              backgroundColor: theme.accent,
            },
            busyAction && styles.buttonDisabled,
          ]}
          onPress={async () => {
            closeDialog();
            await handleExport();
          }}
          disabled={!!busyAction}
          accessibilityRole="button"
          accessibilityLabel="Export backup JSON"
        >
          <Text style={[styles.backupActionButtonText, { color: theme.textOnAccent }]}>
            {busyAction === "export" ? "Exporting..." : "Export JSON"}
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.backupActionButton,
            {
              backgroundColor: theme.success,
            },
            busyAction && styles.buttonDisabled,
          ]}
          onPress={async () => {
            closeDialog();
            await handleImport();
          }}
          disabled={!!busyAction}
          accessibilityRole="button"
          accessibilityLabel="Import backup JSON"
        >
          <Text style={[styles.backupActionButtonText, { color: theme.textOnAccent }]}>
            {busyAction === "import" ? "Importing..." : "Import JSON"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.dialogActions}>
        <Pressable
          style={[
            styles.dialogButton,
            styles.dialogSecondaryButton,
            {
              backgroundColor: theme.surfaceMuted,
              borderColor: theme.border,
            },
          ]}
          onPress={closeDialog}
          accessibilityRole="button"
          accessibilityLabel="Close backup dialog"
        >
          <Text style={[styles.dialogSecondaryButtonText, { color: theme.textSecondary }]}>Close</Text>
        </Pressable>
      </View>
    </>
  );

  const renderDialogContent = () => {
    if (dialogType === "theme") return renderThemeDialog();
    if (dialogType === "backup") return renderBackupDialog();
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={["left", "right"]}>
      <View style={[styles.header, headerTopPadding]}>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Settings</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Tap a setting tile to open dialog options.</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={contentBottomPadding} showsVerticalScrollIndicator={false}>
        <View style={styles.tileList}>
          <Pressable
            style={[
              styles.tile,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              busyAction && styles.tileDisabled,
            ]}
            onPress={() => openDialog("theme")}
            disabled={!!busyAction}
            accessibilityRole="button"
            accessibilityLabel="Open color theme settings"
          >
            <View style={styles.tileTextWrap}>
              <Text style={[styles.tileTitle, { color: theme.textPrimary }]}>Color Theme</Text>
              <Text style={[styles.tileSubtitle, { color: theme.textSecondary }]}>Current: {selectedThemeName}</Text>
            </View>
            <Text style={[styles.tileChevron, { color: theme.textMuted }]}>›</Text>
          </Pressable>

          <Pressable
            style={[
              styles.tile,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
              busyAction && styles.tileDisabled,
            ]}
            onPress={() => openDialog("backup")}
            disabled={!!busyAction}
            accessibilityRole="button"
            accessibilityLabel="Open backup options"
          >
            <View style={styles.tileTextWrap}>
              <Text style={[styles.tileTitle, { color: theme.textPrimary }]}>Backup</Text>
              <Text style={[styles.tileSubtitle, { color: theme.textSecondary }]}>Import and export from a single backup panel.</Text>
            </View>
            <Text style={[styles.tileChevron, { color: theme.textMuted }]}>›</Text>
          </Pressable>

          <View
            style={[
              styles.tile,
              {
                backgroundColor: theme.surface,
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.tileTextWrap}>
              <Text style={[styles.tileTitle, { color: theme.textPrimary }]}>Status</Text>
              <Text numberOfLines={1} style={[styles.tileSubtitle, { color: theme.textSecondary }]}>
                {statusMessage || "No import or export action performed yet."}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal transparent visible={dialogType !== null} animationType="fade" onRequestClose={closeDialog}>
        <View style={styles.dialogOverlay}>
          <Pressable
            style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.overlay }]}
            onPress={closeDialog}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
          />

          <View style={[styles.dialogCard, { backgroundColor: theme.surfaceElevated, borderColor: theme.border }]}>
            {renderDialogContent()}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scroll: {
    flex: 1,
  },
  header: {
    marginBottom: 18,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  tileList: {
    gap: 10,
  },
  tile: {
    minHeight: 70,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  tileDisabled: {
    opacity: 0.6,
  },
  tileTextWrap: {
    flex: 1,
    marginRight: 12,
  },
  tileTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  tileSubtitle: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
  },
  tileChevron: {
    fontSize: 24,
    lineHeight: 24,
    fontFamily: "Inter_700Bold",
  },
  dialogOverlay: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  dialogCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    maxHeight: "80%",
  },
  dialogTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  dialogDescription: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "Inter_400Regular",
  },
  dialogList: {
    marginTop: 14,
    maxHeight: 300,
  },
  dialogListContent: {
    gap: 8,
  },
  dialogThemeOption: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  themeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  dialogThemeName: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  dialogThemeSelectedMark: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  backupActionList: {
    marginTop: 14,
    gap: 10,
  },
  backupActionButton: {
    minHeight: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 14,
  },
  backupActionButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  dialogActions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  dialogButton: {
    minHeight: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  dialogSecondaryButton: {
    borderWidth: 1,
  },
  dialogSecondaryButtonText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
