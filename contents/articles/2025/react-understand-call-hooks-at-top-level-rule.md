---
title: 從 React Hook 原始碼的實作與資料結構，探討為何 Hooks 須在最頂層呼叫
date: 2025-02-11
description: React 官方文件中，有條規則明確寫著 "Only call Hooks at the top level"，延伸來說有不少使用 Hooks 的注意事項，例如：不要在 if/else conditions 或 loop 中使用 Hooks。然而，為什麼不能在 conditions, loop 等等情況中呼叫 Hooks 呢？這背後其實與 React Hooks 的資料結構有關，本文將試著閱讀 React Hooks 原始碼來探討這項規則的原因。
tag: React
---

## 前言：關於 Hooks 的規則

當翻閱 React 官方文件中[關於 Hooks 規則](https://react.dev/reference/rules/rules-of-hooks)時，會看到一句很重要的提醒：

> **Only call Hooks at the top level** 

短短一條規則，卻與 React App 的穩定性高度相關。

這說明只能在最頂層呼叫 Hooks，單看這句話並不是很容易理解，不過如果往該段落探詢，會發現有更詳細的解釋和範例：

> **Don’t call Hooks inside loops, conditions, nested functions, or try/catch/finally blocks.** Instead, always use Hooks at the top level of your React function, before any early returns.

```jsx
/** 簡單示意 **/

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

從這些內容中，可以得知 React Hooks 並不能在 if/else conditions 中使用，或其他的 block scope 中，例如：loop, nested function, try/catch 等等，只能在 component 或 custom hook function 中的最頂層使用。

官方文件其實寫得算清楚，有盡量把不能用的情境條列出來：

![Do not call Hooks rules](/images/articles/react-understand-call-hooks-at-top-level-rule/01.png)
_([截圖來自 React 官方文件](https://react.dev/reference/rules/rules-of-hooks#only-call-hooks-at-the-top-level))_

其實開發 React App 時，通常會採用官方維護的 [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) lint 規則，會自動地避免開發者撰寫出破壞 Hooks 規則的程式碼。

如果開發者不小心把 Hooks 寫在 if/else condition 中會看到類似 “React Hook "useXXX" is called conditionally. React Hooks must be called in the exact same order in every component render” 的警告。

然而究竟是為什麼呢？

**為什麼 Hooks 必須被限制在最頂層呼叫而不能在 conditions, loop 等情境中呼叫？**

這背後必然**與 Hooks 的實作方式有所關聯**，因此將進入 React 原始碼的查找階段，預計後續段落包含：

- 從 React 原始碼找出 Hooks 的資料結構
- 透過實作簡易 `useState` 理解 Hooks 執行時的資料結構
- 破壞「Hooks 須在最頂層呼叫」的規則，會產生什麼問題
  - 如果在使用 useState 時，加上 conditions 會發生什麼事情？
  - 如果在使用 useState 時，加上 loops 會發生什麼事情？
- 總結：使用 Hooks 請記得在最頂層呼叫

讓我們帶著對這個問題的好奇心，繼續看下去！

---

## 從 React 原始碼找出 Hooks 的實作和資料結構

由於 React 是公開原始碼，當對於 Hooks 背後設計的邏輯有疑問時，能直接到官方 Github repo 上面找實際程式碼。

關於 React Hooks 核心的程式碼大概位於 **ReactFiberHooks.js** 相關檔案中，本段會以 [React 18.3.1](https://github.com/facebook/react/blob/v18.3.1/packages/react-reconciler/src/ReactFiberHooks.new.js) **ReactFiberHooks.new.js** 中部分相關的程式碼做示意探討，並不會閱覽全部的原始碼。

由於原始碼蠻複雜，在此會專注以 `useState` 作為範例一步步地探討 Hooks 的實作邏輯和資料結構，至於 `useEffect` 等等其他 APIs 有興趣的讀者可以自行閱覽。

首先，先搜尋 `useState` 關鍵字，會發現分別在 Mount（首次渲染）, Update（更新資料）以及 Rerender（再次渲染）都有對應的函式，分別是 `mountState`, `updateState` 以及 `rerenderState`：

```typescript
// 位於 2427 行
const HooksDispatcherOnMount: Dispatcher = {
  ......,
  useState: mountState,
  ......
};

// 位於 2454 行
const HooksDispatcherOnUpdate: Dispatcher = {
  ......,
  useState: updateState,
  ......
}

// 位於 2458 行
const HooksDispatcherOnRerender: Dispatcher = {
  ......,
  useState: rerenderState,
  ......
}
```

繼續聚焦第一個 `mountState` 的函式中，看看核心邏輯或資料結構是什麼。為了專注在閱讀核心邏輯，我有把 TypeScript 的內容先刪掉：

```javascript
// 位於 1505 行
function mountState(initialState){
  const hook = mountWorkInProgressHook(); // 最關注的 hook 資料

  // 處理傳入的初始值
  if (typeof initialState === 'function') {
    initialState = initialState();
  }
  hook.memoizedState = hook.baseState = initialState;

  // 建立更新佇列
  const queue = {
    pending: null,
    lanes: NoLanes,
    dispatch: null,
    lastRenderedReducer: basicStateReducer,
    lastRenderedState: initialState,
  };
  hook.queue = queue;

  // 建立 dispatch 函式，也就是常用的 setState
  const dispatch = (queue.dispatch = dispatchSetState.bind(
    null,
    currentlyRenderingFiber,
    queue,
  ));

  return [hook.memoizedState, dispatch];
}
```

從這段程式碼中，能發現很關鍵的是 `hook` 這筆資料的創建方式和結構，後續的邏輯其實都是把更多資料結果塞進去 `hook` 中，而 `hook` 是由 `mountWorkInProgressHook()` 建立，於是繼續查找 `mountWorkInProgressHook`：

```javascript
// 位於 636 行
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

上述程式碼中，**能看出 `hook` 是個物件，並含有 `next` 等資料**，似乎是 Linked List 中的節點，能推測 Hooks 資料可能以 [Linked List](https://en.wikipedia.org/wiki/Linked_list) 的結構儲存，當然能繼續追查程式碼藉此確定結果，進一步查找 `workInProgressHook` 資料就會發現啦：

```typescript
export type Hook = {|
  memoizedState: any,
  baseState: any,
  baseQueue: Update<any, any> | null,
  queue: any,
  next: Hook | null,
|};

// Hooks are stored as a “Linked list” on the fiber's memoizedState field.
// The current hook list is the list that belongs to the current fiber.
// The work-in-progress hook list is a new list that will be added to the
// work-in-progress fiber.
let currentHook: Hook | null = null;
let workInProgressHook: Hook | null = null;
```

甚至在原始碼註解中都直接告訴我們答案，這時能確定：

> **Hooks 儲存的資料型態是 Linked List**。

這邊用非常簡潔的方式介紹 Linked List:

> **Linked List 是種用於儲存元素序列的資料結構**。元素序列中的每個元素稱為節點，每個節點都會參考（指向）序列中的下一個節點。

概念圖示化大概長這樣，有個重點是它是有順序以及指向性：

```
head                             tail
 ↓                                ↓
+-----+    +-----+    +-----+    +-----+
|DATA|  -> |DATA|  -> |DATA|  -> |DATA|  -> null
+-----+    +-----+    +-----+    +-----+
  ↑           ↑          ↑          ↑
第一個節點  第二個節點   第三個節點   第四個節點                  
```

所以當下面的程式碼首次渲染時：

```jsx
function Counter() {
  const [count, setCount] = useState(0); // Hook1
  const [text, setText] = useState('Count'); // Hook2
  return (
    <div>{text}: {count}</div>
  )
}
```

Hooks 的資料結構概念上是長這樣：

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

這其中就包含了 Linked List 資料結構的順序指向性，這算是非常重要的一點。

到此先整理最重要的結論：**Hook 會以物件節點的形式被儲存於 Linked List 的資料結構中。** 

這種結構算是能讓 React 在**每次渲染時依照 Hooks 的呼叫順序來維持它們與對應狀態的關係** —— 當首次渲染時建立 Linked List 結構後，後續的更新渲染只要依照相同的順序訪問這個 list，就能確保每個 Hook 都能存取/更新到自己正確的狀態。

---

## 透過實作簡易 useState 理解 Hooks 執行時的資料結構

由於 React Hooks 原始碼整體較複雜，加上已得知核心的 Hooks 資料結構和實作概念，為了方便聚焦討論「為何 Hooks 須在最頂層呼叫」的議題，接著**用 Linked List 的資料結構，實作簡單版本的 `useState` 來模擬 Hooks 的創建與更新邏輯，藉此更簡單直觀地討論「為何 Hooks 須在最頂層呼叫」**。

_p.s. 以下的實作主要是為了幫助理解 Hooks 以 Linked List 運作的資料結構和變化，並非完全對應 React 本身的實際實作。_

### 實作 Mount 階段的 useState

首先實作僅含有 Mount 首次渲染功能的 `useState`:

```javascript
/** 透過 Linked List 結構實作簡單 useState (僅有 Mount)**/

// 當前正在工作的 hook 資料節點指標，始終指向最新的節點
let workInProgressHook = null; 

function useState(initialState) {
  // 創建 hook 節點，資料包含：
  // 1. memoizedState: 儲存的狀態值
  // 2. next: 指向下個節點的指標
  let hook = { 
    memoizedState: initialState,
    next: null
  };
  
  // 首次呼叫 useState 時的邏輯：
  // 初始化當前工作節點為最新的 hook，但尚無須指定 next
  if (workInProgressHook === null) { 
    workInProgressHook = hook; 
  } else { 
  // 後續呼叫 useState 時的邏輯：
  // 1. 將當前工作節點的 next 指向最新創建的 hook
  // 2. 設定當前工作節點為最新創建的 hook
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }

  return [hook.memoizedState]; // 尚未實作 Update aka setState 功能
}

export default useState;
```

使用方式跟 React 的 `useState` 一樣，但由於簡化了 `useState` 的邏輯，所以更好理解「實際執行 `useState` 時程式碼運作」。

下面簡單實作 `Counter` 元件，可以在腦中思考渲染 `Counter` 時的 `useState` 的運作流程和渲染後的 Hooks 資料結構：

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

渲染時 `useState` 的運作流程：
- Hook1 `useState` (isShowText) 執行
  - 創建 hook1  節點，`memoizedState` 為 false, `next` 為 null
  - `workInProgressHook` 設定為 hook1
- Hook2 `useState` (text) 執行
  - 創建 hook2 節點，`memoizedState` 為 'Count', `next` 為 null
  - **workInProgressHook(hook1) 的 next 指向 hook2**，接著 `workInProgressHook` 設定成 hook2
- Hook3 `useState` (count) 執行
  - 創建 hook3 節點，memoizedState 為 0, next 為 null
  - **workInProgressHook(hook2) 的 next 指向 hook3**，接著 `workInProgressHook` 設定成 hook3

渲染後的 Linked List 資料結構概念大概是長這樣：

![Simple useState mounted](/images/articles/react-understand-call-hooks-at-top-level-rule/02.png)
_(Mount 後的 Hooks Linked List 資料結構概念圖)_

如果目前還沒理解上述概念與程式碼的話，建議回頭多看幾次弄懂，因為接下來將從「Mount」進入到「Update」的階段，會更複雜些。

### 替 useState 加上 Update 的機制

在改動 `useState` 程式碼前，先來回憶 React State 更新機制大概的邏輯：
1. Hook1 的 `useState` 執行後，會回傳 `setState` API，藉此讓 Hook1 能更新 `state`
2. Hook1 的 `setState` 執行後，會更新 Hook1 的 `state` ，但是**不會改動到 Hook2, Hook3 的 `state`**; 換句話說，Hook2, Hook3 的 `state` 需要維持先前的結果。
3. `state` 更新後會接著 re-render 元件。

在這些邏輯中，可以發現一件蠻重要的事情就是: **需要紀錄先前的 Hooks 結果**，這樣才能在更新 Hook1 `state` 時確保 Hook2, Hook3... 的 state 依然是先前的 `state`。

因此需要新增的資料和邏輯包含：
1. 新增 `storedHook`：保存上次渲染的 Hooks 結果。
2. 新增 `firstWorkInProgressHook`：保存 `workInProgressHook` 首個節點，方便賦予 `storedHook` 最初節點，看下方實作邏輯會更明白。
3. 新增處理「Update」流程的邏輯，需要和 「Mount」做區分

```javascript
/** 用 Linked List 結構實作簡單 useState(有 Mount 與 Update) **/

let workInProgressHook = null; // 當前正在工作的 hook linked list 資料
let firstWorkInProgressHook  = null; // 保存 workInProgressHook 的第一個節點
let storedHook = null; // 保存上次渲染的 hook linked list 資料
 
function useState(initialState) {
  let hook;

  // 檢查是 Mount or Update 階段
  const isMounted = storedHook === null 

  // Mount 流程: 賦予 hook 全新的資料
  if(isMounted) { 
    hook = {
      memoizedState: initialState,
      next: null
    };
  } else {
  // Update 流程: 從前次渲染的 hook 複用狀態
    hook = {
      memoizedState: storedHook.memoizedState,
      next: null
    };
    // 處理完這次節點後，需往下個節點前進
    storedHook = storedHook.next;
  }

  if (workInProgressHook === null) { 
    workInProgressHook = hook; 
    // 設定 firstWorkInProgressHook
    firstWorkInProgressHook = hook;
  } else { 
    workInProgressHook.next = hook;
    workInProgressHook = hook;
  }

  // setState 實作
  const setState = (newState) => {
    // 更新 hook 的 memoizedState
    hook.memoizedState = typeof newState === 'function' 
    ? newState(hook.memoizedState) 
    : newState;

    // 儲存本輪的 hook linked list，供下一輪渲染使用
    storedHook = firstWorkInProgressHook;

    // 重新渲染前，先把正在處理中的 hook linked list 重置
    workInProgressHook = null;
    firstWorkInProgressHook = null;

    // 假設會觸發重新渲染，讓元件再次執行，進入下一輪渲染
    console.log('State updated, would trigger re-render component.');
  };

  return [hook.memoizedState, setState]; 
}

export default useState;
```

如此一來 `useState` 就有提供 `setState` 的功能來更新 Hook 資料，可以這樣用：

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
      {/* 透過 setIsShowText 更新資料 */}
      <button onClick={() => setIsShowText(prev => !prev)}> 
        {isShowText ? 'Hide Label' : 'Show Label'}
      </button>
      ......
    </div>
  )
}
```

接著來思考程式運作邏輯，逐步解析 Mount 到 Update 的階段中會發生什麼事情以及 Hooks 的資料結構概念。

先從比較單純的 **Mount** 開始，最明顯的差異在於多了 `firstWorkInProgressHook`：

【首次渲染 **Mount 流程**】
- Hook1 `useState` (isShowText) 執行
  - 創建 hook1 節點，並進入 Mount 邏輯，`memoizedState` 為 false; `next` 為 null
  - 此時 `workInProgressHook` 為 null，會將 `workInProgressHook` 設定成 hook1，並且將 `firstWorkInProgressHook` 同樣也設定成 hook1
- Hook2 `useState` (text) 執行
  - 創建 hook2 節點，並進入 Mount 邏輯，`memoizedState` 為 'Count'; `next` 為 null
  - **workInProgressHook(hook1) 的 next 指向 hook2**，接著 `workInProgressHook` 設定成 hook2
- Hook3 `useState` (count) 執行
  - 創建 hook3 節點，並進入 Mount 邏輯，`memoizedState` 為 0; `next` 為 null
  - **workInProgressHook(hook2) 的 next 指向 hook3**，接著 `workInProgressHook` 設定成 hook3

![Simple useState mounted with firstWorkInProgressHook data](/images/articles/react-understand-call-hooks-at-top-level-rule/03.png)
_(Mount 後的 Hooks 資料結構概念圖，firstWorkInProgressHook 指向第一個節點)_

接著來探討相對複雜的 **Update** 流程，每個步驟會附上 Hooks 資料結構概念圖：

【當使用者點擊按鈕，觸發 `setIsShowText(prev => !prev)` **執行 Update 流程**】
- Hook1 的 `setState` 執行
  - 將 hook1 的 `memoizedState` 由 false 改為 true
  - 將 `storedHook` 設定為 `firstWorkInProgressHook`，代表儲存前次渲染的 Hooks 
  - 將 `workInProgressHook`, `firstWorkInProgressHook` 重置成 null 準備重新渲染
  - 觸發 re-render，重新執行元件邏輯！

![Simple useState updated zero step](/images/articles/react-understand-call-hooks-at-top-level-rule/04.png)
_(`setState` 執行後的 Hooks 資料概念圖，工作中 Hooks 被清空，並有儲存先前的 Hooks 結構)_

從資料概念圖能看出：工作中的 Hooks 清空，此時 `firstWorkInProgressHook` 與 `workInProgressHook` 指向 null; 另外有產生一組儲存中的 Hooks 藉此保留上輪渲染的 Hooks，此時 `storedHook` 指向儲存中 Hooks 的頭。接著進入第一組 `useState` 的執行：

- Hook1 `useState`(isShowText) 執行
  - 創建 hook1，由於 `storedHook` 不為 null，進入 Update 流程
  - 將 hook1 `memoizedState` 設置成 `storedHook.memoizedState`
  - 將 `storedHook` 設定為 `storedHook.next`，**亦即 storedHook 資料由上一輪的 hook1 換成上一輪的 hook2**
  - 此時 `workInProgressHook` 為 null，會將 `workInProgressHook` 設定成 hook1，並且將 `firstWorkInProgressHook` 同樣也設定成 hook1

![Simple useState updated 1st step](/images/articles/react-understand-call-hooks-at-top-level-rule/05.png)
_(第一組 isShowText 的 useState 執行後 Hooks 資料概念圖)_

從資料概念能看出：工作中 Hooks 產生出 Hook1 節點，並被 `firstWorkInProgressHook` 與 `workInProgressHook` 指向; 另外 `storedHook` 改指向儲存中的 Hook2 節點。接著進入第二組 `useState` 的執行：

- Hook2 `useState` (text) 執行
  - 創建 hook2，由於 `storedHook` 不為 null，進入 Update 流程
  - 將 hook2 `memoizedState` 設置成 `storedHook.memoizedState`
  - 將 `storedHook` 設定為 `storedHook.next`，**亦即 storedHook 資料由上一輪的 hook2 換成上一輪的 hook3**
  - **workInProgressHook(hook1) 的 next 指向 hook2**，接著 `workInProgressHook` 設定成 hook2

![Simple useState updated 2nd step](/images/articles/react-understand-call-hooks-at-top-level-rule/06.png)
_(第二組 text 的 useState 執行後的 Hooks 資料概念圖)_

從資料概念能看出：工作中 Hooks 產生出 Hook2 節點，並被 `workInProgressHook` 指向; 另外 `storedHook` 改指向儲存中的 Hook3 節點。接著進入第三組 `useState` 的執行：

- Hook3 `useState` (count) 執行 
  - 創建 hook3，由於 `storedHook` 不為 null，進入 Update 流程
  - 將 hook3 `memoizedState` 設置成 `storedHook.memoizedState`
  - 將 `storedHook` 設定為 `storedHook.next`，**亦即 storedHook 資料由上一輪的 hook3 換成上一輪的尾端 null**
  - **workInProgressHook(hook2) 的 next 指向 hook3**，接著 `workInProgressHook` 設定成 hook3

![Simple useState updated 3rd step](/images/articles/react-understand-call-hooks-at-top-level-rule/07.png)
_(第三組 count 的 useState 執行後的 Hooks 資料概念圖)_

從資料概念能看出：工作中 Hooks 產生出 Hook3 節點，並被 `workInProgressHook` 指向; 另外 `storedHook` 改指向 null，亦即沒有儲存中的 Hooks 了。

透過每個步驟執行後的 Hooks 資料結構概念圖，會更能理解目前資料的狀態，然而目前都還是在展示「正確使用」Hooks 的情境下會發生什麼事情，看起來蠻正常的，接著將實際破壞規則：如果不把 Hooks 放在頂層執行，會發生什麼問題呢？

---

## 破壞「Hooks 須在最頂層呼叫」的規則，會產生什麼問題

現在已經了解 Hooks 資料結構以及執行時的資料變化，接下來是更有趣的部分，如果當破壞 Hooks 使用規則會怎麼樣呢？

### 如果在使用 useState 時，加上 conditions 會發生什麼事情？

利用下列錯誤的程式碼做示範，看看執行的過程中會發生什麼問題，主要**專注在如果把 useState 加上 conditions 會發生什麼問題**：

```jsx
import useState from './simpleUseState.js';
import ToggleButton from './ToggleButton.js';

function Counter() {
  const [isShowText, setIsShowText] = useState(false); // Hook1

  /** Hook 錯誤地加上 condition **/
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

重點是**Hook2 (text 資料變數) 不會在 Mount 階段被建立，會被跳過！**

【首次渲染 **Mount 流程**】
- Hook1 `useState` (isShowText) 執行
  - 創建 hook1 節點，並進入 Mount 邏輯，`memoizedState` 為 false; `next` 為 null
  - 此時 `workInProgressHook` 為 null，會將 `workInProgressHook` 設定成 hook1，並且將 `firstWorkInProgressHook` 同樣也設定成 hook1
- 「**因為 isShowText 是 false，所以會跳過 Hook2** `useState` (text) 的執行」
- Hook3 `useState` (counte) 執行
  - 創建 hook3 節點，並進入 Mount 邏輯，`memoizedState` 為 0; `next` 為 null
  - **workInProgressHook(hook1) 的 next 指向 hook3**，接著 `workInProgressHook` 設定成 hook3

在 Mount 後的 Hooks 資料結構概念圖會長這樣：

![useState within confitions after mounted](/images/articles/react-understand-call-hooks-at-top-level-rule/08.png)
_(將 Hook2 useState 放在 if/else 中，Mounted 後的 Hooks 概念圖，Hook2 節點沒有產生)_

在 Mount 階段尚未發生問題，然而，當進行 Update 階段呢？會不會發生什麼問題？

【當使用者點擊按鈕，觸發 `setIsShowText(prev => !prev)` **執行 Update 流程**】
- Hook1 的 `setState` 執行
  - 將 hook1 的 `memoizedState` 由 false 改為 true
  - 將 `storedHook` 設定為 `firstWorkInProgressHook`，代表儲存前次渲染的 Hooks，**這邊要注意的是儲存的前次渲染 Hooks 中指存在 Hook1 與 Hook2 的節點，並沒有 Hook3**
  - 將 `workInProgressHook`, `firstWorkInProgressHook` 重置成 null 準備重新渲染
  - 觸發 re-render，重新執行元件邏輯！

![useState within confitions after mounted](/images/articles/react-understand-call-hooks-at-top-level-rule/09.png)
_(Hook1 setState 後的 Hooks 概念圖)_

當執行完第一步驟的 `setState` 更新時，似乎 Hooks 資料也還沒有發生明顯問題，接著進入 Hook1 的執行：

- Hook1 `useState` (isShowText) 執行
  - 創建 hook1，由於 `storedHook` 不為 null，進入 Update 流程
  - 將 hook1 `memoizedState` 設置成 `storedHook.memoizedState`
  - 將 `storedHook` 設定為 `storedHook.next`，**亦即 storedHook 資料由上一輪的 hook1 換成上一輪的 hook3，這邊要注意的是「storedHook 指向會換成 hook3 而非 hook2，因為 hook2 不存在於上一輪渲染」**
  - 此時 `workInProgressHook` 為 null，會將 `workInProgressHook` 設定成 hook1，並且將 `firstWorkInProgressHook` 同樣也設定成 hook1

![useState within confitions after first useState executed again](/images/articles/react-understand-call-hooks-at-top-level-rule/10.png)
_(Hook1 useState 再次執行後的 Hooks 概念圖)_

再次提醒，這個步驟中最需注意的是：`storedHook` **目前是指向 Hook3 的資料節點！而不是 Hook2 的資料節點，因為 Hook2 資料節點根本還沒產生！** 接著會進入到 Hook2 `useState` 執行的步驟：

- **因為 isShowText 是 true，會執行 Hook2 (text) 的** `useState`，但是會有問題發生！
  - 創建 hook2，由於 `storedHook` 不為 null，進入 Update 流程
  - 將 hook2 `memoizedState` 設置成 `storedHook.memoizedState`，此時的 storedHook 是上輪渲染的 hook3 => **問題發生！這代表 Hook2 (text) 的資料會被錯誤地設定為 Hook3 (count) 的資料 0**
  - 將 `storedHook` 設定為 `storedHook.next`，亦即 storedHook 資料由上一輪的 hook3 換成上一輪的尾端 null
  - workInProgressHook(hook1) 的 next 指向這輪產生的 hook2，接著 `workInProgressHook` 設定成 hook2

![useState within confitions after first useState executed again](/images/articles/react-understand-call-hooks-at-top-level-rule/11.png)
_(Hook2 useState 再次執行後的 Hooks 概念圖)_

在這個步驟，就能看出很大的問題：**由於 Mount 階段時的 Hooks 節點資料並沒有 Hook2(text) 只有 Hook3(count)，因此造成 Update 階段時，Hook2(text) 的資料直接被設定為 Mount 階段時的 Hook3(count) 資料**，造成明明該為 `'Count'` 的資料卻變成 `0`。

透過這個模擬 React Hooks 創建和更新的案例說明，能夠理解**為什麼不能將 Hooks 放在 conditions 中**：

> 因為 React Hooks 是以 Linked List 結構依序儲存，如果在 Mount 階段因為條件判斷而跳過某些 Hook 的創建，會**導致 Update 階段時 Hook 節點與原本的順序不一致，造成狀態資料的對應錯誤**，產生嚴重 Bug。

當然在這裡只有模擬 React Hooks 很簡要的概念，實際上 React 還有做更多複雜的處理邏輯和渲染流程，不過就最重要的資料邏輯和概念而言，有適當的代表性能夠理解「為什麼 Hooks 會有不能將 Hooks 放在 conditions 中的原因」。

#### 如果在使用 useState 時，加上 loops 會發生什麼事情？

其實當能理解 React Hooks 實作的資料邏輯和結構後，相對應能理解更多與「須將 React Hooks 放在頂層」有關的規定，例如：**不能將 React Hooks 放在 loops 中**。

在此依然使用先前製作的簡單版本 `useState` 撰寫一段錯誤的程式碼，將 `useState` 包覆在 loop 當中：

```jsx
import useState from './simpleUseState.js';

function TodoList() {
  const [todos, setTodos] = useState(['Task 1', 'Task 2']); // Hook1

  /** Hook 錯誤地放在 loop 中 **/
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

在這段程式碼邏輯中，能發現一個重點是：**Hook 的數量是根據 Todos 的長度決定，所以是會變動的狀態**，這個邏輯蠻重要的，可以先記住。

由於先前已經探討過不少 `useState` 的執行步驟，因此在此不細談 Mount 的步驟，直接看到 **Mount** 後 Hooks 資料結構概念圖：

![useState within loop after mount](/images/articles/react-understand-call-hooks-at-top-level-rule/12.png)
_(將 useState 放在 loop 中，Mount 後的 Hooks 概念圖)_

可以看到因為目前的 Todos 有兩個，所以 `map` loop 執行完畢後的產生的數量有兩個 Hooks 節點。

在 Mount 階段時，尚未發生明顯問題。問題會發生在 Update 階段時，例如當新增一個 Todo 項目：

【當使用者觸發 `setTodos(prev => [...prev, newTodo])` **執行 Update 流程**】

- Hook1 的 `setState` 執行
  - 將 hook1 的 `memoizedState` 由 ['Task 1', 'Task 2'] 改為 ['Task 1', 'Task 2', 'Task 3']
  - 將 `storedHook` 設定為 `firstWorkInProgressHook`
  - 將 `workInProgressHook`, `firstWorkInProgressHook` 重置成 null 準備重新渲染
  - 觸發 re-render，重新執行元件邏輯！

![useState within loop after setState executed](/images/articles/react-understand-call-hooks-at-top-level-rule/13.png)
_(新增一個 Todo 項目，setState 執行後的 Hooks 概念圖)_

接著開始進行重新渲染執行邏輯，而重新渲染時，因為 Todos 陣列增加一個元素，因此 loop 會多執行一次，這會造成嚴重問題：

- Hook1 `useState` (todos) 執行：順利更新邏輯，若不清楚步驟可回頭查看先前案例

![useState within loop after useState executed](/images/articles/react-understand-call-hooks-at-top-level-rule/14.png)
_(當資料為 todos 的第一個 useState 再次執行後的 Hooks 概念圖)_


- 「因為現在 Todos 有三個元素，`map` 會執行三次 `useState`！與先前執行兩次的 `useState` 不一致導致問題發生！」
  - 第一次迴圈：新一輪的 hook2 (isDone) 對照使用 `storedHook` 中的 hook2 (isDone) 資料，沒問題
  - 第二次迴圈：新一輪的 hook3 (isDone) 對照使用 `storedHook` 中的 hook3 (isDone) 資料，沒問題
  - 第三次迴圈：新一輪的 hook4 (isDone) 會對照使用 `storedHook` 中的 hook4 (newTodo)，錯誤發生！**造成新一輪 hook4 的 isDone 會錯誤地使用到 newTodo 的資料**！ 

![useState within loop after useState executed](/images/articles/react-understand-call-hooks-at-top-level-rule/15.png)
_(當 loop 中資料為 isDone 的多個 useState 都再次執行後的 Hooks 概念圖)_

至此可以得知如果將 Hooks 包在 `map` 等 loop 結構中使用，確實會產生很大的問題。

> 因為 React Hooks 是以 Linked List 結構依序儲存，如果在 loop 中使用 Hooks，每次渲染時產生的 Hook 節點數量會依據 loop 的迭代次數而變動。這會**導致在 Update 階段時，新一輪渲染產生的 Hook 節點數量可能與前一輪渲染時不同，破壞了 Hooks 之間的對應關係**，導致嚴重 Bug。

順帶一提，如果要改寫這段程式碼變成沒問題的話，可以採用幾個方向：

- 方法一：可試著把 `isDone` 這筆資料直接封裝在 `todos` 中，讓每筆 `todos` 直接帶有 `isDone` 就另外用 `useState` 宣告 `isDone` 的資料
- 方法二：可試著抽出 Todo 元件，並把帶有 `isDone` 資料的 useState 宣告在新的元件最頂層中，那也會符合 Hooks 須在元件最頂層使用的規則。

本段落只有針對 "Do not call Hooks inside conditions or loops." 的 conditions 與 loops 進行探討，然而其他相關的規則很多依然都與 React Hooks 的資料邏輯概念有關，像是 "Do not call Hooks inside try/catch/finally blocks"、"Do not call Hooks in event handlers." 等等 React 官方文件有羅列出來的 cases，如果有興趣可以再用相同概念延伸思考囉。

---

## 總結：使用 Hooks 請記得在最頂層呼叫

透過本文從 React Hooks 實作的資料概念和邏輯，能夠更理解為什麼在 React 官方文件中會強調「Only call Hooks at the top level」這條規則，確實與 React Hooks 背後的實作邏輯有關聯，在此總結幾個重要的結論：

- **React Hooks 的資料結構**
  - Hooks 使用 Linked List 結構來儲存狀態
  - 每個 Hook 都是 Linked List 中的一個節點的概念
  - Hook 節點之間通過 `next` 指向相連，形成有序的資料結構
- **為什麼不能在 conditions 中使用 Hooks？**
  - 條件判斷可能導致某些 Hook 節點在首次渲染時被跳過，沒有被創建
  - 由於 Hooks 資料結構的順序性，這會導致後續更新時 Hook 的對應關係錯亂
  - 最終可能造成在條件判斷式中的 Hook state 被賦予錯誤的值，產生不可預期的 Bug
- **為什麼不能在 loops 中使用 Hooks？**
  - loops 中的 Hook 數量可能會隨著迭代次數改變
  - 這種動態的 Hook 數量變化會破壞 Linked List 的穩定性
  - 最終可能導致某些 Hook state 被錯誤地對應到其他 Hook 的資料，產生不可預期的 Bug

整體而言這樣的理解過程，除了理解背後原理滿足好奇心之外，也能讓開發者更理解資料邏輯的設計與限制，往後再碰到任何類似的資料邏輯或實作時，能很快地知道有什麼限制的存在。

不過實際開發時，只要好好地使用 ESLint 規則 `eslint-plugin-react-hooks` 都能在開發階段就發現問題，不會真的違反 React 這個必須在頂層呼叫 Hooks 的規則，所以 ESLint 用好用滿還是很重要的，記得務必把 Lint job 上到每次 release 前必跑的 CICD 項目中，才能確保專案的開發者的所有程式碼都被限制在其中啊。

---

#### 參考資料

- [Rules of Hooks| React Official Document](https://react.dev/reference/rules/rules-of-hooks)
- [React Source Code v18.3.1 | ReactFiberHooks.new.js](https://github.com/facebook/react/blob/v18.3.1/packages/react-reconciler/src/ReactFiberHooks.new.js)
- [React hooks: not magic, just arrays](https://medium.com/@ryardley/react-hooks-not-magic-just-arrays-cd4f1857236e)
- [Rules of ESLint | eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks)
- [Wiki | Linked List](https://en.wikipedia.org/wiki/Linked_list)
- 使用 [Claude](https://claude.ai/) 校稿和修正