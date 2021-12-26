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

如果真的想理解 Redux Middleware 以及其 Source Code，就一定要先理解 functional programming 的部分觀念和實作，否則將相當挫折。

因此先複習 functional programming 部分觀念，僅針對與 Redux Middleware 有關的部分重點說明，藉此讓接下來實作 Redux Middleware 相關功能更加地順利。

### High order function (HOF)

JavaScript 中，函式為一等公民，意思是函式 **能被當作函式的參數**或**能被當作函式的結果回傳**。

滿足下列其一，即可稱為 Higher-order function (HOF) ：

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

### Currying

Currying 算是基於 HOF 所衍生出的概念之一，定義為：

**把帶有多個參數的函式，轉換成一次帶一個參數的多個連續函式**。

光看定義不容易懂，直接看案例會比較具體清楚：

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

將 Currying 的函示改寫成箭頭函式會更簡潔：

```javascript
/*** Currying concept by arrow function ***/
const add = x => y => x + y;

const result = add(5)(10); // 兩個步驟算出結果
```

好處是**可以將每個步驟做成獨立功能並重新命名，增加獨立性與可讀性**。

舉實際程式碼而言：實作取得 9 折的優惠價格，非 Currying 與 Currying 比較如下。

```javascript
/*** Without Currying ***/

function getDiscountPrice(price, discount) {
  return price * discount;
}

const price = getDiscountPrice(100, 0.9);

/*** With Currying ***/

const getDiscountPrice = discount => price => price * discount;

// 抽象獨立出打 9 折的專用 function，增加可讀性和專一功能性，藉此讓使用更安全
// 由於 closure 特性，所以 0.9 並不會被 GC 機制回收
const getTenPercentOff = getDiscountPrice(0.9);

const price = getTenPercentOff(100);
```

### Compose

Compose 算是基於 HOF 所衍生出的概念之一，定義為：

**傳入 compose 的多個 function 參數，最後會被組合為單一 function，並由最右方參數的 funcion 開始執行**。

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

// 呼叫後，會由最右邊的 callback function 開始執行
const shout =
    compose(consoleSentence, exclaim, toUpperCase)

shout("send in the clowns") // "SEND IN THE CLOWNS!"
```

改為 arrow function 的寫法：

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

<hr>

## 實作 Redux Middleware 相關功能

先不定義或解釋 Redux Middleware 是什麼（忽略 Redux Middleware 這個詞！），而是從需求開始實作，畢竟所有的程式碼優化，都是奠基於需求的擴展。

當隨著本文脈絡，實作出滿足幾個新需求的程式碼後，就會自然地完成趨近 Redux Source Code 的 Middleware 功能囉。

在開始實作需求前，先快速回憶上篇寫完的程式碼，分別有兩份 js 檔案：

1. **createStore.js** : 創建 createStore function，裡面已實作 store.getState、store.dispatch、store.subscribe 方法。
2. **index.js** : 應用程式程式碼，裡面會 import 已實作的 createStore，使用它來創建 store。

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

### First Middleware : Log preState and newState

現在有個需求，需要記錄下每次更新前的 state、更新後的 state，可以怎麼做？

以程式運行面來說，就是要在**每次 dipatch 時，印出 preState、newState**。

最直覺的方式，是加上兩個步驟：

1. 在 `store.dispatch(action)` 前，`console.log({ preState })`。
2. 在 `store.dispatch(action)` 後，`console.log({ newState })`。

程式碼改動如下：

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

至此，已透過「**擴展 store.dispatch 的功能**」的方式，實踐每次 dipatch 時，印出 preState、newState 的需求。

而這種擴展 `store.dispatch` 的方法，其實就是 Middleware 的概念，接著將透過更多的需求實踐，更理解這個概念。

### Second Middleware : Catch error when dispatch

#### 【 參考資料 】
