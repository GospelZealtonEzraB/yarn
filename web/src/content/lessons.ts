import type { Construction } from '../engine/fabric'

export interface Lesson {
  id: string
  stage: number
  title: string
  minutes: number
  intro: string
  steps: string[]
  /** How to tell it worked. */
  check: string
  /** The mistake most beginners make here, and the fix. */
  watch: string
  /** Fabric the engine draws so the knitter can compare with their own. */
  /** Animated needle-and-yarn diagram of the movement. */
  technique?: 'knit' | 'purl'
  see?: { castOn: number; rows: string[]; construction: Construction; caption: string }
}

export interface Stage { n: number; name: string; skills: string; makes: string }

export const STAGES: Stage[] = [
  { n: 1, name: 'First loops', skills: 'Slip knot, long-tail cast-on, knit stitch, bind off, weaving in ends', makes: 'Garter stitch scarf' },
  { n: 2, name: 'Knit and purl', skills: 'Purl stitch, stockinette, ribbing, reading your stitches, gauge swatches, fixing a dropped stitch', makes: 'Ribbed scarf, textured cowl' },
  { n: 3, name: 'In the round', skills: 'Circular needles, joining, stitch markers, k2tog and ssk decreases, double-pointed needles', makes: 'Ribbed beanie' },
  { n: 4, name: 'Shaping', skills: 'M1L and M1R increases, thumb gussets, picking up stitches, holding stitches on waste yarn', makes: 'Fingerless mitts, mittens' },
  { n: 5, name: 'Fingers and texture', skills: 'Glove fingers, cables, simple lace, lifelines, fixing mistakes rows later', makes: 'Gloves, cabled headband' },
  { n: 6, name: 'Colour and garments', skills: 'Stripes, Fair Isle, heel turns, raglan shaping, seaming, blocking, altering patterns', makes: 'Socks, top-down sweater' },
]

const rep = (r: string, n: number) => Array<string>(n).fill(r)

export const LESSONS: Lesson[] = [
  { id: 'kit', stage: 1, title: 'Read your ball band', minutes: 5,
    intro: 'The paper band around your yarn tells you almost everything you need to start.',
    steps: [
      'Find the yarn weight. It is a word such as DK, worsted or chunky, or a number from 0 to 7. Thicker yarn means bigger stitches and faster projects.',
      'Find the needle size, given in millimetres. That is the size the maker suggests.',
      'Find the gauge square. It says how many stitches and rows fit in 10 cm. Enter the stitch number on the home screen.',
      'Note the length in metres and the dye lot. Buy all the yarn for one project from the same dye lot so the colour matches.',
      'Keep the band. You will want the washing instructions when you give the gift.',
    ],
    check: 'You know your yarn weight, needle size and stitches per 10 cm.',
    watch: 'Very dark, fuzzy or splitty yarn makes stitches hard to see. For learning, smooth yarn in a light colour is kindest.' },
  { id: 'slipknot', stage: 1, title: 'Slip knot', minutes: 5,
    intro: 'Every piece of knitting starts with this one adjustable loop.',
    steps: [
      'Pull out a length of yarn. The loose end is the tail. The end going to the ball is the working yarn.',
      'Make a loop by laying the working yarn across the tail.',
      'Reach through the loop, pinch the working yarn and pull a little of it through to make a new loop.',
      'Put the new loop on a needle and pull both ends gently until it sits close to the needle.',
    ],
    check: 'The loop slides along the needle easily and tightens when you pull the yarn.',
    watch: 'If it is a hard knot that will not slide, undo it and start again. A slip knot always comes undone with one pull.' },
  { id: 'caston', stage: 1, title: 'Long-tail cast-on', minutes: 15,
    intro: 'Casting on puts the first row of loops on the needle. The long-tail method is stretchy, neat and good for almost everything.',
    steps: [
      'Measure a tail about three times the width of what you are making, plus 15 cm. Make a slip knot there and put it on the needle in your right hand. It counts as your first stitch.',
      'With your left hand, hang the tail over your thumb and the working yarn over your index finger. Hold both strands against your palm with your other fingers, then spread thumb and finger apart.',
      'Bring the needle tip up under the strand on the outside of your thumb.',
      'Carry the tip over to your index finger, go over the strand there and catch it.',
      'Bring that strand back down through the loop on your thumb.',
      'Let the loop drop off your thumb. Use your thumb to snug the new stitch up to the needle. Repeat from step 3.',
    ],
    check: 'A row of even loops on the needle with a neat braid along the bottom edge. Count them twice.',
    watch: 'Casting on tightly makes the first row a fight. Leave a little space between stitches, about the width of the yarn.' },
  { id: 'knit', stage: 1, title: 'The knit stitch', minutes: 20, technique: 'knit',
    intro: 'This is the stitch everything else is built from. Knitters teach it with a rhyme: in through the front door, once around the back, peek through the window, off jumps Jack.',
    steps: [
      'Hold the needle with the stitches in your left hand and the empty needle in your right. The working yarn hangs at the back, away from you.',
      'In through the front door: push the right needle tip into the first stitch from left to right, so it goes in at the front and comes out behind the left needle.',
      'Once around the back: bring the working yarn around the right needle tip, from the back, between the two needles, to the front.',
      'Peek through the window: draw the right needle tip back toward you through the stitch, bringing the wrapped yarn with it as a new loop.',
      'Off jumps Jack: slide the old stitch off the left needle. The new stitch is on your right needle.',
      'Repeat to the end of the row. Then swap the needles between your hands and start the next row.',
    ],
    check: 'Knit every row and you get garter stitch: bumpy ridges on both sides.',
    watch: 'At the start of a row, do not pull the yarn up and over the needle. It makes the first stitch look like two, and your scarf gets wider.',
    see: { castOn: 12, rows: rep('K1', 8), construction: 'flat', caption: 'Garter stitch. Tap a stitch to see how each loop passes through the one below.' } },
  { id: 'bindoff', stage: 1, title: 'Bind off', minutes: 10,
    intro: 'Binding off closes the live stitches so the fabric cannot unravel.',
    steps: [
      'Knit 2 stitches.',
      'Push the left needle tip into the first stitch you knitted, the one further from the tip of the right needle.',
      'Lift it over the second stitch and off the needle. One stitch is bound off.',
      'Knit 1 more stitch and lift the older stitch over it again. Repeat to the end of the row.',
      'With one stitch left, cut the yarn leaving 15 cm. Pull the tail through the last stitch and tighten.',
    ],
    check: 'A chain of sideways V shapes runs along the top edge.',
    watch: 'A tight bind-off puckers the edge. Work loosely, or use a needle one size bigger for this row.' },
  { id: 'weave', stage: 1, title: 'Weave in the ends', minutes: 10,
    intro: 'Hiding the tails is what makes a piece look finished.',
    steps: [
      'Thread a tail onto the tapestry needle.',
      'On the wrong side, run the needle through the bumps of the stitches for about 5 cm, following a row.',
      'Turn and go back the other way for 2 cm through neighbouring bumps. The change of direction stops the end working loose.',
      'Stretch the fabric gently so the tail settles, then trim it close.',
    ],
    check: 'You cannot see the tail from the right side, and the fabric still stretches.',
    watch: 'Never knot the ends and cut them. Knots come undone and poke through.' },

  { id: 'purl', stage: 2, title: 'The purl stitch', minutes: 20, technique: 'purl',
    intro: 'A purl is a knit stitch made from the other side. Together they make every texture in knitting.',
    steps: [
      'Hold the needles as for knitting, but bring the working yarn to the front, toward you.',
      'Push the right needle tip into the first stitch from right to left, so the tip ends up in front of the left needle.',
      'Wrap the yarn around the right needle tip: over the top, down behind it and back to the front.',
      'Push the right needle tip backward through the stitch, taking the new loop with it.',
      'Slide the old stitch off the left needle.',
    ],
    check: 'A purl stitch has a small horizontal bump at its base, right under the needle.',
    watch: 'If the yarn is at the back when you purl, you get an accidental extra loop. Yarn in front for purls, at the back for knits.',
    see: { castOn: 12, rows: rep('P1', 6), construction: 'round', caption: 'The purl side of the fabric: all bumps. Switch colour to Depth to see what sits in front.' } },
  { id: 'stockinette', stage: 2, title: 'Stockinette', minutes: 15,
    intro: 'The smooth fabric of most sweaters and hats. Worked flat it is one row knit, one row purl.',
    steps: [
      'Cast on 20 stitches.',
      'Row 1, the right side: knit every stitch.',
      'Row 2, the wrong side: purl every stitch.',
      'Repeat these two rows. The smooth side with V shapes is the right side.',
    ],
    check: 'One side is all V shapes, the other all bumps.',
    watch: 'Stockinette curls at the edges. That is the fabric, not you. Patterns add ribbing or garter borders to hold it flat.',
    see: { castOn: 12, rows: ['K1', 'P1', 'K1', 'P1', 'K1', 'P1', 'K1', 'P1'], construction: 'flat', caption: 'Knit a row, purl a row. Tap a stitch in row 2: it was purled, but shows as a knit from this side.' } },
  { id: 'rib', stage: 2, title: 'Ribbing', minutes: 15,
    intro: 'Columns of knits beside columns of purls make a stretchy fabric for cuffs and hat brims.',
    steps: [
      'Cast on a multiple of 4 stitches, for example 20.',
      'Knit 2 stitches with the yarn at the back.',
      'Bring the yarn to the front between the needles, then purl 2.',
      'Take the yarn to the back between the needles. Repeat knit 2, purl 2 to the end.',
      'On the next row, knit the stitches that look like V shapes and purl the ones with bumps.',
    ],
    check: 'Raised columns of V shapes alternate with sunken columns of bumps, and the fabric pulls in.',
    watch: 'If the yarn goes over the needle instead of between the needles, you make an extra stitch and a hole.',
    see: { castOn: 12, rows: rep('K2, P2', 8), construction: 'round', caption: '2×2 rib. Colour by Knit or purl to see the columns.' } },
  { id: 'read', stage: 2, title: 'Read your stitches', minutes: 10,
    intro: 'Once you can tell a knit from a purl by looking, you can find your place and spot mistakes without a pattern.',
    steps: [
      'Look at the stitch just below the needle. A V shape is a knit. A bump like a small collar is a purl.',
      'To count rows in stockinette, count the V shapes up one column. Do not count the loop on the needle.',
      'To count rows in garter, count the ridges and double it. Each ridge is two rows.',
      'Before each row of ribbing, look at the first few stitches and say what they are. Knit the knits, purl the purls.',
    ],
    check: 'You can put your knitting down mid-row and work out what comes next when you pick it up.',
    watch: 'The loop sitting on the needle is not finished yet. Read the stitch underneath it.',
    see: { castOn: 12, rows: rep('K1, P1', 8), construction: 'flat', caption: 'Seed stitch: knits and purls alternate in both directions. Try naming a few before tapping them.' } },
  { id: 'gauge', stage: 2, title: 'Knit a gauge swatch', minutes: 30,
    intro: 'Gauge is how many stitches fit in 10 cm with your yarn, your needles and your hands. It decides whether a hat fits.',
    steps: [
      'Cast on enough stitches for about 15 cm, using the needle size on the ball band.',
      'Knit in the stitch the project uses for about 12 cm, then bind off loosely.',
      'Wash and dry the swatch the way you will treat the finished item. Stitches change size when washed.',
      'Lay it flat without stretching. In the middle, count the stitches across exactly 10 cm.',
      'Enter that number on the home screen. Every project resizes to match.',
    ],
    check: 'You have your own stitches per 10 cm, measured away from the edges.',
    watch: 'More stitches than the band says means you knit tightly: try a bigger needle. Fewer means loosely: try a smaller one.' },
  { id: 'fix', stage: 2, title: 'Rescue a dropped stitch', minutes: 15,
    intro: 'A stitch that falls off the needle runs down like a ladder. It looks alarming and takes a minute to fix.',
    steps: [
      'Stop and catch the loose loop with a crochet hook or a spare needle so it cannot run further.',
      'Turn the work so the smooth V side faces you. The strands of the ladder lie behind the loop.',
      'Put the crochet hook through the loop from front to back. Catch the lowest strand of the ladder and pull it through the loop.',
      'Repeat with each strand, bottom to top, until none are left.',
      'Put the loop back on the left needle with its right-hand side at the front, and carry on.',
    ],
    check: 'The column of V shapes is complete again with no horizontal bars across it.',
    watch: 'To undo a few stitches instead, put the left needle into the stitch below the one on the right needle, slide the right needle out and pull the yarn. Knitters call it tinking.' },
]

export const GLOSSARY: [string, string][] = [
  ['K', 'Knit'], ['P', 'Purl'], ['CO', 'Cast on'], ['BO', 'Bind off'], ['st(s)', 'Stitch(es)'],
  ['RS', 'Right side, the side that shows when worn'], ['WS', 'Wrong side, the inside'],
  ['k2tog', 'Knit 2 stitches together: a decrease that leans right'], ['ssk', 'Slip, slip, knit: a decrease that leans left'],
  ['yo', 'Yarn over: wrap the yarn over the needle to make a hole and a new stitch'],
  ['PM', 'Place marker'], ['SM', 'Slip marker from the left needle to the right'],
  ['M1L', 'Make 1 left: an increase that leans left'], ['M1R', 'Make 1 right: an increase that leans right'],
  ['rep', 'Repeat'], ['rnd', 'Round: one full circle when knitting in the round'], ['sl', 'Slip a stitch across without working it'],
  ['* … *', 'Repeat the instructions between the stars'],
]
