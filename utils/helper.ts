/**
 * Helper utilities for Excalidraw canvas and workspace state
 */

export const normalizeAppState = (appState: any) => {
  if (!appState) {
    return {
      collaborators: new Map(),
    };
  }

  // Do not restore interaction-only state from the previous session. In
  // particular, restoring Hand/drawing mode makes selected elements appear
  // immovable even though the custom toolbar shows Selection.
  const persistentState = { ...appState };
  for (const key of [
    "activeTool",
    "selectedElementIds",
    "selectedGroupIds",
    "editingElement",
    "editingTextElement",
    "draggingElement",
    "resizingElement",
    "selectionElement",
    "contextMenu",
  ]) {
    delete persistentState[key];
  }

  return {
    ...persistentState,
    collaborators: new Map(),
    selectedElementIds: {},
    selectedGroupIds: {},
  };
};

export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generatePreviewBase64 = async (api: any): Promise<string | null> => {
  try {
    if (!api) return null;

    const elements = api.getSceneElements?.() || [];
    const nonDeletedElements = elements.filter((el: any) => !el.isDeleted);
    if (!nonDeletedElements.length) return null;

    const appState = api.getAppState?.() || {};
    const files = api.getFiles?.() || {};

    const { exportToBlob } = await import("@excalidraw/excalidraw");

    const blob = await exportToBlob({
      elements: nonDeletedElements,
      appState: {
        ...appState,
        exportBackground: true,
        exportWithDarkMode: false,
      },
      files,
      mimeType: "image/webp",
      quality: 0.5,
      getDimensions: () => ({
        width: 400,
        height: 225,
        scale: 1,
      }),
    });

    return await blobToBase64(blob);
  } catch {
    return null;
  }
};
