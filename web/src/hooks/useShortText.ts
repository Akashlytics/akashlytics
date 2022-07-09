export const useShortText = (text: string, length: number) => {
  return text.length < length ? text : `${text.substring(0, length - 3)}...`;
};
