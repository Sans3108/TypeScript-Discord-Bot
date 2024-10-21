export function formatTime(timeSeconds: number): string {
  const hours = Math.floor(timeSeconds / 3600);
  const minutes = Math.floor((timeSeconds % 3600) / 60);
  const seconds = Math.floor(timeSeconds % 60);

  const hoursStr = hours > 0 ? `${hours}:` : '';
  const minutesStr = `${hours > 0 && minutes < 10 ? '0' : ''}${minutes}:`;
  const secondsStr = `${seconds < 10 ? '0' : ''}${seconds}`;

  return `${hoursStr}${minutesStr}${secondsStr}`;
}
