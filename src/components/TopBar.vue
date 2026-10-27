<template>
  <header class="topbar">
    <div class="topbar-left">
      <a class="brand" href="#" @click.prevent="$emit('reset')">
        <svg class="brand-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 3v18M3 12h18" stroke="var(--cyan)"/>
          <circle cx="12" cy="12" r="8" stroke="var(--purple)"/>
        </svg>
        <span class="brand-text">P-Inpaint</span>
        <span class="badge badge-cyan">BETA</span>
      </a>
    </div>

    <div class="topbar-center">
      <label class="btn btn-primary" :class="{ disabled: isRunning }">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        上传图片
        <input type="file" accept="image/*" hidden @change="onFileChange" />
      </label>

      <button class="btn" :disabled="!imageLoaded || isRunning" @click="$emit('undo')" title="撤销">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="1 4 1 10 7 10"/>
          <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
        </svg>
      </button>

      <button class="btn" :disabled="!imageLoaded || isRunning" @click="$emit('redo')" title="重做">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
      </button>

      <div class="separator"></div>

      <button class="btn" :disabled="!imageLoaded" @click="$emit('reset')" title="重置">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <polyline points="23 4 23 10 17 10"/>
          <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        重置
      </button>

      <button class="btn" :disabled="!imageLoaded" @click="$emit('download')" title="下载结果">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="7 10 12 15 17 10"/>
          <line x1="12" y1="15" x2="12" y2="3"/>
        </svg>
        下载
      </button>
    </div>

    <div class="topbar-right"></div>
  </header>
</template>

<script setup>
defineProps({
  imageLoaded: Boolean,
  isRunning: Boolean,
})

const emit = defineEmits(['upload', 'download', 'reset', 'undo', 'redo'])

function onFileChange(e) {
  const file = e.target.files[0]
  if (file) {
    emit('upload', file)
    e.target.value = ''
  }
}
</script>

<style scoped>
.topbar {
  height: var(--topbar-height);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  z-index: 10;
  gap: 12px;
}

.topbar-left {
  display: flex;
  align-items: center;
  min-width: 180px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
  color: var(--text-primary);
  cursor: pointer;
}

.brand-icon {
  width: 22px;
  height: 22px;
}

.brand-text {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.3px;
  background: linear-gradient(135deg, var(--cyan), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.topbar-center {
  display: flex;
  align-items: center;
  gap: 6px;
}

.topbar-right {
  flex: 1;
}

.separator {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 6px;
}

.disabled {
  opacity: 0.5;
  pointer-events: none;
}
</style>
