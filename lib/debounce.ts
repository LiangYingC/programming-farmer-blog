export const debounce = (func: () => void, debounceTime: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return {
    on: () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func();
      }, debounceTime);
    },
    off: () => {
      clearTimeout(timer);
    },
  };
};
