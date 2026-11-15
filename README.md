# ruben-cubed

Visual lessons for beginner methods on twisty puzzles, starting with the 2x2.
Each step shows an example case on a 3D cube and animates the algorithm.
Steps branch on what the learner sees ("Which of these does your cube look like?"),
and Back retraces the path they took.

## Run locally

The page must be served (browsers block ES modules from `file://`):

```bash
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Tests

```bash
npm install
```

```bash
npm test
```

The page tests use Playwright's Chromium and a local copy of cubing.js, so they do not need the CDN.

## Publish on GitHub Pages

In the repository settings, open Pages, choose "Deploy from a branch", and pick the branch and `/ (root)`.

## Editing lessons

All lesson content lives in `src/steps.js`. Each step has a `lesson`, `title`, `text` and `alg`,
an optional `setup` (otherwise the case is "the cube just before `alg`"), and either `next` or `choices`.
`test/steps.test.js` checks each case against a cube model, so run the tests after changing content.
