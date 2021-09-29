export const convertSeconds = (timeStr) => {
  if (timeStr) {
    const time = `20${timeStr.substring(0, 2)}/${timeStr.substring(2, 4)}/${timeStr.substring(4, 6)} 
    ${timeStr.substring(6, 8)}:${timeStr.substring(8, 10)}:${timeStr.substring(10, 12)}`;

    const date = new Date(time);

    return date.getTime() / 1000;
  }
  return null;
};