---
title: 理解 Redux 原始碼 (一)：來實作 createStore 的 getState、dispatch、subscribe 吧
date: 2021-12-01
description: 很好奇 Redux 是如何在程式中實踐狀態統一控管以及單向資料流的概念，於是決定閱讀 Redux 的原始碼，並解實作基礎的 createStore function，會聚焦在 getState、dispatch、subscribe API。
category: sourceCode
---

## 前言

雖然在先前工作中，比較常用到 Context API 以及 useReducer 處理狀態管理，然而依然很好奇 Redux 是如何在程式中實踐「狀態統一控管」以及「單向資料流」的概念，加上看過谷哥在 ModernWeb'21 上分享的 [挑戰 40 分鐘實作簡易版 Redux 佐設計模式](https://modernweb.ithome.com.tw/session-inner#448) 於是決定來閱讀 Redux 原始碼，並實作簡易的 `createStore` 函式，主要會聚焦在其中的 `getState`、`dispatch` 以及 `subscribe` API。

期許閱讀完這篇後，能達成：

- 理解 Redux 是什麼，以及主要想解決的問題
- 理解並實作 `createStore` 中的 `getState`、`dispatch`、`subscribe`
- 理解 `subscribe` 會遇到什麼 bugs，如何藉由 `currentListners`、`nextListners`、`ensureCanMutateNextListeners` 解決
- 能動手實作 basic createStore function

<hr>

## Redux 是什麼？

在進入實作 Redux `createStore` 前，先快速複習 Redux 是什麼以及想解決的問題。

**Redux 是一個基於 Flux 流程概念實踐的集中式資料狀態管理的工具**，可以使用在 JavaScript 開發的應用程式中，因此並不限定於 React 或任一框架。

為什麼會需要這個「集中式」的資料狀態管理工具？

主要是因為前端的複雜性越來越高，且時常同類型的資料可能散落在不同的區塊元件中，**如果分開管理資料可能會造成資料狀態不一致的狀況，於是透過集中管理資料的方式來解決這個問題**。

例如：通常在應用程式中，使用者的資料，如姓名、大頭照、信箱等，會用在不同的區塊元件中，如果沒有集中統一管理資料，就可能會造成 A 區塊元件中的信箱資料被更新，但 B 區塊元件中信箱資料卻還是過去的狀態。如果集中管理統一管理資料，亦即使用者的資料來源只有一處，就能解決這個問題。

可以從下圖直觀地了解有 Store State 當作集中式資料狀態庫時的好處。

![with and without Redux](/article/sourceCode/redux-make-createStore-getState-dispatch-subscribe/01.png)

除了「集中式」之外，Redux 還有一個關鍵是基於 Flux 實踐的「單向資料流」更新資料方式，簡言之就是**限制更新 Store State 的方式，只能透過下圖單向的流程來執行，藉此讓資料的改變更安全、可預期地被控管**，概念如下圖：

![redux flow](/article/sourceCode/redux-make-createStore-getState-dispatch-subscribe/02.png)

- Store :
  - Redux 的核心，可比喻為一個容器，擁有唯一的資料中心 `Store State`（是個 object）以及提供 `getState`、`dispatch`、`subscribe` 等 API 供外部使用。
  - 在創建 `Store` 時，會接收外部定義的 `Reducer` 函式（定義更新資料的規則），提供給更新資料時執行。
- Dispatcher :
  - 會接收 `Action`，這個 `Action` 包含著更新資料的方式 `Action Type` 以及更新資料時所用的值 `Action Payload`。
  - 如果 `Store` 中的資料發生了變化，只會有一種可能，就是由 `Dispatcher` 派發 `Action` 所觸發的結果。
- Reducer :
  - 會接收 `Dispatcher` 派發的 `Action`，經由對應的 `Action Type` 進行資料更新後，會回傳新的 `Store State`。
  - `Reducer` 是個 pure function，由外部定義，會在創建 `Store` 時傳入。

上面的觀念大致看過有個概念即可，先記住 Redux 最重要的觀念：

1. **會創建單一的中心資料庫**
2. **修改資料的模式是單向資料流**

接著就開始依據 Redux 原始碼的 pattern，實作 `createStore`。

_註 1：使用 Redux 是會有成本的，例如：程式碼數量增加、需要額外維護 Reducer、需要學習 Redux 的運作等，因此通常是資料流複雜度較高的專案才會考慮使用。_

_註 2：更嚴謹的定義 Redux，需包含 3 個要件為 **Single source of truth​、State is read-only​（only change by dispatching）、Changes are made with pure functions**，可參考 [Redux 文件](https://redux.js.org/understanding/thinking-in-redux/three-principles)。_

<hr>

## Step 1 : 實作單一資料庫與 getState API

由於 Redux 中的中心資料庫 `store state`，只能透過對外提供的特定 API 操作，因此先宣告 `createStore` 函式作為模組使用，可以對外提供特定 API。

```javascript
/*** createStore.js file ***/
createStore() {
  return {};
};

export default createStore;
```

實踐 Redux 只有單一中心資料庫的核心概念，因此在 `createStore` 內宣告 `currentState`，並初始為外部傳入的 `preloadedState`。

```javascript
/*** createStore.js file ***/
createStore(preloadedState) {
  // 創建單一的資料中心 currentState
  let currentState = preloadedState;

  return {};
};

export default createStore;

```

接著創建 `getState` API 方法，讓外部能使用 `store.getState` API，當呼叫 `getState`API 時，會 `return currentState`。

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  let currentState = preloadedState;

  function getState() {
    return currentState;
  }

  // 將內部的 getState function 提供給外部使用
  const store = {
    getState,
  };

  return store;
}

export default createStore;
```

如此一來，因為 closure，所以在 `createStore` 中宣告 `currentState` 的變數，不會被 garbage collection 機制回收，因此可以持續存在，提供給外部提取和操作。

<hr>

## Step 2 : 實作更改資料的 dispatch API

實踐單一的 `store state` 以及 `getState` API 後，下一步就來實踐「更新資料」。

先在 `createState` 內部，創建更新資料的方法，稱之為 `dispatch`，並且能傳入 `newState` 參數，藉此更新 `store state`。

```javascript
/*** createStore.js file ***/
function createStore(preloadedState) {
  let currentState = preloadedState;

  function getState() {...};

  // 創建更新 store state 的 dispatch API
  function dispatch(newState) {
    currentState = newState;
  };

  const store = {
    getState,
    dispatch,
  };

  return store;
};

export default createStore;
```

看起來好似完成了，然而目前更新資料庫的自由度過高，開發時可能產生問題。

例如：當 `store state`中，原本是有 number 型別的資料，會進行數字運算，但開發者不小心使用 `dispatch('string')` ，將資料更新成 string 時，就會造成運算上的 Bug。像是下面這樣：

```javascript
/*** index.js file ***/
import createStore from './createStore.js';

const preloadedState = {
  points: 0;
}

const store = createStore(preloadedState);

// 將目前 state + 1
store.dispatch({
  points: store.getState().points + 1
});

// 將目前 state - 1
store.dispatch({
  points: store.getState().points + 1
});

// 想隨便改，造成後續 Bug
store.dispatch({
  points: 'string'
});
```

因此會需要一些規則來解決這個問題，分成兩個方面思考：

1. 需要制定更新 `store state` 的規則，且需確保不會有預期外的 side effect。
2. 需要修改 `store.dispatch`，讓 `dispatch` 能按造制訂出來的規則更新 `store state`。

從第一點開始實作，透過名為 `reducer` 的 pure function，定義好更新 `store state` 的規則：

```javascript
/*** index.js file ***/
import createStore from './createStore.js';

const preloadedState = {
  points: 0;
};

// 透過宣告 reducer pure function，制定修改 state 的規則
// reducer 能傳入 currentState 以及要修改的 action 是什麼
function reducer(state, action) {
  switch (action.type) {
    // 當 action.type 是 INCREMENT 時，執行下面更新資料的邏輯
    case 'INCREMENT':
      return {
        ...state,
        points: state.points + 1;
      }
    // 當 action.type 是 DECREMENT 時，執行下面更新資料的邏輯
    case 'DECREMENT':
      return {
        ...state,
        points: state.points - 1;
      }
    default:
      return state;
  };
};

// 需將制定好的 reducer 傳入 createStore 中，提供給 dispatch 使用
const store = createStore(reducer, preloadedState);

// 透過定義好的 action.type "INCREMENT" 規則修改 state
store.dispatch({
  type: 'INCREMENT',
});

// 透過制定的 action.type "DECREMENT" 規則修改 state
store.dispatch({
  type: 'DECREMENT'
});
```

接著實作第二點，優化 `createStore` 中的 `dispatch`，使其能依據 `reducer` 規則修改 `store state`。

具體實踐上，就是讓 `dispatch` 能接收 `action`，並透過執行 `reducer` function，更新 `store state`。

```javascript
/*** createStore.js file ***/

// 新增 reducer 參數，由外部定義後傳入
function createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;

  function getState() {...};

  // dispatch 可以傳入 action object
  // 通常含 action.typ 與 action.payload
  function dispatch(action) {
    // 透過 reducer 定義好的計畫，更新 store state
    currentState = currentReducer(currentState, action)
  };

  const store = {
    getState,
    dispatch,
  };

  return store;
};

export default createStore;
```

至此，就完成更新 `store state` 的 `dispatch` API，複習一下，它做了兩件事情：

1. 可以接收 action 參數
2. 將 action 傳遞給 reducer，藉此更新 store state

<hr>

## Step 3 : 透過 isDispatching 優化 getState 以及 dispatch

到這邊為止要思考一件事，就是當 `reducer` 更新 `state` 時，如果再次觸發 `getState` 或 `dispatch` 會不會造成什麼問題？

換句話說，就是外部使用方能否在自定義的 `reducer` 內使用 `store.getState` 與 `store.dispatch` ?

- getState : 不必要，因為 `reducer` 本身參數已經傳入 `state`，直接從傳入的參數取用 `state` 即可。
- dispatch : 不必要，因為預期一個 `action` 就會針對 `state` 更動一次邏輯，因此可避免 `reducer` 執行時一個 `action` 時再重複觸發 `dispatch` 執行同個 `action` 的狀況，這種狀況會導致無限遞迴的 Bug。

撇除上面兩項說明，還有個重要思維是 **reducer 的本質是專注在接收 action ，並且根據各個 action type 已經定義好的邏輯，更新 state 後回傳，是個 pure function，所以多餘的 side effect 都該盡量避免**。

可以透過新增 `isDispatching` flag，來達成在 `reducer` 執行時，禁止 `getState` 與 `dispatch` 使用，流程如下：

1. 在 `dispatch` 中，`reducer` 要執行前，先將 `isDispatching = true`
2. 等到 `reducer` 執行完畢後，把 `isDispatching = false`
3. 如果在 `getState` 與 `dispatch` 中，遇到 `isDispatching = true` 就拋出 error message

藉此就能達成在 `reducer` 中，無法使用 `getState` 與 `dispatch` 的目標。

```javascript
/*** createStore.js file ***/

function createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;
  // 新增 isDispatching flag 去判斷是否正在執行 reducer
  // 在 dispatch 函式執行 reducer 前會轉為 true
  let isDispatching = false;

  function getState() {
    // 在 reducer 內不能使用 store.getState()
    // => isDispatching = true 要噴錯誤訊息
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Get the state from the top reducer instead of reading it from the store.'
      );
    }

    return currentState;
  }

  function dispatch(action) {
    // 在 reducer 內不能使用 store.dispatch()
    // => isDispatching = true 要噴錯誤訊息
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions when isDispatching.');
    }

    try {
      // 將 isDispatching 轉為 true 並執行 reducer
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      // reducer 執行結束時，將 isDispatching 轉為 false
      isDispatching = false;
    }
  }

  const store = {
    getState,
    dispatch,
  };

  return store;
}

export default createStore;
```

<hr>

## Step 4 : 實作訂閱機制的 subscribe API

今天新增一個需求，希望當 `store state` 中的 points 被更新時，要自動 `console.log` points，期望的使用方式如下：

```javascript
/*** index.js file ***/
import createStore from './createStore.js';

......

const store = createStore(reducer, preloadedState);

// 當 store state 改變時，就執行 callback function，印出 points
store.subscribe(() => {
  console.log(store.getState().points)
});

......
```

`subscribe` 需要實踐兩個重要的概念：

1. 可以傳入一個 callback 參數作為訂閱項目
2. 當 store state 改變後，訂閱的 callback 會被執行

基於上述就能實作出：

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;
  let isDispatching = false;
  // 定義 listener，在 subscribe 中被更新，在 dispatch 中被執行
  let listener = null

  function getState() {...};

  function dispatch(action) {
    ...
    // 當 state 經由 reducer 更新後，
    // 如果 listener 已訂閱項目，就會執行 listener
    if(listener) {
      listener();
    }
  };

  // subscribe 可以傳入一個 callback，命名為 listenerCb
  function subscribe(listenerCb) {
    // 在 reducer 執行時，不能新增訂閱
    if (isDispatching) {
        throw new Error(
          "You may not call store.subscribe() while the reducer is executing. " +
            "If you would like to be notified after the store has been updated, " +
            "subscribe from a component and invoke store.getState() in the callback to access the latest state."
        );
    }
    // 訂閱 listenerCb
    listener = listenerCb;
  };

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
};

export default createStore;
```

接著以實務需求面來思考兩個問題：

1. 會不會有需要取消訂閱的時候？會，所以需要有 unsubscribe 的方法。
2. 會不會有需要訂閱多個事件的時候？會，所以需要 listeners array 而非 listener 而已。

先處理第一個問題，讓 `subscribe` 會 return 回 `unsubscribe`，如此一來就能透過執行 `unsubscribe()` 來取消訂閱。

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...

  function subscribe(listenerCb) {
    if (isDispatching) {...}

    // 新增 isSubscribe flag 判斷 unsubscribe 是否要被執行
    let isSubscribed = true;

    listener = listenerCb;

    // 新增 unsubscribe 作為取消訂閱時使用
    return unsubscribe () {
      if (!isSubscribed) {
          return;
      }

      if (isDispatching) {
          throw new Error(
            "You may not unsubscribe from a store listener while the reducer is executing."
          );
      }

      // unsubscribe 被執行時，listener 改回空值
      listener = null;
      isSubscribed = false;
    }
  };

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
};

export default createStore;
```

接下來處理第二個問題，可以訂閱多個 callback 事件：

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  // 將 listener 改為 listeners = []
  let listeners = [];

  function getState() {...};

  function dispatch(action) {
    ...
    // 在 state 更新後，執行所有訂閱的 listener 事件
    for(let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };

  function subscribe(listener) {
    ...
    // 新訂閱的 listener，會被加入 listeners
    listeners.push(listener);

    return unsubscribe () {
      ...
      // 移除訂閱的事件，會被抽離 listeners
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);

      isSubscribed = false;
    }
  };

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
};

export default createStore;
```

到此就完成 subscribe / unsubscribe 基本功能。

<hr>

## Step 5 : 修復多層 subscribe / unsubscribe 的問題

目前我們實作的 Redux 在使用端執行多層 subscribe / unsubscribe 時會出現問題，如下：

```javascript
/*** index.js ***/
const store = createStore(reducer, preloadedState);
const unsubscribe1 = store.subscribe(() => {...});
const unsubscribe2 = store.subscribe(() => {
  // 在 subscribe callback 中執行 unsubscribe 會有問題
  unsubscribe1();
  // 在 subscribe callback 中執行另一個 subscribe 會有問題
  const unsubscribe3 = store.subscribe(() => {...});
});
```

為什麼上面這樣會有問題？**因為在針對 listeners array 進行 for loop 時，更改到 listeners 的長度，所以會造成非預期的執行狀況**。

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  function dispatch(action) {
    ...
    for(let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      // 假設在這個 listener 執行時，改變 listeners 的長度
      // 就可能導致有項目被跳過沒有被執行，或是非預期地多被執行
      listener();
    };
  };
  ...
};

export default createStore;
```

處理這個問題，最直覺的方式就是**確保正在執行的 listeners 不會被 subscribe / unsubscribe 影響**。

可以透過創建 `currentListeners` 與 `nextListeners` 達成這個目的：

- currentListeners : stable, 正在被 for 迴圈執行的 listeners
- nextListeners : unstable, 會被 subscribe 及 unsubscribe 改變的 listeners

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  // 將 listeners 改為 currentListeners 及 nextListeners
  let currentListeners = [];
  let nextListeners = currentListeners;

  function getState() {...};

  function dispatch(action) {
    ...
    // 在執行 currentListeners 前，先將 currentListeners 更新成最新的 listeners
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };

  function subscribe(listener) {
    ...
    // subscribe 時，改為對 nextListeners 進行操作
    nextListeners.push(listener);

    return unsubscribe () {
      ...
      // unsubscribe 時，改為對 nextListeners 進行操作
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);

      isSubscribed = false;
    }
  };

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
};

export default createStore;
```

特別注意的是 array 為 object data 複製時是複製 reference 而非 value，所以新增 `ensureCanMutateNextListeners` 處理這個問題。

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  let currentListeners = [];
  let nextListeners = currentListeners;

  function getState() {...};

  // 利用淺拷貝，確保 nextListeners 與 currentListeners 不會指向同一個資料
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function dispatch(action) {
    ...
    // 在執行 currentListeners 前，先將 currentListeners 更新成最新的 listeners
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };

  function subscribe(listener) {
    ...
    // 先執行 ensureCanMutateNextListeners，
    // 確保對 nextListeners 操作，不會改到 currentListeners
    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return unsubscribe () {
      ...
      // 先執行 ensureCanMutateNextListeners，
      // 確保對 nextListeners 操作，不會改到 currentListeners
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);

      isSubscribed = false;
    }
  };

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
};

export default createStore;
```

經過以上的處理，才算是真正地完成 subscribe / unsubscribe 。

<hr>

## Step 6 : 添加初始化的 dispatch

最後一步，添加初始化的 dispatch，讓一開始的 state 可以返回 reducer 中設定的 initialState。

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  // 給予一串隨機的字串
  const randomString = () =>
    Math.random().toString(36).substring(7).split("").join(".");

  // 初始化 state 的 dispatch
  // 利用 randomString 避免與使用者自定義的 INIT action type 衝突
  dispatch({
    type: `INIT${randomString()}`,
  });


  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
};

export default createStore;
```

至此就完成核心的 `createStore` 功能囉，實作程式碼的統整會放在下方「recap 整個 createSote 程式碼」段落。

<hr>

## 回顧最初的幾個閱讀文章目標

來回文章最初幾個希望閱讀後，能理解的項目：

### 1. 理解 Redux 是什麼，以及主要想解決的問題

Redux 是一個基於 Flux 流程概念實踐的集中式資料狀態管理的工具，最主要的目的是統一管理資料，避免資料狀態不一致的問題，且也利用單向資料流的方式控管資料狀態，讓資料變動更可預期與維護。

### 2. 理解並實作 createStore 中的 getState、dispatch、subscribe

createStore 的核心在於單一控管的 sore state，且提供下列三個 API :

- getState : 取得目前的 store state。
- dispatch : 透過傳入 action (含 type and payload) 更新 store state。
- subscribe : 透過傳入 callback，就能訂閱 callback，在 sotore state 更新後會執行 callback。

實作程式碼的統整會放在下方「回顧整個 createStore 程式碼」段落。

### 3. 理解 subscribe 會遇到什麼 bugs，如何藉由 currentListners、nextListners、ensureCanMutateNextListeners 解決

如果不特別處理，在 subscribe 傳入的 listner callback 中執行另一個 subscribe 或 unsubscribe 可能遇到非預期 bugs。

解決方案的關鍵就是：

- currentListners : 創建 currentListners，真正在 state 變動後，會執行的 listners。
- nextListners : 創建 nextListners，當 subscribe / unsubscribe 時，會針對 nextListners 新增或移除 listner。
- ensureCanMutateNextListeners : 因為 listners 是 array，為了確保 currentListners 與 nextListners 不同，因此在 nextListners 操作前，會先執行 ensureCanMutateNextListeners function。

### 4. 能動手實作 basic createStore function

可以試著自己實作，印象會更深刻！如果卡住，再來回顧本文或者 Redux 原始碼。

實作的完整程式碼，會放在下方「recap 整個 createSote 程式碼」段落。

<hr>

## 回顧整個 createStore 程式碼

整段程式碼如下，有註解解釋，如果需要無註解的版本，可以直接[點此到 Github 上觀看](https://github.com/LiangYingC/Implement-Simple-Redux/blob/master/createStore.js)。

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  // currentState 就是核心的 store state，初始的 preloadedState 由外部傳入
  let currentState = preloadedState;
  // currentReducer 就是更新 state 會使用的 reducer，由外部傳入
  let currentReducer = reducer;
  // currentListeners 以及 nextListeners 是為了 subscribe 功能而設計
  let currentListeners = [];
  let nextListeners = currentListeners;
  // isDispatching flag 是為了避免 reducer 中使用 getState、dispatch、subscribe 而設計
  let isDispatching = false;

  // ensureCanMutateNextListeners 利用淺拷貝，確保 nextListeners 以及 currentListeners 第一層指向不同來源
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  // 外部可透過 store.getState 取得 store state
  function getState() {
    if (isDispatching) {
      throw new Error(
        'You may not call store.getState() while the reducer is executing. ' +
          'The reducer has already received the state as an argument. ' +
          'Get the state from the top reducer instead of reading it from the store.'
      );
    }

    return currentState;
  }

  // 外部透過 store.dispatch(action) 改變 store state
  function dispatch(action) {
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions when isDispatching.');
    }

    try {
      isDispatching = true;
      // 透過 currentReducer 的執行，返回更新後的 store state
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    // store state 更新後，先更新 currentListeners，接著觸發所有訂閱的 listener
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  }

  // 外部透過 store.subscribe(listener) 訂閱、 unsubscribe(listener) 取消訂閱 listener
  function subscribe(listener) {
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, ' +
          'subscribe from a component and invoke store.getState() in the callback to access the latest state.'
      );
    }

    let isSubscribed = true;

    // 將新的 listener 添加到 nextListeners 前，先確保 currentListeners 與 nextListeners 不同
    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe(listener) {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing. '
        );
      }

      // 將 listener 從 nextListeners 移除前，先確保 currentListeners 與 nextListeners 不同
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);

      isSubscribed = false;
    };
  }

  const randomString = () => Math.random().toString(36).substring(7).split('').join('.');

  // initialize，透過 randomString() 避免與外部使用者定義的 INIT action type 撞名
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

同時附上使用 `createStore` 的範例：

```javascript
/*** index.js file ***/
import { createStore } from './createStore.js';

// 自定義 reducer
const reducer = (state, action) => {
  switch (action.type) {
    // 如果接收到 PLUS_POINTS 的 action.type，就增加 points
    case 'PLUS_POINTS':
      return {
        points: state.points + action.payload,
      };
    // 如果接收到 MINUS_POINTS 的 action.type，就減少 points
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

// 當 plus 按鈕被點擊時，就觸發 callback，增加 100 points
document.getElementById('plus-points-btn').addEventListener('click', () => {
  // 透過 dispatch { type: 'PLUS_POINTS', payload: 100 }
  // 將 store state 中的 points 增加 100
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

// 當 minus 按鈕被點擊時，就觸發 callback，減少 100 points
document.getElementById('minus-points-btn').addEventListener('click', () => {
  // 透過 dispatch { type: 'MINUS_POINTS', payload: 100 }
  // 將 store state 中的 points 減少 100
  store.dispatch({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

// 透過 subscribe 訂閱機制，當資料被更新時，就會執行傳入的 callback
store.subscribe(() => {
  // 透過 getState 取出最新的 points 並 render 到畫面上
  const points = store.getState().points;
  document.getElementById('display-points-automatically').textContent = points;
});
```

雖然並沒有做出最完整的 `createStore`，像是沒實作 `enhancer` 相關功能，但透過實作 `getState`、`dispatch`、`subscribe`，已經能理解核心的 Redux 運作，也知道它是如何透過 closure、listeners 等模式，去封裝並實踐集中式管理資料以及監聽資料變化等概念，整體而言很有趣呀。

已完成下篇文章[理解 Redux 原始碼 (二)：來實作 middlewares、applyMiddleware 以及 createStore enhancer 吧](/articles/sourceCode/redux-make-createStore-enhancer-and-applyMiddleware)，歡迎點閱。

<hr>

#### 【 參考資料 】

- [LiangYingC/Implement-Simple-Redux repo | 我的實作程式碼](https://github.com/LiangYingC/Implement-Simple-Redux)
- [reduxjs/redux repo | Redux 原始碼](https://github.com/reduxjs/redux/tree/master/src)
- [redux three principles | Redux 文件](https://redux.js.org/understanding/thinking-in-redux/three-principles)
- [挑戰 40 分鐘實作簡易版 Redux 佐設計模式 | 谷哥](https://modernweb.ithome.com.tw/session-inner#448)
- [完全理解 redux（从零实现一个 redux） ｜ brickspert](https://mp.weixin.qq.com/s?__biz=MzIxNjgwMDIzMA==&mid=2247484209&idx=1&sn=1a33a2c8cb58ae98e4f8080ab59da06f&scene=21#wechat_redirect)
- [從 source code 來看 Redux 更新 state 的運行機制 | 陳冠霖](https://as790726.medium.com/%E5%BE%9E-source-code-%E4%BE%86%E7%9C%8B-redux-%E7%9A%84%E9%81%8B%E8%A1%8C%E6%A9%9F%E5%88%B6-f5e0adc1b9f6)
