// Typed port for the legacy astronomy helper; its implementation remains js/human.js.
export function sunTimes(
  day: string,
  latitude: number,
  longitude: number,
): { sunrise: Date; sunset: Date };
export function todayGone(now?: Date): boolean;
