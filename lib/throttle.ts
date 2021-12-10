function throttle(func: () => void, delayTime: number) {
  let timer: ReturnType<typeof setTimeout>;
  let last: number | null = null;

  return function () {
    const now = +new Date();

    if (last && now < last + delayTime) {
      clearTimeout(timer);
      timer = setTimeout(function () {
        func();
        last = now;
      }, delayTime);
    } else {
      last = now;
      func();
    }
  };
}

export default throttle;
