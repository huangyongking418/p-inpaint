import { ref, shallowRef } from "vue"

export function useCanvas() {
  const canvasRef = ref(null)
  const maskCanvasRef = ref(null)
  const overlayRef = ref(null)
  const imageLoaded = ref(false)
  const isDrawing = ref(false)
  const toolMode = ref("brush")       // "brush" | "rect"
  const brushSize = ref(20)
  const brushOpacity = ref(0.8)
  const scale = ref(1)
  const offsetX = ref(0)
  const offsetY = ref(0)
  const imageWidth = ref(0)
  const imageHeight = ref(0)
  const originalImage = shallowRef(null)

  let ctx = null
  let maskCtx = null
  let lastX = 0, lastY = 0
  let rectStart = null          // {x,y} 框选起点
  let savedMaskData = null      // 预览前保存的遮罩状态

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        originalImage.value = img
        imageWidth.value = img.width
        imageHeight.value = img.height
        imageLoaded.value = true
        resolve(img)
      }
      img.onerror = () => reject(new Error("图片加载失败"))
      img.src = URL.createObjectURL(file)
    })
  }

  function initCanvases() {
    const c = canvasRef.value
    const mc = maskCanvasRef.value
    const img = originalImage.value
    if (!c || !mc || !img) return

    c.width = img.width;   c.height = img.height
    mc.width = img.width;  mc.height = img.height

    ctx = c.getContext("2d")
    maskCtx = mc.getContext("2d")
    ctx.drawImage(img, 0, 0)
    maskCtx.clearRect(0, 0, img.width, img.height)

    fitToView()
  }

  function fitToView() {
    const el = overlayRef.value
    if (!el) return
    const parent = el.parentElement
    if (!parent) return
    const cw = parent.clientWidth, ch = parent.clientHeight
    const iw = imageWidth.value, ih = imageHeight.value
    if (!iw || !ih) return

    const s = Math.min(cw / iw, ch / ih, 1) * 0.9
    scale.value = s
    offsetX.value = Math.round((cw - iw * s) / 2)
    offsetY.value = Math.round((ch - ih * s) / 2)
    applyTransform()
  }

  function applyTransform() {
    if (!overlayRef.value) return
    overlayRef.value.style.transform =
      "translate(" + offsetX.value + "px, " + offsetY.value + "px) scale(" + scale.value + ")"
    overlayRef.value.style.transformOrigin = "0 0"
  }

  // ---- 坐标转换 ----
  function getCanvasPos(e) {
    const rect = overlayRef.value.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / scale.value,
      y: (e.clientY - rect.top) / scale.value,
    }
  }

  // ---- 画笔绘制 ----
  function drawDot(x, y) {
    maskCtx.beginPath()
    maskCtx.arc(x, y, brushSize.value / 2, 0, Math.PI * 2)
    maskCtx.fillStyle = "rgba(255, 60, 60, 0.7)"
    maskCtx.fill()
  }

  function drawLine(x1, y1, x2, y2) {
    maskCtx.beginPath()
    maskCtx.lineWidth = brushSize.value
    maskCtx.lineCap = "round"
    maskCtx.lineJoin = "round"
    maskCtx.strokeStyle = "rgba(255, 60, 60, 0.7)"
    maskCtx.moveTo(x1, y1)
    maskCtx.lineTo(x2, y2)
    maskCtx.stroke()
  }

  // ---- 矩形绘制（预览 + 填充） ----
  function drawRectPreview(x1, y1, x2, y2) {
    // 恢复之前保存的遮罩状态
    if (savedMaskData) maskCtx.putImageData(savedMaskData, 0, 0)

    const x = Math.min(x1, x2), y = Math.min(y1, y2)
    const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1)
    if (w < 1 || h < 1) return

    maskCtx.save()
    // 半透明填充预览
    maskCtx.fillStyle = "rgba(255, 60, 60, 0.25)"
    maskCtx.fillRect(x, y, w, h)
    // 虚线边框
    maskCtx.strokeStyle = "rgba(255, 60, 60, 0.9)"
    maskCtx.lineWidth = 2
    maskCtx.setLineDash([6, 4])
    maskCtx.strokeRect(x, y, w, h)
    maskCtx.restore()
  }

  function fillRect(x1, y1, x2, y2) {
    const x = Math.min(x1, x2), y = Math.min(y1, y2)
    const w = Math.abs(x2 - x1), h = Math.abs(y2 - y1)
    if (w < 2 || h < 2) return

    maskCtx.fillStyle = "rgba(255, 60, 60, 0.7)"
    maskCtx.fillRect(x, y, w, h)
  }

  // ---- 统一事件入口 ----
  function startDraw(e) {
    if (!imageLoaded.value || !maskCtx) return
    isDrawing.value = true
    const p = getCanvasPos(e)
    lastX = p.x; lastY = p.y

    if (toolMode.value === "brush") {
      drawDot(lastX, lastY)
    } else {
      // 矩形模式：记录起点，保存当前遮罩
      rectStart = { x: lastX, y: lastY }
      savedMaskData = maskCtx.getImageData(0, 0, imageWidth.value, imageHeight.value)
    }
  }

  function moveDraw(e) {
    if (!isDrawing.value || !maskCtx) return
    const p = getCanvasPos(e)

    if (toolMode.value === "brush") {
      drawLine(lastX, lastY, p.x, p.y)
      lastX = p.x; lastY = p.y
    } else if (rectStart) {
      // 矩形模式：显示预览
      drawRectPreview(rectStart.x, rectStart.y, p.x, p.y)
    }
  }

  function endDraw() {
    if (isDrawing.value && rectStart && toolMode.value === "rect") {
      // 矩形模式：填充遮罩并清除预览
      fillRect(rectStart.x, rectStart.y, lastX, lastY)
      rectStart = null
      savedMaskData = null
    }
    isDrawing.value = false
  }

  // ---- 工具 ----
  function clearMask() {
    if (!maskCtx) return
    maskCtx.clearRect(0, 0, imageWidth.value, imageHeight.value)
  }

  function getImageData() {
    if (!ctx) return null
    return ctx.getImageData(0, 0, imageWidth.value, imageHeight.value)
  }

  function getMaskData() {
    if (!maskCtx) return null
    return maskCtx.getImageData(0, 0, imageWidth.value, imageHeight.value)
  }

  function setResultImage(imageData) {
    if (!ctx) return
    ctx.putImageData(imageData, 0, 0)
    clearMask()
  }

  function resetToOriginal() {
    const img = originalImage.value
    if (!ctx || !img) return
    ctx.drawImage(img, 0, 0)
    clearMask()
  }

  function downloadResult() {
    const c = canvasRef.value
    if (!c) return
    const a = document.createElement("a")
    a.download = "inpainted_result.png"
    a.href = c.toDataURL("image/png")
    a.click()
  }

  function updateOverlay() { applyTransform() }

  return {
    canvasRef, maskCanvasRef, overlayRef,
    imageLoaded, isDrawing, toolMode, brushSize, brushOpacity,
    scale, imageWidth, imageHeight, originalImage,
    loadImage, initCanvases, fitToView,
    startDraw, moveDraw, endDraw,
    clearMask, getImageData, getMaskData,
    setResultImage, resetToOriginal, downloadResult, updateOverlay,
  }
}
