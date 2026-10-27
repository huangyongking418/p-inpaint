<template>
  <aside class="tool-panel">
    <!-- 工具模式（仅加载图片后显示） -->
    <template v-if="imageLoaded">
      <div class="panel">
        <div class="panel-title">工具</div>
        <div class="mode-toggle">
          <button class="mode-btn" :class="{ active: toolMode === 'brush' }"
            @click="$emit('update:toolMode', 'brush')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>
            </svg>
            画笔
          </button>
          <button class="mode-btn" :class="{ active: toolMode === 'rect' }"
            @click="$emit('update:toolMode', 'rect')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
            </svg>
            框选
          </button>
        </div>
      </div>

      <div class="panel" v-if="toolMode === 'brush'">
        <div class="panel-title">画笔</div>
        <div class="control-group">
          <label class="control-label">
            <span>大小</span>
            <span class="control-value">{{ brushSize }}px</span>
          </label>
          <input type="range" class="input-range" min="5" max="150"
            :value="brushSize" @input="$emit('update:brushSize', Number($event.target.value))"/>
        </div>
      </div>

      <div class="panel" v-if="toolMode === 'rect'">
        <div class="panel-title">框选</div>
        <p class="mode-hint">在图片上拖拽矩形框选要消除的区域</p>
      </div>

      <div class="panel">
        <button class="btn btn-clear" @click="$emit('clearMask')">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          清除遮罩
        </button>
      </div>
    </template>

    <!-- AI 修复（始终显示） -->
    <div class="panel">
      <div class="panel-title">AI 修复</div>

      <div class="model-status" v-if="downloadStatus === 'downloading'">
        <div class="status-row">
          <span class="spinner"></span>
          <span class="status-text">下载模型中...</span>
        </div>
        <div class="progress-bar" style="margin-top:8px">
          <div class="progress-bar-fill" :style="{ width: downloadProgress + '%' }"></div>
        </div>
        <span class="status-percent">{{ downloadProgress }}%</span>
      </div>

      <div v-else-if="modelLoading" class="model-status">
        <div class="status-row">
          <span class="spinner"></span>
          <span class="status-text">加载模型中...</span>
        </div>
      </div>

      <div v-else-if="modelLoaded" class="model-status">
        <div class="status-row">
          <span class="badge badge-cyan">READY</span>
          <span class="status-text">模型就绪</span>
        </div>
      </div>

      <div v-else-if="downloadStatus === 'error'" class="model-status">
        <div class="status-row">
          <span class="badge badge-warning">ERROR</span>
          <span class="status-text">{{ errorMessage || '模型加载失败' }}</span>
        </div>
      </div>

      <div v-else class="model-status">
        <div class="status-row">
          <span class="badge badge-warning">WAIT</span>
          <span class="status-text">等待自动加载...</span>
        </div>
      </div>

      <div class="panel-divider"></div>

      <button class="btn btn-primary btn-inpaint"
        :disabled="isRunning || downloadStatus === 'downloading'"
        @click="$emit('inpaint')">
        <svg v-if="isRunning" class="spinner" viewBox="0 0 24 24" width="16" height="16">
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="31.4 31.4"/>
        </svg>
        <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        {{ isRunning ? '修复中...' : '开始修复' }}
      </button>
    </div>

    <!-- 快捷键（始终显示） -->
    <div class="panel panel-shortcuts">
      <div class="panel-title">快捷键</div>
      <div class="shortcut-list">
        <div class="shortcut-item"><kbd>B</kbd><span>画笔模式</span></div>
        <div class="shortcut-item"><kbd>R</kbd><span>框选模式</span></div>
        <div class="shortcut-item"><kbd>[</kbd><span>缩小笔刷</span></div>
        <div class="shortcut-item"><kbd>]</kbd><span>放大笔刷</span></div>
        <div class="shortcut-item"><kbd>Ctrl+Z</kbd><span>撤销</span></div>
        <div class="shortcut-item"><kbd>Ctrl+Shift+Z</kbd><span>重做</span></div>
      </div>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  imageLoaded: Boolean,
  toolMode: String,
  brushSize: Number,
  modelLoaded: Boolean,
  modelLoading: Boolean,
  isRunning: Boolean,
  downloadStatus: String,
  downloadProgress: Number,
  errorMessage: String,
})
defineEmits(["update:toolMode", "update:brushSize", "inpaint", "clearMask"])
</script>

<style scoped>
.tool-panel {
  width: var(--toolpanel-width);
  padding: 12px;
  background: var(--bg-secondary);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  flex-shrink: 0;
}

/* ===== 醒目的面板标题 ===== */
.panel-title {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--cyan);
  margin-bottom: 12px;
  font-family: var(--font-mono);
  padding-left: 10px;
  border-left: 3px solid var(--cyan);
  text-shadow: 0 0 12px rgba(0, 212, 255, 0.25);
}

/* 模式切换 */
.mode-toggle {
  display: flex;
  gap: 0;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  overflow: hidden;
}
.mode-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 7px 12px;
  background: var(--bg-tertiary);
  border: none;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  font-family: var(--font-sans);
}
.mode-btn:first-child { border-right: 1px solid var(--border-color); }
.mode-btn.active {
  background: linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15));
  color: var(--cyan);
  box-shadow: inset 0 0 8px rgba(0,212,255,0.1);
}
.mode-btn:hover:not(.active) { color: var(--text-secondary); background: var(--bg-card); }

.mode-hint { font-size: 12px; color: var(--text-muted); line-height: 1.6; }
.control-group { margin-bottom: 4px; }
.control-label { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
.control-value { font-family: var(--font-mono); color: var(--cyan); font-size: 12px; }
.model-status { display: flex; flex-direction: column; gap: 4px; }
.status-row { display: flex; align-items: center; gap: 8px; }
.status-text { font-size: 12px; color: var(--text-secondary); }
.status-percent { font-family: var(--font-mono); font-size: 11px; color: var(--cyan); text-align: right; }
.btn-clear { width: 100%; justify-content: center; border-color: var(--border-color); }
.btn-inpaint { width: 100%; justify-content: center; padding: 10px 16px; font-size: 14px; }
.panel-shortcuts { margin-top: auto; }
.shortcut-list { display: flex; flex-direction: column; gap: 6px; }
.shortcut-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-muted); }
.shortcut-item kbd {
  display: inline-flex; align-items: center; justify-content: center;
  min-width: 24px; padding: 2px 6px;
  background: var(--bg-tertiary); border: 1px solid var(--border-color);
  border-radius: 3px; font-family: var(--font-mono);
  font-size: 11px; color: var(--text-secondary);
}
</style>
