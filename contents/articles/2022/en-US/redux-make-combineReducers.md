---
title: Understanding Redux Source Code (3) - Let's Implement combineReducers
date: 2022-01-20
description: In the previous two articles about Redux source code, we implemented createStore and applyMiddleware. In this article, we will implement combineReducers, which is responsible for integrating multiple reducers, to understand how Redux accomplishes this.
tag: Redux, JavaScript
---

## Introduction

In the previous article [Understanding Redux Source Code (2) - Let's Implement middlewares, applyMiddleware, and createStore enhancer](/articles/2021/redux-make-createStore-enhancer-and-applyMiddleware), we already understood Redux middlewares-related functionality. This time we will explore the `combineReducers` part of the Redux source code to understand how Redux integrates multiple `reducers`.

After reading this article, you should be able to:

- Understand the purpose of `combineReducers`
- Implement the `combineReducers` code

---

## The Problem combineReducers Solves

Let's quickly recall the usage scenario of `reducer`:

```javascript
/*** app.js file ***/
import createStore from './createStore.js';

// Custom reducer that standardizes the rules for changing state
const reducer = (state, action) => {
  switch (action.type) {
    // If receiving action.type PLUS_POINTS, increase points
    case 'PLUS_POINTS':
      return {
        points: state.points + action.payload,
      };
    // If receiving action.type MINUS_POINTS, decrease points
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
    // Pass action type & payload to the reducer to increase 100 points
    store.dispatch({
      type: 'PLUS_POINTS',
      payload: 100,
    });
  });

......
```

Now let's focus on the `reducer` content:

```javascript
// Store state data structure
const preloadedState = {
  points: 0,
};

// Reducer defines how points are updated
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

In practice, `store state` won't have just one set of data. Let's add common user data, so we add user to the `store state`:

```javascript
// Store state data structure
const preloadedState = {
  points: 0,
  // Add user data
  user: {
    name: 'LiangC',
    age: 18,
  },
};

// Reducer defines how points are updated
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
    // Add 'UPDATE_NAME'
    case 'UPDATE_NAME':
      return {
        ...state,
        user: {
          ...state.user,
          name: action.payload,
        },
      };
    // Add 'UPDATE_AGE'
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

From the above example, we can see that the current `reducer` has a problem: as the `store state` gets larger, the `reducer` becomes very large and mixes update logic for many loosely related data.

At this point, we can consider splitting the loosely related data logic to reduce the complexity of the `reducer` and separate concerns, making the code more maintainable.

So in implementation, we would want to split the `reducer` into `pointsReducer` and `userReducer`:

```javascript
// Store state data structure
const preloadedState = {
  points: 0,
  user: {
    name: 'Liang',
    age: 18,
  },
};

// pointsReducer defines how points are updated
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

// userReducer defines how user is updated
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

This way, the `reducer` becomes more concise with separate concerns.

The next problem is that what's passed into `createStore` can only be a "single `reducer`", so we need a function that "combines `pointsReducer` and `userReducer` back into a single `reducer`".

This is exactly what `combineReducers` aims to do: **combining multiple `reducers` with different business logic into a single `reducer` that can be passed into `createStore`**.

The expected usage is as follows:

```javascript
/*** app.js file ***/
import createStore from './createStore.js';
// Import combineReducers
import combineReducers from './combineReducers.js'

// Store state data structure
const preloadedState = {
  points: 0,
  user: {
    name: 'Liang',
    age: 18,
  },
};

// pointsReducer defines how points are updated
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

// userReducer defines how user is updated
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

// Expecting to use combineReducers to integrate into a final single reducer
const reducer = combineReducers({
    points: pointsReducer,
    user: userReducer
});

// Create store
const store = createStore(reducer, preloadedState);

......
```

Now let's implement the critical `combineReducers`.

---

## Step 1: Implement combineReducers Core Logic

Let's review the expected usage of `combineReducers`:

```javascript
const reducer = combineReducers({
  points: pointsReducer,
  user: userReducer,
});
```

> Redux source code comment on combineReducers: **Turns an object whose values are different reducer functions, into a single reducer function**.

Based on this, we can define the interface of `combineReducers`:

- Input: An object, let's call it `reducersObj`, where the keys are the keys of the store state and the values are reducer functions that update the corresponding state.
- Output: The final combined reducer, which is a function, let's call it `singleReducer`.

```javascript
/*** combineReducers.js file ***/

// Define input as reducersObj
function combineReducers(reducersObj) {
  // Define output as singleReducer function
  return function singleReducer(state = {}, action) {
    // singleReducer returns the integrated new state after execution
    const newState = {};
    return newState;
  };
}

export default combineReducers;
```

Now let's think about the core of `singleReducer`:

- Pass the single `children state` and `action` into each corresponding `reducer` in `reducersObj` to get the updated `children state`.
  - For example: Pass `state[points]` and `action` into `pointsReducer` to produce new `pointsState`; pass `state[user]` and `action` into `userReducer` to produce new `userState`.
- Combine all the new `state` together to form the final `newState`.
  - For example: Combine `pointsState` and `userState` into the final `newState`.

Implementation in code:

```javascript
/*** combineReducers.js file ***/

function combineReducers(reducersObj) {
  // Get reducerKeys = ['points', 'user']
  const reducerKeys = Object.keys(reducersObj);

  return function singleReducer(state = {}, action) {
    const newState = {};

    // Iterate through each reducer to integrate the final newState
    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];
      const reducer = reducers[key];

      // Get the old previousStateForKey
      const previousStateForKey = state[key];
      // Execute reducer to get newStateForKey
      const newStateForKey = reducer(previousStateForKey, action);

      // Integrate newStateForKey into newState
      newState[key] = newStateForKey;
    }

    // Finally return the integrated newState
    return newState;
  };
}

export default combineReducers;
```

Adjust some naming to better match Redux source code:

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

At this point, we have completed the core main logic of `combineReducers`.

---

## Step 2: Ensure the Passed-in reducers are Valid

The current mechanism cannot verify if the passed-in `reducers` are valid, such as:

1. Whether each `reducer` in `reducers` is a `function`.
2. Whether each `reducer` in `reducers` has set an `initial state`.

Let's start by checking if each `reducer` is a `function`:

```javascript
/*** combineReducers.js file ***/

function combineReducers(reducers) {
  const reducerKeys = Object.keys(reducers);

  // Check if each reducer is a function, if not, throw an error
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

Next, let's check if each `reducer` has set an `initial state`:

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

    // Check if each initial state is undefined, if so, throw an error
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

## Step 3: Ensure the Passed-in action is Valid

In addition to ensuring that `reducers` are valid, we can also further validate the `action` passed to `combination` when producing `nextStateForKey`.

Implementation in code, modifying the content of `combination`:

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
      // Since we already checked if the reducer handles state being undefined properly
      // If nextStateForKey is undefined here, the reason would be an invalid action, not invalid state, so throw an error
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

This helps ensure the `action` is valid.

---

## Conclusion, Reviewing the Initial Goals

In fact, the original `combineReducers` code has more implementation details, such as more validity checks and extracting validity check logic into separate functions, which we won't elaborate on here. If you're interested, you can explore the source code for further understanding.

Now let's review what we expected to gain from this article:

### 1. Understanding the Purpose of `combineReducers`

With `combineReducers`, we can combine multiple `reducers` into a single `reducer` to be passed into `createStore`.

This allows developers to split `reducers` based on business logic (or some categorization), e.g., `orderReducer`, `userReducer`..., thus separating concerns and making individual `reducers` smaller.

The usage in code is as follows:

```javascript
// Store state data structure
const preloadedState = {
  points: 0,
  user: {
    name: 'Liang',
    age: 18,
  },
};

// pointsReducer defines how points are updated
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

// userReducer defines how user is updated
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

// Use combineReducers to integrate into the final single reducer
const reducer = combineReducers({
  points: pointsReducer,
  user: userReducer,
});
```

### 2. Implementing combineReducers Related Code

We can focus on understanding and implementing the core logic: **Turns an object whose values are different reducer functions, into a single reducer function**.

```javascript
/*** combineReducers.js file ***/

// Define input as reducers obj, where keys are store state keys and values are reducer functions for updating corresponding states
function combineReducers(reducers) {
  // Get reducerKeys = ['points', 'user']
  const reducerKeys = Object.keys(reducers);

  // Define output as combination function that takes state and action
  return function combination(state = {}, action) {
    const nextState = {};

    // Iterate through each reducer to integrate the final newState
    for (let i = 0; i < reducerKeys.length; i++) {
      const key = reducerKeys[i];
      const reducer = reducers[key];

      // Get the old previousStateForKey
      const previousStateForKey = state[key];
      // Execute reducer to get nextStateForKey
      const nextStateForKey = reducer(previousStateForKey, action);

      // Integrate nextStateForKey into nextState
      nextState[key] = nextStateForKey;
    }

    // Finally return the integrated nextState
    return nextState;
  };
}

export default combineReducers;
```

If you need code without comments, you can [click here to go to GitHub](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase3_combineReducers).

The above is the implementation and summary of `combineReducers`, which is simpler than the previous two articles on Redux createStore and Redux middleware. The key is to know the single goal that `combineReducers` aims to achieve, and then try to implement it. It's very suitable for writing your own implementation as practice.

---

#### References

- [LiangYingC/understand-redux-source-code](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase3_combineReducers)
- [reduxjs/redux repo | redux source code](https://github.com/reduxjs/redux/tree/master/src)
- [完全理解 redux（从零实现一个 redux）｜ brickspert](https://mp.weixin.qq.com/s?__biz=MzIxNjgwMDIzMA==&mid=2247484209&idx=1&sn=1a33a2c8cb58ae98e4f8080ab59da06f&scene=21#wechat_redirect)