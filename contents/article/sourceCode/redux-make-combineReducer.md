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

```javascript
/*** combineReducer simple example ***/

function combineReducers(reducers) {
  // reducerKeys = ['points', 'user']
  const reducerKeys = Object.keys(reducers);

  // output 是合併後的最終 reducer function
  return function combination(state = {}, action) {
    // 產生整合後的新 state
    const nextState = {};

    // 遍歷執行所有的 reducers，整合出新的 state
    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];
      const reducer = reducers[key];
      // 之前的 key 的 state
      const previousStateForKey = state[key];
      // 執行 reducer，獲得的新 state
      const nextStateForKey = reducer(previousStateForKey, action);

      nextState[key] = nextStateForKey;
    }

    return nextState;
  };
}
```

#### 【 參考資料 】

```javascript
/*** Real combineReducer from Redux ***/
import ActionTypes from './utils/actionTypes';
import isPlainObject from './utils/isPlainObject';
import warning from './utils/warning';
import { kindOf } from './utils/kindOf';

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  const reducerKeys = Object.keys(reducers);
  const argumentName =
    action && action.type === ActionTypes.INIT
      ? 'preloadedState argument passed to createStore'
      : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return (
      'Store does not have a valid reducer. Make sure the argument passed ' +
      'to combineReducers is an object whose values are reducers.'
    );
  }

  if (!isPlainObject(inputState)) {
    return (
      `The ${argumentName} has unexpected type of "${kindOf(
        inputState
      )}". Expected argument to be an object with the following ` +
      `keys: "${reducerKeys.join('", "')}"`
    );
  }

  const unexpectedKeys = Object.keys(inputState).filter(
    key => !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key]
  );

  unexpectedKeys.forEach(key => {
    unexpectedKeyCache[key] = true;
  });

  if (action && action.type === ActionTypes.REPLACE) return;

  if (unexpectedKeys.length > 0) {
    return (
      `Unexpected ${unexpectedKeys.length > 1 ? 'keys' : 'key'} ` +
      `"${unexpectedKeys.join('", "')}" found in ${argumentName}. ` +
      `Expected to find one of the known reducer keys instead: ` +
      `"${reducerKeys.join('", "')}". Unexpected keys will be ignored.`
    );
  }
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(key => {
    const reducer = reducers[key];
    const initialState = reducer(undefined, { type: ActionTypes.INIT });

    if (typeof initialState === 'undefined') {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined during initialization. ` +
          `If the state passed to the reducer is undefined, you must ` +
          `explicitly return the initial state. The initial state may ` +
          `not be undefined. If you don't want to set a value for this reducer, ` +
          `you can use null instead of undefined.`
      );
    }

    if (
      typeof reducer(undefined, {
        type: ActionTypes.PROBE_UNKNOWN_ACTION(),
      }) === 'undefined'
    ) {
      throw new Error(
        `The slice reducer for key "${key}" returned undefined when probed with a random type. ` +
          `Don't try to handle '${ActionTypes.INIT}' or other actions in "redux/*" ` +
          `namespace. They are considered private. Instead, you must return the ` +
          `current state for any unknown actions, unless it is undefined, ` +
          `in which case you must return the initial state, regardless of the ` +
          `action type. The initial state may not be undefined, but can be null.`
      );
    }
  });
}

/**
 * Turns an object whose values are different reducer functions, into a single
 * reducer function. It will call every child reducer, and gather their results
 * into a single state object, whose keys correspond to the keys of the passed
 * reducer functions.
 *
 * @param reducers An object whose values correspond to different reducer
 *   functions that need to be combined into one. One handy way to obtain it
 *   is to use ES6 `import * as reducers` syntax. The reducers may never
 *   return undefined for any action. Instead, they should return their
 *   initial state if the state passed to them was undefined, and the current
 *   state for any unrecognized action.
 *
 * @returns A reducer function that invokes every reducer inside the passed
 *   object, and builds a state object with the same shape.
 */
export default function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);
  const finalReducers = {};
  for (let i = 0; i < reducerKeys.length; i++) {
    const key = reducerKeys[i];

    if (process.env.NODE_ENV !== 'production') {
      if (typeof reducers[key] === 'undefined') {
        warning(`No reducer provided for key "${key}"`);
      }
    }

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }
  const finalReducerKeys = Object.keys(finalReducers);

  // This is used to make sure we don't warn about the same
  // keys multiple times.
  let unexpectedKeyCache;
  if (process.env.NODE_ENV !== 'production') {
    unexpectedKeyCache = {};
  }

  let shapeAssertionError;
  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state, action) {
    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    if (process.env.NODE_ENV !== 'production') {
      const warningMessage = getUnexpectedStateShapeWarningMessage(
        state,
        finalReducers,
        action,
        unexpectedKeyCache
      );
      if (warningMessage) {
        warning(warningMessage);
      }
    }

    let hasChanged = false;
    const nextState = {};
    for (let i = 0; i < finalReducerKeys.length; i++) {
      const key = finalReducerKeys[i];
      const reducer = finalReducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
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
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}
```
