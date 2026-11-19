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
  technique?: 'knit' | 'purl' | 'bindoff'
  /** Which diagram frame goes with each step, when the lesson has a diagram. */
  frames?: number[]
  /** A drawn picture for lessons without a movement diagram. */
  picture?: 'ballband' | 'gauge' | 'caston' | 'ring' | 'dpn'
  see?: { castOn: number; rows: string[]; construction: Construction; caption: string }
}

export interface Stage { n: number; name: string; /** What the learner can do by the end. */ goal: string; skills: string; makes: string; /** Projects in the app that this stage leads to. */ projects: string[] }

export const STAGES: Stage[] = [
  { n: 1, name: 'First loops', goal: 'Get loops onto a needle, knit them into fabric, and take them off safely.', skills: 'Slip knot, long-tail cast-on, knit stitch, bind off, weaving in ends', makes: 'Garter stitch scarf', projects: ['scarf'] },
  { n: 2, name: 'Knit and purl', goal: 'Mix knits and purls on purpose, and read what you have made.', skills: 'Purl stitch, stockinette, ribbing, reading your stitches, gauge swatches, fixing a dropped stitch', makes: 'Textured scarf, fingerless mitts', projects: ['ribscarf', 'mitts'] },
  { n: 3, name: 'In the round', goal: 'Knit a seamless tube and shape it.', skills: 'Circular needles, joining, stitch markers, k2tog and ssk decreases, double-pointed needles', makes: 'Ribbed beanie', projects: ['beanie'] },
  { n: 4, name: 'Shaping', goal: 'Add stitches where you want them and knit a thumb.', skills: 'M1L and M1R increases, thumb gussets, picking up stitches, holding stitches on waste yarn', makes: 'Mitts in the round, mittens', projects: [] },
  { n: 5, name: 'Fingers and texture', goal: 'Work small tubes, cross stitches for cables, and repair mistakes rows later.', skills: 'Glove fingers, cables, simple lace, lifelines, fixing mistakes rows later', makes: 'Gloves, cabled headband', projects: [] },
  { n: 6, name: 'Colour and garments', goal: 'Knit with several colours and build garments that fit.', skills: 'Stripes, Fair Isle, heel turns, raglan shaping, seaming, blocking, altering patterns', makes: 'Socks, top-down sweater', projects: [] },
]

const rep = (r: string, n: number) => Array<string>(n).fill(r)

export const LESSONS: Lesson[] = [
  { id: 'kit', picture: 'ballband', stage: 1, title: 'Read your ball band', minutes: 5,
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
  { id: 'caston', picture: 'caston', stage: 1, title: 'Long-tail cast-on', minutes: 15,
    intro: 'Casting on puts the first row of loops on the needle. The long-tail method is stretchy, neat and good for almost everything.',
    steps: [
      'Measure a tail about three times the width of what you are making, plus 15 cm. Make a slip knot there and put it on the needle in your right hand. It counts as your first stitch.',
      'With your left hand, hang the tail over your thumb and the working yarn over your index finger. Hold both strands against your palm with your other fingers, then spread thumb and finger apart.',
      'Bring the needle tip up into the loop around your thumb, coming from below.',
      'Carry the tip over to your index finger. Go over the strand that runs to that finger, coming from above, and catch it.',
      'Bring that strand back down through the loop on your thumb.',
      'Let the loop drop off your thumb. Use your thumb to snug the new stitch up to the needle. Repeat from step 3.',
    ],
    check: 'A row of even loops on the needle with a neat braid along the bottom edge. Count them twice.',
    watch: 'Casting on tightly makes the first row a fight. Leave a little space between stitches, about the width of the yarn. This is the one technique where watching hands helps most, so pair these steps with a video the first time.' },
  { id: 'knit', frames: [0, 1, 2, 3, 4, 4], stage: 1, title: 'The knit stitch', minutes: 20, technique: 'knit',
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
  { id: 'bindoff', frames: [0, 1, 2, 3, 3], stage: 1, title: 'Bind off', minutes: 10, technique: 'bindoff',
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

  { id: 'purl', frames: [0, 1, 2, 3, 4], stage: 2, title: 'The purl stitch', minutes: 20, technique: 'purl',
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
  { id: 'gauge', picture: 'gauge', stage: 2, title: 'Knit a gauge swatch', minutes: 30,
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

  { id: 'round', picture: 'ring', stage: 3, title: 'Join in the round', minutes: 20,
    intro: 'A circular needle lets you knit a tube with no seam. You go round and round instead of back and forth, and the right side always faces you.',
    steps: [
      'Cast on onto a circular needle that is shorter than the tube you are making. For an adult hat that is a 40 cm needle.',
      'Spread the stitches all the way round the needle. Lay it on a table and check that the cast-on edge sits on the inside of the circle the whole way, with no stitch flipped over the needle.',
      'Hold the needle so the tip with the working yarn is in your right hand. Slip a stitch marker onto the right tip.',
      'Knit the first stitch on the left tip and pull the yarn snug. The circle is now closed.',
      'Keep knitting. Each time you reach the marker, slip it from the left tip to the right and carry on. One trip back to the marker is one round.',
    ],
    check: 'You have a tube. Knitting every stitch gives smooth stockinette on the outside without ever purling.',
    watch: 'If the cast-on edge spirals around the needle when you join, the tube has a permanent twist. It cannot be fixed later, so check before the first stitch and again after the first round.' },
  { id: 'k2tog', stage: 3, title: 'Knit two together', minutes: 10,
    intro: 'The simplest decrease. Two stitches become one, and the result leans to the right. Patterns write it k2tog.',
    steps: [
      'Push the right needle tip into the next two stitches on the left needle at once, from left to right, as if they were a single stitch. The tip goes through the second stitch first, then the first.',
      'Wrap the yarn as for a normal knit stitch.',
      'Draw the new loop through both stitches.',
      'Slide both old stitches off the left needle together.',
    ],
    check: 'One stitch fewer on the needle, and the left of the two old stitches lies on top, slanting right.',
    watch: 'If the stitches are tight, the tip may only catch one of them. Look for both loops on the needle before you wrap.',
    see: { castOn: 12, rows: ['K1', 'K1', 'K1', '*K2, k2tog; rep from *', 'K1', 'K1'], construction: 'round', caption: 'Row 4 has three decreases. Tap one to see the two loops it passes through, with the left one on top.' } },
  { id: 'ssk', stage: 3, title: 'Slip, slip, knit', minutes: 10,
    intro: 'The mirror image of k2tog. Two stitches become one and the result leans to the left. Patterns write it ssk.',
    steps: [
      'Slip the next stitch from the left needle to the right as if to knit: put the right tip in from left to right and slide the stitch across without wrapping.',
      'Slip the following stitch the same way.',
      'Push the left needle tip into the fronts of both slipped stitches, from left to right.',
      'Wrap the yarn around the right needle and knit the two stitches together.',
    ],
    check: 'One stitch fewer, and the right of the two old stitches lies on top, slanting left.',
    watch: 'Slip the stitches one at a time and as if to knit. Slipping them as if to purl, or both at once, gives a twisted, bulkier decrease.',
    see: { castOn: 12, rows: ['K1', 'K1', 'K1', '*K2, ssk; rep from *', 'K1', 'K1'], construction: 'round', caption: 'The same fabric with left-leaning decreases. Compare which loop is on top.' } },
  { id: 'dpn', picture: 'dpn', stage: 3, title: 'Double-pointed needles', minutes: 20,
    intro: 'As a hat crown shrinks, the stitches no longer reach around a circular needle. Double-pointed needles hold a small tube on three or four short needles.',
    steps: [
      'Take one double-pointed needle in your right hand in place of the right tip of the circular. Knit about a third of the stitches onto it.',
      'Pick up a second double-pointed needle and knit the next third onto it. Use a third needle for the rest. The circular needle is now empty.',
      'The three needles form a triangle. Hold the two you are working between and let the third hang.',
      'Knit across one needle with an empty one. When that needle empties, it becomes your working needle for the next.',
      'Pull the first stitch on each needle a little tighter than the rest.',
    ],
    check: 'The tube carries on without a break and no stitches slide off the back ends.',
    watch: 'A loose column of stitches where two needles meet is called a ladder. Snugging the first stitch on each needle, or shifting the joins by a stitch or two every few rounds, prevents it. A marker at the very end of a needle falls off, so keep it one stitch in.' },
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
