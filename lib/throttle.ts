const throttle = (func: () => void, delayTime: number) => {
  let timer: ReturnType<typeof setTimeout>;
  return {
    on: () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        func();
      }, delayTime);
    },
    off: () => {
      clearTimeout(timer);
    },
  };
};

export default throttle;
