---
title: 理解 Redux 原始碼：來實作 Middleware 相關功能吧，如：applyMiddleware
date: 2021-12-10
description: 上篇 Redux 系列文章製作完 createStore 中的 getState、dispatch、subscribe 後，這篇進階到實作 Redux Middleware 相關的功能，如 createStore 傳入的 enhancer 以及 applyMiddleware 等，更深入探討 Redux 吧。
category: sourceCode
---

## 前言

延續上篇分享的 [理解 Redux 原始碼：來實作 createStore 的 getState, dispatch, subscribe 吧](/articles/sourceCode/redux-make-createStore-getState-dispatch-subscribe)，這次將更深入探討 Redux Source Code 中，關於 Middleware 的部分，像是：`applyMiddleware` 以及 `createStore` 傳入的 `enhancer` 等等。

期許閱讀完這篇後，能達成：

- 理解 Redux Middleware 想達成的目標，以及能實作自己的 Middleware
- 理解 applyMiddleware
- 理解 createStore enhancer 參數

本文將會接續上篇文章的程式碼結果(已經實作完基本的 `createStore` )，持續開發擴展 `Redux` 功能，最後就會實作出 `Redux Middleware` 的概念。

<hr>

## 複習些 functional programming 的觀念

如果真的想理解 `Redux Middleware` 以及其 Source Code，就一定要先理解 functional programming 的部分觀念和實作，否則將相當挫折。

因此先複習 functional programming 部分觀念，僅針對與 `Redux Middleware` 有關的部分重點說明，藉此讓接下來實作 `Redux Middleware` 相關功能更加地順利。

### 一、High order function (HOF)

JavaScript 中，函式為一等公民，意思是函式**能被作為函式的參數使用**或**能被作為函式回傳的結果使用**。滿足下列其一，即可稱為 Higher-order function (HOF) ：

- 傳入 function 參數的 function
- return function 的 function

```javascript
/*** 1. listener function can be a argument of subscribe function. ***/
function subscribe(listener) {
  let isSubscribed = true;

  listeners.push(listener);

  /*** 2. subscribe function can return unsubscribe function ***/
  return function unsubscribe() {
    if (!isSubscribed) {
      return;
    }

    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);

    isSubscribed = false;
  };
}
```

### 二、Currying

Currying 算是基於 HOF 所衍生出的概念之一，定義為：**把帶有多個參數的函式，轉換成一次帶一個參數的多個連續函式**。

光看定義不易懂，直接看案例比較具體：

```javascript
/*** Without Currying ***/
function add(x, y) {
  return x + y;
}

const result = add(5, 10); // 一個步驟算出結果

/*** With Currying ***/
function add(x) {
  return function (y) {
    return x + y;
  };
}

const result = add(5)(10); // 兩個步驟算出結果
```

將 Currying 的函式改寫成箭頭函式會更簡潔：

```javascript
/*** Currying concept by arrow function ***/
const add = x => y => x + y;

const result = add(5)(10); // 兩個步驟算出結果
```

好處是**可以將每個步驟做成獨立功能並重新命名，增加獨立性與可讀性**。

舉實際程式碼案例：實作取得 9 折的優惠價格，非 Currying 與 Currying 的比較如下。

```javascript
/*** Without Currying ***/

function getDiscountPrice(price, discount) {
  return price * discount;
}

const price = getDiscountPrice(100, 0.9);

/*** With Currying ***/

const getDiscountPrice = discount => price => price * discount;

// 抽象獨立出打 9 折的專用 function，增加可讀性和專一功能性，藉此讓使用更安全
// 由於 closure 特性，所以 0.9 並不會被 Garbage collection 機制回收
const getTenPercentOff = getDiscountPrice(0.9);

const price = getTenPercentOff(100);
```

### 三、Compose

Compose 算是基於 HOF 所衍生出的概念之一，定義為：**傳入 compose 的多個 function 參數，最後會被組合為單一 function，並由最右方參數的 funcion 開始執行**。

同樣光看定義不容易懂，程式碼的實踐如下：

```javascript
const compose = function(fn1, fn2, fn3) {
  return function(x) {
    return fn1(fn2(fn3(x)); // fn1、fn2、fn3 被組合為一個 function 執行並回傳
  };
};

function consoleSentence(sentence) {
    return console.log(sentence)
}

function toUpperCase(sentence) {
    return sentence.toUpperCase();
};

function exclaim(sentence) {
    return sentence + '!'
};

// 呼叫後，會由最右邊的 toUpperCase callback 開始執行
const shout =
    compose(consoleSentence, exclaim, toUpperCase)

shout("send in the clowns") // "SEND IN THE CLOWNS!"
```

改為箭頭函式的寫法：

```javascript
const compose
    = (fn1, fn2, fn3) => (x) => fn1(fn2(fn3(x));
```

傳入無限數量的 fn 的寫法：

```javascript
const compose = (...fns) => x => fns.reversed().reduce((prev, fn) => fn(prev), x);

// or

const compose = (...fns) => x => fns.reduceRight((prev, fn) => fn(prev), x);
```

至此已經快速複習了 HOF、Currying、Compose 的觀念，接著來實作 `Redux Middleware` 相關功能吧！

<hr>

## 複習前篇已實作的 createStore.js 與 index.js

接下來，將先不定義或解釋 `Redux Middleware` 是什麼（可先忘掉 `Redux Middleware` 這個詞！），而是從需求開始實作，擴展先前已經完成的程式碼。

當隨著本文脈絡，實作出滿足幾個新需求的程式碼後，就會自然地完成趨近 Redux Source Code 的 `Middleware` 功能囉。

在開始實作需求前，先快速回憶上篇寫完的程式碼，分別有兩份 js 檔案：

1. `createStore.js` : 創建並 export createStore function，裡面已實作 store.getState、store.dispatch、store.subscribe 方法。
2. `index.js` : 應用程式(App)的程式碼，裡面會 import 已實作的 createStore，使用它來創建 store。

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;
  let currentListeners = [];
  let nextListeners = currentListeners;
  let isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  // 外部透過 store.getState 取得 store state
  function getState() {
    if (isDispatching) {
      throw new Error(...);
    }

    return currentState;
  }

  // 外部透過 store.dispatch(action) 更新 store state
  function dispatch(action) {
    if (isDispatching) {
      throw new Error(...);
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  }

  // 外部透過 store.subscribe(listener) 訂閱事件，被訂閱的事件會在 store state 改變後被觸發
  function subscribe(listener) {
    if (isDispatching) {
      throw new Error(...);
    }

    let isSubscribed = true;

    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe(listener) {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error(...);
      }

      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);

      isSubscribed = false;
    };
  }

  const randomString = () => Math.random().toString(36).substring(7).split('').join('.');

  dispatch({
    type: `INIT${randomString()}`,
  });

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
}

export default createStore;
```

```javascript
/*** index.js file ***/
import { createStore } from './createStore.js';

// 自定義 reducer
const reducer = (state, action) => {
  switch (action.type) {
    case 'PLUS_POINTS':
      return {
        points: state.points + action.payload,
      };
    case 'MINUS_POINTS':
      return {
        points: state.points - action.payload,
      };
    default:
      return state;
  }
};

// 將自定義的 reducer 傳入 createStore 中，藉此創建 store
// store 會提供 getState、dispatch、subscribe API
const preloadedState = {
  points: 0,
};
const store = createStore(reducer, preloadedState);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

document.getElementById('minus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

store.subscribe(() => {
  const points = store.getState().points;
  document.getElementById('display-points-automatically').textContent = points;
});
```

如果對於上述的程式碼很不熟，建議可以回頭閱讀[理解 Redux 原始碼：來實作 createStore 的 getState, dispatch, subscribe 吧](/articles/sourceCode/redux-make-createStore-getState-dispatch-subscribe)後，再來看目前這篇文章。

接著將開始接收需求，去擴展現有的程式碼。

<hr>

## First Middleware: Log preState and newState

現在有個需求，需要記錄下每次更新前的 state、更新後的 state，可以怎麼做？以程式運行面來說，就是要在**每次 dipatch 時，印出 preState、newState**。

最直覺的方式，是加上兩個步驟：

1. 在 `store.dispatch(action)` 前，`console.log({ preState })`。
2. 在 `store.dispatch(action)` 後，`console.log({ newState })`。

`index.js file` 程式改動如下：

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);

// 封裝 logWhenDispatch，達到 log state 的需求
const logWhenDispatch = action => {
    console.log({ preState: store.getState()});
    store.dispatch(action);
    console.log({ newState: store.getState()});
};

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // 將 store.dispatch 替換成 logWhenDispatch
  logWhenDispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

document.getElementById('minus-points-btn').addEventListener('click', () => {
  // 將 store.dispatch 替換成 logWhenDispatch
  logWhenDispatch({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

......
```

然而這樣有個缺點，就是必須把 `store.dispatch` 全部換成 `logWhenDispatch`，有沒有什麼辦法，能夠解決這個問題呢？

有的，就是「**擴展 store.dispatch 的功能**」，讓未來所有的 `store.dispatch` 都包含 `log` `preState` 和 `newState` 的功能即可，要達到這個目標，有兩個步驟：

1. 將原始的 `store.dispatch` 以變數 `next` 儲存起來。
2. 將 `store.dispatch` 重新賦值為 `logWhenDispatch` 的功能。

程式碼改動如下：

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);
// 將原始的 store.dispatch 功能儲存
const next = store.dispatch;

// 將 store.dispatch 重新賦值，達成 log preState、newState 的需求
store.dispatch = action => {
    console.log({ preState: store.getState()});
    // 執行原始的 dispatch
    next(action);
    console.log({ newState: store.getState()});
};

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // 如此一來，就不用將 store.dispatch 替換成 logWhenDispatch
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

document.getElementById('minus-points-btn').addEventListener('click', () => {
  // 如此一來，就不用將 store.dispatch 替換成 logWhenDispatch
  store.dispatch({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

......
```

至此，已透過「**擴展 store.dispatch 的功能**」的方式，實踐每次 `dipatch` 時，印出 `preState`、`newState` 的需求。

而這種**擴展 store.dispatch 的方法，其實就是 Middleware 的概念**，接著將透過更多的需求實踐，更理解這個概念。

<hr>

## Second Middleware: Catch error

接著有下個需求，我們希望在每個 `dispatch` 的過程中，如果有錯誤，就 `catch` 並且 `log`，可以怎麼做？

依據前面處理 log preState、newState 的邏輯，可以這樣實踐：

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);
// 將原始的 store.dispatch 功能儲存
const next = store.dispatch;

// 將 store.dispatch 重新賦值，達到 catch err 的需求
store.dispatch = action => {
    try {
        next(action);
    } catch (err) {
        console.log({ errLog : err });
    }
}

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // 使用 store.dispatch 時，已經自帶 catch err 的效果
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

接著重點來了，現在**同時需要 log state 以及 catch err 功能的 dispatch**，那可以怎麼做？

先釐清幾個需實踐的步驟：

1. 需要以 `next` 形式，保存原本的 `dispatch`。
2. 需要將 `store.dispatch` 賦予新的邏輯。
3. 當新的 `store.dispatch` 觸發時會 : `log preState` => `trigger next` => `catch err` => `log newState`。

程式碼實踐如下：

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);
// 將原始的 store.dispatch 功能儲存於 next
const next = store.dispatch;

// 將 store.dispatch 重新賦值，達到 :
// log preState => trigger next => catch err => log newState
store.dispatch = action => {
    console.log({ preState: store.getState()});

    try {
        next(action);
    } catch (err) {
        console.log({ errLog : err });
    }

    console.log({ newState: store.getState()});
};

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // 使用 store.dispatch 時，已自帶 log state 以及 catch error 的功能
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

目前這樣寫，會個問題就是：假設再來 10 個需求，那麼 `dispatch` 是否會變得異常龐大難以維護 ? 於是乎朝著**關注點分離**的方式著手試著將不同的功能，各自拆分成 function 控管。

以現有的例子而言，就會替 log state 與 try catch err 創建各自獨立的 function 控管，並可藉由組合的方式，實踐需求的串連。

步驟一：抽出 log state 功能，獨立成 `loggerMiddleware` function。

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);
const next = store.dispatch;

// 抽出 log state 的功能獨立成 loggerMiddleware，內部會呼叫 next(action)
const loggerMiddleware = action => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
}

// 將原本 next(action) 替換成 loggerMiddleware(action)
store.dispatch = action => {
    try {
        loggerMiddleware(action);
    } catch (err) {
        console.log({ errLog : err });
    }
};

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

步驟二：抽出 catch err 功能，獨立成 `catchErrMiddleware` function。

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);
const next = store.dispatch;

const loggerMiddleware = action => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
}

// 抽出 catch err 的功能獨立成 catchErrMiddleware，內部會呼叫 loggerMiddleware(action)
const catchErrMiddleware = action => {
     try {
        loggerMiddleware(action);
    } catch (err) {
        console.log({ errLog : err });
    }
};

// 直接賦值為 catchErrMiddleware
store.dispatch = catchErrMiddleware;

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

現在還有個問題會阻礙 `Middleware` function 使用的彈性，就是在 `catchErrMiddleware` 中的 `loggerMiddleware(action)` 是寫死的。如果現在 `catchErrMiddleware`，想要搭配其他的 `Middleware` 而非 `loggerMiddleware`，這樣寫就會有問題。

解法就是：在 `catchErrMiddleware` 中，要接著使用哪個 `Middleware`，也是靠外部傳入的函式參數 `next` 所決定。

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);
const next = store.dispatch;

const loggerMiddleware = action => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
}

// 將 catchErrMiddleware 加上 next 參數，使其能傳入 loggerMiddleware
const catchErrMiddleware = next => action => {
    try {
        // 無需寫死成 loggerMiddleware
        next(action);
    } catch (err) {
        console.log({ errLog : err });
    }
};

// 在此將 loggerMiddleware 當作參數，傳入 catchErrMiddleware
// 由於 Currying 所以 action 無需在此時傳入，等到使用 dispatch(action) 再傳入即可
store.dispatch = catchErrMiddleware(loggerMiddleware);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

同理，在 `loggerMiddleware` 中，要使用哪個 `Middeware`，也可以是靠外部傳入的參數 `next` 決定。

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);

// loggerMiddleware 也加上 next 參數，使其能傳入任意的 Middleware
const loggerMiddleware = next => action => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
};

const catchErrMiddleware = next => action => {
    try {
        next(action);
    } catch (err) {
        console.log({ errLog : err });
    }
};

const next = store.dispatch;
// loggerMiddleware 傳入 next 參數（此 next 即為原始的 store.dispatch）
store.dispatch = catchErrMiddleware(loggerMiddleware(next));

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

到此為止，算是完成多個 `Middleware` 的串接，也做到基本的關注點分離和擴展彈性。

<hr>

## Third Middleware : Record time

第三個需求是在 log preState 之前，先印出當前時間，以先前的結構實踐看看：

```javascript
/*** index.js file ***/
......

const store = createStore(reducer, preloadedState);

const loggerMiddleware = next => action => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
};

// 新增的 timeRecordMiddleware，會印出當前時間
const timeRecordMiddleware = next => action => {
    console.log({ time: new Date().getTime()});
    next(action);
};

const catchErrMiddleware = next => action => {
    try {
        next(action);
    } catch (err) {
        console.log({ errLog : err });
    }
};

const next = store.dispatch;
// 藉此達成 catchErrMiddleware、timeRecordMiddleware、loggerMiddleware 功能串接
store.dispatch = catchErrMiddleware(timeRecordMiddleware(loggerMiddleware(next)));

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

因為發現 `Middleware` 越來越多了，會想要把 `Middleware` 各自獨立成一個 js 檔案，要達成這件事情，就要把 `store` 當成參數傳入各個 `Middleware` 中，因此演變成：

```javascript
/*** loggerMiddleware.js file ***/
const loggerMiddleware = store => next => action => {
  console.log({ preState: store.getState() });
  next(action);
  console.log({ newState: store.getState() });
};

export default loggerMiddleware;
```

```javascript
/*** timeRecordMiddleware.js file ***/
const timeRecordMiddleware = store => next => action => {
  console.log({ time: new Date().getTime() });
  next(action);
};

export default timeRecordMiddleware;
```

```javascript
/*** catchErrMiddleware.js file ***/
const catchErrMiddleware = store => next => action => {
  try {
    next(action);
  } catch (err) {
    console.log({ errLog: err });
  }
};
```

```javascript
/*** index.js file ***/
import createStore from "./createStoreDemo.js";
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

const store = createStore(reducer, preloadedState);

// 全部的 Middleware 由其他檔案引入
// 且傳入 store 給各個 Middleware 使用
const logger = loggerMiddleware(store);
const timeRecord = timeRecordMiddleware(store);
const catchErr = catchErrMiddleware(store);

const next = store.dispatch;
store.dispatch = catchErr(timeRecord(logger(next)));

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

到此為止，算是已實踐了 `Middleware` 的完整概念，接著開始優化與封裝。

<hr>

## Encapsulation of Middleware logic : applyMiddleware

假定「有無數個 `Middleware` 時」，程式碼的複雜性和細節會很多，因此可以試著將重複的內容以及部分細節封裝，使用 `Redux` 的開發者，僅需要關注到使用哪些 `Middleware` 即可。

```javascript
/*** index.js file ***/
import createStore from "./createStoreDemo.js";
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

const store = createStore(reducer, preloadedState);

// 隨著 Middleware 越來越多，下面這幾行可考慮封裝
const logger = loggerMiddleware(store);
const timeRecord = timeRecordMiddleware(store);
const catchErr = catchErrMiddleware(store);
...

// 隨著 Middleware 越來越多，下面這兩行可考慮封裝
const next = store.dispatch;
store.dispatch = catchErr(timeRecord(logger(...)));

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

確定上述程式碼中有機會被封裝的部分後，接著來思考封裝的方式，這時候，回想起來目前在做的事情，其實就是擴展 `dispatch`，而 `dispatch` 存在於 `createStore` 中，因此可以試著「透過更新 `createStore`，在更新過程中做將 `dispatch` 重新封裝，最後 return 回 `dispatch` 已被擴展後的 `newCreateStore`」，就有機會達到封裝細節的目標。

程式碼實踐概念如下：

```javascript
/*** index.js file ***/
import createStore from "./createStoreDemo.js";
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

// 期望可以創建一個新的 newCreateStore，並已處理好 Middlewares 相關細節
// 開發者使用 Redux 時，只需關注傳入什麼 Middlewares 即可
const newCreateStore = applyMiddleware(exceptionMiddleware, timeMiddleware, loggerMiddleware, ...)(createStore);

// 期望藉由 newCreateStore 創建「dispatch 已經被擴展」的 store
const store = newCreateStore(reducer, preloadedState);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

上述程式碼中，最關鍵的角色正是 `applyMiddleware` 函式中封裝的邏輯，基本上它必須要滿足：

1. Input 可以傳入多個 `middlewares`
2. Output 會返回可傳入原始新的 `createStore` 的函式(先稱為 `rewriteCreateStoreFunc`)
3. 執行 `rewriteCreateStoreFunc` 後，會返回 `newCreateStore`，`newCreateStore` 創建的 `store` 已具備擴展功能的新 `dispatch`

`applyMiddleware` 程式邏輯如下：

```javascript
/*** applyMiddleware.js file ***/

// applyMiddleware input 可以傳入多個 middlewares
const applyMiddleware = function (...middlewares) {

  // 會 return 可傳入舊 createStore、返還新 createStore 的 rewriteCreateStoreFunc
  return function rewriteCreateStoreFunc(createStore) {

    // 執行 rewriteCreateStoreFunc 後，會回傳 newCreateStore
    return function newCreateStore(reducer, preloadedState) {

      // 1. 執行一些邏輯，創建出擴展後的 dispatch
      ......

      // 2. 更新 store.dispatch
      store.dispatch = dispatch;

      // 3. 回傳新的 store，此時 store.dispatch 已有擴展後的功能
      return store;
    };

  };
};

export default applyMiddleware;
```

#### 【 參考資料 】
