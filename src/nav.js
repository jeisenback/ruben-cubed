// Tracks where the learner is and the path they took, so Back retraces it.
export function createNav(steps, startId) {
  const byId = new Map(steps.map((s) => [s.id, s]));
  const find = (id) => {
    const step = byId.get(id);
    if (!step) throw new Error(`Unknown step: ${id}`);
    return step;
  };
  let current = find(startId);
  const history = [];
  return {
    current: () => current,
    go(id) {
      const next = find(id);
      history.push(current);
      current = next;
    },
    back() {
      if (history.length) current = history.pop();
    },
    canBack: () => history.length > 0,
  };
}
