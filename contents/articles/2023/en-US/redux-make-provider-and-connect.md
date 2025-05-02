---
title: Understanding Redux Source Code (4) - Understanding React-Redux Combination Through Provider and connect
date: 2023-07-30
description: In the frontend world, it's uncommon to use Redux alone, but rather React and Redux together, aka React-Redux. In this article, we'll explore the implementation of the core parts of React-Redux, focusing mainly on the Provider component and connect method.
tag: Redux, React
---

## Introduction

In previous articles:

- [Understanding Redux Source Code (1) - Let's Implement createStore's getState, dispatch, subscribe](/articles/2021/redux-make-createStore-getState-dispatch-subscribe)
- [Understanding Redux Source Code (2) - Let's Implement middlewares, applyMiddleware, and createStore enhancer](/articles/2021/redux-make-createStore-enhancer-and-applyMiddleware)
- [Understanding Redux Source Code (3) - Let's Implement combineReducers](/articles/2022/redux-make-combineReducers)

We've explored the main concepts and implementations of Redux, including `createStore`, `middlewares`, `applyMiddleware`, and `combineReducers`, so we have a decent understanding of Redux. If you're not familiar with these concepts, you can revisit the articles above or read the official Redux documentation.

In the frontend world of recent years, it's uncommon to see Redux used alone; instead, it's typically used together with React, aka **React-Redux**. In this article, I want to further explore the implementation of the core parts of React-Redux, focusing mainly on the `Provider` component and the `connect` method.

Currently, the most common approach is to use Hooks rather than the `connect` method to integrate React-Redux props into React components. However, although these two approaches differ significantly in their API usage, their ultimate goal is essentially the same: to implement "**allowing React components to connect to the Redux store, thereby enabling them to access and update global data**". Additionally, in my recent work on developing and maintaining a project that's over 5 years old, I still encounter `connect`, so I wanted to understand it more deeply. Therefore, this article will focus on `connect` (the HOC concept) rather than Hooks to explore the combination of Redux and React.

I also personally find it interesting to understand such historical technologies.

After reading this article, I hope you will:
- Understand what React-Redux is
- Understand the core concepts and usage of Provider/connect
- Be able to implement a simple version of Provider/connect

---

## Let's Talk About What React-Redux Is

Even today, some people mistakenly believe that Redux is only used with React, which is a significant misconception.

**Redux is a centralized data state management tool implemented based on the Flux flow concept**. It can be used to manage data state in JavaScript applications and is not limited to any single framework.

**React-Redux is the implementation of Redux in React applications**, allowing React components to read data from the Redux store and dispatch actions to the store to update state.

![react-redux flow](/images/articles/redux-make-provider-and-connect/01.png)

The concept diagram above very briefly expresses the role of React-Redux.

The official React-Redux documentation describes it as:
> **React Redux** is the official React UI bindings layer for Redux. It lets your **React components** read data from a Redux store, and dispatch actions to the store to update state.

Thinking further from the above, we can understand that: to enable React components to use Redux, what it means behind the scenes is "**each React component, as needed, can access the state/dispatch provided by the Redux store and use it**"

To achieve this goal, we need:

1. A way to provide the store to every component => **Provider**.
2. A way to access store state/dispatch from component props => **connect**.

Next, we'll start by understanding the definitions and usage of `Provider` / `connect`.

*p.s. With different versions of React, React-Redux, the way to use Provider / connect and their source code will differ. The examples in this article may not be the latest way of writing, but the core concepts don't differ much and can still be referenced and learned from.*

---

## The Concept Definition and Usage of Provider

The `Provider` component is one of the core components of React-Redux. This component is mainly responsible for receiving the Redux store and passing it as props, allowing all child components wrapped by `Provider` to use store-related functions. Through the following code example, you can quickly understand how to use `Provider`:

```jsx
/*** index.js ***/
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import Counter from './Counter';

// Custom reducer function
const reducer = (state = { count: 0 }, action) =>  {
  switch (action.type) {
    case 'INCREMENT':
      return { count: state.count + 1 };
    case 'DECREMENT':
      return { count: state.count - 1 };
    default:
      return state;
  }
}

// Create store using redux's createStore
const store = createStore(reducer);

ReactDOM.render(
  // Through react-redux's Provider, pass store as props,
  // so that child components wrapped by Provider can access the store
  <Provider store={store}>
    <Counter />
  </Provider>, 
  document.getElementById('root')
);
```

In most projects, to allow all components to access the store, we directly wrap the `App` component with `Provider`:

```jsx
/*** index.js ***/
......

import App from './App';

......

ReactDOM.render(
  // Provider wraps App, allowing all components under App to access the store
  <Provider store={store}>
    <App />
  </Provider>, 
  document.getElementById('root')
);
```

In fact, the official documentation already explains `Provider` in an easy-to-understand way:
> The <Provider> component **makes the Redux store available to any nested components that need to access the Redux store**.

> Since any React component in a React Redux app can be connected to the store, **most applications will render a <Provider> at the top level**, with the entire app's component tree inside of it.

---

## The Concept Definition and Usage of connect

Next, let's focus on the concept and usage of `connect`:

`connect` is a core method in React-Redux. As the name suggests, it's the concept of "connection," which can actually connect the Redux store to React components. In other words, through `connect`, the state and dispatch methods from the Redux store can be connected to a React component's props, allowing the React component to use them.

If you're seeing `Provider` and `connect` for the first time, you might think both are about combining the store with React components, but what's the "conceptual" difference?

- **Provider is the provider**, "providing" the store to all components, but this doesn't mean every component needs to actually use the store state/dispatch.
- **connect is the connector**, allowing components that truly need to use the store state/dispatch to actually "connect" with the store, thereby enabling them to access the store state/dispatch in the component props.

Continuing from the `Provider` usage example code above, we can use `connect` in the `Counter` component:

```jsx
/*** Counter.js ***/
import { connect } from 'react-redux';

// Declare Counter component, get store state/dispatch from props,
// with the help of connect behind the scenes, making it possible to use these items in props
const Counter = ({ 
  count, 
  increment, 
  decrement 
}) => {
  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}

// Declare mapStateToProps,
// setting which store state the Counter needs to access
const mapStateToProps = (state) => ({
  count: state.count,
});

// Declare mapDispatchToProps,
// setting which store dispatch actions the Counter needs to access
const mapDispatchToProps = (dispatch) => ({
  increment: () => dispatch({ type: 'INCREMENT' }),
  decrement: () => dispatch({ type: 'DECREMENT' }),
});

// Use connect to link Counter with the store,
// so it can access count data & increment, decrement methods from Counter props
export default connect(mapStateToProps, mapDispatchToProps)(Counter);
```

From the usage above, we can see the usage pattern of the `connect` API, which can take two sets of parameters.

1. The first set of parameters can include `mapStateToProps`, `mapDispatchToProps`:

- **mapStateToProps**: A function that receives the Redux store's state as input, and returns an object as output. The keys of this object will be passed to the component as props. This **defines which Redux store states need to be passed to the component**.

- **mapDispatchToProps**: Also a function, which receives the Redux store's dispatch as input, and returns an object as output. The keys of this object will also be passed to the component as props. This **defines functions for updating the Redux store, which can dispatch actions to the Redux store to update state**.

In the example code, through `mapStateToProps`, `mapDispatchToProps`, we define methods for accessing the `counter` state and the `increment`, `decrement` dispatch actions.

*p.s. The first set of parameters for connect can also include `mergeProps`, `options`, which we won't discuss for now.*

2. The second set of parameters can include a component:

`connect` is an implementation of HOC (High Order Component). Simply put, an HOC is a function that accepts a component as a parameter and ultimately returns a new component. This new component usually extends or modifies the props or behavior of the original component.

In the example, the second set of parameters passed in is the `Counter` component, ultimately adding the `count` state, `increment`, `decrement` methods to the `Counter` props.

From the introduction above, we can roughly understand the concepts and usage of `Provider` and `connect`. Next, we'll start **implementing** these two APIs provided by React-Redux to better understand their principles.

---

## Implementing Simple Provider and connect using Context API

To create `Provider` and `connect`, the most basic core part is to have a way that allows any React component to "conveniently" access a single source store and modify it.

The emphasis on conveniently means that this access method shouldn't be through continually passing props, which would create prop drilling problems and be difficult to maintain when there are many layers of components.

If you've been writing React for a while, after reading the above, you can intuitively think of the **Context API** provided by React. React's Context API allows data to be passed and shared at all levels in the component tree without having to pass props level by level, avoiding prop drilling. This is particularly useful when managing global state or data shared by multiple layers of components.

In simple terms, the usage is:
1. First, create a Context using `React.createContext(defaultValue)`, which creates a Context object.
2. Then, wrap the top-level parent component with the `Provider` provided by the Context object, and pass the value to be shared to the `value` prop.
3. Finally, in child-level components that need to extract the shared value, use `useContext` to get the shared value.

```jsx
import { createContext, useContext } from 'react'

// Create a Context, default can be passed or not
const ThemeContext = createContext()

// At the top-level parent component, use Provider to wrap, sharing the ThemeContext value
const App = () => {
  return (
    <ThemeContext.Provider value="light">
      <Header />
    </ThemeContext.Provider>
  )
}

// In the Header component (or any of its child components), you can easily access the theme value
const Header = () => {
  return (
    <div>
      <ThemedButton />
    </div>
  )
}

// In ThemedButton, use the useContext Hook to access the theme value
const ThemedButton = () => {
  const theme = useContext(ThemeContext)
  return (
    <button>
      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
    </button>
  )
}
```

After reviewing the example, we can implement the simplest `Provider`, which needs to satisfy:

1. Can accept a `store` prop.
2. Can wrap `children` components.

```jsx
/*** Provider.js ***/
import { createContext } from 'react'

// Create a context for redux store
const ReduxContext = createContext()

// Create a Provider component that can receive store and children
const Provider = ({ 
  store, 
  children 
}) => {
  return (
    // Use ReduxContext's Provider and pass store as value
    // This way, all child components below can access the store
    <ReduxContext.Provider value={store}>
      {children}
    </ReduxContext.Provider>
  )
}

export { Provider, ReduxContext }
```

Of course, this is the simplest version, and there are many optimizations that can be made later.

Using the same concept, we can continue to implement the simplest `connect` HOC, which needs to satisfy:

1. First set of parameters can include `mapStateToProps`, `mapDispatchToProps`.
2. Second set of parameters can include a component.
3. Finally, it will return a new version of the component, whose props need to include state and methods for updating state, mapped through `mapStateToProps`, `mapDispatchToProps`.

```jsx
/*** connect.js ***/
import { useContext } from 'react'
import { ReduxContext } from './Provider'

// First set of parameters can include mapStateToProps, mapDispatchToProps
const connect = (mapStateToProps, mapDispatchToProps) => {
  // Second set of parameters can include WrappedComponent
  return function (WrappedComponent) {
    // Return the completed connected Component, which will receive the original props
    return function ConnectedComponent(ownProps) {
      // Extract store from context
      const store = useContext(ReduxContext); 
      // Pass store.getState() to mapStateToProps, return the final store state to be used
      const stateProps = mapStateToProps ? 
        mapStateToProps(store.getState(), ownProps) 
        : {}; 
      // Pass store.dispatch to mapDispatchToProps, return the final dispatch methods to be used
      const dispatchProps = mapDispatchToProps ? 
        mapDispatchToProps(store.dispatch, ownProps) 
        : {};

      // The final rendered component, already combining all needed props
      return (
        <WrappedComponent 
          {...ownProps} 
          {...stateProps} 
          {...dispatchProps} 
        />
      )
    }
  }
}
```

In this way, through the Context API, we've implemented a simple version of the "**letting React components get the store and merge it into props**" requirement. With the "acquisition mechanism" in place, let's move on to implement a simple version of the "update mechanism."

---

## Implementing the Component Update Mechanism in Provider and connect

In our previous implementation, we can already access and use the store. However, if we actually trigger dispatch methods in props, like the `increment` / `decrement` in the previous example, thereby updating the `count` in the store, will it trigger related components to re-render?

No, because we haven't implemented the "trigger re-rendering" mechanism yet. This mechanism needs to include:

1. If the store state updates, Provider needs to trigger the passing down of the new state
2. If connect receives a new state change, it needs to trigger the component to update and re-render

"When the state changes, xxx behavior should be triggered" - this statement most intuitively reminds us of the `store.subscribe(fn)` API: when the store state changes, fn is triggered. Using this concept, let's rewrite the code:

```jsx
/*** Provider.js ***/
import { createContext, useState, useEffect } from 'react'

const ReduxContext = createContext()

const Provider = ({ 
  store, 
  children 
}) => {
  const [_, forceUpdate] = useState(store.getState());

  // Through subscription, when the store updates, it will trigger forceUpdate
  // This way, Provider provides the latest store
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdate(store.getState());
    });
    return () => {
      unsubscribe();
    };
  }, [store]);
  
  return (
    <ReduxContext.Provider value={store}>
      {children}
    </ReduxContext.Provider>
  )
}

export { Provider, ReduxContext }
```

```jsx
/*** connect.js ***/
import { 
  useContext,
  useState, 
  useEffect
} from 'react'
import { ReduxContext } from './Provider'

const connect = (mapStateToProps, mapDispatchToProps) => {
  return function (WrappedComponent) {
    return function ConnectedComponent(ownProps) {
      const store = useContext(ReduxContext); 
      const stateProps = mapStateToProps ? 
        mapStateToProps(store.getState(), ownProps) 
        : {}; 
      const dispatchProps = mapDispatchToProps ? 
        mapDispatchToProps(store.dispatch, ownProps) 
        : {};

      // Add the following code to achieve the mechanism: when store updates, re-render the component
      const [_, forceUpdate] = useState({});
      useEffect(() => {
        const unsubscribe = store.subscribe(() => {
          // When the store changes, it will force re-render the component using connect
          forceUpdate({});
        });
        return () => {
          unsubscribe();
        };
      }, [store]);

      return (
        <WrappedComponent 
          {...ownProps} 
          {...stateProps} 
          {...dispatchProps} 
        />
      )
    }
  }
}
```

It's important to emphasize: why must the update mechanism be added to both `Provider` and `connect`?

Because they have different purposes:

- Update mechanism in Provider: Ensures that new stores are passed to components that need them
- Update mechanism in connect: Ensures that components using the updated store are re-rendered

If the update mechanism in `connect` is removed, there might be a problem where the component doesn't render the latest data.

At this point, we've implemented a simple version of the update method using an easy-to-understand implementation pattern. The next step is to further optimize it.

---

## Further Optimizing the Performance of Provider and connect

For the already implemented `Provider` above, we can further optimize it to ensure that `forceUpdate` is only triggered after `store.getState()` has been updated.

There are multiple ways to implement this. Here, we'll use `useRef`:

```jsx
/*** Provider.js ***/
import { 
  createContext, 
  useState, 
  useEffect, 
  useRef 
} from 'react'

const ReduxContext = createContext()

const Provider = ({ 
  store, 
  children 
}) => {
  const [_, forceUpdate] = useState({});
  // Store store.getState using useRef
  const storeStateRef = useRef(store.getState());

  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      // Only update if the latest store state is not equal to the previous store state
      const newState = store.getState();
      if(newState !== storeStateRef.current){
        storeStateRef.current = newState;
        forceUpdate({});
      }
    });
    return () => {
      unsubscribe();
    };
  }, [store]);
  
  return (
    <ReduxContext.Provider value={store}>
      {children}
    </ReduxContext.Provider>
  )
}

export { Provider, ReduxContext }
```

This is a simple way to achieve the concept of reducing `forceUpdate` triggers. Of course, we can apply similar logic to `connect`, using `useRef` to reduce unnecessary renders:

```jsx
/*** connect.js ***/
import { useContext, useRef } from 'react'
import { ReduxContext } from './Provider'
import shallowEqual from './shallowEqual' // Assume shallowEqual is already created

const connect = (mapStateToProps, mapDispatchToProps) => {
  return function (WrappedComponent) {
    return function ConnectedComponent(ownProps) {
      const store = useContext(ReduxContext); 
      const stateProps = mapStateToProps ? 
        mapStateToProps(store.getState(), ownProps) 
        : {}; 
      const dispatchProps = mapDispatchToProps ? 
        mapDispatchToProps(store.dispatch, ownProps) 
        : {};
      // Use useRef to store props, stateProps, dispatchProps
      const storedOwnProps = useRef(ownProps)
      const storedStateProps = useRef(stateProps)
      const storedDispatchProps = useRef(dispatchProps)

      const [_, forceUpdate] = useState({});
      useEffect(() => {
        const unsubscribe = store.subscribe(() => {
          const newStateProps = mapStateToProps ? 
            mapStateToProps(store.getState(), ownProps) 
            : {};
          const newDispatchProps = mapDispatchToProps ? 
            mapDispatchToProps(store.dispatch, ownProps) 
            : {};
          // Only trigger forceUpdate to re-render when combinedProps content has changed
          if (
            !shallowEqual(storedOwnProps.current, ownProps) || !shallowEqual(storedStateProps.current, newStateProps) ||
            !shallowEqual(storedDispatchProps.current, newDispatchProps)
          ) {
            storedOwnProps.current = ownProps;
            storedStateProps.current = newStateProps;
            storedDispatchProps.current = newDispatchProps;
            forceUpdate({});
          }
        });
        return () => {
          unsubscribe();
        };
      }, [store]);

      return (
        <WrappedComponent 
          {...storedOwnProps.current} 
          {...storedStateProps.current} 
          {...storedDispatchProps.current}
        />
      )
    }
  }
}
```

Of course, compared to the actual source code, there are many areas for further optimization. However, at this point, we've implemented the concept of reducing unnecessary re-renders.

The most curious part for me is "why use **strict equality ===** in `Provider` but **shallow equality** in `connect`?"

The reason is that in reducers, if the state hasn't been updated, it returns the original state. Even if this state is an object value, the two references will be the same, not triggering force update, so `store.getState()` can directly use **strict equality** for comparison.

Let's explain with a reducer code example:

```javascript
function accountReducer(state = {price: 0, credit: 0}, action) {
  switch (action.type) {
    case 'INCREMENT_PRICE':
      // If changed, will return an object with a different reference
      return {...state, price: state.price + 1};
    case 'DECREMENT_PRICE':
      // If changed, will return an object with a different reference
      return {...state, price: state.price - 1};
    default:
      // If not changed, will return the original object, same reference
      return state;
  }
}
```

As for why **shallow equality** is needed in `connect`, it's because every time `stateProps` and `dispatchProps` will generate new objects. Even if the key values inside are exactly the same, if the references are different, using **strict equality** would still trigger force update, resulting in updates every time. Therefore, **shallow equality** comparison is necessary for meaningful comparison.

```javascript
const mapStateToProps = (state) => {
  return {
    price: state.price, 
    credit: state.credit
  };
}

export connect(mapStateToProps, null)(component)

// When triggering const stateProps = mapStateToProps(store.getState() in connect,
// the reference of the stateProps object is always new, so:
// If using === comparison, reference is different each time, updated each time.
// If using shallow equality comparison, it can truly compare if key values are different, only updated if values are different.
```

The small supplement above is meant to help understand the details of this "comparison method" more quickly.

---

## Conclusion, Reviewing the Initial Goals

By now, the react-redux source code has evolved to be much more complex than redux. This article has implemented the basic concepts in a relatively simple way to understand the interaction between react and redux. If you want to see more detailed implementations or extensions to handle more scenarios, you can continue reading the source code.

Initially, I hoped that after reading this article, you would:

- Understand what React-Redux is
- Understand the core concepts and usage of Provider/connect
- Be able to implement a simple version of Provider/connect

### 1. Understand what React-Redux is

**Redux is a centralized data state management tool implemented based on the Flux flow concept**. It can be used to manage data state in JavaScript applications and is not limited to any single framework.

**React-Redux is the implementation of Redux in React applications**, allowing React components to read data from the Redux store and dispatch actions to the store to update state.

### 2. Understand the core concepts and usage of Provider/connect

`Provider` is mainly responsible for receiving the Redux store and passing it as props, allowing all child components wrapped by `Provider` to use store-related functions.

`connect` can connect the state and dispatch methods from the Redux store to a React component's props, allowing React components to use them.

- **Provider is the provider**, "providing" the store to all components, but not every component needs to actually use the store state/dispatch.
- **connect is the connector**, allowing components that truly need to use the store state/dispatch to actually "connect" with the store, thereby accessing the store state/dispatch in component props.

Examples of program usage:

```jsx
/*** index.js ***/
......

import App from './App';

......

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>, 
  document.getElementById('root')
);
```

```jsx
/*** Counter.js ***/
import { connect } from 'react-redux';

const Counter = ({ 
  count, 
  increment, 
  decrement 
}) => {
  return (
    <div>
      <button onClick={decrement}>-</button>
      <span>{count}</span>
      <button onClick={increment}>+</button>
    </div>
  );
}

const mapStateToProps = (state) => ({
  count: state.count,
});

const mapDispatchToProps = (dispatch) => ({
  increment: () => dispatch({ type: 'INCREMENT' }),
  decrement: () => dispatch({ type: 'DECREMENT' }),
});

export default connect(mapStateToProps, mapDispatchToProps)(Counter);
```

### 3. Be able to implement a simple version of Provider/connect

The text above describes it quite in detail, so here we'll just review through code:

```jsx
/*** Provider.js ***/
import { 
  createContext, 
  useState, 
  useEffect, 
  useRef 
} from 'react'

// Create a context for redux store
const ReduxContext = createContext()

// Create a Provider component that can accept store and children
const Provider = ({ 
  store, 
  children 
}) => {
  // Create forceUpdate to re-render Provider and update it
  const [_, forceUpdate] = useState({});
  // Store store.getState using useRef
  const storeStateRef = useRef(store.getState());

  useEffect(() => {
    // Through subscription, when store updates, it will trigger subscribe callback logic
    const unsubscribe = store.subscribe(() => {
      const newState = store.getState();
      // If the latest store state is not equal to the previous store state, force update
      if(newState !== storeStateRef.current){
        storeStateRef.current = newState;
        forceUpdate({});
      }
    });
    return () => {
      unsubscribe();
    };
  }, [store]);
  
  return (
    // Use ReduxContext's Provider and pass store as value
    // This way, all child components below can access the store
    <ReduxContext.Provider value={store}>
      {children}
    </ReduxContext.Provider>
  )
}

export { Provider, ReduxContext }
```

```jsx
/*** connect.js ***/
import { useContext, useRef } from 'react'
import { ReduxContext } from './Provider'
import shallowEqual from './shallowEqual' // Assume shallowEqual is already created

// First set of parameters can include mapStateToProps, mapDispatchToProps
const connect = (mapStateToProps, mapDispatchToProps) => {
  // Second set of parameters can include WrappedComponent
  return function (WrappedComponent) {
    // Return the completed connected Component, which will receive the original props
    return function ConnectedComponent(ownProps) {
      // Extract store from context
      const store = useContext(ReduxContext); 
      // Pass store.getState() to mapStateToProps, return the final store state
      const stateProps = mapStateToProps ? 
        mapStateToProps(store.getState(), ownProps) 
        : {}; 
      // Pass store.dispatch to mapDispatchToProps, return the final dispatch methods
      const dispatchProps = mapDispatchToProps ? 
        mapDispatchToProps(store.dispatch, ownProps) 
        : {};
      // Use useRef to store props, stateProps, dispatchProps
      const storedOwnProps = useRef(ownProps)
      const storedStateProps = useRef(stateProps)
      const storedDispatchProps = useRef(dispatchProps)

      const [_, forceUpdate] = useState({});
      useEffect(() => {
        // Subscribe to store updates, re-render component through forceUpdate mechanism
        const unsubscribe = store.subscribe(() => {
          const newStateProps = mapStateToProps ? 
            mapStateToProps(store.getState(), ownProps) 
            : {};
          const newDispatchProps = mapDispatchToProps ? 
            mapDispatchToProps(store.dispatch, ownProps) 
            : {};
          // Only trigger forceUpdate to re-render when combinedProps content has changed
          if (
            !shallowEqual(storedOwnProps.current, ownProps) || !shallowEqual(storedStateProps.current, newStateProps) ||
            !shallowEqual(storedDispatchProps.current, newDispatchProps)
          ) {
            storedOwnProps.current = ownProps;
            storedStateProps.current = newStateProps;
            storedDispatchProps.current = newDispatchProps;
            forceUpdate({});
          }
        });
        return () => {
          unsubscribe();
        };
      }, [store]);

      // The final rendered component, already combining all needed props
      return (
        <WrappedComponent 
          {...storedOwnProps.current} 
          {...storedStateProps.current} 
          {...storedDispatchProps.current}
        />
      )
    }
  }
}
```

That's the entire content of this article. Compared to the previous articles focusing on Redux, this one puts more emphasis on the core components of the interaction between React and Redux, helping understand the general logic behind the implementation.

---

#### References
- [Provider source code](https://github.com/reduxjs/react-redux/blob/master/src/components/Provider.tsx)
- [connect source code](https://github.com/reduxjs/react-redux/blob/7.x/src/connect/connect.js)
- [React-redux | To understand the principles, let's implement a React-redux!](https://medium.com/%E6%89%8B%E5%AF%AB%E7%AD%86%E8%A8%98/developing-react-redux-from-zero-to-one-e27eddfbce39)
- [Looking at how React-Redux makes Redux dance with React from the source code](https://as790726.medium.com/%E5%BE%9E-source-code-%E4%BE%86%E7%9C%8B-react-redux-%E6%80%8E%E9%BA%BC%E8%AE%93-redux-%E8%B7%9F-react-%E5%85%B1%E8%88%9E-a0777b99463a)
- Conversations with [ChatGPT4](https://openai.com/gpt-4)


#### Special Thanks

- Thanks to zacharyptt in [this issue](https://github.com/LiangYingC/programming-farmer-blog/issues/16) for making me realize it should be **shallow** rather than **shadow** equality.








