/**
 * The teaching wrapper around each lesson: a drill to do with real yarn, and
 * what to do when it goes wrong. Kept apart from the steps so the two can be
 * reviewed separately.
 */
export interface Extra { practice: string; troubles: [problem: string, fix: string][] }

export const EXTRAS: Record<string, Extra> = {
  kit: { practice: 'Find the weight, needle size, gauge and length on your own ball band. Enter the gauge on the home screen.', troubles: [
    ['The band gives a range of needle sizes', 'Start in the middle of the range.'],
    ['There is no gauge square', 'Go by the weight: DK is about 22 stitches per 10 cm, worsted about 18, chunky about 14.'],
  ] },
  slipknot: { practice: 'Make five slip knots, pulling each one out again before the next.', troubles: [
    ['It tightens when I pull the tail, not the working yarn', 'Either is fine for now. You pulled the other strand through the loop.'],
    ['It will not come undone', 'That is an ordinary knot. Pick it open or cut it off and try again.'],
  ] },
  caston: { practice: 'Cast on 20 stitches, slide them all off, and do it again. Three rounds of that and your hands will know it.', troubles: [
    ['I ran out of tail', 'Pull it out and start again with more. One wrap of yarn around the needle per stitch, plus 15 cm, is a reliable measure.'],
    ['The stitches are too tight to slide', 'Cast on over two needles held together, then pull one out.'],
    ['The stitches are different sizes', 'Snug each one with your thumb at the same moment in the rhythm. Evenness comes with repetition.'],
  ] },
  knit: { practice: 'Cast on 15 stitches and knit 10 rows. Count your stitches at the end of every row.', troubles: [
    ['I have more stitches than I started with', 'Usually the first stitch of a row. If the yarn is pulled up over the needle, that stitch looks like two. Let the yarn hang down at the back before you begin.'],
    ['I have fewer stitches', 'A stitch slipped off unnoticed, or two were knitted as one. Look for a loose loop a row or two down.'],
    ['There is a hole', 'The yarn may have wrapped the needle between stitches, or you set off the wrong way after a break. The working yarn always comes from the last stitch on the right needle.'],
    ['My stitches are very tight', 'Form each stitch on the full thickness of the needle, not on the tapered tip.'],
  ] },
  bindoff: { practice: 'Bind off your practice piece from the knit stitch lesson.', troubles: [
    ['The edge is tighter than the fabric', 'Hold a needle one or two sizes bigger in your right hand for the bind-off.'],
    ['I ended with two stitches, not one', 'Lift the first over the second once more, then pull the tail through.'],
  ] },
  weave: { practice: 'Weave in both tails on your practice piece. Stretch it and check they stay hidden.', troubles: [
    ['The tail shows on the front', 'The needle went through the whole stitch. Catch only the bumps on the back.'],
    ['The fabric puckers', 'The tail is pulled too tight. Stretch the fabric before trimming.'],
  ] },
  purl: { practice: 'Cast on 15 stitches and purl 10 rows. Purling every row makes garter stitch too.', troubles: [
    ['My purls are looser than my knits', 'Common at first. Give the yarn a small tug after each purl.'],
    ['I get an extra loop over the needle', 'The yarn was at the back when you began. Bring it to the front first, between the needles.'],
  ] },
  stockinette: { practice: 'Cast on 20 stitches. Knit a row, purl a row, for 20 rows.', troubles: [
    ['I lost track of which row comes next', 'Look at the side facing you. Vs facing you: knit this row. Bumps facing you: purl it.'],
    ['There is a ridge across the smooth side', 'Two knit rows or two purl rows in a row. It will not unravel. Carry on, or undo back to it.'],
    ['Purl rows look looser than knit rows', 'Very common. It evens out with practice and with washing.'],
  ] },
  rib: { practice: 'Cast on 20 stitches and work 12 rows of knit 2, purl 2.', troubles: [
    ['The columns drift sideways', 'The count slipped. Stop counting and read the stitches: knit the Vs, purl the bumps.'],
    ['I have extra stitches and holes', 'The yarn went over the needle when changing between knit and purl. It must pass between the needle tips.'],
  ] },
  read: { practice: 'Take any practice piece and name ten stitches out loud. Check yourself in the stitch lab.', troubles: [
    ['Garter ridges and purl bumps look the same', 'They are the same thing. A garter ridge is a row of purl bumps.'],
    ['I cannot tell which row a stitch belongs to', 'Follow one leg of the V down to where it comes out of the loop below.'],
  ] },
  gauge: { practice: 'Knit a swatch in the yarn for your next project and enter your number on the home screen.', troubles: [
    ['My count falls between two numbers', 'Measure across 20 cm and halve it for a more exact figure.'],
    ['I do not want to wash the swatch', 'At least dampen it and let it dry flat. Some yarns grow a lot when wet.'],
  ] },
  fix: { practice: 'On a practice swatch, drop a stitch on purpose, let it run three rows, and rescue it.', troubles: [
    ['The rescued column looks tighter or looser', 'Normal. It evens out after a few rows and a wash.'],
    ['The dropped stitch is in a purl column', 'Turn the work so the V side of that column faces you and fix it from there.'],
    ['I have no crochet hook', 'Lift each strand through with the tip of a spare needle. Slower, but it works.'],
  ] },
  round: { practice: 'Cast on 60 stitches on a 40 cm circular needle, join, and knit 10 rounds.', troubles: [
    ['There is a gap where the round joins', 'Knit the first two stitches firmly. The cast-on tail closes what remains when you weave it in.'],
    ['The stitches are stretched tight around the needle', 'The needle is too long for this many stitches. Use a shorter one, or double-pointed needles.'],
    ['I knitted back the wrong way after a break', 'The working yarn must be on the right-hand tip. If it is on the left, turn the work around.'],
  ] },
  k2tog: { practice: 'On your tube from the last lesson, work knit 4, knit 2 together all the way round once. Count the stitches.', troubles: [
    ['I cannot get the needle through both stitches', 'Tug the two stitches down with your left thumb to loosen them, or use a pointier needle.'],
    ['My stitch count is off', 'A decrease was missed or worked twice. Count the stitches between decreases.'],
  ] },
  ssk: { practice: 'Work one round of knit 4, ssk and compare its slant with your k2tog round.', troubles: [
    ['My ssk looks looser than my k2tog', 'It usually does. Many knitters slip the second stitch as if to purl instead, which tightens it.'],
    ['It leans the same way as k2tog', 'The stitches were not slipped first. Slipping turns them so the decrease can lean left.'],
  ] },
  dpn: { practice: 'Move your practice tube onto double-pointed needles and knit five rounds.', troubles: [
    ['Needles keep sliding out', 'Use wooden or bamboo needles, which grip, and keep the stitches in the middle of each needle.'],
    ['Too many needles to manage', 'Only two are ever in use. Let the others hang and ignore them.'],
  ] },
}
