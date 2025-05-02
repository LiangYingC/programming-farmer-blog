---
title: Understanding Redux Source Code (1) - Implementing createStore's getState, dispatch, and subscribe
date: 2021-12-01
description: I was curious about how Redux implements centralized state management and unidirectional data flow concepts, so I decided to read the Redux source code and implement a basic createStore function, focusing on the getState, dispatch, and subscribe APIs.
tag: Redux, JavaScript
---

## Introduction

Although I've more frequently used Context API and `useReducer` for state management in my previous work, I was still curious about how Redux implements the concepts of "centralized state management" and "unidirectional data flow." After seeing Guooooo's presentation at ModernWeb'21 titled [Challenge: Implementing a Simple Redux in 40 Minutes with Design Patterns](https://modernweb.ithome.com.tw/session-inner#448), I decided to read the Redux source code and implement a simple `createStore` function, focusing on its `getState`, `dispatch`, and `subscribe` APIs.

After reading this article, I hope you'll achieve:

- Understanding what Redux is and the main problems it aims to solve
- Understanding `createStore` and its `getState`, `dispatch`, and `subscribe` APIs
- Understanding what bugs can occur with `subscribe`, and how they're solved using `currentListeners`, `nextListeners`, and `ensureCanMutateNextListeners`
- Being able to implement a basic `createStore` function

---

## What is Redux?

Before implementing Redux's `createStore`, let's review what Redux is and the problems it aims to solve.

**Redux is a centralized state management tool based on the Flux flow concept** that can be used in JavaScript applications, not limited to React or any specific framework.

Why do we need this "centralized" state management tool?

The main reason is that frontend complexity is increasing, and often the same type of data is scattered across different component blocks. **If we manage data separately, data state inconsistencies can occur, so we can solve this problem by centrally managing data**.

For example: typically in applications, user data, such as name, avatar, and email, is used in different component blocks. Without centralized data management, you might update email data in component block A, but component block B might still be using the outdated state. If you centrally manage data, with a single source of truth, you can solve this problem.

The benefits of having a unified data source (store state) and centralized state management can be intuitively understood from the diagram below.

![with and without Redux](/images/articles/redux-make-createStore-getState-dispatch-subscribe/01.png)

In addition to being "centralized," another key aspect of Redux is the "unidirectional data flow" based on Flux for updating data. In simple terms, **it restricts how the store state is updated, only allowing it through the unidirectional flow shown below, making data changes more secure, predictable, and controllable**. The concept is illustrated below:

![redux flow](/images/articles/redux-make-createStore-getState-dispatch-subscribe/02.png)

A brief introduction to the important roles:

- Store:
  - The core of Redux, which can be compared to a container with a unique data center `store state` and provides APIs like `getState`, `dispatch`, `subscribe` for external use.
- Dispatcher:
  - `dispatch` receives an `action` object, which typically includes the update method `action type` and the value used for updating data `action payload`.
  - If the `store state` changes, there's only one possibility: it was triggered by an `action` dispatched by `dispatch`.
- Reducer:
  - Receives the `action` dispatched by `dispatch`, performs data updates according to the corresponding `action type` rules, and returns the new `store state`.

You only need a general understanding of the above concepts. Remember the most important concepts of Redux:

1. **It creates a single central data store**
2. **It modifies data through a unidirectional data flow pattern**

Next, we'll extend from these two concepts and implement the `createStore` function responsible for creating the store, according to the pattern in Redux's source code.

_Note: A more rigorous definition of Redux includes 3 key principles: **Single source of truth, State is read-only (only change by dispatching), and Changes are made with pure functions**. Refer to the [Redux documentation](https://redux.js.org/understanding/thinking-in-redux/three-principles) for more details._

---

## Step 1: Implementing a Single Data Store and getState API

First, we'll use the function modularization ([Module Pattern](https://javascript.plainenglish.io/data-hiding-with-javascript-module-pattern-62b71520bddd)) approach to create `createStore` and implement the "single data store" concept:

```javascript
/*** createStore.js file ***/
// Declare the createStore function
function createStore(preloadedState) {
  // Declare currentState as a single data source, which can be initialized as preloadedState
  let currentState = preloadedState;
  return {};
}

export default createStore;
```

Next, we'll create a `getState` function and make it available externally through the `store.getState` API interface. When the `getState` API is called, it will `return currentState`.

```javascript
/*** createStore.js file ***/
function createStore(preloadedState) {
  let currentState = preloadedState;

  // Create getState API to access currentState
  function getState() {
    return currentState;
  }

  // Make the internal getState function available externally
  const store = {
    getState,
  };
  return store;
}

export default createStore;
```

Due to closure characteristics, the `currentState` variable declared in `createStore` won't be reclaimed by the garbage collection mechanism, so it can continue to exist and be available for external retrieval and manipulation.

---

## Step 2: Implementing the dispatch API for Data Modification

After implementing `store state` and the `getState` API, the next step is to implement "data updating."

First, within `createStore`, we'll create a method for updating data called `dispatch`, which can accept a `newState` parameter to update the `store state`.

```javascript
/*** createStore.js file ***/
function createStore(preloadedState) {
  let currentState = preloadedState;

  function getState() {...};

  // Create dispatch API to update store state
  function dispatch(newState) {
    // Update store state to newState
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

This seems complete, but currently, the freedom to update data is too high, which can lead to unexpected problems in multi-person or complex development.

For example: When the `store state` originally contains number type data used for numerical operations, if a developer accidentally uses `dispatch('string')` to update the data to a string, it will cause operational problems (bugs).

Here's an example of a bug:

```javascript
/*** app.js file ***/
import createStore from './createStore.js';

const preloadedState = {
  points: 0;
}
// Import the createStore we just implemented to create a store
const store = createStore(preloadedState);

// Add 1 to state
store.dispatch({
  points: store.getState().points + 1
});

// Subtract 1 from state
store.dispatch({
  points: store.getState().points - 1
});

// Random change, causing subsequent bugs because a string is used in numerical operations
store.dispatch({
  points: 'string'
});
```

To avoid this, we need "hard rules for updating `state`," which we'll break down into two steps:

1. Define rules for updating `store state` and ensure there are no unexpected side effects.
2. Modify `store.dispatch` to make `dispatch` update `store state` according to the defined rules.

Starting with point 1, developers can define a pure function called `reducer` to predefine the rules for updating `store state`. Since `reducer` is a pure function, it won't have side effects.

Next, we'll pass the defined `reducer` to `createStore` so that when `dispatch` is called, it can trigger the `reducer` and update the `store state` according to the predefined rules, thus avoiding the unexpected problems mentioned earlier.

The implementation is as follows:

```javascript
/*** app.js file ***/
import createStore from './createStore.js';

const preloadedState = {
  points: 0;
};

// Define a reducer (pure function) to establish rules for modifying state
// reducer receives the currentState and the action for modification
function reducer(state, action) {
  switch (action.type) {
    // When action.type is INCREMENT, execute the data update logic below
    case 'INCREMENT':
      return {
        ...state,
        points: state.points + 1;
      }
    // When action.type is DECREMENT, execute the data update logic below
    case 'DECREMENT':
      return {
        ...state,
        points: state.points - 1;
      }
    default:
      return state;
  };
};

// Pass the defined reducer to createStore for dispatch to use
const store = createStore(reducer, preloadedState);

// Can only modify state through the defined action.type "INCREMENT"
store.dispatch({
  type: 'INCREMENT',
});

// Can only modify state through the defined action.type "DECREMENT"
store.dispatch({
  type: 'DECREMENT'
});
```

Continuing with point 2, we'll optimize `dispatch` in `createStore` to make it capable of receiving an `action` and updating `store state` according to the `reducer` rules.

Specifically, this means making `dispatch` accept an `action` and use the `reducer` function to update `store state`.

```javascript
/*** createStore.js file ***/
// Add reducer parameter, defined externally and passed in
function createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;

  function getState() {...};

  // dispatch can receive an action object
  // typically action object has action.type and action.payload
  function dispatch(action) {
    // Update store currentState through rules defined in reducer
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

With this, we've completed the `dispatch` for updating `store state`. To recap, it does two things:

1. It can receive an `action` parameter
2. It passes the `action` to the `reducer` to update the `store state`

---

## Step 3: Optimizing getState and dispatch with isDispatching

At this point, we need to consider: when the `reducer` is updating the `state`, would it cause any problems if `getState` or `dispatch` is triggered again?

In more concrete terms: can external users use `store.getState` and `store.dispatch` within their custom `reducer`?

- getState: Unnecessary, because the `reducer` itself receives the current `state` as its first parameter, so it can access it directly without calling `store.getState`.
- dispatch: Unnecessary, because the expectation is that one `action` only modifies the `state` once. And we need to avoid the situation where the `reducer` is executing an `action` and then triggers `store.dispatch` to execute the same `action` again, which would lead to an infinite recursion bug.

Beyond these explanations, an important mindset is that **the essence of a reducer is to focus on receiving an action, and based on the action type, execute predefined logic to update the state and return it. It's a pure function, and any additional side effects should be avoided**.

We can add an `isDispatching` flag to prevent calling `getState` and `dispatch` while the `reducer` is executing. The flow is as follows:

1. In `dispatch`, before the `reducer` executes, set `isDispatching = true`
2. After the `reducer` has finished executing, set `isDispatching = false`
3. In `getState` and `dispatch`, if `isDispatching = true`, throw an error message

This achieves the goal of not being able to use `getState` and `dispatch` within the `reducer`.

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;
  // Add isDispatching flag to determine if reducer is currently executing
  // It will be set to true before the reducer executes in the dispatch function
  let isDispatching = false;

  function getState() {
    // Cannot use store.getState() within reducer
    // => throw error message when isDispatching = true
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
    // Cannot use store.dispatch() within reducer
    // => throw error message when isDispatching = true
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions when isDispatching.');
    }

    try {
      // Set isDispatching to true and execute reducer
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      // When reducer execution ends, set isDispatching back to false
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

---

## Step 4: Implementing the subscribe API for Subscription Mechanism

Let's say there's a new requirement: we want to automatically `console.log` points every time the `store state`'s points value is updated. The desired usage in app.js would be:

```javascript
/*** app.js file ***/
import createStore from './createStore.js';

......

const store = createStore(reducer, preloadedState);

// Whenever store state changes, execute the callback function to print points
// store will receive this callback function through subscribe
store.subscribe(() => {
  console.log(store.getState().points)
});

......
```

`subscribe` needs to implement two important concepts:

1. It can receive a callback function as a subscription function
2. When the `store state` changes, the subscribed callback function will be executed

The following code implements these concepts:

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  let currentState = preloadedState;
  let currentReducer = reducer;
  let isDispatching = false;
  // Define listener, updated in subscribe; executed in dispatch
  let listener = null

  function getState() {...};

  function dispatch(action) {
    ...
    // After state is updated by reducer,
    // if there are subscribed listeners, execute them
    if(listener) {
      listener();
    }
  };

  // store.subscribe can receive a callback function, named listenerCb
  function subscribe(listenerCb) {
    // Cannot add subscriptions while reducer is executing
    if (isDispatching) {
        throw new Error(
          "You may not call store.subscribe() while the reducer is executing. " +
            "If you would like to be notified after the store has been updated, " +
            "subscribe from a component and invoke store.getState() in the callback to access the latest state."
        );
    }
    // Subscribe listenerCb
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

Now, from a requirements perspective, we need to consider two more questions:

1. Is there a need to unsubscribe? Yes, so we need an unsubscribe method.
2. Is there a need to subscribe to multiple events (callbacks)? Yes, so we need a listeners array, not just a single listener.

Let's address point 1 first - the "unsubscribe" requirement. We'll make `subscribe` return an `unsubscribe` function, so you can call `unsubscribe()` to cancel the subscription.

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...

  function subscribe(listenerCb) {
    if (isDispatching) {...}

    // Add isSubscribe flag to determine if unsubscribe should be executed
    let isSubscribed = true;

    listener = listenerCb;

    // Add unsubscribe for cancelling subscription
    return unsubscribe () {
      if (!isSubscribed) {
          return;
      }

      if (isDispatching) {
          throw new Error(
            "You may not unsubscribe from a store listener while the reducer is executing."
          );
      }

      // When unsubscribe is executed, set listener back to null to remove subscriber
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

Next, let's address requirement 2 - "subscribing to multiple callback events":

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  // Change listener to listeners = []
  let listeners = [];

  function getState() {...};

  function dispatch(action) {
    ...
    // After state update, execute all subscribed listener events
    for(let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };

  function subscribe(listener) {
    ...
    // Newly subscribed listener is added to listeners
    listeners.push(listener);

    return unsubscribe () {
      ...
      // Removing a subscribed event will remove it from listeners
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

With this, we've completed the basic functionality of `subscribe`/`unsubscribe`.

---

## Step 5: Fixing Issues with Nested subscribe / unsubscribe

The current Redux implementation has an issue when executing **nested** `subscribe`/`unsubscribe`, as shown below:

```javascript
/*** app.js ***/
const store = createStore(reducer, preloadedState);
const unsubscribe1 = store.subscribe(() => {...});
const unsubscribe2 = store.subscribe(() => {
  // Executing unsubscribe within a subscribe callback can cause issues
  unsubscribe1();
  // Executing another subscribe within a subscribe callback can also cause issues
  const unsubscribe3 = store.subscribe(() => {...});
});
```

Why is the above problematic?

**Because when iterating through the listeners array in a for loop, changing the length of listeners can cause unexpected execution behavior**.

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  function dispatch(action) {
    ...
    for(let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      // If this listener's execution changes the length of listeners
      // It might cause some items to be skipped or unexpectedly executed multiple times
      listener();
    };
  };
  ...
};

export default createStore;
```

To address this issue, we can **ensure that the listeners being executed are not affected by subscribe/unsubscribe operations**.

We can achieve this by creating `currentListeners` and `nextListeners`:

- **currentListeners**: stable, being iterated through in the for loop
- **nextListeners**: unstable, can be changed by `subscribe` and `unsubscribe`

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  // Change listeners to currentListeners and nextListeners
  let currentListeners = [];
  let nextListeners = currentListeners;

  function getState() {...};

  function dispatch(action) {
    ...
    // Before executing currentListeners, update currentListeners to the latest listeners
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };

  function subscribe(listener) {
    ...
    // When subscribing, operate on nextListeners
    nextListeners.push(listener);

    return unsubscribe () {
      ...
      // When unsubscribing, operate on nextListeners
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

It's particularly important to note that **when an array (object data) is copied, it copies the reference, not the value**, so we add `ensureCanMutateNextListeners` to handle this issue.

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  let currentListeners = [];
  let nextListeners = currentListeners;

  function getState() {...};

  // Use shallow copy to ensure nextListeners and currentListeners don't point to the same data
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function dispatch(action) {
    ...
    // Before executing currentListeners, update currentListeners to the latest listeners
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  };

  function subscribe(listener) {
    ...
    // Execute ensureCanMutateNextListeners first,
    // ensuring operations on nextListeners never affect currentListeners
    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return unsubscribe () {
      ...
      // Execute ensureCanMutateNextListeners first,
      // ensuring operations on nextListeners never affect currentListeners
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

With the above handling, we've fully implemented `subscribe`/`unsubscribe`.

---

## Step 6: Adding the Initialization dispatch

The final step, we've come to the last step!

Add an initialization `dispatch` to make the initial `state` return the `initialState` set in the `reducer`.

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  ...
  // Generate a random string
  const randomString = () =>
    Math.random().toString(36).substring(7).split("").join(".");

  // Initialize state with dispatch
  // Use randomString to avoid conflicts with user-defined INIT action types
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

With this, we've completed the core of Redux's `createStore`!

---

## Review of the Complete createStore Code

The complete code is as follows, with explanatory comments. For a version without comments, you can [click here to view it on Github](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase1_createStore).

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState) {
  // currentState is the core store state, initialized with preloadedState passed from outside
  let currentState = preloadedState;
  // currentReducer is the reducer used to update state, passed from outside
  let currentReducer = reducer;
  // currentListeners and nextListeners are designed for the subscribe functionality
  let currentListeners = [];
  let nextListeners = currentListeners;
  // isDispatching flag is designed to prevent using getState, dispatch, subscribe within reducer
  let isDispatching = false;

  // ensureCanMutateNextListeners uses shallow copy to ensure nextListeners and currentListeners point to different sources at the first level
  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  // External can access store state via store.getState
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

  // External changes store state via store.dispatch(action)
  function dispatch(action) {
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions when isDispatching.');
    }

    try {
      isDispatching = true;
      // Return updated store state through execution of currentReducer
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    // After store state update, update currentListeners and trigger all subscribed listeners
    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }
  }

  // External subscribes/unsubscribes to listener through store.subscribe(listener)
  function subscribe(listener) {
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
          'If you would like to be notified after the store has been updated, ' +
          'subscribe from a component and invoke store.getState() in the callback to access the latest state.'
      );
    }

    let isSubscribed = true;

    // Ensure currentListeners and nextListeners are different before adding new listener to nextListeners
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

      // Ensure currentListeners and nextListeners are different before removing listener from nextListeners
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);

      isSubscribed = false;
    };
  }

  const randomString = () => Math.random().toString(36).substring(7).split('').join('.');

  // initialize, use randomString() to avoid conflicts with user-defined INIT action types
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

Here's also an example `app.js` file using `createStore`:

```javascript
/*** app.js file ***/
import { createStore } from './createStore.js';

// Custom reducer
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

// Pass the custom reducer to createStore to create store
// store will provide getState, dispatch, subscribe APIs
const preloadedState = {
  points: 0,
};
const store = createStore(reducer, preloadedState);

// When plus button is clicked, trigger callback to add 100 points
document.getElementById('plus-points-btn').addEventListener('click', () => {
  // Through dispatch { type: 'PLUS_POINTS', payload: 100 }
  // Increase the points in store state by 100
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

// When minus button is clicked, trigger callback to subtract 100 points
document.getElementById('minus-points-btn').addEventListener('click', () => {
  // Through dispatch { type: 'MINUS_POINTS', payload: 100 }
  // Decrease the points in store state by 100
  store.dispatch({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

// Using the subscribe mechanism, when data is updated, the passed callback will be executed
store.subscribe(() => {
  // Get the latest points via getState and render to the screen
  const points = store.getState().points;
  document.getElementById('display-points-automatically').textContent = points;
});
```

---

## Review of the Goals After Reading This Article

Let's revisit the goals we hoped to achieve at the beginning of the article:

### 1. Understanding what Redux is and the main problems it aims to solve

Redux is a centralized state management tool based on the Flux flow concept. Its main purpose is to unify data management, prevent data state inconsistencies, and use a "unidirectional data flow" to control data state, making data changes more predictable and maintainable.

### 2. Understanding and implementing getState, dispatch, subscribe in createStore

The core of `createStore` is the centrally managed `store state`, and it provides the following three APIs:

- **getState**: Get the current `store state`.
- **dispatch**: Update `store state` by passing in an `action` (containing type and payload).
- **subscribe**: Subscribe a callback that will be executed after `store state` is updated.

### 3. Understanding what bugs subscribe can encounter and how to solve them with currentListeners, nextListeners, ensureCanMutateNextListeners

Without special handling, executing another `subscribe` or `unsubscribe` within a listener callback passed to `subscribe` might encounter unexpected bugs.

The key to the solution is:

- **currentListeners**: Create `currentListeners`, stable, which will actually execute each `listener` after `state` changes.
- **nextListeners**: Create `nextListeners`, unstable, which will add or remove `listener` when `subscribe`/`unsubscribe` is called.
- **ensureCanMutateNextListeners**: Since `listeners` is an array, to ensure `currentListeners` and `nextListeners` are different, `ensureCanMutateNextListeners` is executed before operating on `nextListeners`.

### 4. Being able to implement a basic createStore function

It's highly recommended to implement it yourself for a more lasting impression! If you get stuck, feel free to revisit this article or the Redux source code.

While this article doesn't implement the complete `createStore`, such as the `enhancer` related functionality, by implementing `getState`, `dispatch`, and `subscribe`, we can understand the core Redux operation and how it uses closure, listeners, and other patterns to encapsulate and implement centralized data management and data change monitoring concepts, which is very interesting.

If you're interested in the `enhancer` or `middlewares` mechanism, feel free to read the next article: [Understanding Redux Source Code (2) - Implementing middlewares, applyMiddleware, and createStore enhancer](/articles/2021/redux-make-createStore-enhancer-and-applyMiddleware).

---

#### References

- [LiangYingC/understand-redux-source-code](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase1_createStore)
- [reduxjs/redux | redux source code ](https://github.com/reduxjs/redux/tree/master/src)
- [redux three principles | redux document](https://redux.js.org/understanding/thinking-in-redux/three-principles)
- [挑戰 40 分鐘實作簡易版 Redux 佐設計模式 | 谷哥](https://modernweb.ithome.com.tw/session-inner#448)
- [完全理解 redux（从零实现一个 redux）｜ brickspert](https://mp.weixin.qq.com/s?__biz=MzIxNjgwMDIzMA==&mid=2247484209&idx=1&sn=1a33a2c8cb58ae98e4f8080ab59da06f&scene=21#wechat_redirect)
- [從 source code 來看 Redux 更新 state 的運行機制 | 陳冠霖](https://as790726.medium.com/%E5%BE%9E-source-code-%E4%BE%86%E7%9C%8B-redux-%E7%9A%84%E9%81%8B%E8%A1%8C%E6%A9%9F%E5%88%B6-f5e0adc1b9f6)
