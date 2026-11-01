/** Events ordered by their start, earliest first. */
export const byStart = <T extends { startsAt: string }>(events: readonly T[]): T[] =>
  [...events].sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());
