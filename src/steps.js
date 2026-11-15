// Lesson content for the 2x2 beginner method.
// Each step shows a case on the cube and an algorithm to play.
// If `setup` is missing, the case is "the cube just before `alg`".
// A step has `next` (one way forward) or `choices` (the learner picks a case).

const SWAP = "R U R' U' R' F R2 U' R' U' R U R' F'";
const TRIGGER = "R U R' U'";
const repeat = (alg, n) => Array(n).fill(alg).join(" ");

export const START = "notation";

export const STEPS = [
  {
    id: "notation",
    lesson: "Notation",
    title: "How to read moves",
    text:
      "Each letter is a quarter turn of one face, as if you were looking straight at that face. " +
      "R turns the right face, U the top (up) face, F the front face, D the bottom (down) face, all clockwise. " +
      "A ' (say \"prime\") means turn the other way. A 2 means turn it twice. " +
      "Play the moves and watch each face turn.",
    alg: "R R' U U' F F' D D' R2 U2",
    setup: "U2' R2'",
    next: "first-layer",
  },
  {
    id: "first-layer",
    lesson: "First layer",
    title: "Build the white layer",
    text:
      "Do this for each of the four white corners. Turn the top layer until a white corner sits directly " +
      "above the spot where it belongs. Hold the cube so that spot is at the front right, with white on the bottom. " +
      "Repeat R U R' U' until the corner drops in with white on the bottom and its side colors matching. " +
      "It takes at most five tries. " +
      "If a white corner is stuck in the bottom layer in the wrong spot, hold it at the bottom front right " +
      "and do R U R' U' once to lift it into the top layer.",
    alg: repeat(TRIGGER, 3),
    next: "yellow-side",
  },
  {
    id: "yellow-side",
    lesson: "Yellow side",
    upsideDown: true,
    title: "Turn the yellow stickers down",
    text:
      "This uses the same move as the white layer. Turn the cube over so white is on top and yellow is on the bottom. " +
      "Look at the bottom front right corner. If its yellow sticker does not face down, repeat R U R' U' " +
      "until that same corner is back in its spot with yellow facing down (two or four times). " +
      "In between, the corner leaves its spot and a white corner may show up there: keep going. " +
      "The white layer will look messed up while you do this. That is expected. " +
      "Then turn only the bottom layer (D) to bring the next corner whose yellow does not face down to the bottom front right, " +
      "and repeat. Never turn the whole cube during this step. " +
      "When all four yellow stickers face down, the white layer fixes itself. If all four already face down, go to the next step.",
    alg: `${repeat(TRIGGER, 2)} D ${repeat(TRIGGER, 4)} D'`,
    next: "pll-intro",
  },
  {
    id: "pll-intro",
    lesson: "Top corners",
    title: "Put the top corners in place",
    text:
      "Turn the cube back over so white is on the bottom and yellow is on top. " +
      "The top is all yellow, but the corners may be in the wrong spots. Look at the sides of the top layer. " +
      "If one side has two corners with matching colors, those are called headlights. " +
      "Do you see headlights?",
    alg: "",
    choices: [
      { label: "Yes, headlights", to: "pll-lights" },
      { label: "No headlights", to: "pll-none" },
      { label: "Every side already matches", to: "finish" },
    ],
  },
  {
    id: "pll-lights",
    lesson: "Top corners",
    title: "Headlights",
    text: `Hold the cube so the headlights are on the left side. Then do ${SWAP}.`,
    alg: SWAP,
    next: "finish",
  },
  {
    id: "pll-none",
    lesson: "Top corners",
    title: "No headlights",
    text: "Do the same move sequence once from any angle. You will then have headlights. Look again.",
    alg: SWAP,
    setup: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
    next: "pll-intro",
  },
  {
    id: "finish",
    lesson: "Finish",
    title: "Turn the top to finish",
    text: "Turn the top layer until every side matches. The cube is solved.",
    alg: "U",
  },
];
