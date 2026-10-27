<template>
  <div class="canvas-container" ref="containerRef">
    <!-- 空状态 -->
    <div v-if="!imageLoaded" class="empty-state">
      <div class="empty-icon">
        <svg viewBox="0 0 80 80" fill="none" stroke="currentColor" stroke-width="1.5" width="80" height="80">
          <rect x="10" y="10" width="60" height="60" rx="6" stroke="var(--cyan)" stroke-opacity="0.3"/>
          <circle cx="30" cy="30" r="6" stroke="var(--purple)" stroke-opacity="0.4"/>
          <path d="M10 55 L30 40 L45 52 L55 42 L70 55" stroke="var(--accent)" stroke-opacity="0.3"/>
          <path d="M28 52 L50 52" stroke="var(--border-color)"/>
        </svg>
      </div>
      <p class="empty-title">拖拽图片到此处，或点击上方「上传图片」</p>
      <p class="empty-hint">支持 JPG / PNG / WebP，最大 20MB</p>
    </div>

    <!-- 画布覆盖层 -->
    <div v-else class="canvas-overlay" ref="overlayElRef"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      @mouseleave="onMouseUp"
    >
      <div class="canvas-wrapper">
        <canvas class="origin-layer" ref="canvasElRef"></canvas>
        <canvas class="mask-layer" ref="maskCanvasElRef"></canvas>
      </div>

      <div v-if="isRunning" class="running-overlay">
        <div class="spinner"></div>
        <span>AI 修复中...</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, nextTick } from 'vue'

const props = defineProps({
  imageLoaded: Boolean, scale: Number, brushSize: Number,
  isDrawing: Boolean, downloadStatus: String,
  downloadProgress: Number, isRunning: Boolean,
  onMousedown: Function, onMousemove: Function, onMouseup: Function,
})

const emit = defineEmits(['canvasReady'])
const containerRef = ref(null)
const overlayElRef = ref(null)
const canvasElRef = ref(null)
const maskCanvasElRef = ref(null)

function onMouseDown(e) { props.onMousedown?.(e) }
function onMouseMove(e) { props.onMousemove?.(e) }
function onMouseUp(e) { props.onMouseup?.(e) }

function notify() {
  nextTick(() => emit('canvasReady', {
    originCanvas: canvasElRef,
    maskCanvas: maskCanvasElRef,
    overlay: overlayElRef,
  }))
}

onMounted(notify)
watch(() => props.imageLoaded, (v) => { if (v) notify() })
</script>

<style scoped>
.canvas-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 30% 50%, rgba(0, 212, 255, 0.03) 0%, transparent 60%),
    radial-gradient(ellipse at 70% 50%, rgba(124, 58, 237, 0.03) 0%, transparent 60%);
}
.empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 12px;
  color: var(--text-muted); animation: fadeIn 0.5s ease;
}
.empty-icon { opacity: 0.6; }
.empty-title { font-size: 15px; font-weight: 500; color: var(--text-secondary); }
.empty-hint { font-size: 12px; color: var(--text-muted); }
.canvas-overlay { position: relative; cursor: crosshair; }
.canvas-wrapper { position: relative; }
.origin-layer { display: block; image-rendering: auto; }
.mask-layer {
  position: absolute; top: 0; left: 0; display: block;
  opacity: 0.8;
}
.running-overlay {
  position: absolute; inset: 0;
  background: rgba(10, 14, 26, 0.6);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 12px; color: var(--text-secondary); font-size: 14px;
  backdrop-filter: blur(4px); z-index: 5; animation: fadeIn 0.3s ease;
}
</style>
