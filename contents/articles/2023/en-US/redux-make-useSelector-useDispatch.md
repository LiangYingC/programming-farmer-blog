---
title: "Understanding Redux Source Code (5) - From HOC to Hooks, Implementing useSelector and useDispatch"
date: 2023-08-31
description: As React-Redux versions have evolved, the official recommendation has shifted toward using Hooks instead of the previous HOC pattern (e.g., `connect`). In this article, we'll explore the benefits of this transition and understand and implement React-Redux's most important Hooks - useSelector and useDispatch.
tag: Redux, React
---

# Introduction

In the [previous article](/contents/articles/2023/en-US/redux-make-provider-and-connect/), we explored how to implement the `Provider` and `connect` APIs for React-Redux. These APIs use a Higher-Order Component (HOC) pattern, which was the primary approach for integrating Redux with React components before React 16.8 introduced Hooks.

With the release of React Hooks and subsequent updates to React-Redux, the official recommendation has shifted toward using Hooks instead of the HOC pattern. In this article, we'll explore:

1. Why the transition from HOC to Hooks is beneficial
2. Understanding the `useSelector` and `useDispatch` Hook APIs
3. Implementing simplified versions of `useSelector` and `useDispatch`

## Transitioning from HOC to Hooks: The Benefits

Before diving into the implementation, let's understand why React-Redux shifted from the HOC pattern to Hooks.

When using Higher-Order Components like `connect()`, several issues can arise:

### 1. Unclear Data Sources

When a component receives props, it's difficult to distinguish whether these props come from:
- The parent component
- `mapStateToProps` (Redux state)
- `mapDispatchToProps` (Redux actions)
- The HOC's own props

This blending of data sources increases the cognitive load during development and makes the component harder to understand.

### 2. Props Naming Conflicts

If the same prop name appears in multiple sources (parent component, `mapStateToProps`, or `mapDispatchToProps`), they may overwrite each other, leading to unexpected behaviors that are difficult to debug.

### 3. Static Type Checking Challenges

With HOCs, TypeScript has difficulty inferring the correct types for props, especially with complex `connect()` configurations.

In contrast, Hooks offer the following improvements:

### 1. Clear Data Source Distinction

With Hooks, data sources are explicitly defined:
```jsx
// Clearly from Redux state
const counter = useSelector(state => state.counter)
// Clearly for dispatching Redux actions
const dispatch = useDispatch()
// Clearly from parent component
function Counter({ incrementAmount }) {
  // ...
}
```

### 2. Simplified Code

Hooks eliminate the need for declaring `mapStateToProps`, `mapDispatchToProps`, and wrapping components with `connect()`, resulting in cleaner, more readable code.

### 3. Reduced Component Nesting

With multiple HOCs (e.g., `connect()()()...`), debugging becomes challenging as you navigate through multiple layers. Hooks flatten this structure, making debugging easier.

Additionally, since Hooks are simply functions with intuitive input/output patterns, writing tests for them is relatively straightforward.

---

## Understanding useSelector

`useSelector` is a Hook API provided by React-Redux for accessing state from the Redux store. When the selected state changes, it triggers a re-render of the component.

`useSelector` primarily accepts two parameters: a **selector function** and **options**. The selector function retrieves the desired Redux state, while options allow for adjusting certain settings. Typically, only the selector parameter is used.

```jsx
// useSelector API
const selectedState = useSelector(selector, options)

// useSelector API type
type RootState = ReturnType<typeof store.getState>
type SelectorFn = <Selected>(state: RootState) => Selected
type EqualityFn = (a: any, b: any) => boolean
type CheckFrequency = 'never' | 'once' | 'always'

interface UseSelectorOptions {
  equalityFn?: EqualityFn
  stabilityCheck?: CheckFrequency
  noopCheck?: CheckFrequency
}

const result: Selected = useSelector(
  selector: SelectorFn,
  options?: EqualityFn | UseSelectorOptions
)
    
// useSelector examples
export const Counter = () => {
  const counter = useSelector((state) => state.counter)
  return <div>{counter}</div>
}

export const TodoListItem = ({ id }) => {
  const customizedEqual = (oldValue, newValue) => shadowEqual(oldValue, newValue)
  const todoItem = useSelector((state) => state.todos[id], customizedEqual)
  return <div>{todoItem.text}</div>
}
```

It's important to understand the concept that "when the accessed state changes, it triggers a component re-render." Specifically:

1. **First, Redux updates the state**: When an action is dispatched, it triggers the Redux store's update mechanism, updating the store state.

2. **Then, useSelector determines whether to re-render**: When the Redux state changes, `useSelector` compares the previous and current state values. If they differ, it forces a re-render. By default, this comparison uses strict equality (`===`), requiring the references to be identical to be considered the same (and thus not requiring a re-render). Alternatively, you can pass a custom equality function through the options parameter to adjust how state changes are compared.

Note that the default comparison method in the newer `useSelector` differs from the previous `connect` approach:

- useSelector: Uses strict comparison (`===`) by default; triggers a re-render when the references of the new and old selectedState differ.
- connect: Uses shallow comparison (`shallowEqual`) by default; triggers a re-render when the values of the new and old selectedState differ.

This is described in the Redux official documentation:

> useSelector() only forces a re-render if the selector result appears to be different than the last result. The default comparison is a strict === reference comparison. This is different than connect(), which uses shallow equality checks on the results of mapState calls to determine if re-rendering is needed. 

While this difference typically doesn't cause issues when migrating from `connect` HOC to `useSelector`, understanding it ensures correct usage and helps in troubleshooting potential problems.

---

## Implementing a Simplified useSelector

After understanding the `useSelector` API, let's implement a simplified version to better grasp its underlying logic.

Our implementation will focus on the `useSelector(selector, equalityFn)` functionality, noting these key points:

1. The `selector` parameter `(reduxState) => reduxState.xxx` selects the final Redux state to return.
2. We need to trigger a re-render when any Redux store state changes => This requires subscribing to the store and triggering a forceRender when the store state changes.
3. More specifically, we should only re-render when the change in Redux store state affects the state selected by useSelector, avoiding unnecessary renders => This means we need to record the previous state to compare with the new state.
4. The `equalityFn` parameter serves as a function to determine if the new and old states have changed. If not provided, `===` is used by default.

### 1. Creating the Input/Output Interface

- Input: selector and equalityFn
- Output: selectedState

The selector function takes the form `(reduxState) => reduxState.xxx`, and `selector(store.getState())` produces the final `selectedState` to return.

```jsx
/** useSelector.js file **/
import { useContext } from "react";
// ReduxContext was created previously, details can be found in the previous article
import { ReduxContext } from './Provider' 

const useSelector = (
  selector,
  equalityFn
)  => {
  // Get the store from ReduxContext, which provides getState/dispatch methods
  const store = useContext(ReduxContext); 
    
  // Use the selector to select the final Redux State to return
  const selectedState = selector(store.getState());
    
  // Return the selected State
  return selectedState;
}

export default useSelector;
```

### 2. Implementing "Trigger Re-render When Redux State Changes"

When Redux state changes, we need to trigger a re-render. In other words, we use `store.subscribe` to subscribe to `forceRender`, so that when the store state changes, `forceRender` executes.

```jsx
/** useSelector.js file **/
import { 
    useContext, 
    useReducer, 
    useEffect 
} from "react";
import { ReduxContext } from './Provider' 

const useSelector = (
  selector,
  equalityFn
)  => {
  const store = useContext(ReduxContext); 
    
  // Use useReducer to create forceRender for triggering re-renders
  const [, forceRender] = useReducer(s => s + 1, 0);
    
  const selectedState = selector(store.getState());

  useEffect(() => {
    // Using store.subscribe mechanism
    // When an action is dispatched to Redux store, call forceRender
    const unsubscribe = store.subscribe(() => forceRender());
    return unsubscribe;
  }, []);

  return selectedState;
}

export default useSelector;
```

### 3. Implementing "Only Trigger Re-render When Selected State Changes"

We can use `useRef` to keep track of the previous version of `selectedState`, allowing us to compare whether the new and old states have actually changed, and only triggering `forceRender` if there's a change.

```jsx
/** useSelector.js file **/
import { 
    useContext, 
    useReducer, 
    useRef, 
    useEffect 
} from "react";
import { ReduxContext } from './Provider' 

const useSelector = (
  selector,
  equalityFn
)  => {
  const store = useContext(ReduxContext); 
  const [, forceRender] = useReducer(s => s + 1, 0);

  // Use useRef to store the previous selectedState
  const prevSelectedState = useRef(null);
  const selectedState = selector(store.getState());

  // Implement checkForUpdates to check if new and old selectedState differ
  function checkForUpdates() {
    // Get the latest selectedState
    const newSelectedState = selector(store.getState());
    // If new and old selectedState are equal, don't re-render
    if(newSelectedState === prevSelectedState.current) {
        return;
    }
    // If new and old selectedState differ, trigger re-render
    prevSelectedState.current = newSelectedState;
    forceRender();
  }

  useEffect(() => {
    // When an action is dispatched to Redux store, call checkForUpdates
    const unsubscribe = store.subscribe(checkForUpdates);
    return unsubscribe;
  }, []);

  return selectedState;
}

export default useSelector;
```

### 4. Implementing "Use Custom equalityFn to Compare State Changes"

We can use the second parameter, equalityFn, to determine whether the new and old selectedState have changed.

```jsx
/** useSelector.js file **/
import { 
    useContext, 
    useReducer, 
    useRef, 
    useEffect 
} from "react";
import { ReduxContext } from './Provider' 

// Default equalityFn using strict equality mode
const defaultEqualityFn = (a, b) => a === b;

const useSelector = (
  selector,
  // Custom equalityFn can be passed in, defaulting to defaultEqualityFn
  equalityFn = defaultEqualityFn 
)  => {
  const store = useContext(ReduxContext); 
  const [, forceRender] = useReducer(s => s + 1, 0);

  const prevSelectedState = useRef(null);
  const selectedState = selector(store.getState());

  function checkForUpdates() {
    const newSelectedState = selector(store.getState());
     // Use equalityFn to determine if new and old selectedState are equal
     // If equal, don't re-render
    if(equalityFn(newSelectedState, latestSelectedState.current)) {
        return;
    }
    // If not equal, trigger re-render
    prevSelectedState.current = newSelectedState;
    forceRender();
  }

  useEffect(() => {
    // When an action is dispatched to Redux store, call checkForUpdates
    const unsubscribe = store.subscribe(checkForUpdates);
    return unsubscribe;
  }, []);

  return selectedState;
}

export default useSelector;
```

With this, we've completed the core logic of a simplified `useSelector`. Now, let's move on to `useDispatch`.

---

## Understanding useDispatch

`useDispatch` is another Hook API provided by React-Redux that returns the store's `dispatch` method. Through the `dispatch` method, you can send actions to the Redux store, thereby updating the Redux store state.

Using `useDispatch` makes it easier to trigger Redux actions in components without using the connect HOC pattern or other complex methods.

```jsx
// useDispatch API
const dispatch = useDispatch()

// useDispatch API type
interface Dispatch<A extends Action = UnknownAction> {
  <T extends A>(action: T, ...extraArgs: any[]): T
}
const dispatch: Dispatch = useDispatch()

// useDispatch example
export const Counter = ({ value }) => {
  const dispatch = useDispatch()
  const incrementCounter = () => dispatch(
    { type: 'INCREAMENT' }
  )

  return (
    <div>
      <span>{value}</span>
      <button onClick={incrementCounter}>
        Increment counter
      </button>
    </div>
  )
}
```

It's worth noting that as long as the Redux store instance remains the same, the `dispatch` reference will also remain the same. Typically, an application will have just one Provider and create a store once to pass in, so using `dispatch` as a dependency for `useEffect` or other Hooks is safe and won't trigger infinite loops or similar issues.

This is described in the Redux official documentation:

> The dispatch function reference will be stable as long as the same store instance is being passed to the <Provider>. Normally, that store instance never changes in an application.

Now, let's implement a simplified version of `useDispatch`.

---

## Implementing a Simplified useDispatch

Implementing a simplified version of `useDispatch` is quite straightforward. We just need to get the Redux store's dispatch function from the `ReduxContext` and return it.

```jsx
/** useDispatch.js file **/
import { useContext } from "react";
import { ReduxContext } from './Provider';

const useDispatch = () => {
  // Get store from ReduxContext
  const store = useContext(ReduxContext);

  // Return the store's dispatch function
  return store.dispatch;
}

export default useDispatch;
```

In this simplified version of `useDispatch`, we first use `useContext(ReduxContext)` to get the Redux store from `ReduxContext`, then simply return the store's `dispatch` function.

This way, when developers use `useDispatch` in a component, they can extract `dispatch` and send actions to the Redux store without using `connect` with `mapDispatchToProps` to send actions.

When we get the `store` from `ReduxContext`, this `store` comes from the `store` passed by the `Provider`. Typically, a `store` in an app is created only once, through methods like `createStore(...)`, so both `store` and `store.dispatch` are stable and won't randomly change references.

Compared to `useSelector`, the implementation of `useDispatch` is much simpler.

---

## Conclusion: Revisiting our Initial Goals

After reading through the source code of both HOC and Hooks approaches, it's clear that the latter is easier to understand. A key factor is the reduced nesting levels, and Hooks being more pure functions, making them more intuitive to comprehend.

Of course, the actual source code is more complex, and I highly recommend reading it directly if you're interested—it's genuinely more understandable than the HOC approach. Let's revisit our initial goals for this article:

### 1. Understanding Why the Shift from HOC to Hooks and Its Benefits

The transition from HOC to Hooks offers several advantages:

#### Clear Data Source Distinction

With Hooks, there's a clear distinction between "data and methods from parent props" and "data and methods from Redux," resolving issues like "increased cognitive load," "prop naming conflicts leading to overrides," and "mixed types being difficult to define."

#### More Concise Code

Since there's no need to declare or focus on `mapStateToProps` and `mapDispatchToProps`, or use the HOC `connect` to wrap React components, the code becomes more concise and readable.

#### Reduced Component Nesting

Multiple layers of HOC structure can make debugging difficult, such as cases with `connect()()()...` where you need to trace issues layer by layer. Hooks flatten the original multi-layered nesting, reducing debugging complexity.

#### Easier Test Writing

Compared to the HOC pattern, Hooks are simpler function structures, making them relatively easier to test.

### 2. Understanding the useSelector and useDispatch Hook APIs

#### useSelector API

`useSelector` is a Hook API provided by React-Redux for accessing state from the Redux store. When the selected state changes, it triggers a component re-render.

`useSelector` primarily accepts two parameters: a **selector function** and **options**. The selector function retrieves the desired Redux state, while options allow for adjusting certain settings.

```jsx
const selectedState = useSelector(selector, options)
```

#### useDispatch API

`useDispatch` is another Hook API provided by React-Redux that returns the store's `dispatch` method. Through this method, you can send actions to the Redux store, thereby updating the Redux store state.

```jsx
const dispatch = useDispatch()
```

### 3. Implementing Simplified Versions of useSelector and useDispatch

#### Implementing useSelector 

```jsx
/** useSelector.js file **/
import { 
    useContext, 
    useReducer, 
    useRef, 
    useEffect 
} from "react";
import { ReduxContext } from './Provider' 

// Default equalityFn using strict equality mode
const defaultEqualityFn = (a, b) => a === b;

const useSelector = (
  // The selector function responsible for selecting the selectedState
  selector,
  // Custom equalityFn can be passed in, defaulting to defaultEqualityFn
  equalityFn = defaultEqualityFn 
)  => {
  const store = useContext(ReduxContext); 
  // Use useReducer to create forceRender for triggering re-renders at specific times
  const [, forceRender] = useReducer(s => s + 1, 0);

  // Use useRef to store the previous selectedState,
  // for determining if the new and old selectedState have changed
  const prevSelectedState = useRef(null);
  const selectedState = selector(store.getState());

  function checkForUpdates() {
    const newSelectedState = selector(store.getState());
     // Use equalityFn to determine if new and old selectedState are equal
     // If equal, don't re-render
    if(equalityFn(newSelectedState, latestSelectedState.current)) {
        return;
    }
    // If not equal, trigger re-render
    prevSelectedState.current = newSelectedState;
    forceRender();
  }

  useEffect(() => {
    // When an action is dispatched to Redux store, call checkForUpdates
    const unsubscribe = store.subscribe(checkForUpdates);
    return unsubscribe;
  }, []);

  // Return the selected state
  return selectedState;
}

export default useSelector;
```

#### Implementing useDispatch 

```jsx
/** useDispatch.js file **/
import { useContext } from "react";
import { ReduxContext } from './Provider';

const useDispatch = () => {
  // Get store from ReduxContext
  const store = useContext(ReduxContext);

  // Return the store's dispatch function
  return store.dispatch;
}

export default useDispatch;
```

That's all for this article! I hope it's been helpful. If you're interested, feel free to explore the additional references below.

---

#### References
- [Redux Doc Hooks](https://react-redux.js.org/api/hooks)
- [Reat-Redux source code useSelector](https://github.com/reduxjs/react-redux/blob/7.x/src/hooks/useSelector.js)
- [Reat-Redux source code useDispatch](https://github.com/reduxjs/react-redux/blob/7.x/src/hooks/useDispatch.js)
- [The evolution of React APIs and code reuse](https://frontendmastery.com/posts/the-evolution-of-react-patterns/)
- [React-redux | 為了瞭解原理，那就來實作一個 React-redux 吧！](https://medium.com/%E6%89%8B%E5%AF%AB%E7%AD%86%E8%A8%98/developing-react-redux-from-zero-to-one-e27eddfbce39)
- Conversations with [ChatGPT4](https://openai.com/gpt-4)
</rewritten_file>







