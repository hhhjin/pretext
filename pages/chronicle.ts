import {
  layoutNextLine,
  prepareWithSegments,
  type LayoutCursor,
  type PreparedTextWithSegments,
} from '../src/layout.ts'

const FONT = '20px "Iowan Old Style", "Palatino Linotype", "Book Antiqua", Palatino, serif'
const LINE_HEIGHT = 32

const BODY_COPY = [
  'By the time the room settled, the drawing had already changed from an image into a route. The first pass was only a ribbon of sand drifting diagonally through the composition, but that was enough to force every sentence to admit that its old rectangle had been temporary. The text wanted to cling to the contour, then veer away from it, then return as if the page had a weather system instead of a column grid.',
  'That is the pleasure of doing this work in userland. The text is no longer sealed inside a block formatting context that has to be measured after the fact. Each line can be asked where it begins, where it ends, and how far it can travel before the next shape narrows the corridor. Instead of pleading with layout, the page can negotiate with it.',
  'The scent of the idea comes from that moment of control. A pull quote can occupy the left margin without freezing the rest of the story. A central figure can widen, shrink, or drift upward, and the copy will route itself through the changed openings without forfeiting the continuity of the paragraph. The geometry becomes part of the rhetoric.',
  'The point is not to mimic print nostalgically. It is to recover a capability that was always there in richer editorial tools: text that understands the surface it inhabits. Once the browser is not the only keeper of line breaks, you can build timelines, comparisons, notebooks, and braided views that stay anchored while the window changes under them.',
  'That is why this page keeps the art soft and the rules crisp. The shapes here are only scaffolds, but they prove the more important thing: a responsive layout can still behave like composition. It can keep its rhythm, keep its memory, and keep enough structure exposed that a human author can steer it on purpose.',
].join(' ')

type RectBox = {
  x: number
  y: number
  width: number
  height: number
}

type BaseLayout = {
  viewportHeight: number
  width: number
  wide: boolean
  bodyLeft: number
  bodyRight: number
  issueX: number
  issueY: number
  issueWidth: number
  titleX: number
  titleY: number
  titleWidth: number
  centerX: number
  centerWidth: number
  rightX: number
  rightWidth: number
  leftX: number
  leftWidth: number
  bottomX: number
  bottomWidth: number
  footerWidth: number
  statusWidth: number
  ribbonBox: RectBox
  blobBox: RectBox
}

type MeasuredHeights = {
  issue: number
  title: number
  center: number
  right: number
  left: number
  bottom: number
  footer: number
  status: number
}

type LayoutMetrics = {
  width: number
  wide: boolean
  bodyLeft: number
  bodyRight: number
  height: number
  stageTop: number
  issueBox: RectBox
  titleBox: RectBox
  centerBox: RectBox
  rightBox: RectBox
  leftBox: RectBox
  bottomBox: RectBox
  footerBox: RectBox
  statusBox: RectBox
  ribbonBox: RectBox
  blobBox: RectBox
}

type PositionedLine = {
  left: number
  top: number
  text: string
  title: string
}

const prepared: PreparedTextWithSegments = prepareWithSegments(BODY_COPY, FONT)

const domCache = {
  poster: document.getElementById('poster') as HTMLDivElement,
  issueTag: document.getElementById('issue-tag') as HTMLDivElement,
  titleBlock: document.getElementById('title-block') as HTMLDivElement,
  deckCenter: document.getElementById('deck-center') as HTMLParagraphElement,
  deckRight: document.getElementById('deck-right') as HTMLParagraphElement,
  deckLeft: document.getElementById('deck-left') as HTMLParagraphElement,
  deckBottom: document.getElementById('deck-bottom') as HTMLParagraphElement,
  footerNote: document.getElementById('footer-note') as HTMLDivElement,
  status: document.getElementById('status') as HTMLDivElement,
  statusMeta: document.getElementById('status-meta') as HTMLDivElement,
  ribbonArt: document.getElementById('ribbon-art') as HTMLDivElement,
  blobArt: document.getElementById('blob-art') as HTMLDivElement,
  lineStage: document.getElementById('line-stage') as HTMLDivElement,
  lineNodes: [] as HTMLDivElement[],
}

let scheduledRender = false

function scheduleRender(): void {
  if (scheduledRender) return
  scheduledRender = true
  requestAnimationFrame(function renderChronicle() {
    scheduledRender = false
    render()
  })
}

window.addEventListener('resize', () => scheduleRender())
if ('fonts' in document) {
  void document.fonts.ready.then(() => scheduleRender())
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function setRect(node: HTMLElement, box: RectBox): void {
  node.style.left = `${box.x}px`
  node.style.top = `${box.y}px`
  node.style.width = `${box.width}px`
}

function measureHeight(node: HTMLElement): number {
  return Math.ceil(node.getBoundingClientRect().height)
}

function applyMeasureProjection(base: BaseLayout): void {
  domCache.poster.style.width = `${base.width}px`

  setRect(domCache.issueTag, {
    x: base.issueX,
    y: base.issueY,
    width: base.issueWidth,
    height: 0,
  })
  setRect(domCache.titleBlock, {
    x: base.titleX,
    y: base.titleY,
    width: base.titleWidth,
    height: 0,
  })
  setRect(domCache.deckCenter, {
    x: base.centerX,
    y: base.wide ? 126 : 0,
    width: base.centerWidth,
    height: 0,
  })
  setRect(domCache.deckRight, {
    x: base.rightX,
    y: base.wide ? 124 : 0,
    width: base.rightWidth,
    height: 0,
  })
  setRect(domCache.deckLeft, {
    x: base.leftX,
    y: base.wide ? 356 : 0,
    width: base.leftWidth,
    height: 0,
  })
  setRect(domCache.deckBottom, {
    x: base.bottomX,
    y: base.wide ? 716 : 0,
    width: base.bottomWidth,
    height: 0,
  })
  setRect(domCache.footerNote, {
    x: base.bodyLeft,
    y: base.wide ? 760 : 0,
    width: base.footerWidth,
    height: 0,
  })
  setRect(domCache.status, {
    x: base.wide ? 28 : 20,
    y: base.viewportHeight - 120,
    width: base.statusWidth,
    height: 0,
  })
}

function readHeights(): MeasuredHeights {
  return {
    issue: measureHeight(domCache.issueTag),
    title: measureHeight(domCache.titleBlock),
    center: measureHeight(domCache.deckCenter),
    right: measureHeight(domCache.deckRight),
    left: measureHeight(domCache.deckLeft),
    bottom: measureHeight(domCache.deckBottom),
    footer: measureHeight(domCache.footerNote),
    status: measureHeight(domCache.status),
  }
}

function computeBaseLayout(viewportWidth: number, viewportHeight: number): BaseLayout {
  const width = Math.max(320, Math.min(1380, viewportWidth - 28))
  const wide = width >= 980
  const bodyLeft = wide ? 56 : 28
  const bodyRight = width - (wide ? 58 : 28)

  return {
    viewportHeight,
    width,
    wide,
    bodyLeft,
    bodyRight,
    issueX: bodyLeft,
    issueY: wide ? 28 : 22,
    issueWidth: wide ? 296 : width - bodyLeft * 2,
    titleX: bodyLeft,
    titleY: wide ? 74 : 68,
    titleWidth: wide ? Math.min(650, width * 0.47) : width - bodyLeft * 2,
    centerX: wide ? Math.round(width * 0.53) : bodyLeft,
    centerWidth: wide ? Math.min(290, width * 0.2) : width - bodyLeft * 2,
    rightX: wide ? width - 248 : bodyLeft,
    rightWidth: wide ? 182 : width - bodyLeft * 2,
    leftX: bodyLeft,
    leftWidth: wide ? 286 : width - bodyLeft * 2,
    bottomX: wide ? Math.round(width * 0.54) : bodyLeft,
    bottomWidth: wide ? 344 : width - bodyLeft * 2,
    footerWidth: wide ? 304 : width - bodyLeft * 2,
    statusWidth: wide ? width - 56 : width - 40,
    ribbonBox: wide
      ? { x: Math.round(width * 0.41), y: 18, width: Math.min(470, width * 0.42), height: 710 }
      : { x: Math.round(width * 0.17), y: 0, width: Math.round(width * 0.68), height: 330 },
    blobBox: wide
      ? { x: 58, y: 540, width: 328, height: 208 }
      : { x: bodyLeft, y: 0, width: Math.round(width * 0.42), height: 150 },
  }
}

function computeLayout(base: BaseLayout, measured: MeasuredHeights): LayoutMetrics {
  const issueBox = {
    x: base.issueX,
    y: base.issueY,
    width: base.issueWidth,
    height: measured.issue,
  }

  if (base.wide) {
    const titleBox = {
      x: base.titleX,
      y: base.titleY,
      width: base.titleWidth,
      height: measured.title,
    }
    const centerBox = {
      x: base.centerX,
      y: 126,
      width: base.centerWidth,
      height: measured.center,
    }
    const rightBox = {
      x: base.rightX,
      y: 124,
      width: base.rightWidth,
      height: measured.right,
    }
    const leftBox = {
      x: base.leftX,
      y: 356,
      width: base.leftWidth,
      height: measured.left,
    }
    const bottomBox = {
      x: base.bottomX,
      y: 716,
      width: base.bottomWidth,
      height: measured.bottom,
    }
    const footerBox = {
      x: base.bodyLeft,
      y: Math.max(base.blobBox.y + base.blobBox.height + 12, leftBox.y + leftBox.height + 28),
      width: base.footerWidth,
      height: measured.footer,
    }

    return {
      width: base.width,
      wide: true,
      bodyLeft: base.bodyLeft,
      bodyRight: base.bodyRight,
      height: 0,
      stageTop: 102,
      issueBox,
      titleBox,
      centerBox,
      rightBox,
      leftBox,
      bottomBox,
      footerBox,
      statusBox: { x: 28, y: 0, width: base.statusWidth, height: measured.status },
      ribbonBox: base.ribbonBox,
      blobBox: base.blobBox,
    }
  }

  const titleBox = {
    x: base.titleX,
    y: issueBox.y + issueBox.height + 26,
    width: base.titleWidth,
    height: measured.title,
  }
  const centerBox = {
    x: base.centerX,
    y: titleBox.y + titleBox.height + 28,
    width: base.centerWidth,
    height: measured.center,
  }
  const rightBox = {
    x: base.rightX,
    y: centerBox.y + centerBox.height + 18,
    width: base.rightWidth,
    height: measured.right,
  }
  const ribbonBox = {
    ...base.ribbonBox,
    y: rightBox.y + rightBox.height + 36,
  }
  const leftBox = {
    x: base.leftX,
    y: ribbonBox.y + ribbonBox.height + 34,
    width: base.leftWidth,
    height: measured.left,
  }
  const blobBox = {
    ...base.blobBox,
    y: leftBox.y + leftBox.height + 30,
  }
  const bottomBox = {
    x: base.bottomX,
    y: blobBox.y + blobBox.height + 26,
    width: base.bottomWidth,
    height: measured.bottom,
  }
  const footerBox = {
    x: base.bodyLeft,
    y: bottomBox.y + bottomBox.height + 22,
    width: base.footerWidth,
    height: measured.footer,
  }

  return {
    width: base.width,
    wide: false,
    bodyLeft: base.bodyLeft,
    bodyRight: base.bodyRight,
    height: 0,
    stageTop: footerBox.y + footerBox.height + 42,
    issueBox,
    titleBox,
    centerBox,
    rightBox,
    leftBox,
    bottomBox,
    footerBox,
    statusBox: { x: 20, y: 0, width: base.statusWidth, height: measured.status },
    ribbonBox,
    blobBox,
  }
}

function subtractIntervals(
  rangeLeft: number,
  rangeRight: number,
  intervals: Array<{ left: number, right: number }>,
): Array<{ left: number, right: number }> {
  if (intervals.length === 0) return [{ left: rangeLeft, right: rangeRight }]

  const sorted = intervals
    .map((interval) => ({
      left: clamp(interval.left, rangeLeft, rangeRight),
      right: clamp(interval.right, rangeLeft, rangeRight),
    }))
    .filter((interval) => interval.right - interval.left > 0)
    .sort((a, b) => a.left - b.left)

  const merged: Array<{ left: number, right: number }> = []
  for (const interval of sorted) {
    const last = merged[merged.length - 1]
    if (last === undefined || interval.left > last.right) {
      merged.push({ ...interval })
    } else {
      last.right = Math.max(last.right, interval.right)
    }
  }

  const slots: Array<{ left: number, right: number }> = []
  let cursor = rangeLeft
  for (const interval of merged) {
    if (interval.left > cursor) slots.push({ left: cursor, right: interval.left })
    cursor = Math.max(cursor, interval.right)
  }
  if (cursor < rangeRight) slots.push({ left: cursor, right: rangeRight })
  return slots
}

function lineOverlaps(box: RectBox, lineTop: number): boolean {
  return lineTop + LINE_HEIGHT > box.y && lineTop < box.y + box.height
}

function ribbonLocalBounds(t: number, width: number): { left: number, right: number } {
  const center =
    width * 0.5 +
    width * 0.13 * Math.sin(t * Math.PI * 2.35 + 0.35) +
    width * 0.045 * Math.sin(t * Math.PI * 5.6 - 0.4)
  const half =
    width * 0.18 +
    width * 0.055 * Math.cos(t * Math.PI * 1.7 - 0.2) +
    width * 0.03 * Math.sin(t * Math.PI * 4.2 + 0.25)

  return {
    left: clamp(center - half, width * 0.05, width * 0.72),
    right: clamp(center + half, width * 0.28, width * 0.95),
  }
}

function ribbonInterval(layout: LayoutMetrics, lineTop: number): { left: number, right: number } | null {
  const { ribbonBox } = layout
  const lineMid = lineTop + LINE_HEIGHT / 2
  if (lineMid < ribbonBox.y || lineMid > ribbonBox.y + ribbonBox.height) return null
  const t = clamp((lineMid - ribbonBox.y) / ribbonBox.height, 0, 1)
  const bounds = ribbonLocalBounds(t, ribbonBox.width)
  return {
    left: ribbonBox.x + bounds.left - 14,
    right: ribbonBox.x + bounds.right + 14,
  }
}

function blobInterval(layout: LayoutMetrics, lineTop: number): { left: number, right: number } | null {
  const { blobBox } = layout
  const lineMid = lineTop + LINE_HEIGHT / 2
  const cy = blobBox.y + blobBox.height * 0.52
  const dy = (lineMid - cy) / (blobBox.height * 0.52)
  if (Math.abs(dy) >= 1) return null

  const rx = blobBox.width * (0.5 + 0.06 * Math.cos(dy * Math.PI * 1.5))
  const wobble = blobBox.width * 0.06 * Math.sin(dy * Math.PI * 3.4)
  const half = rx * Math.sqrt(1 - dy * dy)
  const cx = blobBox.x + blobBox.width * 0.5 + wobble

  return {
    left: cx - half - 10,
    right: cx + half + 10,
  }
}

function buildRibbonPath(width: number, height: number): string {
  const leftPoints: string[] = []
  const rightPoints: string[] = []
  const steps = 28

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = t * height
    const bounds = ribbonLocalBounds(t, width)
    leftPoints.push(`${bounds.left.toFixed(2)},${y.toFixed(2)}`)
    rightPoints.push(`${bounds.right.toFixed(2)},${y.toFixed(2)}`)
  }

  return `M ${leftPoints.join(' L ')} L ${rightPoints.reverse().join(' L ')} Z`
}

function buildRibbonContour(width: number, height: number, ratio: number): string {
  const points: string[] = []
  const steps = 24
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = t * height
    const bounds = ribbonLocalBounds(t, width)
    const wobble = Math.sin(t * Math.PI * 6 + ratio * Math.PI * 2) * width * 0.014
    const x = bounds.left + (bounds.right - bounds.left) * ratio + wobble
    points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }
  return `M ${points.join(' L ')}`
}

function buildRibbonSvg(width: number, height: number): string {
  const path = buildRibbonPath(width, height)
  const contours = [0.16, 0.29, 0.43, 0.58, 0.73, 0.86]
    .map((ratio, index) => (
      `<path d="${buildRibbonContour(width, height, ratio)}" ` +
      `stroke="rgba(255, 243, 222, ${0.34 - index * 0.035})" stroke-width="${1.4 + index * 0.14}" fill="none" stroke-linecap="round" />`
    ))
    .join('')

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="ribbonFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#ebbb75" />
          <stop offset="34%" stop-color="#c98747" />
          <stop offset="68%" stop-color="#6f4929" />
          <stop offset="100%" stop-color="#2a1b11" />
        </linearGradient>
        <linearGradient id="ribbonHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.72)" />
          <stop offset="45%" stop-color="rgba(255,255,255,0)" />
          <stop offset="100%" stop-color="rgba(255,255,255,0.1)" />
        </linearGradient>
      </defs>
      <path d="${path}" fill="url(#ribbonFill)" />
      <path d="${path}" fill="url(#ribbonHighlight)" opacity="0.55" />
      ${contours}
    </svg>
  `
}

function buildBlobSvg(width: number, height: number): string {
  const cx = width * 0.5
  const cy = height * 0.52
  const steps = 36
  const outer: string[] = []

  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * Math.PI * 2
    const base =
      1 +
      0.16 * Math.sin(angle * 3 + 0.5) +
      0.1 * Math.cos(angle * 5 - 0.4)
    const rx = width * 0.42 * base
    const ry = height * 0.3 * base
    const x = cx + Math.cos(angle) * rx
    const y = cy + Math.sin(angle) * ry
    outer.push(`${x.toFixed(2)},${y.toFixed(2)}`)
  }

  const loops = [0.78, 0.6, 0.44]
    .map((scale) => {
      const points: string[] = []
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * Math.PI * 2
        const wobble = 1 + 0.08 * Math.sin(angle * 4 + scale * 6)
        const rx = width * 0.42 * scale * wobble
        const ry = height * 0.3 * scale * wobble
        const x = cx + Math.cos(angle) * rx
        const y = cy + Math.sin(angle) * ry
        points.push(`${x.toFixed(2)},${y.toFixed(2)}`)
      }
      return `<path d="M ${points.join(' L ')} Z" fill="none" stroke="rgba(255, 244, 228, 0.5)" stroke-width="2.2" />`
    })
    .join('')

  return `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <radialGradient id="blobFill" cx="45%" cy="35%">
          <stop offset="0%" stop-color="#e9d3b0" />
          <stop offset="48%" stop-color="#b99367" />
          <stop offset="100%" stop-color="#6e4b31" />
        </radialGradient>
      </defs>
      <path d="M ${outer.join(' L ')} Z" fill="url(#blobFill)" />
      ${loops}
    </svg>
  `
}

function getSlots(layout: LayoutMetrics, lineTop: number): Array<{ x: number, width: number }> {
  if (!layout.wide) {
    return [{ x: layout.bodyLeft, width: layout.bodyRight - layout.bodyLeft }]
  }

  const intervals: Array<{ left: number, right: number }> = []
  const obstacleGap = 18

  for (const box of [layout.titleBox, layout.centerBox, layout.rightBox, layout.leftBox, layout.bottomBox, layout.footerBox]) {
    if (lineOverlaps(box, lineTop)) {
      intervals.push({
        left: box.x - obstacleGap,
        right: box.x + box.width + obstacleGap,
      })
    }
  }

  const ribbon = ribbonInterval(layout, lineTop)
  if (ribbon !== null) intervals.push(ribbon)

  const blob = blobInterval(layout, lineTop)
  if (blob !== null) intervals.push(blob)

  return subtractIntervals(layout.bodyLeft, layout.bodyRight, intervals)
    .map((slot) => ({ x: slot.left, width: slot.right - slot.left }))
    .filter((slot) => slot.width >= 146)
}

function buildLines(layout: LayoutMetrics): { lines: PositionedLine[], contentBottom: number } {
  const lines: PositionedLine[] = []
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 }
  let rowIndex = 0
  let lastTop = layout.stageTop
  const maxRows = 220

  while (rowIndex < maxRows) {
    const lineTop = layout.stageTop + rowIndex * LINE_HEIGHT
    const slots = getSlots(layout, lineTop)

    if (slots.length === 0) {
      rowIndex++
      continue
    }

    for (const slot of slots) {
      const line = layoutNextLine(prepared, cursor, slot.width)
      if (line === null) {
        const contentBottom = Math.max(
          layout.footerBox.y + layout.footerBox.height,
          layout.ribbonBox.y + layout.ribbonBox.height + 44,
          layout.blobBox.y + layout.blobBox.height + 32,
          lastTop + LINE_HEIGHT,
        )
        return { lines, contentBottom }
      }

      const lineNumber = lines.length + 1
      lines.push({
        left: slot.x,
        top: lineTop,
        text: line.text,
        title:
          `L${lineNumber} • ${line.start.segmentIndex}:${line.start.graphemeIndex}→` +
          `${line.end.segmentIndex}:${line.end.graphemeIndex}` +
          (line.trailingDiscretionaryHyphen ? ' • discretionary hyphen' : '') +
          ` • ${line.width.toFixed(2)}px`,
      })
      cursor = line.end
      lastTop = lineTop
    }

    rowIndex++
  }

  return {
    lines,
    contentBottom: Math.max(
      layout.footerBox.y + layout.footerBox.height,
      lastTop + LINE_HEIGHT,
      layout.ribbonBox.y + layout.ribbonBox.height + 44,
      layout.blobBox.y + layout.blobBox.height + 32,
    ),
  }
}

function ensureLineNode(index: number): HTMLDivElement {
  let node = domCache.lineNodes[index]
  if (node === undefined) {
    node = document.createElement('div')
    node.className = 'line'
    domCache.lineNodes[index] = node
    domCache.lineStage.appendChild(node)
  }
  return node
}

function applySceneProjection(layout: LayoutMetrics, lines: PositionedLine[]): void {
  domCache.poster.style.height = `${layout.height}px`

  setRect(domCache.issueTag, layout.issueBox)
  setRect(domCache.titleBlock, layout.titleBox)
  setRect(domCache.deckCenter, layout.centerBox)
  setRect(domCache.deckRight, layout.rightBox)
  setRect(domCache.deckLeft, layout.leftBox)
  setRect(domCache.deckBottom, layout.bottomBox)
  setRect(domCache.footerNote, layout.footerBox)
  setRect(domCache.status, layout.statusBox)

  setRect(domCache.ribbonArt, layout.ribbonBox)
  domCache.ribbonArt.style.height = `${layout.ribbonBox.height}px`
  domCache.ribbonArt.innerHTML = buildRibbonSvg(layout.ribbonBox.width, layout.ribbonBox.height)

  setRect(domCache.blobArt, layout.blobBox)
  domCache.blobArt.style.height = `${layout.blobBox.height}px`
  domCache.blobArt.innerHTML = buildBlobSvg(layout.blobBox.width, layout.blobBox.height)

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!
    const node = ensureLineNode(i)
    node.textContent = line.text
    node.title = line.title
    node.style.left = `${line.left}px`
    node.style.top = `${line.top}px`
  }

  for (let i = lines.length; i < domCache.lineNodes.length; i++) {
    domCache.lineNodes[i]!.remove()
  }
  domCache.lineNodes.length = lines.length

  domCache.statusMeta.textContent =
    `${lines.length} positioned lines • ${layout.width}px poster • explicit resize pass`
}

function render(): void {
  const viewportWidth = document.documentElement.clientWidth
  const viewportHeight = document.documentElement.clientHeight

  const base = computeBaseLayout(viewportWidth, viewportHeight)
  applyMeasureProjection(base)
  const measured = readHeights()
  const layout = computeLayout(base, measured)
  const { lines, contentBottom } = buildLines(layout)

  const height = Math.max(
    viewportHeight - 32,
    contentBottom + measured.status + 74,
    layout.blobBox.y + layout.blobBox.height + measured.status + 90,
  )

  applySceneProjection({
    ...layout,
    height,
    statusBox: {
      x: layout.statusBox.x,
      y: height - measured.status - 24,
      width: layout.statusBox.width,
      height: measured.status,
    },
  }, lines)
}

scheduleRender()
