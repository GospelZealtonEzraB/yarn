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
}
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
    { title: 'Ready', text: 'Stitches wait on the left needle. The working yarn hangs behind the needles, running to your right hand.',
      ...READY, needleZ: Z.rightFront, old: OLD_ON, waiting: 3,
      yarn: [s(Z.behind, foot(READY.tip, READY.angle), [296, 140], [304, 112]), s(Z.behind, [304, 112], [310, 96], [316, 80]),
        s(Z.behind, [316, 80], [321, 66], [325, 54]), s(Z.behind, [325, 54], [329, 44], K_HAND)] },
    { title: 'In through the front door', text: 'The right needle goes into the first stitch from left to right. It passes behind the front leg of the stitch and ends up behind the left needle.',
      ...K_IN, needleZ: 2, old: OLD_ON, waiting: 3,
      yarn: [s(Z.behind, foot(K_IN.tip, K_IN.angle), [196, 118], [215, 98]), s(Z.behind, [215, 98], [235, 85], [255, 73]),
        s(Z.behind, [255, 73], [275, 62], [295, 52]), s(Z.behind, [295, 52], [315, 43], K_HAND)] },
    { title: 'Once around the back', text: 'The yarn comes from behind, forward between the two needles, and over the right needle from left to right.',
      ...K_IN, needleZ: 2, old: OLD_ON, waiting: 3,
      yarn: [s(Z.behind, foot(K_IN.tip, K_IN.angle), [150, 120], [143, 97]), s(2.5, [143, 97], [146, 88], [157, 86]),
        s(Z.behind, [157, 86], [175, 78], [200, 68]), s(Z.behind, [200, 68], [270, 48], K_HAND)] },
    { title: 'Peek through the window', text: 'The right needle draws back toward you through the old stitch, bringing the wrapped yarn with it as a new loop.',
      ...K_THROUGH, needleZ: Z.rightFront, old: OLD_ON, waiting: 3,
      yarn: [s(Z.behind, foot(K_THROUGH.tip, K_THROUGH.angle), [172, 130], [158, 112]), s(6.5, [158, 112], [151, 121], [156, 131]),
        s(Z.behind, [156, 131], [162, 122], [156, 111]), s(Z.behind, [156, 111], [230, 62], K_HAND)] },
    { title: 'Off jumps Jack', text: 'The old stitch slides off the left needle and hangs below the new one. The new stitch is on the right needle, right leg in front.',
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
    { title: 'Yarn in front', text: 'Before a purl, the working yarn hangs in front of the needles, toward you.',
      ...READY, needleZ: Z.rightFront, old: OLD_ON, waiting: 3,
      yarn: [s(Z.front, foot(READY.tip, READY.angle), [288, 185], [291, 196]), s(Z.front, [291, 196], [294, 204], [296, 210]),
        s(Z.front, [296, 210], [298, 216], [299, 220]), s(Z.front, [299, 220], [300, 222], P_HAND)] },
    { title: 'In from the right', text: 'The right needle goes into the first stitch from right to left. It passes behind the front leg and its tip ends up in front of the left needle.',
      ...P_IN, needleZ: 4, old: OLD_ON, waiting: 3,
      yarn: [s(Z.front, foot(P_IN.tip, P_IN.angle), [215, 165], [240, 185]), s(Z.front, [240, 185], [258, 198], [272, 207]),
        s(Z.front, [272, 207], [283, 214], [291, 219]), s(Z.front, [291, 219], [296, 222], P_HAND)] },
    { title: 'Over the top', text: 'The yarn goes up over the top of the right needle, down behind it between the two needles, and back to the front.',
      ...P_IN, needleZ: 4, old: OLD_ON, waiting: 3,
      yarn: [s(Z.front, foot(P_IN.tip, P_IN.angle), [170, 128], [157, 110]), s(Z.front, [157, 110], [153, 99], [151, 89]),
        s(Z.between, [151, 89], [143, 90], [144, 101]), s(Z.front, [144, 101], [200, 190], P_HAND)] },
    { title: 'Push it through', text: 'The right needle tip moves backward through the old stitch, carrying the wrapped yarn with it as a new loop behind the left needle.',
      ...P_THROUGH, needleZ: 0.5, old: OLD_ON, waiting: 3,
      yarn: [s(Z.front, foot(P_THROUGH.tip, P_THROUGH.angle), [172, 128], [160, 113]), s(0.7, [160, 113], [164, 86], [154, 112]),
        s(Z.front, [154, 112], [152, 120], [152, 128]), s(Z.front, [152, 128], [200, 195], P_HAND)] },
    { title: 'Slide it off', text: 'The old stitch slides off the left needle. Its top now lies across the front of the new stitch: that is the purl bump.',
      ...DONE, needleZ: Z.rightFront, waiting: 3,
      // A purl loop goes backward through the old stitch, so the top of the old stitch is drawn in front.
      old: { back: s(Z.backLeg, ...off.back), front: s(8, ...off.front) },
      yarn: [s(Z.front, foot(DONE.tip, DONE.angle), [222, 152], [204, 136]), s(6.5, [204, 136], [197, 124], [199, 110]),
        s(Z.behind, [199, 110], [205, 120], [197, 135]), s(Z.front, [197, 135], [240, 190], P_HAND)] },
  ],
}

export const TECHNIQUES = { knit: KNIT, purl: PURL }

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
