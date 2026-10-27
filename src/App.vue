<template>
  <div class="app-layout">
    <TopBar
      :image-loaded="canvas.imageLoaded.value"
      :is-running="inpainting.isRunning.value"
      @upload="handleUpload"
      @download="canvas.downloadResult()"
      @reset="handleReset"
      @undo="handleUndo"
      @redo="handleRedo"
    />

    <div class="main-area" @drop.prevent="handleDrop" @dragover.prevent>
      <CanvasArea
        :image-loaded="canvas.imageLoaded.value"
        :scale="canvas.scale.value"
        :brush-size="canvas.brushSize.value"
        :is-drawing="canvas.isDrawing.value"
        :download-status="inpainting.downloadStatus.value"
        :download-progress="inpainting.downloadProgress.value"
        :is-running="inpainting.isRunning.value"
        :on-mousedown="canvas.startDraw"
        :on-mousemove="canvas.moveDraw"
        :on-mouseup="canvas.endDraw"
        @canvas-ready="onCanvasReady"
      />

      <ToolPanel
        :image-loaded="canvas.imageLoaded.value"
        :tool-mode="canvas.toolMode.value"
        :brush-size="canvas.brushSize.value"
        :model-loaded="inpainting.modelLoaded.value"
        :model-loading="inpainting.modelLoading.value"
        :is-running="inpainting.isRunning.value"
        :download-status="inpainting.downloadStatus.value"
        :download-progress="inpainting.downloadProgress.value"
        :error-message="inpainting.errorMessage.value"
        @update:tool-mode="canvas.toolMode.value = $event"
        @update:brush-size="canvas.brushSize.value = $event"
        @inpaint="handleInpaint"
        @clear-mask="canvas.clearMask()"
      />
    </div>

    <StatusBar
      :image-loaded="canvas.imageLoaded.value"
      :image-width="canvas.imageWidth.value"
      :image-height="canvas.imageHeight.value"
      :model-loaded="inpainting.modelLoaded.value"
      :model-loading="inpainting.modelLoading.value"
      :is-running="inpainting.isRunning.value"
      :download-status="inpainting.downloadStatus.value"
      :download-progress="inpainting.downloadProgress.value"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue"
import TopBar from "./components/TopBar.vue"
import CanvasArea from "./components/CanvasArea.vue"
import ToolPanel from "./components/ToolPanel.vue"
import StatusBar from "./components/StatusBar.vue"
import { useCanvas } from "./composables/useCanvas.js"
import { useInpainting } from "./composables/useInpainting.js"
import { useHistory } from "./composables/useHistory.js"

const canvas = useCanvas()
const inpainting = useInpainting()
const history = useHistory()

// ---- 页面加载后自动下载 AI 模型 ----
onMounted(() => {
  inpainting.loadModel().catch(e => console.warn("[p-inpaint] auto load failed:", e.message))

  window.addEventListener("keydown", handleKey)
  window.addEventListener("resize", handleResize)
})
onUnmounted(() => {
  window.removeEventListener("keydown", handleKey)
  window.removeEventListener("resize", handleResize)
})

// ---- 画布连接 ----
function onCanvasReady({ originCanvas, maskCanvas, overlay }) {
  canvas.canvasRef.value = originCanvas.value
  canvas.maskCanvasRef.value = maskCanvas.value
  canvas.overlayRef.value = overlay.value
  if (canvas.imageLoaded.value) canvas.initCanvases()
}

// ---- 上传 ----
async function handleUpload(file) {
  await canvas.loadImage(file)
  history.clear()
}

function handleDrop(e) {
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith("image/")) handleUpload(file)
}

// ---- 修复 ----
async function handleInpaint() {
  const imageData = canvas.getImageData()
  const maskData = canvas.getMaskData()
  if (!imageData || !maskData) return
  history.pushState(maskData)
  try {
    const result = await inpainting.runInpainting(
      imageData, maskData, canvas.imageWidth.value, canvas.imageHeight.value
    )
    canvas.setResultImage(result)
  } catch (e) {
    console.error("Inpainting failed:", e)
  }
}

function handleReset() { canvas.resetToOriginal(); history.clear() }

// ---- 撤销/重做 ----
function handleUndo() {
  const state = history.undo()
  if (state) {
    const mc = canvas.maskCanvasRef.value
    if (mc) { const c = mc.getContext("2d"); c.clearRect(0,0,mc.width,mc.height); c.putImageData(state,0,0) }
  }
}
function handleRedo() {
  const state = history.redo()
  if (state) {
    const mc = canvas.maskCanvasRef.value
    if (mc) { const c = mc.getContext("2d"); c.clearRect(0,0,mc.width,mc.height); c.putImageData(state,0,0) }
  }
}

// ---- 键盘 ----
function handleKey(e) {
  if (e.target.tagName === "INPUT") return
  if (e.key === "[" && !e.ctrlKey) { canvas.brushSize.value = Math.max(5, canvas.brushSize.value - 5); e.preventDefault() }
  if (e.key === "]" && !e.ctrlKey) { canvas.brushSize.value = Math.min(150, canvas.brushSize.value + 5); e.preventDefault() }
  if (e.key === "b" && !e.ctrlKey) { canvas.toolMode.value = "brush"; e.preventDefault() }
  if (e.key === "r" && !e.ctrlKey) { canvas.toolMode.value = "rect"; e.preventDefault() }
  if (e.ctrlKey && e.key === "z" && !e.shiftKey) { handleUndo(); e.preventDefault() }
  if (e.ctrlKey && e.shiftKey && e.key === "z") { handleRedo(); e.preventDefault() }
}

function handleResize() {
  if (canvas.imageLoaded.value) canvas.fitToView()
}
</script>

<style scoped>
.app-layout { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.main-area { flex: 1; display: flex; overflow: hidden; position: relative; }
</style>
