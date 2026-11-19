/**
 * Needle-and-yarn diagrams for hand techniques, seen from the knitter's side.
 *
 * A technique is a list of keyframes. Each keyframe fixes where the right
 * needle is, where the working yarn runs, and what is in front of what. The
 * view interpolates between keyframes, so the motion is continuous, and the
 * depth order always comes from the keyframe data rather than from drawing
 * order chosen by eye.
 *
 * Conventions checked against published descriptions of Western knitting:
 *  - A stitch sits on the needle with its right leg in front (Western mount).
 *  - Knit: needle enters front to back, left to right; yarn starts behind,
 *    comes forward between the needles and over the right needle.
 *  - Purl: yarn starts in front; needle enters right to left, ending in front
 *    of the left needle; yarn goes over the top of the right needle and down
 *    behind it.
 * Hands are not drawn.
 */
export type P = [number, number]
export interface Strand { pts: P[]; z: number }
export interface Frame {
  title: string
  text: string
  /** Right needle: tip position and angle in degrees (0 = shaft pointing right, positive = clockwise). */
  tip: P
  angle: number
  needleZ: number
  /** The working yarn, as four strands joined end to end: a, b, c, d. */
  yarn: [Strand, Strand, Strand, Strand]
  /** The stitch being worked: its back leg and front leg. */
  old: { back: Strand; front: Strand }
  /** How many unworked stitches are still on the left needle, not counting the one being worked. */
  waiting: number
  view: View
  arrow?: P[]
  labels?: Label[]
}
/** The visible area for a step, as x, y, width, height. Every view is 5:3 so the picture never changes shape. */
export type View = [number, number, number, number]
/** A name written on the picture. `side` says which way the text runs from its anchor point. */
export interface Label { at: P; text: string; side: 'start' | 'end' }
export interface Technique { id: 'knit' | 'purl'; name: string; frames: Frame[] }

/** Depth layers, back to front. */
export const Z = { behind: 0, backLeg: 1, leftNeedle: 3, between: 3.5, frontLeg: 5, rightFront: 6, front: 7 }

export const LEFT_NEEDLE: { from: P; tip: P } = { from: [-10, 118], tip: [196, 100] }
export const leftY = (x: number) => 118 - ((x + 10) * 18) / 206
export const LEFT_XS = [60, 92, 124]
const WORK_X = 156

/** A stitch hanging on the left needle at x: back leg (left, behind the needle) and front leg (right, in front). */
export function leftStitch(x: number): { back: P[]; front: P[] } {
  const y = leftY(x)
  return {
    back: [[x - 9, y + 48], [x - 9, y + 22], [x - 7, y + 5], [x - 2, y - 7]],
    front: [[x - 2, y - 7], [x + 5, y - 9], [x + 8, y + 5], [x + 9, y + 22], [x + 9, y + 48]],
  }
}
/** The same stitch after it has been slipped off, hanging around the base of the new stitch at n. */
function dropped(n: P): { back: P[]; front: P[] } {
  return {
    back: [[n[0] - 12, n[1] + 52], [n[0] - 11, n[1] + 34], [n[0] - 8, n[1] + 22], [n[0] - 1, n[1] + 14]],
    front: [[n[0] - 1, n[1] + 14], [n[0] + 4, n[1] + 13], [n[0] + 8, n[1] + 22], [n[0] + 10, n[1] + 34], [n[0] + 11, n[1] + 52]],
  }
}
/** A point on the right needle, t units back from its tip. */
export function onNeedle(tip: P, angle: number, t: number): P {
  const a = (angle * Math.PI) / 180
  return [tip[0] + Math.cos(a) * t, tip[1] + Math.sin(a) * t]
}
/** Stitches already worked sit this far back from the right needle tip. */
export const WORKED_AT = [70, 94]
/** Where the working yarn leaves the last worked stitch: the foot of its back leg. */
const foot = (tip: P, angle: number): P => { const p = onNeedle(tip, angle, WORKED_AT[0]); return [p[0] - 9, p[1] + 16] }

const s = (z: number, ...pts: P[]): Strand => ({ pts, z })
const on = leftStitch(WORK_X)
const OLD_ON = { back: s(Z.backLeg, ...on.back), front: s(Z.frontLeg, ...on.front) }

const READY: { tip: P; angle: number } = { tip: [232, 120], angle: 30 }
const DONE: { tip: P; angle: number } = { tip: [190, 112], angle: 34 }
const NEW = onNeedle(DONE.tip, DONE.angle, 12)
const off = dropped(NEW)

const K_IN: { tip: P; angle: number } = { tip: [140, 78], angle: 54 }
const K_THROUGH: { tip: P; angle: number } = { tip: [146, 116], angle: 38 }
const K_HAND: P = [332, 36]

export const KNIT: Technique = {
  id: 'knit', name: 'The knit stitch',
  frames: [
    { title: 'Ready', view: [62, 36, 250, 150], labels: [{ at: [66, 96], text: 'left needle', side: 'start' }, { at: [252, 126], text: 'right needle', side: 'end' }, { at: [306, 62], text: 'working yarn, behind', side: 'end' }], text: 'Stitches wait on the left needle. The working yarn hangs behind the needles, running to your right hand.',
      ...READY, needleZ: Z.rightFront, old: OLD_ON, waiting: 3,
      yarn: [s(Z.behind, foot(READY.tip, READY.angle), [296, 140], [304, 112]), s(Z.behind, [304, 112], [310, 96], [316, 80]),
        s(Z.behind, [316, 80], [321, 66], [325, 54]), s(Z.behind, [325, 54], [329, 44], K_HAND)] },
    { title: 'In through the front door', view: [92, 46, 150, 90], arrow: [[204, 130], [186, 104], [168, 80]], labels: [{ at: [152, 60], text: 'tip ends up behind', side: 'start' }, { at: [174, 132], text: 'front leg', side: 'start' }], text: 'The right needle goes into the first stitch from left to right. It passes behind the front leg of the stitch and ends up behind the left needle.',
      ...K_IN, needleZ: 2, old: OLD_ON, waiting: 3,
      yarn: [s(Z.behind, foot(K_IN.tip, K_IN.angle), [196, 118], [215, 98]), s(Z.behind, [215, 98], [235, 85], [255, 73]),
        s(Z.behind, [255, 73], [275, 62], [295, 52]), s(Z.behind, [295, 52], [315, 43], K_HAND)] },
    { title: 'Once around the back', view: [92, 46, 150, 90], arrow: [[134, 106], [131, 86], [146, 76], [164, 80]], labels: [{ at: [240, 58], text: 'yarn comes up between the needles', side: 'end' }], text: 'The yarn comes from behind, forward between the two needles, and over the right needle from left to right.',
      ...K_IN, needleZ: 2, old: OLD_ON, waiting: 3,
      yarn: [s(Z.behind, foot(K_IN.tip, K_IN.angle), [150, 120], [143, 97]), s(2.5, [143, 97], [146, 88], [157, 86]),
        s(Z.behind, [157, 86], [175, 78], [200, 68]), s(Z.behind, [200, 68], [270, 48], K_HAND)] },
    { title: 'Peek through the window', view: [96, 66, 150, 90], arrow: [[136, 86], [133, 104], [140, 120]], labels: [{ at: [176, 116], text: 'new loop', side: 'start' }], text: 'The right needle draws back toward you through the old stitch, bringing the wrapped yarn with it as a new loop.',
      ...K_THROUGH, needleZ: Z.rightFront, old: OLD_ON, waiting: 3,
      yarn: [s(Z.behind, foot(K_THROUGH.tip, K_THROUGH.angle), [172, 130], [158, 112]), s(6.5, [158, 112], [151, 121], [156, 131]),
        s(Z.behind, [156, 131], [162, 122], [156, 111]), s(Z.behind, [156, 111], [230, 62], K_HAND)] },
    { title: 'Off jumps Jack', view: [128, 72, 150, 90], arrow: [[162, 98], [176, 92], [190, 96]], labels: [{ at: [214, 112], text: 'new stitch', side: 'start' }, { at: [214, 150], text: 'old stitch', side: 'start' }], text: 'The old stitch slides off the left needle and hangs below the new one. The new stitch is on the right needle, right leg in front.',
      ...DONE, needleZ: Z.rightFront, waiting: 3,
      // A knit loop comes forward through the old stitch, so the old stitch is drawn behind everything.
      old: { back: s(-1, ...off.back), front: s(-1, ...off.front) },
      yarn: [s(Z.behind, foot(DONE.tip, DONE.angle), [220, 152], [203, 134]), s(6.5, [203, 134], [196, 122], [199, 110]),
        s(Z.behind, [199, 110], [204, 120], [198, 134]), s(Z.behind, [198, 134], [250, 70], K_HAND)] },
  ],
}

const P_IN: { tip: P; angle: number } = { tip: [138, 90], angle: 30 }
const P_THROUGH: { tip: P; angle: number } = { tip: [152, 78], angle: 50 }
const P_HAND: P = [300, 224]

export const PURL: Technique = {
  id: 'purl', name: 'The purl stitch',
  frames: [
    { title: 'Yarn in front', view: [62, 56, 250, 150], labels: [{ at: [66, 96], text: 'left needle', side: 'start' }, { at: [250, 128], text: 'right needle', side: 'end' }, { at: [286, 200], text: 'working yarn, in front', side: 'end' }], text: 'Before a purl, the working yarn hangs in front of the needles, toward you.',
      ...READY, needleZ: Z.rightFront, old: OLD_ON, waiting: 3,
      yarn: [s(Z.front, foot(READY.tip, READY.angle), [288, 185], [291, 196]), s(Z.front, [291, 196], [294, 204], [296, 210]),
        s(Z.front, [296, 210], [298, 216], [299, 220]), s(Z.front, [299, 220], [300, 222], P_HAND)] },
    { title: 'In from the right', view: [92, 52, 150, 90], arrow: [[208, 142], [184, 128], [158, 114]], labels: [{ at: [150, 68], text: 'tip ends up in front', side: 'start' }], text: 'The right needle goes into the first stitch from right to left. It passes behind the front leg and its tip ends up in front of the left needle.',
      ...P_IN, needleZ: 4, old: OLD_ON, waiting: 3,
      yarn: [s(Z.front, foot(P_IN.tip, P_IN.angle), [215, 165], [240, 185]), s(Z.front, [240, 185], [258, 198], [272, 207]),
        s(Z.front, [272, 207], [283, 214], [291, 219]), s(Z.front, [291, 219], [296, 222], P_HAND)] },
    { title: 'Over the top', view: [92, 52, 150, 90], arrow: [[168, 112], [164, 94], [152, 80], [138, 82]], labels: [{ at: [240, 64], text: 'then down behind the needle', side: 'end' }], text: 'The yarn goes up over the top of the right needle, down behind it between the two needles, and back to the front.',
      ...P_IN, needleZ: 4, old: OLD_ON, waiting: 3,
      yarn: [s(Z.front, foot(P_IN.tip, P_IN.angle), [170, 128], [157, 110]), s(Z.front, [157, 110], [153, 99], [151, 89]),
        s(Z.between, [151, 89], [143, 90], [144, 101]), s(Z.front, [144, 101], [200, 190], P_HAND)] },
    { title: 'Push it through', view: [96, 46, 150, 90], arrow: [[146, 108], [140, 92], [146, 76]], labels: [{ at: [244, 64], text: 'new loop, behind the left needle', side: 'end' }], text: 'The right needle tip moves backward through the old stitch, carrying the wrapped yarn with it as a new loop behind the left needle.',
      ...P_THROUGH, needleZ: 0.5, old: OLD_ON, waiting: 3,
      yarn: [s(Z.front, foot(P_THROUGH.tip, P_THROUGH.angle), [172, 128], [160, 113]), s(0.7, [160, 113], [164, 86], [154, 112]),
        s(Z.front, [154, 112], [152, 120], [152, 128]), s(Z.front, [152, 128], [200, 195], P_HAND)] },
    { title: 'Slide it off', view: [128, 72, 150, 90], arrow: [[162, 98], [176, 92], [190, 96]], labels: [{ at: [214, 112], text: 'new stitch', side: 'start' }, { at: [214, 138], text: 'purl bump', side: 'start' }], text: 'The old stitch slides off the left needle. Its top now lies across the front of the new stitch: that is the purl bump.',
      ...DONE, needleZ: Z.rightFront, waiting: 3,
      // A purl loop goes backward through the old stitch, so the top of the old stitch is drawn in front.
      old: { back: s(Z.backLeg, ...off.back), front: s(8, ...off.front) },
      yarn: [s(Z.front, foot(DONE.tip, DONE.angle), [222, 152], [204, 136]), s(6.5, [204, 136], [197, 124], [199, 110]),
        s(Z.behind, [199, 110], [205, 120], [197, 135]), s(Z.front, [197, 135], [240, 190], P_HAND)] },
  ],
}

/* ---------- generic scenes: what the view actually draws ---------- */

export interface SceneNeedle { from: P; to: P; z: number }
export interface SceneStrand { pts: P[]; z: number; cls: 'work' | 'old' | 'rest' }
export interface Scene { needles: SceneNeedle[]; strands: SceneStrand[] }
export interface DiagramStep { title: string; text: string; scene: Scene; view: View; /** The movement to make in this step. */ arrow?: P[]; labels?: Label[] }
export interface Diagram { id: string; name: string; steps: DiagramStep[] }

const NEEDLE_LENGTH = 190
/** A stitch sitting on a needle at p: back leg behind the needle, front leg in front. */
function stitchAt(p: P): { back: P[]; front: P[] } {
  return {
    back: [[p[0] - 9, p[1] + 44], [p[0] - 9, p[1] + 20], [p[0] - 7, p[1] + 4], [p[0] - 2, p[1] - 7]],
    front: [[p[0] - 2, p[1] - 7], [p[0] + 5, p[1] - 9], [p[0] + 8, p[1] + 5], [p[0] + 9, p[1] + 20], [p[0] + 9, p[1] + 44]],
  }
}

/** The scene for one knit or purl keyframe. */
export function sceneOf(f: Frame): Scene {
  const strands: SceneStrand[] = []
  for (const x of LEFT_XS) {
    const st = leftStitch(x)
    strands.push({ pts: st.back, z: Z.backLeg, cls: 'rest' }, { pts: st.front, z: Z.frontLeg, cls: 'rest' })
  }
  for (const t of WORKED_AT) {
    const st = stitchAt(onNeedle(f.tip, f.angle, t))
    strands.push({ pts: st.back, z: f.needleZ - 0.05, cls: 'rest' }, { pts: st.front, z: f.needleZ + 0.05, cls: 'rest' })
  }
  strands.push({ ...f.old.back, cls: 'old' }, { ...f.old.front, cls: 'old' })
  for (const st of f.yarn) strands.push({ ...st, cls: 'work' })
  return {
    needles: [
      { from: LEFT_NEEDLE.from, to: LEFT_NEEDLE.tip, z: Z.leftNeedle },
      { from: f.tip, to: onNeedle(f.tip, f.angle, NEEDLE_LENGTH), z: f.needleZ },
    ],
    strands,
  }
}
const diagram = (t: Technique): Diagram => ({ id: t.id, name: t.name, steps: t.frames.map((f) => ({ title: f.title, text: f.text, scene: sceneOf(f), view: f.view, arrow: f.arrow, labels: f.labels })) })

/*
 * Bind-off. Two stitches are on the right needle: A was knitted first and sits
 * further from the tip, B second. The left needle lifts A over B and over the
 * tip. Checked against the step photos of a published bind-off tutorial: the
 * left needle goes into the stitch further from the tip, in front of the right
 * needle, and the lifted stitch ends up around the base of the other.
 */
const BO_TIP: P = [226, 96], BO_ANGLE = 40
const BO_B = onNeedle(BO_TIP, BO_ANGLE, 40), BO_A = onNeedle(BO_TIP, BO_ANGLE, 64)
const BO_XS = [44, 76, 108, 140]
function bindOffScene(shift: P, a: { back: P[]; front: P[] }): Scene {
  const move = (p: P): P => [p[0] + shift[0], p[1] + shift[1]]
  const strands: SceneStrand[] = []
  for (const x of BO_XS) {
    const st = leftStitch(x)
    strands.push({ pts: st.back.map(move), z: Z.backLeg, cls: 'rest' }, { pts: st.front.map(move), z: Z.frontLeg, cls: 'rest' })
  }
  const b = stitchAt(BO_B)
  strands.push({ pts: b.back, z: 1.9, cls: 'work' }, { pts: b.front, z: 2.1, cls: 'work' })
  // The lifted stitch goes in front of everything on its front leg and behind everything on its back leg,
  // so it always encloses whatever it has been passed over.
  strands.push({ pts: a.back, z: 0.5, cls: 'old' }, { pts: a.front, z: 5.5, cls: 'old' })
  strands.push({ pts: [[BO_B[0] - 2, BO_B[1] - 7], [290, 70], [332, 36]], z: Z.behind, cls: 'work' })
  return {
    needles: [
      { from: move(LEFT_NEEDLE.from), to: move(LEFT_NEEDLE.tip), z: Z.leftNeedle },
      { from: BO_TIP, to: onNeedle(BO_TIP, BO_ANGLE, NEEDLE_LENGTH), z: 2 },
    ],
    strands,
  }
}
const A_ON = stitchAt(BO_A)
const A_FEET = { back: A_ON.back.slice(0, 2), front: A_ON.front.slice(3) }
const A_LIFTED = { back: [...A_FEET.back, [222, 104], [212, 84]] as P[], front: [[212, 84], [220, 80], [228, 92], ...A_FEET.front] as P[] }
const A_DROPPED = { back: [[250, 190], [246, 170], [244, 152], [250, 141]] as P[], front: [[250, 141], [262, 137], [270, 146], [272, 165], [274, 190]] as P[] }

export const BINDOFF: Diagram = {
  id: 'bindoff', name: 'Bind off',
  steps: [
    { title: 'Knit two stitches', view: [130, 56, 220, 132], labels: [{ at: [236, 112], text: 'second stitch', side: 'end' }, { at: [292, 150], text: 'first stitch', side: 'start' }, { at: [134, 84], text: 'left needle', side: 'start' }], text: 'Two stitches sit on the right needle. The blue one was knitted first, so it is further from the tip.', scene: bindOffScene([0, 0], A_ON) },
    { title: 'Pick up the first stitch', view: [150, 62, 190, 114], arrow: [[214, 150], [238, 146], [258, 140]], text: 'Push the left needle tip into the blue stitch from left to right, in front of the right needle.', scene: bindOffScene([74, 32], A_ON) },
    { title: 'Lift it over', view: [150, 62, 190, 114], arrow: [[284, 128], [262, 96], [236, 78]], labels: [{ at: [204, 74], text: 'over the tip', side: 'end' }], text: 'Lift the blue stitch over the pink one and over the tip of the right needle.', scene: bindOffScene([18, -14], A_LIFTED) },
    { title: 'Let it go', view: [150, 62, 190, 114], arrow: [[222, 90], [204, 94], [186, 98]], labels: [{ at: [282, 152], text: 'bound off', side: 'start' }], text: 'Slide the left needle out. The blue stitch now lies around the base of the pink one. One stitch is bound off. Knit one more and repeat.', scene: bindOffScene([0, 0], A_DROPPED) },
  ],
}

export const DIAGRAMS: Record<'knit' | 'purl' | 'bindoff', Diagram> = { knit: diagram(KNIT), purl: diagram(PURL), bindoff: BINDOFF }

const mix = (a: number, b: number, t: number) => a + (b - a) * t
const mixP = (a: P[], b: P[], t: number): P[] => a.map((p, i) => [mix(p[0], b[i][0], t), mix(p[1], b[i][1], t)])
const mixS = (a: Strand, b: Strand, t: number): Strand => ({ pts: mixP(a.pts, b.pts, t), z: t < 0.5 ? a.z : b.z })

/** The scene part-way between two keyframes. Positions blend; depth switches at the halfway point. */
export function between(a: Frame, b: Frame, t: number): Frame {
  return {
    ...(t < 0.5 ? a : b),
    tip: [mix(a.tip[0], b.tip[0], t), mix(a.tip[1], b.tip[1], t)],
    angle: mix(a.angle, b.angle, t),
    yarn: a.yarn.map((st, i) => mixS(st, b.yarn[i], t)) as Frame['yarn'],
    old: { back: mixS(a.old.back, b.old.back, t), front: mixS(a.old.front, b.old.front, t) },
  }
}

/** The scene part-way between two steps. Positions blend; depth switches at the halfway point. */
export function blend(a: Scene, b: Scene, t: number): Scene {
  return {
    needles: a.needles.map((n, i) => ({ from: mixP([n.from], [b.needles[i].from], t)[0], to: mixP([n.to], [b.needles[i].to], t)[0], z: t < 0.5 ? n.z : b.needles[i].z })),
    strands: a.strands.map((st, i) => ({ pts: mixP(st.pts, b.strands[i].pts, t), z: t < 0.5 ? st.z : b.strands[i].z, cls: st.cls })),
  }
}

/** A smooth open curve through the points. */
export function curve(p: P[]): string {
  const f = (n: number) => n.toFixed(1)
  let d = `M${f(p[0][0])},${f(p[0][1])}`
  for (let i = 0; i < p.length - 1; i++) {
    const a = p[Math.max(i - 1, 0)], b = p[i], c = p[i + 1], e = p[Math.min(i + 2, p.length - 1)]
    d += `C${f(b[0] + (c[0] - a[0]) / 6)},${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)},${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])},${f(c[1])}`
  }
  return d
}
