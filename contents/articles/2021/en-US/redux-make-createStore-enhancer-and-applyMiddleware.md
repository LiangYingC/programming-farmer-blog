---
title: Understanding Redux Source Code (2) - Implementing middlewares, applyMiddleware, and createStore enhancer
date: 2021-12-30
description: Following the previous Redux series article where we implemented createStore's getState, dispatch, and subscribe, this article will advance to implementing Redux middleware-related functionality such as applyMiddleware and createStore's enhancer. Let's explore Redux more deeply with curiosity.
tag: Redux, JavaScript
---

## Introduction

Continuing from the previous article [Understanding Redux Source Code: Implementing createStore's getState, dispatch, and subscribe](/articles/2021/redux-make-createStore-getState-dispatch-subscribe), this time we'll explore deeper into the Redux source code, specifically the `middleware` part, including: `applyMiddleware` and the `enhancer` parameter of `createStore`.

After reading this article, I hope you'll achieve:

- Understanding what `middleware` aims to accomplish
- Being able to implement your own custom `middleware`
- Understanding and implementing `applyMiddleware`
- Understanding and implementing the third parameter of `createStore`: `enhancer`

For now, we won't define or explain what Redux middleware is, so you can temporarily forget about the term Redux middleware!

This article will continue from the code result of the previous article, including the contents of `createStore.js` and `app.js`, continuing to receive "new requirements" to expand the development of `app.js` and `createStore.js`, and ultimately implement Redux middleware-related functionality.

So, let's quickly review the code we implemented in the previous article.

---

## Review of Previously Implemented createStore.js and app.js

1. **createStore.js**: Creating `createStore`, which when executed creates a `store` that already implements the `store.getState`, `store.dispatch`, and `store.subscribe` methods.
2. **app.js**: Application (App) code, which will `import` the implemented `createStore` and use it to create a `store`.

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

  // External access to store state via store.getState
  function getState() {
    if (isDispatching) {
      throw new Error(...);
    }
    return currentState;
  }

  // External modification of store state via store.dispatch(action)
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

  // External subscription to events via store.subscribe(listener), which are triggered after store state changes
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

// Custom reducer
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

// Pass the custom reducer to createStore to create a store
// store provides getState, dispatch, subscribe APIs
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

If you're not familiar with the above code, I suggest going back to read [Understanding Redux Source Code: Implementing createStore's getState, dispatch, and subscribe](/articles/2021/redux-make-createStore-getState-dispatch-subscribe) before continuing with this article.

Now, let's start receiving requirements and expand the existing code, beginning with `app.js`.

---

## First Requirement: Log preState and newState

There's now a requirement to know the `state` before each update and the `state` after each update. How can we do this? From a programming perspective, we need to **log preState and newState every time dispatch is called**.

The most intuitive approach is to add two steps in `app.js`:

1. Before `store.dispatch(action)`, `console.log({ preState })`.
2. After `store.dispatch(action)`, `console.log({ newState })`.

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);

// Encapsulate logWhenDispatch to meet the logging state requirement
const logWhenDispatch = action => {
    console.log({ preState: store.getState()});
    store.dispatch(action);
    console.log({ newState: store.getState()});
};

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // Replace store.dispatch with logWhenDispatch
  logWhenDispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

document.getElementById('minus-points-btn').addEventListener('click', () => {
  // Replace store.dispatch with logWhenDispatch
  logWhenDispatch({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

......
```

This implementation is simple in principle: we **encapsulate dispatch in the logWhenDispatch function, adding the log of the preState and newState before and after calling dispatch**. Finally, we change `store.dispatch` to `logWhenDispatch`.

To refactor it better, we could also make logWhenDispatch return a function:

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);

// Refactor logWhenDispatch to return a function
const logWhenDispatch = () => {
    return (action) => {
        console.log({ preState: store.getState()});
        store.dispatch(action);
        console.log({ newState: store.getState()});
    };
};

// Execute logWhenDispatch() to get the wrapped dispatch that logs state
const dispatchWithLog = logWhenDispatch();

document.getElementById('plus-points-btn').addEventListener('click', () => {
  // Replace store.dispatch with dispatchWithLog
  dispatchWithLog({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

document.getElementById('minus-points-btn').addEventListener('click', () => {
  // Replace store.dispatch with dispatchWithLog
  dispatchWithLog({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

......
```

We can go a step further and abstract the `log functionality` into a standalone function:

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);

// Function that logs the state before and after a dispatch
const logState = (preState, newState) => {
    console.log({ preState });
    console.log({ newState });
};

// Refactor again to more clearly separate the logging logic from the dispatch wrapper
const logWhenDispatch = (store, logFn) => {
    return (action) => {
        const preState = store.getState();
        store.dispatch(action);
        const newState = store.getState();
        logFn(preState, newState);
    };
};

// Create dispatchWithLog with the logging function
const dispatchWithLog = logWhenDispatch(store, logState);

document.getElementById('plus-points-btn').addEventListener('click', () => {
  dispatchWithLog({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

document.getElementById('minus-points-btn').addEventListener('click', () => {
  dispatchWithLog({
    type: 'MINUS_POINTS',
    payload: 100,
  });
});

......
```

The refactored implementation makes the functionality clearer: **create a dispatchWithLog to replace the original store.dispatch, with the addition of a log function that logs state changes**.

---

## Second Requirement: Use Thunk to Handle Async Operations

Now there's a new requirement: **support dispatching asynchronous actions**.

In the previous usage, store.dispatch only accepted an action object with a type. What if we want to make an API call and dispatch actions when the API returns? How do we handle this asynchronous operation?

For example, in a real-world application, we might want to do the following:

```javascript
/*** app.js file ***/
......

document.getElementById('get-external-data-btn').addEventListener('click', () => {
  // We want to dispatch this function to the store
  // This function will handle API calls and then dispatch actual actions
  const getAndUpdateUserData = (dispatch, getState) => {
    // Dispatch an action to show a loading state
    dispatch({
      type: 'START_LOADING',
    });

    // Make an API call
    fetch('https://api.example.com/user')
      .then(response => response.json())
      .then(userData => {
        // Dispatch the received data
        dispatch({
          type: 'UPDATE_USER_DATA',
          payload: userData,
        });
        
        // Dispatch an action to hide the loading state
        dispatch({
          type: 'END_LOADING',
        });
      })
      .catch(error => {
        // Dispatch error handling
        dispatch({
          type: 'HANDLE_ERROR',
          payload: error.message,
        });
        
        // Dispatch an action to hide the loading state
        dispatch({
          type: 'END_LOADING',
        });
      });
  };

  // How can we dispatch this function?
  store.dispatch(getAndUpdateUserData); // This won't work with the current implementation!
});
```

In our current implementation, store.dispatch only accepts action objects, not functions. To solve this, we need to enhance store.dispatch to also handle function actions.

Let's implement this:

```javascript
/*** app.js file ***/
......

const store = createStore(reducer, preloadedState);

// Wrap store.dispatch to handle function actions
const dispatchWithThunk = action => {
  // If action is a function, execute it and pass dispatch and getState
  if (typeof action === 'function') {
    return action(dispatchWithThunk, store.getState);
  }
  
  // If action is an object, dispatch it as usual
  return store.dispatch(action);
};

document.getElementById('get-external-data-btn').addEventListener('click', () => {
  const getAndUpdateUserData = (dispatch, getState) => {
    // Use the dispatch passed in, which is dispatchWithThunk,
    // so it can handle nested function actions too
    dispatch({
      type: 'START_LOADING',
    });

    fetch('https://api.example.com/user')
      .then(response => response.json())
      .then(userData => {
        dispatch({
          type: 'UPDATE_USER_DATA',
          payload: userData,
        });
        
        dispatch({
          type: 'END_LOADING',
        });
      })
      .catch(error => {
        dispatch({
          type: 'HANDLE_ERROR',
          payload: error.message,
        });
        
        dispatch({
          type: 'END_LOADING',
        });
      });
  };

  // Now we can dispatch a function!
  dispatchWithThunk(getAndUpdateUserData);
});
```

This implementation allows us to **handle both action objects and action functions**. When we dispatch a function, dispatchWithThunk will execute it with dispatchWithThunk itself and store.getState as arguments.

---

## Third Requirement: Combine Logging and Thunk Functionality

Now, we have two enhanced dispatch functions:
1. **dispatchWithLog**: For logging state changes
2. **dispatchWithThunk**: For handling function actions

But what if we want both functionalities together? How can we combine them?

There are two possible approaches:

1. Nest the functions:
```javascript
const combinedDispatch = action => {
  console.log({ preState: store.getState() });
  
  const result = typeof action === 'function'
    ? action(combinedDispatch, store.getState)
    : store.dispatch(action);
    
  console.log({ newState: store.getState() });
  
  return result;
};
```

2. Create a more generic way to enhance dispatch, allowing multiple enhancements to be combined:

```javascript
// 1. Create functions that enhance dispatch
const addLogging = dispatch => {
  return action => {
    console.log({ preState: store.getState() });
    const result = dispatch(action);
    console.log({ newState: store.getState() });
    return result;
  };
};

const addThunk = dispatch => {
  return action => {
    if (typeof action === 'function') {
      return action(dispatch, store.getState);
    }
    return dispatch(action);
  };
};

// 2. Chain the enhancements
let enhancedDispatch = store.dispatch;
enhancedDispatch = addLogging(enhancedDispatch);
enhancedDispatch = addThunk(enhancedDispatch);

// 3. Replace store.dispatch with the enhanced version
// Now store.dispatch has both logging and thunk capabilities
store.dispatch = enhancedDispatch;
```

The second approach provides a more flexible way to **compose multiple dispatch enhancements**. Each enhancement function accepts the current dispatch and returns a new enhanced dispatch.

---

## Implementing a Complete Solution with Multiple Middleware

Let's take the second approach and make it more robust. We'll modify both `app.js` and `createStore.js` to support middleware.

First, let's enhance `createStore.js` to support middleware:

```javascript
/*** createStore.js file ***/
function createStore(reducer, preloadedState, enhancer) {
  // If enhancer is provided, use it to enhance createStore
  if (typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, preloadedState);
  }
  
  // The rest of the original createStore implementation...
  let currentState = preloadedState;
  let currentReducer = reducer;
  let currentListeners = [];
  let nextListeners = currentListeners;
  let isDispatching = false;
  
  // ... existing implementation ...
  
  return {
    getState,
    dispatch,
    subscribe,
  };
}

// New function to combine middlewares
function applyMiddleware(...middlewares) {
  return createStore => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    
    // Start with the original dispatch
    let dispatch = store.dispatch;
    
    // Create a middlewareAPI object to pass to middlewares
    const middlewareAPI = {
      getState: store.getState,
      dispatch: action => dispatch(action),
    };
    
    // Apply each middleware to the dispatch function
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    
    // Compose all the middlewares into a single enhanced dispatch function
    dispatch = chain.reduce((a, b) => action => a(b(action)), dispatch);
    
    // Return the store with the enhanced dispatch function
    return {
      ...store,
      dispatch,
    };
  };
}

export { createStore, applyMiddleware };
```

Now, let's update `app.js` to use these new features:

```javascript
/*** app.js file ***/
import { createStore, applyMiddleware } from './createStore.js';

// Define middlewares
const loggerMiddleware = ({ getState }) => next => action => {
  console.log('dispatching', action);
  console.log('preState', getState());
  
  const result = next(action);
  
  console.log('postState', getState());
  return result;
};

const thunkMiddleware = ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState);
  }
  
  return next(action);
};

// Create store with middlewares
const store = createStore(
  reducer, 
  preloadedState,
  applyMiddleware(loggerMiddleware, thunkMiddleware)
);

// Now we can dispatch both actions and thunks, with logging
document.getElementById('plus-points-btn').addEventListener('click', () => {
  store.dispatch({
    type: 'PLUS_POINTS',
    payload: 100,
  });
});

document.getElementById('get-external-data-btn').addEventListener('click', () => {
  store.dispatch((dispatch, getState) => {
    dispatch({ type: 'START_LOADING' });
    
    fetch('https://api.example.com/user')
      .then(response => response.json())
      .then(userData => {
        dispatch({
          type: 'UPDATE_USER_DATA',
          payload: userData,
        });
        dispatch({ type: 'END_LOADING' });
      })
      .catch(error => {
        dispatch({
          type: 'HANDLE_ERROR',
          payload: error.message,
        });
        dispatch({ type: 'END_LOADING' });
      });
  });
});
```

At this point, we've indirectly achieved the complete concept of implementing Redux middleware through requirement implementation!

We'll come back to define and explain Redux middleware later. For now, let's continue with the current code and make more optimizations and encapsulations.

---

## Optimizing applyMiddleware with compose

Let's enhance the `applyMiddleware` function by extracting the middleware composition logic into a separate utility function called `compose`:

```javascript
/*** createStore.js file ***/
// Compose multiple functions into a single function
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }
  
  if (funcs.length === 1) {
    return funcs[0];
  }
  
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

function applyMiddleware(...middlewares) {
  return createStore => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    let dispatch = store.dispatch;
    
    const middlewareAPI = {
      getState: store.getState,
      dispatch: action => dispatch(action),
    };
    
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(dispatch);
    
    return {
      ...store,
      dispatch,
    };
  };
}

export { createStore, applyMiddleware, compose };
```

This `compose` function makes our code more readable and can be reused for other composition tasks.

---

## Finalizing our Implementation

Let's combine everything we've learned to create a complete implementation:

```javascript
/*** createStore.js file ***/
// Compose multiple functions into a single function
export function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }
  
  if (funcs.length === 1) {
    return funcs[0];
  }
  
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

// Apply multiple middlewares to createStore
export function applyMiddleware(...middlewares) {
  return createStore => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    let dispatch = store.dispatch;
    
    const middlewareAPI = {
      getState: store.getState,
      dispatch: action => dispatch(action),
    };
    
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(dispatch);
    
    return {
      ...store,
      dispatch,
    };
  };
}

// Create a Redux store
export function createStore(reducer, preloadedState, enhancer) {
  // If enhancer is provided and is a function, use it
  if (typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, preloadedState);
  }
  
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
  
  function dispatch(action) {
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
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
    
    return action;
  }
  
  function subscribe(listener) {
    if (isDispatching) {
      throw new Error(
        'You may not call store.subscribe() while the reducer is executing. ' +
        'If you would like to be notified after the store has been updated, ' +
        'subscribe from a component and invoke store.getState() in the callback to access the latest state.'
      );
    }
    
    let isSubscribed = true;
    
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }
      
      if (isDispatching) {
        throw new Error(
          'You may not unsubscribe from a store listener while the reducer is executing.'
        );
      }
      
      isSubscribed = false;
      
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
    };
  }
  
  // Initialize the store with a random action
  const randomString = () => Math.random().toString(36).substring(7).split('').join('.');
  dispatch({ type: `INIT${randomString()}` });
  
  return {
    getState,
    dispatch,
    subscribe,
  };
}

// Example usage:
/*
import { createStore, applyMiddleware } from './createStore.js';

const loggerMiddleware = ({ getState }) => next => action => {
  console.log('before', getState());
  const result = next(action);
  console.log('after', getState());
  return result;
};

const thunkMiddleware = ({ dispatch, getState }) => next => action => {
  if (typeof action === 'function') {
    return action(dispatch, getState);
  }
  return next(action);
};

const store = createStore(
  reducer,
  initialState,
  applyMiddleware(loggerMiddleware, thunkMiddleware)
);

// Developers using Redux only need to focus on which middlewares to pass in
*/
```

With this implementation, we've created a robust system for extending Redux's functionality through middleware. The `applyMiddleware` function enhances `createStore` by wrapping the `dispatch` method with middleware functions.

---

## Understanding Redux Middleware

Through this project, let's summarize the definition of Redux middleware:

**Through the mechanism of Redux middleware, developers can extend the functionality of Dispatcher, achieving extra operations before or after Action is assigned to Reducer**. For example: printing the state before and after updates, handling asynchronous operations, etc.

![redux flow](/images/articles/redux-make-createStore-enhancer-and-applyMiddleware/01.gif)

The structure of a middleware looks like this: `({ getState, dispatch }) => next => action => { ... }`, which is a triple-nested function.

The above explanation, if you haven't implemented Redux middleware code, it's not easy to understand, but after implementing it once, it's easier to understand the context of multiple middlewares connected in sequence.

Let's break down a middleware in more detail:

```javascript
// Define a middleware
const exampleMiddleware = ({ getState, dispatch }) => {
  // First level: Receives middlewareAPI with getState and dispatch
  
  return next => {
    // Second level: Receives the next dispatch function
    
    return action => {
      // Third level: Receives the action to be dispatched
      
      // Do something before dispatch
      console.log('Dispatching:', action);
      
      // Call next dispatch function
      const result = next(action);
      
      // Do something after dispatch
      console.log('New State:', getState());
      
      // Return the result
      return result;
    };
  };
};
```

When multiple middlewares are combined using `compose`, they form a chain where each middleware calls the next one in sequence, and the last middleware calls the original `store.dispatch`.

This pattern allows for great flexibility and extensibility in Redux applications.

---

## Creating Your Own Middleware

We've seen the logging middleware and thunk middleware examples. Let's create another custom middleware:

```javascript
// A middleware that adds a timestamp to each action
const timestampMiddleware = () => next => action => {
  const timestampedAction = {
    ...action,
    meta: {
      ...action.meta,
      timestamp: Date.now(),
    },
  };
  
  return next(timestampedAction);
};

// A middleware that filters out specific action types
const filterMiddleware = () => next => action => {
  // Skip certain action types
  if (action.type === 'IGNORED_ACTION') {
    console.log('Ignoring action', action);
    return;
  }
  
  return next(action);
};
```

So we can create a custom middleware, for example, the famous `Redux-Thunk`:

```javascript
/*** Redux-Thunk source code ***/
function createThunkMiddleware(extraArgument) {
  return ({ dispatch, getState }) => next => action => {
    if (typeof action === 'function') {
      return action(dispatch, getState, extraArgument);
    }
    
    return next(action);
  };
}

const thunk = createThunkMiddleware();
thunk.withExtraArgument = createThunkMiddleware;

export default thunk;
```

The power of middleware comes from:

1. **Intercept Actions**: Middleware can inspect, modify, or even cancel actions.
2. **Transform Actions**: Convert one action into another or dispatch multiple actions.
3. **Handle Side Effects**: Perform operations like API calls outside the regular Redux flow.
4. **Extend Store Capabilities**: Add functionality not present in the core Redux store.

Redux's middleware system enables developers to extend the store's capabilities without modifying the core implementation.

---

## The Role of enhancer in createStore

In our implementation, we added a third parameter to `createStore` called `enhancer`. Let's understand what it does:

```javascript
function createStore(reducer, preloadedState, enhancer) {
  if (typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, preloadedState);
  }
  
  // Original createStore implementation...
}
```

An enhancer is a higher-order function that takes the `createStore` function and returns an enhanced version of it. The key line is:

```javascript
return enhancer(createStore)(reducer, preloadedState);
```

This allows enhancers to:

1. Modify the store creation process
2. Add features to the store object
3. Change how dispatch, subscribe, or getState work

In our implementation, `applyMiddleware` is an enhancer. It takes the original `createStore` function and returns a new function that:

1. Creates a store using the original `createStore`
2. Enhances the store's `dispatch` method with middleware
3. Returns the enhanced store

This pattern is powerful because it keeps `createStore` focused on core functionality while allowing extensions through enhancers.

---

## Generalizing to Handle Various Enhancers

While we've focused on `applyMiddleware` as an enhancer, Redux supports any function that follows the enhancer pattern. Let's refine our implementation to handle different enhancers more generally:

```javascript
function createStore(reducer, preloadedState, enhancer) {
  // Handle the case where preloadedState is skipped
  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }
  
  if (typeof enhancer === 'function') {
    return enhancer(createStore)(reducer, preloadedState);
  }
  
  // Original implementation...
}
```

This change allows developers to pass an enhancer directly as the second argument if they don't need to specify `preloadedState`.

---

## Conclusion and Next Steps

Finally, we've completed the implementation of the core concept of Redux middleware!

Now we can create a Redux store with middleware support:

```javascript
import { createStore, applyMiddleware } from './redux.js';
import thunk from 'redux-thunk';
import logger from 'redux-logger';

const store = createStore(
  rootReducer,
  initialState,
  applyMiddleware(thunk, logger)
);
```

The real power of Redux comes from its extensible architecture. By understanding the implementation details, we can:

1. Create custom middleware for our specific needs
2. Debug Redux applications more effectively
3. Make informed decisions about which middleware to use
4. Create custom store enhancers for advanced use cases

Comparing with the actual Redux source code, you'll find some differences in the code, because there are more implementation details, such as: checking if the input type is correct, preventing incorrect usage, optimizing code, etc.

However, overall, we've completed the core concept of Redux middleware, starting from a requirements perspective. I hope this makes it easier for you to understand the Redux middleware-related source code.

If you're interested in learning more about implementing the Redux `combineReducers` function to efficiently manage multiple reducers, feel free to read: [Understanding Redux Source Code (3) - Implementing combineReducers](/articles/sourceCode/redux-make-combineReducers).

---

#### References

- [LiangYingC/understand-redux-source-code](https://github.com/LiangYingC/understand-redux-source-code/tree/master/phase2_middlewares)
- [reduxjs/redux | redux source code ](https://github.com/reduxjs/redux/tree/master/src)
- [middleware | redux document](https://redux.js.org/understanding/history-and-design/middleware)
- [完全理解 redux（从零实现一个 redux）｜ brickspert](https://mp.weixin.qq.com/s?__biz=MzIxNjgwMDIzMA==&mid=2247484209&idx=1&sn=1a33a2c8cb58ae98e4f8080ab59da06f&scene=21#wechat_redirect)
- [詳解 Redux middleware ｜ 谷哥](https://max80713.medium.com/%E8%A9%B3%E8%A7%A3-redux-middleware-efd6a506357e)
- [從 source code 來看 Redux 更新 state 的運行機制 | 陳冠霖](https://as790726.medium.com/%E5%BE%9E-source-code-%E4%BE%86%E7%9C%8B-redux-%E7%9A%84%E9%81%8B%E8%A1%8C%E6%A9%9F%E5%88%B6-f5e0adc1b9f6)
