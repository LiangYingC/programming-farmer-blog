---
title: "Understanding the Top-Level Rule of React Hooks: Insights from React Hooks Source Code and Data Structures"
date: 2025-02-11
description: The React official documentation clearly states "Only call Hooks at the top level," which extends to various rules when using Hooks, such as not using Hooks in if/else conditions or loops. But why can't we call Hooks in conditions, loops, or other situations? This is actually related to the data structure of React Hooks. This article will explore the reasons behind this rule by examining the React Hooks source code.
tag: React
---

## Introduction: The Rules of Hooks

When reviewing [the Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) in the React official documentation, you'll see an important reminder:

> **Only call Hooks at the top level** 

This short rule is highly relevant to the stability of your React app.

This states that Hooks can only be called at the top level, which may not be easy to understand at first glance. Looking further into this section, you'll find more detailed explanations and examples:

> **Don't call Hooks inside loops, conditions, nested functions, or try/catch/finally blocks.** Instead, always use Hooks at the top level of your React function, before any early returns.

```jsx
/** Simple example **/

function CounterGood() {
  // ✅ Good: top-level in a function component
  const [count, setCount] = useState(0);
  ......
}

function CounterBad() {
  const [isOn, setIsOn] = useState(false)
  // 🔴 Bad: inside a condition (to fix, move it outside!)
  if(isOn){
    const [count, setCount] = useState(0);
    ......
  }
  ......
}
```

From this, we learn that React Hooks cannot be used inside if/else conditions or other block scopes such as loops, nested functions, or try/catch, but only at the top level of a component or custom hook function.

The official documentation is quite clear and lists the scenarios where Hooks should not be used:

![Do not call Hooks rules](/images/articles/react-understand-call-hooks-at-top-level-rule/01.png)
_([Screenshot from React official documentation](https://react.dev/reference/rules/rules-of-hooks#only-call-hooks-at-the-top-level))_

When developing React applications, developers typically use the official [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) linting rules, which automatically prevent developers from writing code that breaks the Hooks rules.

If a developer accidentally places Hooks in an if/else condition, they'll see a warning like "React Hook "useXXX" is called conditionally. React Hooks must be called in the exact same order in every component render".

But why is this the case?

**Why must Hooks be restricted to the top level and not be called in conditions, loops, or similar contexts?**

This must be **related to how Hooks are implemented**, so we'll dive into the React source code. The following sections will cover:

- Finding the data structure of Hooks in the React source code
- Understanding the data structure of Hooks during execution by implementing a simple `useState`
- What problems arise when breaking the "Hooks must be called at the top level" rule
  - What happens if we add conditions when using useState?
  - What happens if we add loops when using useState?
- Conclusion: Remember to call Hooks at the top level

Let's continue with curiosity about this question!

---

## Finding the Implementation and Data Structure of Hooks in React Source Code

Since React is open source, when we have questions about the logic behind Hooks, we can go directly to the official GitHub repo to find the actual code.

The core code for React Hooks is mainly located in the **ReactFiberHooks.js** related files. This section will focus on parts of [React 18.3.1](https://github.com/facebook/react/blob/v18.3.1/packages/react-reconciler/src/ReactFiberHooks.new.js) **ReactFiberHooks.new.js** for our investigation, rather than reviewing the entire source code.

Since the source code is quite complex, we'll focus on `useState` as an example to gradually explore the implementation logic and data structure of Hooks. Readers interested in `useEffect` and other APIs can explore those on their own.

First, searching for the `useState` keyword, we find that there are corresponding functions for Mount (first render), Update (data update), and Rerender (render again), which are `mountState`, `updateState`, and `rerenderState`:

```typescript
// At line 2427
const HooksDispatcherOnMount: Dispatcher = {
  ......,
  useState: mountState,
  ......
};

// At line 2454
const HooksDispatcherOnUpdate: Dispatcher = {
  ......,
  useState: updateState,
  ......
}

// At line 2458
const HooksDispatcherOnRerender: Dispatcher = {
  ......,
  useState: rerenderState,
  ......
}
```

Let's focus on the first `mountState` function to see the core logic or data structure. To focus on the core logic, I've removed the TypeScript content:

```javascript
// At line 1505
function mountState(initialState){
  const hook = mountWorkInProgressHook(); // Most interesting hook data

  // Handle initial value
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;

  // Create update queue
  const queue = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;

  // Create dispatch function, which is the commonly used setState
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ));

  return [hook.memoizedState, dispatch];
}
```

From this code, we find that a key element is how the `hook` data is created and structured. The subsequent logic is mostly about adding more data to the `hook`. The `hook` is created by `mountWorkInProgressHook()`, so let's look at that function:

```javascript
// At line 636
function mountWorkInProgressHook() {
  const hook = {
    memoizedState: null,
    baseState: null,
    baseQueue: null,
    queue: null,
    next: null,
  };

  if (workInProgressHook === null) {
    // This is the first hook in the list
    currentlyRenderingFiber.memoizedState = workInProgressHook = hook;
  } else {
    // Append to the end of the list
    workInProgressHook = workInProgressHook.next = hook;
  }
  return workInProgressHook;
}
```

From the code above, **we can see that a `hook` is an object that contains a `next` property**, which suggests it's a node in a Linked List. We can infer that Hooks data might be stored in a [Linked List](https://en.wikipedia.org/wiki/Linked_list) structure. We can confirm this by examining more code and looking at the `workInProgressHook` data:

```typescript
export type Hook = {|
  memoizedState: any,
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: any,
  next: Hook | null,
|};

// Hooks are stored as a "Linked list" on the fiber's memoizedState field.
// The current hook list is the list that belongs to the current fiber.
// The work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;
```

The source code comments even directly tell us the answer, so we can confirm:

> **Hooks data is stored in a Linked List structure**.

Here's a very concise introduction to Linked Lists:

> **A Linked List is a data structure used to store a sequence of elements**. Each element in the sequence is called a node, and each node references (points to) the next node in the sequence.

Conceptually, it looks something like this, with a key point being that it has order and directionality:

```
head                             tail
 ↓                                ↓
+-----+    +-----+    +-----+    +-----+
|DATA|  -> |DATA|  -> |DATA|  -> |DATA|  -> null
+-----+    +-----+    +-----+    +-----+
  ↑           ↑          ↑          ↑
First node  Second node  Third node  Fourth node                  
```

So when the code below is rendered for the first time:

```jsx
function Counter() {
  const [count, setCount] = useState(0); // Hook1
  const [text, setText] = useState('Count'); // Hook2
  return (
    <div>{text}: {count}</div>
  )
}
```

The data structure of Hooks conceptually looks like this:

```javascript
Hook1 = {
  ......,
  memoizedState: 0, // count state
  next: ---> Hook2 = {
              ......,
              memoizedState: 'Count', // text state
              next: ---> null
            }
}
```

This includes the order and directionality of the Linked List data structure, which is a very important point.

To summarize the most important conclusion at this point: **Hook nodes are stored in a Linked List data structure.**

This structure allows React to **maintain the relationship between Hooks and their corresponding states based on the order of Hook calls during each render** — after creating the Linked List structure during the first render, subsequent update renders simply follow the same order to access this list, ensuring that each Hook can access/update its correct state.

---

## Understanding Hooks Data Structure During Execution by Implementing a Simple useState

Since the React Hooks source code is quite complex, and we now understand the core data structure and implementation concept of Hooks, to better focus on the issue of "why Hooks must be called at the top level," I'll **implement a simple version of `useState` using the Linked List data structure to simulate the creation and update logic of Hooks, making it easier to understand "why Hooks must be called at the top level."**

_p.s. The implementation below is mainly to help understand how Hooks work with Linked List data structures and changes, and doesn't fully correspond to React's actual implementation._

### Implementing useState for the Mount Phase

First, let's implement a `useState` with just the Mount first-render functionality:

```javascript
/** Implementing simple useState with Linked List structure (Mount only)**/

// Current working hook data node pointer, always points to the latest node
let workInProgressHook = null; 

function useState(initialState) {
  // Create hook node, data includes:
  // 1. memoizedState: stored state value
  // 2. next: pointer to the next node
  let hook = { 
    memoizedState: initialState,
    next: null
  };
  
  // Logic for first useState call:
  // Initialize current work node to the latest hook, no need to specify next yet
  if (workInProgressHook === null) { 
    workInProgressHook = hook; 
  } else { 
  // Logic for subsequent useState calls:
  // 1. Point the current work node's next to the newly created hook
  // 2. Set the current work node to the newly created hook
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }

  return [hook.memoizedState]; // Update (setState) functionality not yet implemented
}

export default useState;
```

The usage is the same as React's `useState`, but since we've simplified the logic of `useState`, it's easier to understand "how `useState` actually works when executed."

Here's a simple implementation of a `Counter` component. Try to mentally trace through the flow of `useState` operations during the rendering of `Counter` and the resulting Hooks data structure after rendering:

```jsx
import useState from './simpleUseState.js';

function Counter() {
  const [isShowText] = useState(false); // Hook1
  const [text] = useState('Count'); // Hook2
  const [count] = useState(0); // Hook3
  return (
    <div>
      <div>
        {isShowText && `${text}: `}{count}
      </div>
      ......
    </div>
  )
}
```

The flow of `useState` operations during rendering:
- Hook1 `useState` (isShowText) executes
  - Creates hook1 node, `memoizedState` is false, `next` is null
  - `workInProgressHook` is set to hook1
- Hook2 `useState` (text) executes
  - Creates hook2 node, `memoizedState` is 'Count', `next` is null
  - **workInProgressHook(hook1)'s next points to hook2**, then `workInProgressHook` is set to hook2
- Hook3 `useState` (count) executes
  - Creates hook3 node, memoizedState is 0, next is null
  - **workInProgressHook(hook2)'s next points to hook3**, then `workInProgressHook` is set to hook3

The Linked List data structure after rendering conceptually looks like this:

![Simple useState mounted](/images/articles/react-understand-call-hooks-at-top-level-rule/02.png)
_(Hooks Linked List data structure concept after Mount)_

If you haven't yet understood the concepts and code above, I recommend going back and reviewing them until you do, as we're about to move from the "Mount" phase to the "Update" phase, which will be more complex.

### Adding the Update Mechanism to useState

Before modifying the `useState` code, let's recall the basic logic of React's state update mechanism:
1. After Hook1's `useState` executes, it returns a `setState` API, allowing Hook1 to update its `state`
2. When Hook1's `setState` executes, it updates Hook1's `state`, but **doesn't affect Hook2 or Hook3's `state`**; in other words, Hook2 and Hook3's `state` need to maintain their previous results.
3. After the `state` updates, the component re-renders.

From this logic, we can identify something important: **we need to record the previous Hooks results**. This allows us to ensure that when updating Hook1's `state`, Hook2 and Hook3's states remain their previous `state` values.

Therefore, we need to add the following data and logic:
1. Add `storedHook`: to save the Hooks results from the previous render.
2. Add `firstWorkInProgressHook`: to save the first node of `workInProgressHook`, making it easier to assign the initial node to `storedHook`. The implementation logic below will make this clearer.
3. Add logic to handle the "Update" flow, which needs to be distinguished from "Mount"

```javascript
/** Implementing simple useState with Linked List structure (with Mount and Update) **/

let workInProgressHook = null; // Current working hook linked list data
let firstWorkInProgressHook  = null; // Save the first node of workInProgressHook
let storedHook = null; // Save the hook linked list data from the previous render
 
function useState(initialState) {
  let hook;

  // Check if it's the Mount or Update phase
  const isMounted = storedHook === null 

  // Mount flow: assign brand new data to hook
  if(isMounted) { 
    hook = {
      memoizedState: initialState,
      next: null
    };
  } else {
  // Update flow: reuse state from the previous render's hook
    hook = {
      memoizedState: storedHook.memoizedState,
      next: null
    };
    // After processing this node, move to the next node
    storedHook = storedHook.next;
  }

  if (workInProgressHook === null) { 
    workInProgressHook = hook; 
    // Set firstWorkInProgressHook
    firstWorkInProgressHook = hook;
  } else { 
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }

  // setState implementation
  const setState = (newState) => {
    // Update hook's memoizedState
    hook.memoizedState = typeof newState === 'function' 
    ? newState(hook.memoizedState) 
    : newState;

    // Store this round's hook linked list for the next render
    storedHook = firstWorkInProgressHook;

    // Reset the current working hook linked list before re-rendering
    workInProgressHook = null;
    firstWorkInProgressHook = null;

    // Assuming this would trigger a re-render, causing the component to execute again for the next render
    console.log('State updated, would trigger re-render component.');
  };

  return [hook.memoizedState, setState]; 
}

export default useState;
```

Now our `useState` provides `setState` functionality to update Hook data. It can be used like this:

```jsx
import useState from './simpleUseState.js';

function Counter() {
  const [isShowText, setIsShowText] = useState(false); // Hook1
  const [text, setText] = useState('Count'); // Hook2
  const [count, setCount] = useState(0); // Hook3
  return (
    <div>
      <div>
        {isShowText && `${text}: `}{count}
      </div>
      {/* Update data using setIsShowText */}
      <button onClick={() => setIsShowText(prev => !prev)}> 
        {isShowText ? 'Hide Label' : 'Show Label'}
      </button>
      ......
    </div>
  )
}
```

Now let's think about how the program works, analyzing step by step what happens during the transition from Mount to Update phase and the conceptual structure of the Hooks data.

Let's start with the simpler **Mount** phase. The most obvious difference is the addition of `firstWorkInProgressHook`:

【First Render **Mount Flow**】
- Hook1 `useState` (isShowText) executes
  - Creates hook1 node, enters Mount logic, `memoizedState` is false; `next` is null
  - At this point `workInProgressHook` is null, so `workInProgressHook` is set to hook1, and `firstWorkInProgressHook` is also set to hook1
- Hook2 `useState` (text) executes
  - Creates hook2 node, enters Mount logic, `memoizedState` is 'Count'; `next` is null
  - **workInProgressHook(hook1)'s next points to hook2**, then `workInProgressHook` is set to hook2
- Hook3 `useState` (count) executes
  - Creates hook3 node, enters Mount logic, `memoizedState` is 0; `next` is null
  - **workInProgressHook(hook2)'s next points to hook3**, then `workInProgressHook` is set to hook3

![Simple useState mounted with firstWorkInProgressHook data](/images/articles/react-understand-call-hooks-at-top-level-rule/03.png)
_(Hooks data structure concept after Mount, firstWorkInProgressHook points to the first node)_

Now let's explore the relatively more complex **Update** flow. Each step will include a conceptual diagram of the Hooks data structure:

【When the user clicks the button, triggering `setIsShowText(prev => !prev)` **Update Flow**】
- Hook1's `setState` executes
  - Changes hook1's `memoizedState` from false to true
  - Sets `storedHook` to `firstWorkInProgressHook`, storing the Hooks from the previous render, **note that the stored previous render Hooks only contain Hook1 and Hook3 nodes, not Hook2**
  - Resets `workInProgressHook` and `firstWorkInProgressHook` to null in preparation for re-rendering
  - Triggers re-render, re-executing the component logic!

![Simple useState updated zero step](/images/articles/react-understand-call-hooks-at-top-level-rule/04.png)
_(Hooks data concept after `setState` execution, working Hooks are cleared, and previous Hooks structure is stored)_

From the data concept diagram, we can see: the working Hooks are cleared, with `firstWorkInProgressHook` and `workInProgressHook` pointing to null; meanwhile, a set of stored Hooks has been created to preserve the previous render's Hooks, with `storedHook` pointing to the head of the stored Hooks. Now let's move to the execution of the first `useState`:

- Hook1 `useState`(isShowText) executes
  - Creates hook1, since `storedHook` is not null, enters Update flow
  - Sets hook1's `memoizedState` to `storedHook.memoizedState`
  - Sets `storedHook` to `storedHook.next`, **meaning storedHook data changes from the previous round's hook1 to the previous round's hook3, note that "storedHook points to hook3 instead of hook2, because hook2 doesn't exist in the previous render"**
  - At this point `workInProgressHook` is null, so `workInProgressHook` is set to hook1, and `firstWorkInProgressHook` is also set to hook1

![Simple useState updated 1st step](/images/articles/react-understand-call-hooks-at-top-level-rule/05.png)
_(Hooks data concept after the first isShowText useState execution)_

From the data concept, we can see: the working Hooks have created a Hook1 node, pointed to by both `firstWorkInProgressHook` and `workInProgressHook`; meanwhile, `storedHook` now points to the stored Hook3 node. Now let's move to the execution of the second `useState`:

- Hook2 `useState` (text) executes
  - Creates hook2, since `storedHook` is not null, enters Update flow
  - Sets hook2's `memoizedState` to `storedHook.memoizedState`
  - Sets `storedHook` to `storedHook.next`, **meaning storedHook data changes from the previous round's hook3 to the previous round's null tail**
  - **workInProgressHook(hook1)'s next points to hook2**, then `workInProgressHook` is set to hook2

![Simple useState updated 2nd step](/images/articles/react-understand-call-hooks-at-top-level-rule/06.png)
_(Hooks data concept after the second text useState execution)_

From the data concept, we can see: the working Hooks have created a Hook2 node, pointed to by `workInProgressHook`; meanwhile, `storedHook` now points to null, meaning there are no more stored Hooks.

Through the Hooks data structure concept diagrams after each step, we can better understand the current state of the data. However, so far we've only been showing what happens when Hooks are "correctly used." This seems normal, but what problems would arise if we don't call Hooks at the top level?

---

## What Problems Arise When Breaking the "Hooks Must Be Called at the Top Level" Rule

Now that we understand the data structure of Hooks and how the data changes during execution, let's move on to the more interesting part: what happens when we break the rules for using Hooks?

### What Happens if We Add Conditions When Using useState?

Let's use the following incorrect code as an example to see what problems arise during execution. We'll **focus on what happens when we add conditions to useState**:

```jsx
import useState from './simpleUseState.js';
import ToggleButton from './ToggleButton.js';

function Counter() {
  const [isShowText, setIsShowText] = useState(false); // Hook1

  /** Hook incorrectly added with condition **/
  if(isShowText) {
    const [text, setText] = useState('Count'); // Hook2
    return (
      <div>
        <div>{text}</div>
        <ToggleButton 
          label='Show Count'
          onClick={() => setIsShowText(prev => !prev)} 
        />
        ......
      </div>
    )
  }

  const [count, setCount] = useState(0); // Hook3
  return (
    <div>
      <div>{count}</div>
      <ToggleButton 
        label='Show Text'
        onClick={() => setIsShowText(prev => !prev)} 
      />
      ......
    </div>
  )
}
```

The key point is that **Hook2 (text variable) won't be created during the Mount phase, it will be skipped!**

【First Render **Mount Flow**】
- Hook1 `useState` (isShowText) executes
  - Creates hook1 node, enters Mount logic, `memoizedState` is false; `next` is null
  - At this point `workInProgressHook` is null, so `workInProgressHook` is set to hook1, and `firstWorkInProgressHook` is also set to hook1
- "**Because isShowText is false, Hook2** `useState` (text) **execution is skipped**"
- Hook3 `useState` (counte) executes
  - Creates hook3 node, enters Mount logic, `memoizedState` is 0; `next` is null
  - **workInProgressHook(hook1)'s next points to hook3**, then `workInProgressHook` is set to hook3

After Mount, the Hooks data structure concept looks like this:

![useState within confitions after mounted](/images/articles/react-understand-call-hooks-at-top-level-rule/08.png)
_(Hooks concept after Mount when Hook2 useState is placed in if/else, Hook2 node is not created)_

No problems have occurred during the Mount phase. However, what happens when we move to the Update phase? Will any problems occur?

【When the user clicks the button, triggering `setIsShowText(prev => !prev)` **Update Flow**】
- Hook1's `setState` executes
  - Changes hook1's `memoizedState` from false to true
  - Sets `storedHook` to `firstWorkInProgressHook`, storing the Hooks from the previous render, **note that the stored previous render Hooks only contain Hook1 and Hook3 nodes, not Hook2**
  - Resets `workInProgressHook` and `firstWorkInProgressHook` to null in preparation for re-rendering
  - Triggers re-render, re-executing the component logic!

![useState within confitions after mounted](/images/articles/react-understand-call-hooks-at-top-level-rule/09.png)
_(Hooks concept after Hook1 setState)_

After completing the first step of `setState` update, the Hooks data still hasn't shown any obvious problems. Now let's move to the execution of Hook1:

- Hook1 `useState` (isShowText) executes
  - Creates hook1, since `storedHook` is not null, enters Update flow
  - Sets hook1's `memoizedState` to `storedHook.memoizedState`
  - Sets `storedHook` to `storedHook.next`, **meaning storedHook data changes from the previous round's hook1 to the previous round's hook3, note that "storedHook points to hook3 instead of hook2, because hook2 doesn't exist in the previous render"**
  - At this point `workInProgressHook` is null, so `workInProgressHook` is set to hook1, and `firstWorkInProgressHook` is also set to hook1

![useState within confitions after first useState executed again](/images/articles/react-understand-call-hooks-at-top-level-rule/10.png)
_(Hooks concept after Hook1 useState executes again)_

As a reminder, the most important thing to note in this step is: `storedHook` **now points to the Hook3 data node! Not the Hook2 data node, because the Hook2 data node hasn't been created yet!** Next, we'll move to the Hook2 `useState` execution:

- **Because isShowText is true, Hook2 (text)** `useState` **will execute, but a problem will occur!**
  - Creates hook2, since `storedHook` is not null, enters Update flow
  - Sets hook2's `memoizedState` to `storedHook.memoizedState`, at this point storedHook is the previous round's hook3 => **Problem occurs! This means Hook2 (text)'s data will be incorrectly set to Hook3 (count)'s data 0**
  - Sets `storedHook` to `storedHook.next`, meaning storedHook data changes from the previous round's hook3 to the previous round's null tail
  - workInProgressHook(hook1)'s next points to this round's newly created hook2, then `workInProgressHook` is set to hook2

![useState within confitions after first useState executed again](/images/articles/react-understand-call-hooks-at-top-level-rule/11.png)
_(Hooks concept after Hook2 useState executes again)_

At this step, we can see a major problem: **Since the Mount phase didn't have a Hook2(text) node, only a Hook3(count) node, during the Update phase, Hook2(text)'s data is directly set to the Mount phase's Hook3(count) data**, causing what should be `'Count'` to become `0`.

Through this example simulating React Hooks creation and update, we can understand **why Hooks can't be placed in conditions**:

> Because React Hooks are stored sequentially in a Linked List structure, if certain Hooks are skipped during the Mount phase due to conditional logic, it will **lead to inconsistency in the Hook node order during the Update phase, causing incorrect mapping of state data** and producing serious bugs.

Of course, I've only simulated a very basic concept of React Hooks here. In reality, React does much more complex processing logic and rendering flow, but in terms of the most important data logic and concepts, this explanation adequately represents "why Hooks have the rule that they can't be placed in conditions."

#### What Happens if We Add Loops When Using useState?

Once we understand the data logic and structure of React Hooks implementation, we can understand more rules related to "Hooks must be called at the top level," such as **not being able to place React Hooks in loops**.

Let's again use our simple version of `useState` to write some incorrect code, placing `useState` inside a loop:

```jsx
import useState from './simpleUseState.js';

function TodoList() {
  const [todos, setTodos] = useState(['Task 1', 'Task 2']); // Hook1

  /** Hook incorrectly placed in a loop **/
  todos.map((todo) => {
    // Will generate (todos.length - 1) Hooks
    // Generated Hook2, Hook3 after mounted
    const [isDone, setIsDone] = useState(false); // Hook2, Hook3
    return (
      <div>
        <span style={{ textDecoration: isDone ? 'line-through' : 'none' }}>
          {todo}
        </span>
        <button onClick={() => setIsDone(prev => !prev)}>
          {isDone ? 'Undo' : 'Done'}
        </button>
      </div>
    )
  })

  const [newTodo, setNewTodo] = useState(''); // Hook4 after mounted
  return (
    <div>
      <input
        value={newTodo}
        onChange={(e) => setNewTodo(e.target.value)}
      />
      <button onClick={() => {
        setTodos(prev => [...prev, newTodo]);
        ......
      }}>
        Add Todo
      </button>
    </div>
  )
}
```

In this code logic, we can observe a key point: **the number of Hooks is determined by the length of Todos, so it's a variable state**. This logic is quite important; keep it in mind.

Since we've already discussed many `useState` execution steps, I won't detail the Mount steps; let's go straight to the Hooks data structure concept after **Mount**:

![useState within loop after mount](/images/articles/react-understand-call-hooks-at-top-level-rule/12.png)
_(Hooks concept after Mount when useState is placed in a loop)_

We can see that because there are currently two Todos, after the `map` loop completes, two Hooks nodes are generated.

During the Mount phase, no obvious problems have occurred yet. Problems will arise during the Update phase, for example, when adding a new Todo item:

【When the user triggers `setTodos(prev => [...prev, newTodo])` **Update Flow**】

- Hook1's `setState` executes
  - Changes hook1's `memoizedState` from ['Task 1', 'Task 2'] to ['Task 1', 'Task 2', 'Task 3']
  - Sets `storedHook` to `firstWorkInProgressHook`
  - Resets `workInProgressHook` and `firstWorkInProgressHook` to null in preparation for re-rendering
  - Triggers re-render, re-executing the component logic!

![useState within loop after setState executed](/images/articles/react-understand-call-hooks-at-top-level-rule/13.png)
_(Hooks concept after adding a new Todo item and setState execution)_

Next, the re-rendering execution logic begins. During re-rendering, because the Todos array has an additional element, the loop will execute one more time, which will cause a serious problem:

- Hook1 `useState` (todos) executes: smoothly updates, refer to previous cases if you're unsure about the steps

![useState within loop after useState executed](/images/articles/react-understand-call-hooks-at-top-level-rule/14.png)
_(Hooks concept after the first useState for todos data executes again)_


- "Because there are now three elements in Todos, `map` will execute `useState` three times! This is inconsistent with the previous two executions of `useState`, causing problems!"
  - First loop iteration: This round's hook2 (isDone) correctly uses data from `storedHook`'s hook2 (isDone), no problem
  - Second loop iteration: This round's hook3 (isDone) correctly uses data from `storedHook`'s hook3 (isDone), no problem
  - Third loop iteration: This round's hook4 (isDone) will incorrectly use data from `storedHook`'s hook4 (newTodo), error occurs! **This causes the new round's hook4 isDone to incorrectly use newTodo's data**! 

![useState within loop after useState executed](/images/articles/react-understand-call-hooks-at-top-level-rule/15.png)
_(Hooks concept after multiple isDone useState in the loop execute again)_

Now we can see that placing Hooks in a `map` or other loop structure will indeed cause major problems.

> Because React Hooks are stored in a Linked List structure sequentially, if Hooks are used in loops, the number of Hook nodes generated during each render will vary based on the loop iteration count. This will **lead to a mismatch in the number of Hook nodes produced in the new render round compared to the previous one, breaking the correspondence between Hooks** and causing serious bugs.

By the way, if we want to rewrite this code to avoid problems, we can take a few approaches:

- Method 1: Try to encapsulate the `isDone` data directly in `todos`, so each `todo` has its own `isDone` property, eliminating the need for a separate `useState` declaration for `isDone`
- Method 2: Try to extract a Todo component and declare the useState with `isDone` data at the top level of the new component, which would comply with the rule of using Hooks at the top level of components.

This section has only focused on the "conditions" and "loops" aspects of "Do not call Hooks inside conditions or loops." However, many other related rules are also related to the data logic concept of React Hooks, such as "Do not call Hooks inside try/catch/finally blocks" and "Do not call Hooks in event handlers," which are listed in the React official documentation. If you're interested, you can extend the same concepts to think about these cases.

---

## Conclusion: Remember to Call Hooks at the Top Level

Through this article's exploration of the data concept and logic of React Hooks implementation, we can better understand why the React official documentation emphasizes the "Only call Hooks at the top level" rule. It is indeed related to the implementation logic behind React Hooks. Here are some key conclusions:

- **React Hooks Data Structure**
  - Hooks use a Linked List structure to store state
  - Each Hook is conceptually a node in the Linked List
  - Hook nodes are connected through the `next` pointer, forming an ordered data structure
- **Why Can't We Use Hooks in Conditions?**
  - Conditional judgments might cause some Hook nodes to be skipped during first render, not being created
  - Due to the sequential nature of the Hooks data structure, this will cause confusion in the Hook correspondence during subsequent updates
  - Eventually, Hook states in conditionals might be assigned incorrect values, creating unpredictable bugs
- **Why Can't We Use Hooks in Loops?**
  - The number of Hooks in loops might change with the iteration count
  - This dynamic change in Hook quantity breaks the stability of the Linked List
  - Eventually, some Hook states might be incorrectly mapped to other Hook data, creating unpredictable bugs

Overall, this understanding process not only satisfies curiosity about the underlying principles but also helps developers better understand the design and limitations of data logic. When encountering similar data logic or implementations in the future, developers can quickly recognize what limitations exist.

However, in practical development, as long as you properly use the ESLint rule `eslint-plugin-react-hooks`, you can detect problems during the development phase and avoid violating this rule that requires calling Hooks at the top level. So using ESLint fully is very important. Remember to include Lint jobs in the CICD items that must run before each release to ensure that all code from the project's developers is constrained within these rules.

---

#### References

- [Rules of Hooks| React Official Document](https://react.dev/reference/rules/rules-of-hooks)
- [React Source Code v18.3.1 | ReactFiberHooks.new.js](https://github.com/facebook/react/blob/v18.3.1/packages/react-reconciler/src/ReactFiberHooks.new.js)
- [React hooks: not magic, just arrays](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)
- [Rules of ESLint | eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [Wiki | Linked List](https://en.wikipedia.org/wiki/Linked_list)