---
title: 理解 Redux 原始碼 (三)：來實作 combineReducers 吧
date: 2022-01-10
description: 前兩篇 Redux 原始碼的文章，實作了 createStore 以及 applyMiddleware 等項目，在這篇文章中，將實作負責整合多個 reducers 的 combineReducers，藉此了解 Redux 是如何實踐這件事。
category: sourceCode
---

## 前言

延續上篇分享的 [理解 Redux 原始碼 (二)：來實作 middlewares、applyMiddleware 以及 createStore enhancer 吧](/articles/sourceCode/redux-make-createStore-enhancer-and-applyMiddleware)，這次將更深入探討 Redux Source Code 中，關於 `combineReducers` 的部分，試著了解 Redux 是如何整合多個 `reducers`。

期許閱讀完這篇後，能達成：

- 理解 `combineReducers` 要達成的目的
- 能實作出 `combineReducers` 相關的程式碼

<hr>

## combineReducers 要解決的問題

快速回憶一下 `reducer` 的使用情境：

```javascript
/*** index.js file ***/
import { createStore } from './createStore.js';

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

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // 將 action type & payload 傳進 reducer 中，增加 100 points
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

......
```

接下來都將聚焦在 `reducer` 本身：

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

通常 `store state` 不會只有一個，先試著新增 `user` 的資料：

```javascript
// store state 的資料結構
const preloadedState = {
  points: 0,
  // 新增 user 資料
  user: {
    name: 'Liang',
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

從上面的範例中可以發現，目前的 `reducer` 有個問題，就是隨著 `store state` 越來越多，`reducer` 就會非常龐大，而且會將很多關聯不大的資料更新邏輯混在一起。

根據經驗，會希望不同資料邏輯，可以拆分開來，讓 `reducer` 複雜度下降，並且讓關注點分離，程式更好維護。

所以實作上會希望拆分成 `pointsReducer` 與 `userReducer`：

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
const pointsReducer = (state, action) => {
  // 注意此處傳入的 state 會是 { points: XXX }
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

// userReducer 規範 user 的更新
const userReducer = (state, action) => {
  // 注意此處傳入的 state 會是 { user: XXX }
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

如此一來，reducer 變小且關注點分離。

下個問題來了，最後傳入 `createStore` 的只會是「單一」的 `reducer`，因此會需要有個函式，將 `pointsReducer` 與 `userReducer` 整併回單一的 `reducer`。

這就是 `combineReducers` 要達成的目標，將多個不同商業邏輯的 `reducers`，整合成單一 `reducer`，藉此傳入 `createStore` 中使用。

使用的期望如下：

```javascript
/*** index.js file ***/
import { createStore } from './createStore.js';
import { combineReducers } from './combineReducers.js'

// pointsReducer 規範 points 的更新
const pointsReducer = (state, action) => {
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

// userReducer 規範 user 的更新
const userReducer = (state, action) => {
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

// store state 的資料結構
const preloadedState = {
  points: 0,
  user: {
    name: 'Liang',
    age: 18,
  },
};

// 期望透過 combineReducers，整合出最終單一的 reducer
const reducer = combineReducerss({
    points: pointsReducer,
    user: userReducer
});

// 創建 store
const store = createStore(reducer, preloadedState);

......
```

接著，就開始實踐最關鍵的 `combineReducers` 吧！

<hr>

#### 【 參考資料 】
