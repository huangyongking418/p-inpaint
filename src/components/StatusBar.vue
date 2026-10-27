<template>
  <footer class="statusbar">
    <div class="statusbar-left">
      <span v-if="imageLoaded" class="status-item">
        <span class="status-dot" style="background: var(--accent)"></span>
        {{ imageWidth }} x {{ imageHeight }}
      </span>
      <span v-else class="status-item status-muted">
        <span class="status-dot"></span>
        未加载图片
      </span>
    </div>

    <div class="statusbar-center">
      <span v-if="downloadStatus === 'downloading'" class="status-item">
        <span class="spinner"></span>
        下载模型中... {{ downloadProgress }}%
      </span>
      <span v-else-if="modelLoading" class="status-item">
        <span class="spinner"></span>
        加载模型中...
      </span>
      <span v-else-if="isRunning" class="status-item">
        <span class="spinner"></span>
        AI 修复推理中...
      </span>
      <span v-else-if="modelLoaded" class="status-item">
        <span class="status-dot" style="background: var(--cyan)"></span>
        AI 模型就绪
      </span>
      <span v-else class="status-item status-muted">
        <span class="status-dot"></span>
        等待操作
      </span>
    </div>

    <div class="statusbar-right">
      <span class="status-item status-muted">
        v0.1.0
      </span>
    </div>
  </footer>
</template>

<script setup>
defineProps({
  imageLoaded: Boolean,
  imageWidth: Number,
  imageHeight: Number,
  modelLoaded: Boolean,
  modelLoading: Boolean,
  isRunning: Boolean,
  downloadStatus: String,
  downloadProgress: Number,
})
</script>

<style scoped>
.statusbar {
  height: var(--statusbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  gap: 16px;
}

.statusbar-left,
.statusbar-center,
.statusbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.statusbar-center {
  flex: 1;
  justify-content: center;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.status-muted {
  opacity: 0.5;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--text-muted);
}

.spinner {
  width: 10px;
  height: 10px;
  border-width: 1.5px;
}
</style>
