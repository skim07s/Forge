import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
} from "react-native";
import BottomSheet from "./BottomSheet";

export default function NewIngotSheet({ visible, onClose, onCreate }) {
  const [title, setTitle] = useState("");

  const handleCreate = () => {
    if (!title.trim()) return;
    onCreate(title);
    setTitle("");
    onClose();
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} maxHeight={0.4}>
      <View style={styles.header}>
        <Text style={styles.title}>New Task</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>

      <View style={styles.content}>
        <TextInput
          style={styles.input}
          placeholder="What needs to be done?"
          placeholderTextColor="#666"
          value={title}
          onChangeText={setTitle}
          autoFocus={visible}
          onSubmitEditing={handleCreate}
          returnKeyType="done"
        />
        
        <Pressable
            style={[styles.createButton, !title.trim() && styles.disabledButton]}
            onPress={handleCreate}
            disabled={!title.trim()}
        >
            <Text style={styles.createButtonText}>Add to Ingot List</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontFamily: 'Inter_700Bold',
        color: '#FFFFFF',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        color: '#888',
        fontSize: 16,
    },
    content: {
        gap: 16,
    },
    input: {
        backgroundColor: '#242424',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#FFFFFF',
        fontFamily: 'Inter_400Regular',
    },
    createButton: {
        backgroundColor: '#FF6B35',
        borderRadius: 12,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    disabledButton: {
        backgroundColor: '#333',
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'Inter_600SemiBold',
    },
});
