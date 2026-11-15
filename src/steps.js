// Lesson content for the 2x2 beginner method.
// Each step shows a case on the cube and an algorithm to play.
// If `setup` is missing, the case is "the cube just before `alg`".
// A step has `next` (one way forward) or `choices` (the learner picks a case).

const SUNE = "R U R' U R U2 R'";
const SUNE_BACKWARDS = "R U2' R' U' R U' R'";
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
      "R turns the right face, U the top (up) face, F the front face, all clockwise. " +
      "A ' (say \"prime\") means turn the other way. A 2 means turn it twice. " +
      "Play the moves and watch each face turn.",
    alg: "R R' U U' F F' R2 U2",
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
    next: "oll-intro",
  },
  {
    id: "oll-intro",
    lesson: "Top color",
    title: "Make the top all yellow",
    text:
      "Turn the cube over so the solved white layer is on the bottom. Now you only need one move " +
      "sequence, called Sune: R U R' U R U2 R'. Count the top corners that already show yellow on top. " +
      "How many are there?",
    alg: "",
    choices: [
      { label: "One", to: "oll-one" },
      { label: "None", to: "oll-none" },
      { label: "Two", to: "oll-two" },
      { label: "All four", to: "pll-intro" },
    ],
  },
  {
    id: "oll-one",
    lesson: "Top color",
    title: "One yellow corner on top",
    text:
      "Turn the top layer until the yellow-on-top corner is at the front left. Then do Sune once. " +
      "If the top still is not all yellow, look again and repeat.",
    alg: SUNE,
    next: "pll-intro",
  },
  {
    id: "oll-none",
    lesson: "Top color",
    title: "No yellow corners on top",
    text:
      "Turn the top layer until the front-left top corner has its yellow sticker facing left. " +
      "Then do Sune once. You will now have one yellow corner on top. Look again.",
    alg: SUNE,
    setup: `${SUNE_BACKWARDS} ${SUNE_BACKWARDS}`,
    next: "oll-intro",
  },
  {
    id: "oll-two",
    lesson: "Top color",
    title: "Two yellow corners on top",
    text:
      "Turn the top layer until the front-left top corner has its yellow sticker facing you (the front). " +
      "Then do Sune once. You will now have one yellow corner on top. Look again.",
    alg: SUNE,
    setup: "R U R' U' R' F R F'",
    next: "oll-intro",
  },
  {
    id: "pll-intro",
    lesson: "Top corners",
    title: "Put the top corners in place",
    text:
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
