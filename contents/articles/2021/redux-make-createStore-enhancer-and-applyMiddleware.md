---
title: 理解 Redux 原始碼 (二)：來實作 middlewares、applyMiddleware 以及 createStore enhancer 吧
date: 2021-12-30
description: 接續上篇 Redux 系列文章，已實作完 createStore 中的 getState、dispatch、subscribe 後，這篇將進階到實作 Redux middleware 相關的功能，如 applyMiddleware 及 createStore 傳入的 enhancer 等。帶著好奇心，更深入探討 Redux 吧。
category: sourceCode
---

## 前言

延續上篇分享的 [理解 Redux 原始碼：來實作 createStore 的 getState, dispatch, subscribe 吧](/articles/sourceCode/redux-make-createStore-getState-dispatch-subscribe)，這次將更深入探討 Redux 原始碼中，關於 `middleware` 的部分，像是：`applyMiddleware` 及 `createStore` 傳入的 `enhancer` 等等。

期許閱讀完本文後，能達成：

- 理解 `middleware` 想達成的目標
- 能實作自己客製化的 `middleware`
- 理解並實作 `applyMiddleware`
- 理解並實作 `createStore` 傳入的第三個參數 `enhancer`

接下來，將先不定義或解釋 Redux middleware 是什麼，因此可暫忘掉 Redux middleware 這個詞！

本文將接續上篇文章的程式碼結果，包含 `createStore.js` 以及 `app.js` 的內容，持續接收「新的需求」，擴展開發 `app.js` 與 `createStore.js` 的程式碼，最後就會實作出 Redux middleware 相關功能。

因此，先快速回憶上篇實作的程式碼。

---

## 複習前篇已實作的 createStore.js 與 app.js

1. **createStore.js** : 創建 `createStore`，透過執行 `createStore` 可創建 `store`，裡面已實作 `store.getState`、`store.dispatch`、`store.subscribe` 方法。
2. **app.js** : 應用程式(App)的程式碼，裡面會 `import` 已實作的 `createStore`，使用它來創建 `store`。

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
/*** app.js file ***/
import createStore from './createStore.js';

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

如果對於上述的程式碼很不熟，建議先回頭閱讀[理解 Redux 原始碼：來實作 createStore 的 getState, dispatch, subscribe 吧](/articles/sourceCode/redux-make-createStore-getState-dispatch-subscribe)後，再來讀本文。

接著將開始接收需求，去擴展現有的程式碼，會先從 `app.js` 下手。

---

## 第一個需求: Log preState and newState

現在有個需求，需要知道每次更新前的 `state`、更新後的 `state`，可以怎麼做？以程式面來說，就是要在**每次 dipatch 時，印出 preState、newState**。

最直覺的改法，是在 `app.js` 加上兩個步驟：

1. 在 `store.dispatch(action)` 前，`console.log({ preState })`。
2. 在 `store.dispatch(action)` 後，`console.log({ newState })`。

```javascript
/*** app.js file ***/
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

然而這樣改有缺點，就是必須把 `store.dispatch` 全部換成 `logWhenDispatch`，有沒有什麼方法，能夠解決此問題？

有的，就是「**擴展 store.dispatch 的功能**」，讓未來所有的 `store.dispatch` 都包含印出 `preState` 和 `newState` 的功能，如此就無需替換掉 `store.dispatch`。

要達到這個目標，有兩個步驟：
1. 將原始的 `store.dispatch` 以變數 `next` 儲存起來。
2. 將 `store.dispatch` 重新賦值為 `logWhenDispatch` 的功能。

程式碼改動如下：

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);
// 將原始的 store.dispatch 功能儲存
const next = store.dispatch;

// 將 store.dispatch 重新賦值，藉此擴展功能，達成 log preState、newState 的需求
store.dispatch = (action) => {
    console.log({ preState: store.getState()});
    // 執行原始的 dispatch
    next(action);
    console.log({ newState: store.getState()});
};

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // 如此一來，不用將 store.dispatch 替換成 logWhenDispatch
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

document.getElementById('minus-points-btn').addEventListener('click', () => {
  // 如此一來，不用將 store.dispatch 替換成 logWhenDispatch
  store.dispatch({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

......
```

至此，已透過「**擴展 store.dispatch 的功能**」的方式，實踐每次 `dispatch` 時，印出 `preState`、`newState` 的需求。

而這種**擴展 store.dispatch 的思維，就是 middleware 的核心概念**，接著將透過更多的需求實踐，更理解這個概念。

---

## 第二個需求: Catch error

接著有另一個需求，希望在每個 `dispatch` 的過程中，如果有錯誤，就 `catch` 並且 `log` 出來，可以怎麼做？

依據前面處理印出 `preState`、`newState` 的邏輯，可以這樣實踐：

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);
// 將原始的 store.dispatch 功能儲存
const next = store.dispatch;

// 將 store.dispatch 重新賦值，達到 catch err 的需求
store.dispatch = (action) => {
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

重點來了，現在**同時需要 log state 以及 catch err 功能的 dispatch**，可以怎麼做？

先釐清幾個需要實踐的步驟：

1. 需要以 `next` 形式，保存原本的 `dispatch`。
2. 需要將 `store.dispatch` 賦予新的邏輯。
3. 當新的 `store.dispatch` 觸發時會: `log preState` => `trigger next` => `catch err` => `log newState`。

程式碼實踐如下：

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);
// 將原始的 store.dispatch 功能儲存於 next
const next = store.dispatch;

// 將 store.dispatch 重新賦值，達到 :
// log preState => trigger next => catch err => log newState
store.dispatch = (action) => {
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

目前這樣寫，還有個問題是：**假設再來 10 個需求，那麼 `dispatch` 是否會變得異常龐大難以維護** ?

於是朝著**關注點分離**的方向思考，著手試著**將不同的功能，各自拆分成獨立函式控管**。

以上述例子而言，可以試著將 log state 與 try catch err 創建成各自獨立的函式控管，並藉由**串連**兩個函式，實踐兩個需求的整合。

步驟一：抽出 log state 功能，獨立成 `loggerMiddleware` 函式。

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);
const next = store.dispatch;

// 抽出 log state 的功能，獨立成 loggerMiddleware，內部會呼叫 next(action)
const loggerMiddleware = (action) => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
}

// 將原本 next(action) 替換成 loggerMiddleware(action)
store.dispatch = (action) => {
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

步驟二：抽出 catch err 功能，獨立成 `catchErrMiddleware` 函式。

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);
const next = store.dispatch;

const loggerMiddleware = (action) => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
}

// 抽出 catch err 的功能，獨立成 catchErrMiddleware，內部會呼叫 loggerMiddleware(action)
const catchErrMiddleware = (action) => {
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

現在還有個問題會阻礙 `middleware` 函式使用的彈性，就是在 `catchErrMiddleware` 中的 `loggerMiddleware(action)` 是寫死的。如果現在 `catchErrMiddleware`，想要搭配其他的 middleware 而非 `loggerMiddleware`，這樣寫就會有問題。

解法就是：在 `catchErrMiddleware` 中，要接著使用哪個 middleware，也是靠外部傳入的函式參數 `next` 所決定。

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);
const next = store.dispatch;

const loggerMiddleware = (action) => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
}

// 將 catchErrMiddleware 加上 next 參數，使其能傳入 loggerMiddleware
const catchErrMiddleware = (next) => (action) => {
    try {
        // 無需寫死成 loggerMiddleware(action)
        next(action);
    } catch (err) {
        console.log({ errLog : err });
    }
};

// 將 loggerMiddleware 當作參數，傳入 catchErrMiddleware
// 由於 Currying 所以 action 無需在此時傳入，等到使用 store.dispatch(action) 再傳入即可
store.dispatch = catchErrMiddleware(loggerMiddleware);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

同理，在 `loggerMiddleware` 中，要使用哪個 middleware，也可以是靠外部傳入的參數 `next` 決定。

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);

// loggerMiddleware 也加上 next 參數，使其能傳入任意的 middleware
const loggerMiddleware = (next) => (action) => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
};

const catchErrMiddleware = (next) => (action) => {
    try {
        next(action);
    } catch (err) {
        console.log({ errLog : err });
    }
};

const next = store.dispatch;
// catchErrMiddleware(loggerMiddleware) 改為 catchErrMiddleware(loggerMiddleware(next))
// loggerMiddleware 傳入的 next 參數，即為原始的 store.dispatch
store.dispatch = catchErrMiddleware(loggerMiddleware(next));

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

至此，已完成多個 middlewares 的串接，也做到基本的關注點分離和擴展彈性。

---

## 第三個需求: Record time

第三個需求是在 log preState 之前，先印出當前時間，以先前的結構實踐看看：

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);

const loggerMiddleware = (next) => (action) => {
    console.log({ preState: store.getState()});
    next(action);
    console.log({ newState: store.getState()});
};

// 新增的 timeRecordMiddleware，會印出當前時間
const timeRecordMiddleware = (next) => (action) => {
    console.log({ time: new Date().getTime()});
    next(action);
};

const catchErrMiddleware = (next) => (action) => {
    try {
        next(action);
    } catch (err) {
        console.log({ errLog : err });
    }
};

const next = store.dispatch;
// 達成 catchErrMiddleware、timeRecordMiddleware、loggerMiddleware 功能串接
store.dispatch = catchErrMiddleware(timeRecordMiddleware(loggerMiddleware(next)));

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

因為發現 middleware 越來越多，會想把每個 middleware 各自獨立成 js 檔案，要達成這件事情，就要把 `store` 當成參數傳入各個 middleware 中，讓 middleware 中能使用到 `store.getState()`，因此變成：

```javascript
/*** loggerMiddleware.js file ***/
const loggerMiddleware = (store) => (next) => (action) => {
  console.log({ preState: store.getState() });
  next(action);
  console.log({ newState: store.getState() });
};

export default loggerMiddleware;
```

```javascript
/*** timeRecordMiddleware.js file ***/
const timeRecordMiddleware = (store) => (next) => (action) => {
  console.log({ time: new Date().getTime() });
  next(action);
};

export default timeRecordMiddleware;
```

```javascript
/*** catchErrMiddleware.js file ***/
const catchErrMiddleware = (store) => (next) => (action) => {
  try {
    next(action);
  } catch (err) {
    console.log({ errLog: err });
  }
};
export default catchErrMiddleware;
```

```javascript
/*** app.js file ***/
import createStore from "./createStoreDemo.js";
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

const store = createStore(reducer, preloadedState);

// 全部的 middleware 由其他檔案引入
// 且傳入 store 給各個 middleware 使用
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

至此，已透過需求的實踐，間接達成實作 Redux middleware 的完整概念！

最後會再回過頭來定義解說 Redux middleware ，現在先接續目前程式碼，做更多的優化封裝。

---

## 實作 applyMiddleware 函式，封裝 middlewares 的細節邏輯

假定**有無數個 middlewares 時**，程式碼的複雜性和細節會很多，因此可以將重複的內容以及部分細節封裝，讓使用 Redux 的開發者，僅需關注要使用哪些 middlewares 即可。

```javascript
/*** app.js file ***/
import createStore from "./createStoreDemo.js";
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

const store = createStore(reducer, preloadedState);

// 隨著 middleware 越來越多，下面這幾行可考慮封裝
const logger = loggerMiddleware(store);
const timeRecord = timeRecordMiddleware(store);
const catchErr = catchErrMiddleware(store);
...

// 隨著 middleware 越來越多，下面這兩行可考慮封裝
const next = store.dispatch;
store.dispatch = catchErr(timeRecord(logger(...)));

......
```

了解上述程式碼中，有可被封裝的部分後，接著思考封裝方式。

綜合來看，目前做的事情，其實就是「擴展 `dispatch`」，而 `dispatch` 存在於 `createStore` 中，從這個方向思考，可以試著「創造一個 `dispatch` 已經擴展完畢的 `newCreateStore`」，藉著執行 `newCreateStore` 就能獲取已擴展 `dispatch` 的 `store`：

```javascript
/*** app.js file ***/

......

// 期望可以創建一個 newCreateStore
const newCreateStore = ... // 透過某些方式創建 newCreateStore

// 期望藉由 newCreateStore 創建「dispatch 已被擴展」的 store
const store = newCreateStore(reducer, preloadedState);

......
```

該如何創建 `newCreateStore` 呢？

可以透過封裝函式來進行，這個函式需將 `middleware` 相關重複邏輯封裝，讓開發者只需關注需傳入哪些 middlewares 即可，其他細節都無需關注，先將這個函式命名為 `applyMiddleware`。

至於 `applyMiddleware` 這個函式必須擁有下面兩個參數，才能創建出 `newCreateStore`：

1. **middlewares** : 傳入所有要使用的 middleware。
2. **createStore** : 原本的 createStore。

透過 Currying 概念實踐之：

```javascript
/*** app.js file ***/
import createStore from "./createStoreDemo.js";
import applyMiddleware from './applyMiddleware.js';
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

// 期望透過 applyMiddleware 創建 newCreateStore，並已處理好 middlewares 相關細節
// 開發者使用 Redux 時，只需關注傳入什麼 middlewares
const newCreateStore = applyMiddleware(
    exceptionMiddleware,
    timeMiddleware,
    loggerMiddleware,
    ...,
)(createStore);

// 期望藉由 newCreateStore 創建「dispatch 已經被擴展」的 store
const store = newCreateStore(reducer, preloadedState);

......
```

由於 Currying 所以也可寫成：

```javascript
/*** app.js file ***/
import createStore from "./createStoreDemo.js";
import applyMiddleware from './applyMiddleware.js';
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

// 由於 Currying，所以可先透過 applyMiddleware 宣告 rewriteCreateStoreFunc
const rewriteCreateStoreFunc = applyMiddleware(
    exceptionMiddleware,
    timeMiddleware,
    loggerMiddleware,
    ...,
);
// 再透過 rewriteCreateStoreFunc(createStore) 創建 newCreateStore
const newCreateStore = rewriteCreateStoreFunc(createStore);

// 期望藉由 newCreateStore 創建「dispatch 已經被擴展」的 store
const store = newCreateStore(reducer, preloadedState);

......
```

繼續探討最關鍵的 `applyMiddleware`，它要滿足：

1. Input 可以傳入多個 `middlewares`
2. Output 會返回可傳入 `createStore` 的函式 (稱為 `rewriteCreateStoreFunc`)
3. 執行 `rewriteCreateStoreFunc` 後，會返回 `newCreateStore`，`newCreateStore` 創建的 `store` 已具備擁有 `middlewares` 功能的 `dispatch`

`applyMiddleware` 程式邏輯如下：

```javascript
/*** applyMiddleware.js file ***/

// applyMiddleware input 可以傳入多個 middlewares
const applyMiddleware = function (...middlewares) {

  // 會 return 可傳入 createStore、返還 newCreateStore 的 rewriteCreateStoreFunc
  return function rewriteCreateStoreFunc(createStore) {

    // 執行 rewriteCreateStoreFunc 後，會回傳 newCreateStore
    return function newCreateStore(reducer, preloadedState) {

      // 1. 執行些邏輯，創建出擴展 middlewares 功能的 dispatch
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

接著關注 return 的 `newCreateStore` 中細節邏輯的實踐：

```javascript
/*** applyMiddleware.js file ***/
const applyMiddleware = function (...middlewares) {
  return function rewriteCreateStoreFunc(createStore) {
    return function newCreateStore(reducer, preloadedState) {
      // 1. 使用原始的 createStore 創建原始的 store
      const store = createStore(reducer, preloadedState);

      // 2. 創建 middleware chain，將每個 middleware 都傳入 store 參數
      // 相當於先前的 logger = loggerMiddleware(store)、timeRecord = timeRecordMiddleware(store)、catchErr = catchErrMiddleware(store)，返還 [catchErr, timeRecord, logger]
      const middlewareChain = middlewares.map(middleware => middleware(store));

      // 3. 宣告 dispatch，並先紀錄原始的 dispatch
      // 相當於先前的 next = store.dispatch
      let dispatch = store.dispatch;

      // 4. 擴展 dispatch，將 middlewares 的功能封裝其中
      // 相當於先前的 catchErr(timeRecord(logger(next)))
      middlewareChain.reverse().map(middleware => {
        dispatch = middleware(dispatch);
      });

      // 5. 更新 store.dispatch
      // 相當於先前的 store.dispatch = catchErr(timeRecord(logger(next)))
      store.dispatch = dispatch;
      return store;
    };
  };
};

export default applyMiddleware;
```

到這個階段，已實踐整個 `applyMiddleware` 的函式啦，還可做些調整，使其更符合原始碼 pattern。

---

## applyMiddleware 函式的優化

### 一、用箭頭函式的寫法，讓寫法更簡潔

```javascript
/*** applyMiddleware.js file ***/
const applyMiddleware = function (...middlewares) {
  // 用箭頭函式讓 Currying 寫法更簡潔
  return (createStore) => (reducer, preloadedState) => {
      const store = createStore(reducer, preloadedState);
      let dispatch = store.dispatch;

      const middlewareChain = middlewares.map(middleware => middleware(store));
      middlewareChain.reverse().map(middleware => {
          dispatch = middleware(dispatch);
      });

      store.dispatch = dispatch;
      return store;
  };
};

export default applyMiddleware;
```

### 二、用 Redux 封裝的 `compose`，讓寫法更簡潔

```javascript
/*** compose.js file ***/

// Redux 封裝的 compose
// 其實就是 FP compose 概念的實踐，如不熟悉可自行 Google
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

export default compose;
```

```javascript
/*** applyMiddleware.js file ***/
import compose from './compose.js'

const applyMiddleware = function (...middlewares) {
  return (createStore) => (reducer, preloadedState) => {
      const store = createStore(reducer, preloadedState);
      let dispatch = store.dispatch;

      const middlewareChain = middlewares.map(middleware => middleware(store));
      // 用 compose 取代先前 map 的寫法，創建 catchErr(timeRecord(logger(...)))
      dispatch = compose(...middlewareChain)(store.dispatch);

      store.dispatch = dispatch;
      return store;
  };
};

export default applyMiddleware;
```

### 三、避免 middleware 使用 subscribe

如果依照最少修改原則，`middleware` 應僅能修改 `dispatch`，頂多過程中能取得 `getState` 使用，但不該動 `subscribe`，因此可針對 `applyMiddleware` 做進一步調整避免 `middleware` 使用 `subscribe` :

```javascript
/*** applyMiddleware.js file ***/
import compose from './compose.js'

const applyMiddleware = function (...middlewares) {
  return (createStore) => (reducer, preloadedState) => {
      const store = createStore(reducer, preloadedState);
      let dispatch = store.dispatch;

      // 透過 storeForMiddleware，限制 middleware 只能用 getState，但無法使用 subscribe
      const storeForMiddleware = { getState: store.getState };
      const middlewareChain = middlewares.map(middleware => middleware(storeForMiddleware));
      dispatch = compose(...middlewareChain)(store.dispatch);

      store.dispatch = dispatch;
      return store;
  };
};

export default applyMiddleware;
```

到此，完成 `applyMiddleware` 的寫法優化，在 `app.js` 中可以這樣使用：

```javascript
/*** app.js file ***/
import createStore from "./createStoreDemo.js";
import applyMiddleware from "./applyMiddleware.js";
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

// 透過 applyMiddleware 創建 newCreateStore，藉此使用 middlewares
const newCreateStore = applyMiddleware(
  catchErrMiddleware,
  timeRecordMiddleware,
  loggerMiddleware
)(createStore);

// 透過 newCreateStore 創建「dispatch 已經被擴展」的 store
const store = newCreateStore(reducer, preloadedState);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

---

## 整合 createStore 與 newCreateStore

目前 `createStore` 有兩種狀況：

- 當有用到 `middlewares` 時，開發者要自行創建 `newCreateStore`，並使用之。
- 當沒有用到 `middlewares` 時，開發者要直接使用原始的 `createStore` 即可。

因此可再調整 `createStore.js`，讓開發者無需關注這個問題：

```javascript
/*** createStore.js file ***/

// 多傳入第三個參數 rewriteCreateStoreFunc
function createStore(reducer, preloadedState, rewriteCreateStoreFunc) {
    // 如果有 rewriteCreateStoreFunc，就使用新版的 createStore
    if(rewriteCreateStoreFunc){
       const newCreateStore = rewriteCreateStoreFunc(createStore);
       return newCreateStore(reducer, preloadedState);
    };

    // 不然就照原始 createStore 流程走
    ......
}

export default createStore;
```

在 `app.js` 中，無論是否用 `middlewares` 都只需使用 `createStore`。

```javascript
/*** app.js file ***/
import createStore from "./createStoreDemo.js";
import applyMiddleware from "./applyMiddleware.js";
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

// 透過 applyMiddleware 創建 rewriteCreateStoreFunc
const rewriteCreateStoreFunc = applyMiddleware(
  catchErrMiddleware,
  timeRecordMiddleware,
  loggerMiddleware
);

// 使用 createStore 並傳入第三個參數 rewriteCreateStoreFunc
const store = createStore(reducer, preloadedState, rewriteCreateStoreFunc);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

最後，將 `rewriteCreateStoreFunc` 依照原始碼 pattern，改名 `enhancer`：

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState, enhancer) {
    // 如果有 enhancer，就使用新版的 createStore
    if(enhancer){
       const newCreateStore = enhancer(createStore);
       return newCreateStore(reducer, preloadedState);
    };

    // 不然就照原始 createStore 流程走
    ......
}

export default createStore;
```

```javascript
/*** app.js file ***/
import createStore from "./createStoreDemo.js";
import applyMiddleware from "./applyMiddleware.js";
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

......

// 透過 applyMiddleware 創建 enhancer
const enhancer = applyMiddleware(
  catchErrMiddleware,
  timeRecordMiddleware,
  loggerMiddleware
);

// 使用 createStore 並傳入第三個參數 enhancer
const store = createStore(reducer, preloadedState, enhancer);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

終於啊！到此大致完成 Redux 原始碼中，與 `middleware` 有關的邏輯概念實作！

---

## 回顧本文幾個重點項目

文章最初有設定幾個閱讀完後，期待的收穫，來一一回顧：

### 一、理解 middleware 想達成的目標

藉由這個項目，來統整 Redux middleware 的定義：

**透過 Redux middleware 的機制，開發者可以擴展 Dispatcher 的功能，達成在 Action 被指派後到 Reducer 執行前，或者在 Reducer 執行後，進行額外的操作處理**，例如：把更新前後的資料狀態印出來觀察、呼叫 API 更新資料等等，概念如下圖。

![redux flow](/article/sourceCode/redux-make-createStore-enhancer-and-applyMiddleware/01.gif)

特別注意的是，middleware 並非一次只能使用一個，如果有多個 middlewares 的情況，概念上就會像接力一樣，前一個 middleware 會透過 `next` 將 `action` 交給下一個 middleware，直到最後一個 middleware 執行完畢後，才會觸發到原始的 `dispatch`，進而執行 `reducer`。

以上這段說明，如果沒有實際把 Redux middleware 程式碼實作出來，其實不好理解，但實作過一次後，就更容易清楚多個 middlewares 串連的脈絡。

### 二、能實作自己客製化的 middleware

回顧實踐的 `loggerMiddleware`、`catchErrMiddleware` 結構：

```javascript
/*** loggerMiddleware.js file ***/
const loggerMiddleware = (store) => (next) => (action) => {
  console.log({ preState: store.getState() });
  next(action);
  console.log({ newState: store.getState() });
};

export default loggerMiddleware;
```

```javascript
/*** catchErrMiddleware.js file ***/
const catchErrMiddleware = (store) => (next) => (action) => {
  try {
    next(action);
  } catch (err) {
    console.log({ errLog: err });
  }
};
export default catchErrMiddleware;
```

可發現 `middleware` 函式的形式就是：

```javascript
const middleware = (store) => (next) => (action) => {
  // can do some logic
  next(action);
  // can do some logic
};
```

基本上滿足兩個條件：

1. 使用 Currying 概念，並可傳入 `store`、`next`、`action`
2. 使用 `next(action)` ，藉此接續下個 middleware 或觸發原始的 `dispatch`

就能製作出客製化的 middleware，例如知名的 `Redux-Thunk`：

```javascript
/*** Redux-Thunk source code ***/
const thunkMiddleware = ({ dispatch, getState }) => next => action => {
  // The thunk middleware looks for any functions that were passed to `store.dispatch`.
  // If this "action" is really a function, call it and return the result.
  if (typeof action === 'function') {
    // Inject the store's `dispatch` and `getState` methods
    return action(dispatch, getState);
  }

  // Otherwise, pass the action down the middleware chain as usual
  return next(action);
};

export default thunkMiddleware;
```

### 三、理解並實作 applyMiddleware

`applyMiddleware` 基本上就是封裝 middlewares 與 `dispatch` 兩者整合的細節，最後會直接返回一個可傳入 `createStore` 以及 `reducer, preloadedState` 的函式（通常被命名成 `enhancer`）。

```javascript
/*** applyMiddleware.js ***/
import compose from './compose.js'

// input 為傳入多個 middlewares
const applyMiddleware = function (...middlewares) {
  // output 為可傳入 createStore 與 reducer, preloadedState 的函式
  return (createStore) => (reducer, preloadedState) => {
      const store = createStore(reducer, preloadedState);
      let dispatch = store.dispatch;

      const middlewareChain = middlewares.map(middleware => middleware(store));
      dispatch = compose(...middlewareChain)(store.dispatch);

      store.dispatch = dispatch;
      return store; // 此 store 的 dispatch 已封裝 middlewares 的功能
  };
};

export default applyMiddleware;
```

使用起來如下：

```javascript
......

// 透過 applyMiddleware 創建 enhancer
const enhancer = applyMiddleware(
  catchErrMiddleware,
  timeRecordMiddleware,
  loggerMiddleware
);

......

```

### 四、理解並實作 createStore 傳入的第三個參數 enhancer

`enhancer` 為執行 `applyMiddleware(...middlewares)` 返回的函式，可以傳入 `createStore` 中，執行 `createStore(reducer, preloadedState, enhancer)` 後，將創建出 `store`，其 `store.dispatch` 已含有 `middlewares` 功能。

```javascript
......

// 透過 applyMiddleware 創建 enhancer
const enhancer = applyMiddleware(
  catchErrMiddleware,
  timeRecordMiddleware,
  loggerMiddleware
);
// 使用 createStore 並傳入第三個參數 enhancer
const store = createStore(reducer, preloadedState, enhancer);

......
```

從 `createStore.js` 中，可以看出如果 `enhancer` 存在，那就會執行之：

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState, enhancer) {
    // 如果有 enhancer，就使用新版的 createStore
    if(enhancer){
       const newCreateStore = enhancer(createStore);
       return newCreateStore(reducer, preloadedState);
    };

    // 不然就照原始 createStore 流程走
    ......
}

export default createStore;
```

---

## 回顧所有實作的程式碼

這次實作的核心程式碼如下，有包含註解。如果需無註解的版本[請點此前往 Github](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase2_middlewares)：

```javascript
/*** loggerMiddleware.js file ***/

// 創建 loggerMiddleware 會印出 preState 以及 newState
const loggerMiddleware = store => next => action => {
  console.log({ preState: store.getState() });
  next(action);
  console.log({ newState: store.getState() });
};
export default loggerMiddleware;
```

```javascript
/*** timeRecordMiddleware.js file ***/

// 創建 loggerMiddleware 會印出更新 state 的時間
const timeRecordMiddleware = store => next => action => {
  console.log({ time: new Date().getTime() });
  next(action);
};
export default timeRecordMiddleware;
```

```javascript
/*** catchErrMiddleware.js file ***/

// 創建 loggerMiddleware 會抓出更新 state 時的錯誤
const catchErrMiddleware = store => next => action => {
  try {
    next(action);
  } catch (err) {
    console.log({ errLog: err });
  }
};
export default catchErrMiddleware;
```

```javascript
/*** applyMiddleware.js file ***/
import compose from './compose.js'

// 執行時傳入 middlewares，創建出 enhancer
const applyMiddleware = function (...middlewares) {
  return (createStore) => (reducer, preloadedState) => {
      // 1.使用原始的 createStore 創建原始的 store
      const store = createStore(reducer, preloadedState);
      // 2.紀錄原始的 dispatch
      let dispatch = store.dispatch;

      // 3.封裝給 middleware 用的 store
      const storeForMiddleware = { getState: store.getState };
      // 4.創建 middleware chain，將每個 middleware 都傳入 store 參數
      // 產生的結果 : [logger, timeRecord, catchErr]
      const middlewareChain = middlewares.map(middleware => middleware(storeForMiddleware));
      // 5.擴展 dispatch，將 middlewares 的功能封裝其中
      // 產生的結果 : catchErr(timeRecord(logger(store.dispatch)))
      dispatch = compose(...middlewareChain)(store.dispatch);

      // 6.更新 store.dispatch
      store.dispatch = dispatch;
      return store;
  };
};


export default applyMiddleware;
```

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState, enhancer) {
    // 如果有 enhancer，就使用新版的 createStore
    if(enhancer){
       const newCreateStore = enhancer(createStore);
       return newCreateStore(reducer, preloadedState);
    };

    // 不然就照原始 createStore 流程走
    ......

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
/*** app.js file ***/
import createStore from './createStore.js';
import applyMiddleware from './applyMiddleware.js';
import loggerMiddleware from './loggerMiddleware.js';
import timeRecordMiddleware from './timeRecordMiddleware.js';
import catchErrMiddleware from './catchErrMiddleware.js';

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

// 透過 applyMiddleware，傳入多個 middlewares 創建 enhancer
const enhancer = applyMiddleware(catchErrMiddleware, timeRecordMiddleware, loggerMiddleware);

// 使用 createStore 傳入第三個參數 enhancer，創建 dispatch 已被擴展的 store
const preloadedState = {
  points: 0,
};
const store = createStore(reducer, preloadedState, enhancer);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // 此 dispatch 已可觸發 middlewares 相關功能
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

比對真正的 Redux 原始碼，會發現有些程式不同，因為還有更多實作的細節，例如：判斷傳入型別是否正確、避免錯誤使用、程式寫法優化等等的內容，在此並沒有完全實作，有興趣可再多去閱讀原始碼。

然而整體而言，已實作 Redux middleware 的核心概念，而且是從需求角度出發的思考模式，希望讓閱讀完的你，有更容易理解 Redux middleware 相關原始碼。

下篇文章會實作 `combineReducers`，相對此篇，非常輕量簡單，有興趣歡迎閱讀：[理解 Redux 原始碼 (三)：來實作 combineReducers 吧](/articles/sourceCode/redux-make-combineReducers)。

---

#### 【 參考資料 】

- [LiangYingC/understand-redux-source-code](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase2_middlewares)
- [reduxjs/redux | redux source code ](https://github.com/reduxjs/redux/tree/master/src)
- [middleware | redux document](https://redux.js.org/understanding/history-and-design/middleware)
- [完全理解 redux（从零实现一个 redux）｜ brickspert](https://mp.weixin.qq.com/s?__biz=MzIxNjgwMDIzMA==&mid=2247484209&idx=1&sn=1a33a2c8cb58ae98e4f8080ab59da06f&scene=21#wechat_redirect)
- [詳解 Redux middleware ｜ 谷哥](https://max80713.medium.com/%E8%A9%B3%E8%A7%A3-redux-middleware-efd6a506357e)
- [從 source code 來看 Redux 更新 state 的運行機制 | 陳冠霖](https://as790726.medium.com/%E5%BE%9E-source-code-%E4%BE%86%E7%9C%8B-redux-%E7%9A%84%E9%81%8B%E8%A1%8C%E6%A9%9F%E5%88%B6-f5e0adc1b9f6)
