---
title: 理解 Redux 原始碼 (3)：來實作 combineReducers 吧
date: 2022-01-20
description: 前兩篇 Redux 原始碼的文章，實作了 createStore 以及 applyMiddleware 等項目，在這篇文章中，將實作負責整合多個 reducers 的 combineReducers，藉此了解 Redux 是如何實踐這件事。
tag: Redux, JavaScript
---

## 前言

在上篇 [理解 Redux 原始碼 (2)：來實作 middlewares、applyMiddleware 以及 createStore enhancer 吧](/articles/2021/redux-make-createStore-enhancer-and-applyMiddleware)中，已經理解 Redux middlewares 相關功能。這次將探討 Redux 原始碼中，關於 `combineReducers` 的部分，藉此理解 Redux 如何整合多個 `reducers`。

期許閱讀完本文後，能達成：

- 理解 `combineReducers` 要達成的目的
- 能實作 `combineReducers` 相關程式碼

---

## combineReducers 要解決的問題

快速回憶 `reducer` 的使用情境：

```javascript
/*** app.js file ***/
import createStore from './createStore.js';

// 自定義的 reducer，藉此統一規範更改 state 的規則
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

const preloadedState = {
  points: 0,
};
const store = createStore(reducer, preloadedState);

document.getElementById('plus-points-btn')
  .addEventListener('click', () => {
    // 將 action type & payload 傳進 reducer 中，增加 100 points
    store.dispatch({
      type: 'PLUS_POINTS',
      payload: 100,
    });
  });

......
```

接下來將聚焦在 `reducer` 相關內容：

```javascript
// store state 的資料結構
const preloadedState = {
  points: 0,
};

// reducer 規範 points 的更新
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
```

實務上而言， `store state` 不會只有一組資料，在此加入常見的 user 資料，於是在 `store state` 中新增 user：

```javascript
// store state 的資料結構
const preloadedState = {
  points: 0,
  // 新增 user 資料
  user: {
    name: 'LiangC',
    age: 18,
  },
};

// reducer 規範 points 的更新
const reducer = (state, action) => {
  switch (action.type) {
    case 'PLUS_POINTS':
      return {
        ...state,
        points: state.points + action.payload,
      };
    case 'MINUS_POINTS':
      return {
        ...state,
        points: state.points - action.payload,
      };
    // 新增 'UPDATE_NAME'
    case 'UPDATE_NAME':
      return {
        ...state,
        user: {
          ...state.user,
          name: action.payload,
        },
      };
    // 新增 'UPDATE_AGE'
    case 'UPDATE_AGE':
      return {
        ...state,
        user: {
          ...state.user,
          age: action.age,
        },
      };
    default:
      return state;
  }
};
```

從上述範例中可以發現，目前的 `reducer` 有個問題，就是隨著 `store state` 越來越多，`reducer` 會非常龐大，並且會將很多關聯不大的資料更新邏輯混在一起。

這時候，可以思考將關聯性低的資料邏輯拆分開，讓 `reducer` 複雜度下降，並且關注點分離，讓程式更好維護。

所以實作上會希望將 `reducer` 拆分成 `pointsReducer` 與 `userReducer`：

```javascript
// store state 的資料結構
const preloadedState = {
  points: 0,
  user: {
    name: 'Liang',
    age: 18,
  },
};

// pointsReducer 規範 points 的更新
const pointsReducer = (state = preloadedState.points, action) => {
  switch (action.type) {
    case 'PLUS_POINTS':
      return state.points + action.payload;
    case 'MINUS_POINTS':
      return state.points - action.payload;
    default:
      return state;
  }
};

// userReducer 規範 user 的更新
const userReducer = (state = preloadedState.user, action) => {
  switch (action.type) {
    case 'UPDATE_NAME':
      return {
        ...state,
        name: action.name,
      };
    case 'UPDATE_AGE':
      return {
        ...state,
        age: action.age,
      };
    default:
      return state;
  }
};
```

如此一來，`reducer` 變簡潔且關注點分離。

下個問題來了，最後傳入 `createStore` 的只能是「單一的 `reducer`」，因此會需要有個方法函式，「將 `pointsReducer` 與 `userReducer` 整併回單一的 `reducer`」。

這正是 `combineReducers` 要達成的目標：**將多個不同商業邏輯的 `reducers`，整合成單一 `reducer`，藉此傳入 `createStore` 中使用**。

使用的期望如下：

```javascript
/*** app.js file ***/
import createStore from './createStore.js';
// 引入 combineReducers
import combineReducers from './combineReducers.js'

// store state 的資料結構
const preloadedState = {
  points: 0,
  user: {
    name: 'Liang',
    age: 18,
  },
};

// pointsReducer 規範 points 的更新
const pointsReducer = (state = preloadedState.points, action) => {
  switch (action.type) {
    case 'PLUS_POINTS':
      return state.points + action.payload;
    case 'MINUS_POINTS':
      return state.points - action.payload;
    default:
      return state;
  }
};

// userReducer 規範 user 的更新
const userReducer = (state = preloadedState.user, action) => {
  switch (action.type) {
    case 'UPDATE_NAME':
      return {
        ...state,
        name: action.name,
      };
    case 'UPDATE_AGE':
      return {
        ...state,
        age: action.age,
      };
    default:
      return state;
  }
};

// 期望透過 combineReducers，整合出最終單一的 reducer
const reducer = combineReducers({
    points: pointsReducer,
    user: userReducer
});

// 創建 store
const store = createStore(reducer, preloadedState);

......
```

接著開始實踐最關鍵的 `combineReducers`。

---

## Step 1 : 實作 combineReducers 核心邏輯

回顧期望的 `combineReducers` 使用方式：

```javascript
const reducer = combineReducers({
  points: pointsReducer,
  user: userReducer,
});
```

> Redux 原始碼對 combineReducers 的註解：**Turns an object whose values are different reducer functions, into a single reducer function**.

藉此定義能 `combineReducers` 的介面：

- Input：為物件，先稱為 `reducersObj`，此物件的 key 是 store state 的 key ; value 是用來更新對應 state 的 reducer 函式。
- Output：為最終合併的 reducer，會是個函式，先稱為 `singleReducer`。

```javascript
/*** combineReducers.js file ***/

// 定義 input 為 reducersObj
function combineReducers(reducersObj) {
  // 定義 output 為 singleReducer function
  return function singleReducer(state = {}, action) {
    // singleReducer 執行後，回傳整合後的新 state
    const newState = {};
    return newState;
  };
}

export default combineReducers;
```

接著思考 `singleReducer` 的核心：

- 將被傳入的單一 `children state` 與 `action`，丟進 `reducersObj` 每個對應的 `reducer` 中執行，藉此獲得更新後的 `children state`。
  - 例如：`state[points]` 與 `action` 丟進 `pointsReducer` 產出新的 `pointsState` ; `state[user]` 與 `action` 丟進 `userReducer` 產出新的 `userState`。
- 將所有新的 `state` 組合在一起，變成最終的 `newState`。
  - 例如：將 `pointsState` 與 `userState` 組合成最終的 `newState`。

程式碼實踐如下：

```javascript
/*** combineReducers.js file ***/

function combineReducers(reducersObj) {
  // 取得 reducerKeys = ['points', 'user']
  const reducerKeys = Object.keys(reducersObj);

  return function singleReducer(state = {}, action) {
    const newState = {};

    // 遍歷執行每一個 reducer，藉此整合出最終的 newState
    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];
      const reducer = reducers[key];

      // 取得舊的 previousStateForKey
      const previousStateForKey = state[key];
      // 執行 reducer，獲得的 newStateForKey
      const newStateForKey = reducer(previousStateForKey, action);

      // 將 newStateForKey 整合進 newState 中
      newState[key] = newStateForKey;
    }

    // 最後回傳整合完成的 newState
    return newState;
  };
}

export default combineReducers;
```

調整部分命名，更符合 Redux 原始碼：

```javascript
/*** combineReducers.js file ***/

// reducersObj => reducers
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  // singleReducer => combination
  return function combination(state = {}, action) {
    // newState => nextState
    const nextState = {};

    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];
      const reducer = reducers[key];

      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;
    }

    return nextState;
  };
}

export default combineReducers;
```

至此，就已完成 `combineReducers` 的核心主邏輯。

---

## Step 2 : 確保傳入的 reducers 合法

目前的機制，沒辦法確認傳入的 `reducers` 是否合法，像是：

1. `reducers` 中，每個 `reducer` 是否為 `function`。
2. `reducers` 中，每個 `reducer` 是否有設定 `initail state`。

先來處理確認每個 `reducer` 是否為 `function`：

```javascript
/*** combineReducers.js file ***/

function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  // 檢查每個 reducer 是否為 function，如果不是就報錯
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];
    const reducer = reducers[key];

    if (typeof reducer !== 'function') {
      throw new Error(`No reducer function provided for key "${key}"`);
    }
  }

  return function combination(state = {}, action) {...};
}

export default combineReducers;
```

再來處理確認每個 `reducer` 是否有設定 `initail state`：

```javascript
/*** combineReducers.js file ***/

function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];
    const reducer = reducers[key];

    if (typeof reducer !== 'function') {
      throw new Error(`No reducer function provided for key "${key}"`);
    }

    // 檢查每個 initial state 是否為 undefined，如果是就報錯
    const initialState = reducer(undefined, { type: ActionTypes.INIT });
    if (typeof initialState === 'undefined') {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined during initialization.` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      );
    }
  }

  return function combination(state = {}, action) {...};
}

export default combineReducers;
```

---

## Step 3 : 確保傳入的 action 合法

除了盡量確保 `reducers` 合法外，關於 `combination` 傳入的 `action`，也可以在產出 `nextStateForKey` 時，做進一步的驗證。

程式碼實踐如下，會改動 `combination` 的內容：

```javascript
function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];
    const reducer = reducers[key];

    if (typeof reducer !== 'function') {
      throw new Error(`No reducer function provided for key "${key}"`);
    }

    const initialState = reducer(undefined, { type: ActionTypes.INIT });
    if (typeof initialState === 'undefined') {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined during initialization.` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      );
    }
  }

  return function combination(state = {}, action) {
    const nextState = {};

    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];
      const reducer = reducers[key];

      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      // 因為前面已檢查 reducer 的 state 傳入 undefined 時是否正常
      // 所以在此 undefined 的原因，就會是 action 有誤，而非 state 有誤，因此報錯
      if (typeof nextStateForKey === 'undefined') {
        const actionType = action && action.type;
        throw new Error(
          `When called with an action of type ${
            actionType ? `"${String(actionType)}"` : '(unknown type)'
          }, the slice reducer for key "${key}" returned undefined. ` +
            `To ignore an action, you must explicitly return the previous state. ` +
            `If you want this reducer to hold no value, you can return null instead of undefined.`
        );
      }

      nextState[key] = nextStateForKey;
    }

    return nextState;
  };
}

export default combineReducers;
```

藉此達成檢查 `action` 是否合法。

---

## 總結，回顧最初的目標

事實上，在原始碼 `combineReducers` 有更多細節的實踐，像是更多的合法檢查以及將合法檢查相關邏輯抽成獨立函式等，在此不贅述，有興趣可再去爬原始碼理解。

接著回顧文章最初期待閱讀完的收穫：

### 一、理解 `combineReducers` 要達成的目的

透過 `combineReducers`，可以將多個 `reducers`，合併成一個單一 `reducer`，傳入 `createStore` 中。

藉此能讓開發者依據商業邏輯（或某種分類）拆分 `reducer`，例如：`orderReducer`、`userReducer`...，藉此讓關注點分離，且讓單一 `reducer` 變小。

程式的使用如下：

```javascript
// store state 的資料結構
const preloadedState = {
  points: 0,
  user: {
    name: 'Liang',
    age: 18,
  },
};

// pointsReducer 規範 points 的更新
const pointsReducer = (state = preloadedState.points, action) => {
  switch (action.type) {
    case 'PLUS_POINTS':
      return state.points + action.payload;
    case 'MINUS_POINTS':
      return state.points - action.payload;
    default:
      return state;
  }
};

// userReducer 規範 user 的更新
const userReducer = (state = preloadedState.user, action) => {
  switch (action.type) {
    case 'UPDATE_NAME':
      return {
        ...state,
        name: action.name,
      };
    case 'UPDATE_AGE':
      return {
        ...state,
        age: action.age,
      };
    default:
      return state;
  }
};

// 透過 combineReducers，整合出最終單一的 reducer
const reducer = combineReducers({
  points: pointsReducer,
  user: userReducer,
});
```

### 二、能實作 combineReducers 相關程式碼

可以聚焦於理解並實作核心邏輯：**Turns an object whose values are different reducer functions, into a single reducer function**。

```javascript
/*** combineReducers.js file ***/

// 定義 input 為 reducers obj，key 是 store state 的 state key ; value 是更新對應 state 的 reducer function
function combineReducers(reducers) {
  // 取得 reducerKeys = ['points', 'user']
  const reducerKeys = Object.keys(reducers);

  // 定義 ouput 為可傳入 state、action 的 combination function
  return function combination(state = {}, action) {
    const nextState = {};

    // 遍歷執行每一個 reducer，藉此整合出最終的 newState
    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];
      const reducer = reducers[key];

      // 取得舊的 previousStateForKey
      const previousStateForKey = state[key];
      // 執行 reducer，獲得的 nextStateForKey
      const nextStateForKey = reducer(previousStateForKey, action);

      // 將 nextStateForKey 整合進 nextState 中
      nextState[key] = nextStateForKey;
    }

    // 最後回傳整合完成的 nextState
    return nextState;
  };
}

export default combineReducers;
```

如果有需要沒有註解的程式碼，可[點此前往 GitHub 取用](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase3_combineReducers)。

以上是關於 `combineReducers` 的實作和總結，比起前兩篇 Redux createStore 、Redux middleware 都還單純些，重點在於知道 `combineReducers` 要達成的單一目標後，就能試著實作，很適合自己寫寫看當練習。

---

#### 參考資料

- [LiangYingC/understand-redux-source-code](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase3_combineReducers)
- [reduxjs/redux repo | redux source code](https://github.com/reduxjs/redux/tree/master/src)
- [完全理解 redux（从零实现一个 redux）｜ brickspert](https://mp.weixin.qq.com/s?__biz=MzIxNjgwMDIzMA==&mid=2247484209&idx=1&sn=1a33a2c8cb58ae98e4f8080ab59da06f&scene=21#wechat_redirect)
