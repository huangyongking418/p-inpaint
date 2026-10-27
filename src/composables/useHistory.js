import { ref } from 'vue'

export function useHistory() {
  const undoStack = ref([])
  const redoStack = ref([])
  const maxHistory = 30

  function pushState(maskImageData) {
    if (!maskImageData) return
    const copy = new ImageData(
      new Uint8ClampedArray(maskImageData.data),
      maskImageData.width,
      maskImageData.height
    )
    undoStack.value.push(copy)
    if (undoStack.value.length > maxHistory) {
      undoStack.value.shift()
    }
    redoStack.value = []
  }

  function undo() {
    if (undoStack.value.length === 0) return null
    const state = undoStack.value.pop()
    redoStack.value.push(state)
    return state
  }

  function redo() {
    if (redoStack.value.length === 0) return null
    const state = redoStack.value.pop()
    undoStack.value.push(state)
    return state
  }

  function clear() {
    undoStack.value = []
    redoStack.value = []
  }

  return { undoStack, redoStack, pushState, undo, redo, clear }
}
