---
title: 理解 Redux 原始碼：來實作簡單的 Redux createStore 吧
date: 2021-11-21
description: 很好奇 redux 是如何在程式中實踐狀態統一控管以及單向資料流的概念，於是決定閱讀 Redux 的原始碼，並解實作簡單的 createStore function，會聚焦在 getState、dispatch、subscribe API。
category: javaScript
---

## 前言

雖然在先前工作中，比較常用到 Context API 以及 useReducer 處理狀態管理，然而依然很好奇 Redux 是如何在程式中實踐狀態統一控管以及單向資料流的概念，加上看過谷哥在 ModernWeb'21 上分享的 [挑戰 40 分鐘實作簡易版 Redux 佐設計模式](https://modernweb.ithome.com.tw/session-inner#448) 於是就決定來閱讀原始碼，並參考谷哥的做法，實作簡易的 createStore function，主要會先聚焦在其中的 `getState`、`dispatch` 以及 `subscribe` API。

期許閱讀完這篇後，能理解：

- Redux 是什麼？主要解決什麼問題？
- 理解並實作 createStore 中的 getState、dispatch、subscribe
- 理解 subscribe 會遇到什麼 bugs，如何藉由 currentListners、nextListners、ensureCanMutateNextListeners 解決

<hr>

## Redux 是什麼？

**Redux 是一個基於 Flux 流程概念實踐的集中式資料狀態管理的工具**，可以使用在 JavaScript 開發的應用程式中，因此並不限定於 React 或任一框架。

為什麼會需要這個「集中式」的資料狀態管理工具？

主要是因為在前端的複雜性越來越高，並且時常同一類型的資料可能散落在不同的區塊元件中，**如果分開管理資料可能會造成資料狀態不一致的狀況**，例如：通常在應用程式中，使用者的資料，如姓名、大頭照、信箱等，會用在不同的區塊元件中，如果沒有集中式統一管理資料，就可能會造成 A 區塊元件中的信箱資料被更新，但 B 區塊元件中信箱資料卻還是過去的狀態（重新整理頁面依然如此）。

可以從下面這張圖了解當有 Store 當作集中式資料狀態庫時的好處。

![with and without Redux](/article/javaScript/javascript-make-simple-redux-createStore/01.png)

除了「集中式」之外，Redux 還有一個關鍵是基於 Flux 實踐的「單向資料流」更新資料方式，如此能讓資料的改變更安全、可預期地被控管，概念如下圖：

![redux flow](/article/javaScript/javascript-make-simple-redux-createStore/02.png)
_p.s 如果想要加上 Middleware 會在 Action 到 Reducer 間處理，此文不會探討_

- Store : Redux 的核心，擁有集中管理資料狀態的 Store State（會是一個 object），以及會接收外部的 Reducer 提供給 dispatch 後使用，最後對外會提供 `getState`、`dispatch`、`subscribe` 等 API 供外部使用。
- Dispatcher : 會接收 Action，這個 Action 包含著要改變的類型 Action Type 以及要改變的資料 Action Payload。如果 store 中的資料發生了變化，只會有一種可能，就是由 dispatcher 派發 action 來觸發的結果。
- Reducer : 會接收 Dispatcher 派發的 Action，經由對應的 Action Type 進行資料更新後，會回傳新的 Store State。

將 Redux 概念轉換成實際的程式碼使用，大概念看過即可，不用管細節：

```javascript
// 從 Redux 套件中取出創建 store 的 createStore function
// => 這篇文章就是要來實作的 createStore function
const { createStore } = Redux;

// 自定義 reducer
const reducer = (state, action) => {
  switch (action.type) {
    case 'PLUS_POINTS':
      return {
        points: state.points + action.payload,
      };
    case 'MINUS_POINTS':
      return {
        points: state.points === 0 ? state.points : state.points - action.payload,
      };
    default:
      return state;
  }
};

// 將自定義的 reducer 傳入 createStore 中，創建 store
// store 會提供 getState、dispatch、subscribe API
const preloadedState = {
  points: 0,
};
const store = createStore(reducer, preloadedState);

// 當 plus 按鈕被點擊時，就 dispatch 一個 action，type 是 'PLUS_POINTS', payload 是 100
// 這個 action 會被 dispatch 派發到 reducer，進行 points + 100 的操作，返還新的 state
document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

// 當 minus 按鈕被點擊時，就 dispatch 一個 action，type 是 'MINUS_POINTS', payload 是 100
// 這個 action 會被 dispatth 派發到 reducer，進行 points - 100 的操作，返還新的 state
document.getElementById('minus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

// 當 state 資料有被更新時，就要將 UI 畫面更新
// subscribe 可以傳入一個 callback function，會自動在資料改變後執行
store.subscribe(() => {
  document.getElementById('display-points-automatically').textContent = store.getState().points;
});
```

從上述 Redux 快速的導覽中，可以歸納本文要實作 createStore 需注意的幾個重點：

1. store 是集中式資料管理中心，透過 `createStore(reducer, preloadedState)` 創建。
2. reducer 是外部定義好，接著傳入給 store 使用的，並不需要在 createStore 中實作。
3. store 提供的 `getState` API，能提取目前的 store state。
4. store 提供的 `dispatch` API，能傳入 action 並且送到 reducer 內更新 store state。
5. store 提供的 `subscribe` API，能傳入 callback function，在 dispatch 更新 store state 後執行。

接著就開始參考 Redux 原始碼中的 pattern，實作 `createStore`。

_p.s. 特別注意的是使用 redux 是會有成本的，例如：程式碼數量增加、需要額外維護 reducer、需要學習 redux 的運作等，因此通常是資料流複雜度高的專案才會考慮使用。_

<hr>

## Step 1 : 定義 createStore 的介面，並實作 getState API

首先定義好 `createStore` 的介面：

- input : 需要傳入外部定義好的 reducer 以及 preloadedState。
- output : 需要提供外部 getState、dispatch、subscribe API 使用。

```javascript
createStore(reducer, preloadedState) {

  function getState() {}

  function dispatch() {}

  function subscribe() {}

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
}
```

接著 store 有個最重要的項目就是中心資料庫 store state，因此會宣告 `currentState`，並且初始值為 `preloadedState`。

```javascript
createStore(reducer, preloadedState) {
  let currentState = preloadedState;

  function getState() {}

  function dispatch() {}

  function subscribe() {}

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
}
```

很直覺地，在 `getState` 中 `return currentState` 就能完成取得 store state 的任務。

```javascript
createStore(reducer, preloadedState) {
  let currentState = preloadedState;

  function getState() {
    return currentState
  };

  function dispatch() {};

  function subscribe() {};

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
}
```

<hr>

## Step 2 : 實作 dispatch API

先回顧 `dispatch` 需要具備什麼條件：

1. 可以接收 action
2. 將 action 傳遞給 reducer，並且更新 store state

基於上述就能實作出：

```javascript
createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;

  function getState() {...};

  // 可以傳入 action
  function dispatch(action) {
    // 透過 reducer 更新 store state
    currentState = currentReducer(currentState, action)
  };

  function subscribe() {};

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
}
```

到這邊為止要思考一件事，就是當 reducer 更新 state 時，如果再次觸發 getState 或 dispatch 會不會造成什麼問題？

換句話說，就是使用方能不能在自定義的 reducer 內使用 `store.getState` 與 `store.dispatch` ?

- getState : 不必要，因為 reducer 本身參數已經傳入 state，直接從傳入的參數取用 state 即可。
- dispatch : 不必要，因為預期一個 action 就會針對 state 更動一次邏輯，因此可避免 reducer 執行時一個 action 時再重複執行一同一個 action 的狀況，這種狀況甚至可能變無窮遞迴。

撇除上面兩項說明，因為**reducer 的本質是專注在接收 action ，並且根據各個 action type 已經定義好的邏輯，更新 state 後回傳，是個 pure function，所以多餘的 side effect 都該盡量避免**。

可以透過新增 `isDispatching` flag，來達成在 reducer 執行時，禁止 getState 與 dispatch 使用。

在 dispatch 中，reducer 要執行前，先將 `isDispatching = true`，等到 reducer 執行完畢後，把 `isDispatching = false`，接著在 getState 與 dispatch 中，遇到 `isDispatching = true` 就拋出 err message，就能達成在 reducer 中，無法使用 getState 與 dispatch 的目標。

```javascript
createStore(reducer, preloadedState) {
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
          "You may not call store.getState() while the reducer is executing. " +
            "The reducer has already received the state as an argument. " +
            "Get the state from the top reducer instead of reading it from the store."
        );
      }

      return currentState;
  };

  function dispatch(action) {
    // 在 reducer 內不能使用 store.dispatch()
    // => isDispatching = true 要噴錯誤訊息
    if (isDispatching) {
        throw new Error(
          "Reducers may not dispatch actions when isDispatching."
        );
    }

    try {
        // 將 isDispatching 轉為 true 並執行 reducer
        isDispatching = true;
        currentState = currentReducer(currentState, action);
    } finally {
        // reducer 執行結束時，將 isDispatching 轉為 false
        isDispatching = false;
    }
  };

  function subscribe() {};

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
}
```

<hr>

## Step 3 : 實作 subscribe API

先回顧 `subscribe` 需要具備什麼條件：

1. 可以傳入一個 callback 參數作為訂閱項目
2. 這個訂閱的 callback 會在 store state 改變後被執行

基於上述就能實作出：

```javascript
createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;
  let isDispatching = false;
  // 定義 listener，會在 subscribe 賦值，並在 dispatch 被執行
  let listener = null

  function getState() {...};

  function dispatch(action) {
    ...
    // 在更新 state 之後，執行 listener
    if(listener) {
      listener();
    }
  };

  // subscribe 可以傳入一個 callback，命名為 listener
  function subscribe(listenerCb) {
    // 在 reducer 執行時，不能新增訂閱
    if (isDispatching) {
        throw new Error(
          "You may not call store.subscribe() while the reducer is executing. " +
            "If you would like to be notified after the store has been updated, " +
            "subscribe from a component and invoke store.getState() in the callback to access the latest state."
        );
    }
    listener = listenerCb;
  };

  const store = {
    getState,
    dispatch,
    subscribe,
  };

  return store;
}
```

接著以實務需求面來思考兩個問題：

1. 會不會有需要取消訂閱的時候？會，所以需要有 unsubscribe 的方法。
2. 會不會有需要訂閱多個事件的時候？會，所以需要 listeners array 而非 listener 而已。

先處理第一個問題，讓 subscribe 會 return 回 unsubscribe，如此一來就能透過執行 `unsubscribe()` 來取消訂閱。

```javascript
createStore(reducer, preloadedState) {
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
}
```

接下來處理第二個問題，可以訂閱多個 callback 事件

```javascript
createStore(reducer, preloadedState) {
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
}
```

到此就完成 subscribe / unsubscribe 基本功能。

<hr>

## Step 4 : 修復多層 subscribe / unsubscribe 的問題

目前我們實作的 Redux 在使用端執行多層 subscribe / unsubscribe 時會出現問題，如下：

```javascript
const store = createStore(reducers.todos);
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
createStore(reducer, preloadedState) {
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
```

處理這個問題，最直覺的方式就是**確保正在執行的 listeners 不會被 subscribe / unsubscribe 影響**。

可以透過創建 `currentListeners` 與 `nextListeners` 達成這個目的：

- currentListeners : stable, 正在被 for 迴圈執行的 listeners
- nextListeners : unstable, 會被 subscribe 及 unsubscribe 改變的 listeners

```javascript
createStore(reducer, preloadedState) {
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
}
```

特別注意的是 array 為 object data 複製時是複製 reference 而非 value，所以新增 `ensureCanMutateNextListeners` 處理這個問題。

```javascript
createStore(reducer, preloadedState) {
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
}
```

經過以上的處理，才算是真正地完成 subscribe / unsubscribe 。

<hr>

## Step 5 : 添加初始化的 dispatch

最後一步，添加初始化的 dispatch，讓一開始的 state 可以返回 reducer 中設定的 initialState。

```javascript
createStore(reducer, preloadedState) {
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
}
```

至此就完成核心的 `createStore` 功能囉，實作程式碼的統整會放在下方「recap 整個 createSote 程式碼」段落。

<hr>

## 回顧最初的幾個閱讀文章目標

來回答文章最初的幾個問題：

### 【Redux 是什麼？主要解決什麼問題？】

Redux 是一個基於 Flux 流程概念實踐的集中式資料狀態管理的工具，最主要的目的是統一管理資料，避免資料狀態不一致的問題，且也利用單向資料流的方式控管資料狀態，讓資料變動更可預期與維護。

### 【理解並實作 createStore 中的 getState、dispatch、subscribe】

createStore 的核心在於單一控管的 sore state，且提供下列三個 API :

- getState : 取得目前的 store state。
- dispatch : 透過傳入 action (type and payload) 更新 store state。
- subscribe : 透過傳入 callback，就能訂閱 callback，在 sotore state 更新後會執行 callback。

實作程式碼的統整會放在下方「recap 整個 createSote 程式碼」段落。

### 【理解 subscribe 會遇到什麼 bugs，如何藉由 currentListners、nextListners、ensureCanMutateNextListeners 解決】

如果不特別處理，在 subscribe 傳入的 listner callback 中執行另一個 subscribe 或 unsubscribe 可能遇到非預期 bugs。

解決方案的關鍵就是：

- currentListners : 創建 currentListners，真正在 state 變動後，會執行的 listners。
- nextListners : 創建 nextListners，當 subscribe / unsubscribe 時，會針對 nextListners 新增或移除 listner。
- ensureCanMutateNextListeners : 因為 listners 是 array，為了確保 currentListners 與 nextListners 不同，因此在 nextListners 操作前，會先執行 ensureCanMutateNextListeners function。

實作程式碼的統整會放在下方「recap 整個 createSote 程式碼」段落。

<hr>

## 回顧整個 createStore 程式碼

整段程式碼如下，會有註解解釋，如果想要沒有註解的版本，可以直接[到 Github 上觀看](https://github.com/LiangYingC/Implement-Simple-Redux/blob/master/redux.js)，有幫助的話歡迎給星星ＸＤ

```javascript
createStore(reducer, preloadedState) {
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
        "You may not call store.getState() while the reducer is executing. " +
          "The reducer has already received the state as an argument. " +
          "Get the state from the top reducer instead of reading it from the store."
      );
    }

    return currentState;
  }

  // 外部透過 store.dispatch(action) 改變 store state
  function dispatch(action) {
    if (isDispatching) {
      throw new Error(
        "Reducers may not dispatch actions when isDispatching."
      );
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
        "You may not call store.subscribe() while the reducer is executing. " +
          "If you would like to be notified after the store has been updated, " +
          "subscribe from a component and invoke store.getState() in the callback to access the latest state."
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
          "You may not unsubscribe from a store listener while the reducer is executing. "
        );
      }

      // 將 listener 從 nextListeners 移除前，先確保 currentListeners 與 nextListeners 不同
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);

      isSubscribed = false;
    };
  }

  const randomString = () =>
    Math.random().toString(36).substring(7).split("").join(".");

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
```

雖然並沒有做出最完整的 `createStore`，像是沒實作 enhancer、replaceReducer、observable 等等，但透過實作 getState、dispatch、subscribe，已經能理解核心的 Redux 運作，也知道它是透過 closure、listeners 等模式去封裝實踐單一資料流以及監聽等概念，整體而言蠻有趣的吶。

<hr>

#### 【 參考資料 】

- [LiangYingC/Implement-Simple-Redux repo | 我的實作程式碼](https://github.com/LiangYingC/Implement-Simple-Redux)
- [reduxjs/redux repo | redux 原始碼](https://github.com/reduxjs/redux/tree/master/src)
- [挑戰 40 分鐘實作簡易版 Redux 佐設計模式 | 谷哥](https://modernweb.ithome.com.tw/session-inner#448)
- [從 source code 來看 Redux 更新 state 的運行機制 | 陳冠霖](https://as790726.medium.com/%E5%BE%9E-source-code-%E4%BE%86%E7%9C%8B-redux-%E7%9A%84%E9%81%8B%E8%A1%8C%E6%A9%9F%E5%88%B6-f5e0adc1b9f6)
- [Redux 設計思想與工作原理 | 前端進階之旅](http://www.mdeditor.tw/pl/gZ9p/zh-tw)
