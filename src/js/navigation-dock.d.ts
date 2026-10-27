// Legacy spring shared by scroll density and contextual action morphs.
export function stepDockSpring(
  value: number,
  velocity: number,
  target: number,
  seconds: number,
): { value: number; velocity: number; settled: boolean };
