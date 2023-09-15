---
title: 理解 Redux 原始碼 (5)：從 HOC 到 Hooks，實作 useSelector 與 useDispatch
date: 2023-08-31
description: 隨著 React-Redux 版本提升，官方更建議使用 Hooks 的方式，而非過去的 HOC 模式 e.g.`connect`。在本文中，將探討這樣的轉變有什麼好處，以及理解和實作 React-Redux 最重要的 useSelector 和 useDispatch Hooks。
tag: react, sourceCode
---

## 前言

在上篇[理解 Redux 原始碼 (4)：透過 Provider 與 connect 理解 React-Redux 的組合](/articles/2023/redux-make-provider-and-connect)中，能理解 React 與 Redux 如何結合，並知道如何實作簡單的 `Provider` 與 `connect`。

隨著 React 與 React-Redux 版本的提升，現在官方更建議使用 **Hooks** 的方式來使用 React-Redux，而非過去的 **HOC(High Order Component)** 模式 e.g.`connect`。這樣的轉換是有好處的，將會在接下來的內文中分享。

而 React-Redux Hooks 中，最常用到的就是 `useSelector` 以及 `useDispatch`，當使用兩者時，就無需再使用 `connect`, `mapStateToProps`, `mapDispatchToProps` 等，便能取用 Redux store 的資料與方法。因此本文關於 Hooks 的部分，將聚焦於探討這兩個 Hooks 的應用和原始碼，透過實作簡單的 `useSelector` 與 `useDispatch` 將更理解 React-Redux 的 Hooks 版本。

期待閱讀完本文後能：
- 理解為什麼要從 HOC 轉為 Hooks 的寫法，好處為何
- 理解 `useSelector` 與 `useDispatch` Hook APIs
- 能實作簡單版本的 `useSelector` 與 `useDispatch`

*p.s. 隨著 React, React-Redux 版本不同，useSelector / useDispatch 的原始碼會有所不同，本文撰寫的範例不一定是最新版本的寫法，但核心概念差異不大，仍可參考並有所學習。*

---

## 談談為何要從 HOC 轉為 Hooks

每個技術的轉折都有背後的原因，而這段會探討：「為什麼要將 HOC 轉為 Hooks 寫法」。

首先，快速複習 HOC(High Order Component) 的概念：

「HOC 能接收一個 component 作為參數，並最終返回一個新的 component。這個新的 component 通常會擴充或修改原始 component 的 props 或行為。」

`connect` function 就是 HOC 的概念實踐，它的第一組參數，可以傳入 `mapStateToProps` 與 `mapDispatchToProps`，而第二組參數可以傳入 React component，藉此讓 React component 獲得從 `mapStateToProps` 與 `mapDispatchToProps` 中選擇的 Redux state/dispatch 資料與方法。

講起來有些繞口，透過程式碼更直觀了解：

```jsx
/*** Counter.js ***/
import { connect } from 'react-redux';

// 宣告 Counter component，並在最下方，有用 connect 包裹才 export，
// 藉此能從 props 中取到 store 的 state/dispatch
const Counter = ({ 
  title,
  count, 
  increment, 
  decrement,
  submit
}) => {
  return (
    <div>
      <div>{title}</div>
      <div>
        <button onClick={decrement}>-</button>
        <span>{count}</span>
        <button onClick={increment}>+</button>
      </div>
      <button onClick={submit}>Submit</button>
    </div>
  );
}

// 宣告 mapStateToProps，設定 Counter 取用的 store state
const mapStateToProps = (state) => ({
  count: state.count,
});

// 宣告 mapDispatchToProps，設定 Counter 取用 store dispatch actions
const mapDispatchToProps = (dispatch) => ({
  increment: () => dispatch({ type: 'INCREMENT' }),
  decrement: () => dispatch({ type: 'DECREMENT' }),
});

// 用 connect 將 Counter 與 store 連結，
// 藉此從 Counter props 中取用 count 資料 & increment, decrement 方法
export default connect(mapStateToProps, mapDispatchToProps)(Counter);
```

如果對 `connect` 不熟又想深入瞭解，可以閱讀[本系列上篇文章](/articles/2023/redux-make-provider-and-connect)。

關於「換成 Hooks 寫法有什麼好處」這個問題可以反過來討論，也就是「目前 HOC 的寫法有什麼壞處」，而好處通常就是補足壞處的部分。因此先了解 HOC 的問題：

### HOC 帶來的問題

#### 1. 資料流模糊 (Obscured data flow)

可以看到 `Counter` 的 component 有著多個 props，但有辦法直觀地分辨出「這些 props 各自從哪裡來」嗎？哪些是從父層級來的？哪些是從 Redux 來的？

```jsx
const Counter = ({ 
  title,
  count, 
  increment, 
  decrement,
  submit
}) => {
  ......
}
......
```

非常困難。

除非閱讀到 `mapStateToProps` 與 `mapDispatchToProps` 內的資料邏輯，才有辦法分辨出 `title`, `submit` 是從父層級來的 props; 而 `count`, `increment`, `decrement` 是從 Redux 組合而來的 props。

當 component 資料邏輯更多或更複雜時，這個問題也會被放大，不小心就會弄混 props 的來源，進而導致開發上的問題。

#### 2. props 命名衝突 (Name collisions)

`connect` HOC 背後的概念是將原始 React component 的 props 與 `mapStateToProps` 和 `mapDispatchToProps` 返回的資料與方法結合，概念示意的程式碼如下：

```jsx
const connect = (mapStateToProps, mapDispatchToProps) => {
  return function (WrappedComponent) {
    return function ConnectedComponent(ownProps) {
      ......

      const stateProps = mapStateToProps ? 
        mapStateToProps(store.getState(), ownProps) 
        : {}; 
      const dispatchProps = mapDispatchToProps ? 
        mapDispatchToProps(store.dispatch, ownProps) 
        : {};

      ......

      // 最終渲染的元件，是透過所有 props 的組合
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

重點是關於最後 `WrapperdComponent` 結合所有 props 的段落，可以想見，假設 `ownProps` 中，從父層級有個 `name` props; 而在 `stateProps` 中，有從 `mapStateToProps` 提取 key 為 `name` 的資料，這兩者的資料命名一樣都是 `name`，就有命名衝突的發生，進而導致部分資料被覆蓋的問題。

而這層命名衝突隱含在 HOC 實作邏輯中，不一定會在 component 層級被發現，因此不好 debug。

#### 3. 靜態型別檢查困難 (Hard to statically type)

當使用 TypeScript 進行靜態型別檢查時，HOC 會讓靜態型別檢查的複雜度增加，最主要的原因是 props 混雜來自「父層級傳入」以及「Redux 傳入」。因此不能只定義其中之一的型別，必須注意兩者來源的型別都要定義好。

舉個簡單範例，說明漏掉 Type Check 的狀況：

```jsx
type ReduxState = {
  user: {
    id: number;
    name: string;
    age: number;
  };
};

type UserProfileProps = {
  user: {
    id: number;
    name: string;
  };
};

const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  return <div>{user.name}</div>;
};

const mapStateToProps = (state: ReduxState) => ({
  age: state.user.age,
});

// 最終 export 出去的 Connected UserProfile user props，包含 `age`
// 因此上方的 `React.FC<UserProfileProps>` 型別有問題
export default connect(mapStateToProps)(UserProfile);
```

由於 Connected 的元件混雜了不同來源的 props，因此在定義型別時，就要特別注意會否遺漏，造成開發上的負擔。

以上是 3 個常見的 HOC 問題，其實還有其他的問題，像是「多層 HOC 鑲嵌之下的偵錯困難、效能問題」等等。

那「Hooks 有解決上述 HOC 的問題嗎」？

### Hooks 帶來的好處

這邊先直接換成 Hooks 寫法，用 `useSelector` 與 `useDispatch` 改寫上面 `Counter` 的程式碼，在此先不用深入理解 `useSelector` 與 `useDispatch` 的用法，只要專注在從 HOC 轉成 Hooks 後的程式碼變化及好處，轉換後的程式碼：

```jsx
/*** Counter.js ***/
// 引入 useSelector, useDispatch 而非 connect
import { useSelector, useDispatch } from 'react-redux';

const Counter = ({ 
  title, 
  submit 
}) => {
  // 使用 useSelector 取得 Redux store 的 count state
  const count = useSelector(state => state.count);

  // 使用 useDispatch 取得 dispatch 函數，
  // 並定義 action creators: increment, decrement
  const dispatch = useDispatch();
  const increment = () => dispatch({ type: 'INCREMENT' });
  const decrement = () => dispatch({ type: 'DECREMENT' });

  return (
    <div>
      <div>{title}</div>
      <div>
        <button onClick={decrement}>-</button>
        <span>{count}</span>
        <button onClick={increment}>+</button>
      </div>
      <button onClick={submit}>Submit</button>
    </div>
  );
}

export default Counter;
```

轉換成 Hooks 後有什麼好處：

#### 1.資料來源區分明確

原本「來自父層級的 props」 與「來自 Redux 的 props」會混雜，導致「認知負擔增加」、「props 命名衝突進而互相覆蓋」、「型別混雜不好定義」等問題。

使用 Hooks 後，因為有明確區分兩者，所以獲得改善。現在資料來自父層級或者 Redux 一目瞭然，而且如果有命名衝突會報錯而非互相覆蓋，當然，型別定義也會更加單純。

```jsx
// 來自父層級的資料
const Counter = ({ 
  title, 
  submit 
}) => {
  // 來自 Redux 的資料
  const count = useSelector(state => state.count);
  const dispatch = useDispatch();
  const increment = () => dispatch({ type: 'INCREMENT' });
  const decrement = () => dispatch({ type: 'DECREMENT' });
  ......
}
```

#### 2.程式碼更簡潔

因為無須宣告與關注 `mapStateToProps` 與 `mapDispatchToProps`，也不用使用 HOC `connect` 包裹 React component，進而讓程式碼更加簡潔好讀。

#### 3.減少元件的鑲嵌層級

如果多層的 HOC 結構之下，會導致偵錯困難，像是 `connect()()()...` 的狀況，就要一層一層去抓問題，然而 Hooks 讓原本多層的鑲嵌扁平化，進而減少偵錯時的困難度。

除此之外，由於 Hooks 就是一種 Function 型態，有著更直覺的 input/output，因此撰寫測試上也相對更容易。

在理解使用 Hooks 的好處後，接著將專注於 `useSelector` 與 `useDispatch` 兩個重要的 React-Redux Hook APIs。

---

## 深入認識 useSelector

`useSelector` 是 React-Redux 提供的 Hook API，用來取用 Redux store 中的狀態。當取用的狀態有所改變時，也會觸發 component 的 re-render。

`useSelector` 主要接受兩個參數 **selector funtion** 與 **options**，透過 selector function 就能取得需要的 Redux state，而透過 options 則能夠調整部分設定，通常只會用到第一個 selector 參數。

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

這邊需要瞭解一個重要的概念「當取用的狀態有所改變時，也會觸發 component re-render。」，具體來說是：

1. **首先，Redux 更新狀態**：當 dispatch 某個 action，觸發 Readux store 更新機制，更新 store state。

2. **再者，useSelector 判斷是否要重新渲染**：當 Redux state 變化時，`useSelector` 會比較取用的前後 state 是否有不同，如果有不同，才會強制觸發重新渲染。而比較前後兩者 state 是否有變化，預設是使用用 `===` 嚴格比較的方式，兩者的 reference 必須完全相同時，才會被認為是相同，不需要重新渲染。另外，可以藉由第二個參數 options 傳入客製化的 equalityFn 藉此調整比較 state 是否有變化的方式。

特別注意的是，第二點提及的「比較新舊 state 是否有變化」的預設方式，新版的`useSelector` 與過去 `connect` 的比較方式是不同的：

- useSelector: 預設用嚴格比較(`===`)，新舊 selectedState 兩者的 reference 不同時，觸發重新渲染。
- connect: 預設用淺層比較(`shallowEqual`)，新舊 selectedState 兩者的值不同時，觸發重新渲染。

這段主要是來自 Redux 官方文件的描述：

> useSelector() only forces a re-render if the selector result appears to be different than the last result. The default comparison is a strict === reference comparison. This is different than connect(), which uses shallow equality checks on the results of mapState calls to determine if re-rendering is needed. 

雖然當開發者將程式碼從 `connect` HOC 的方式，改寫成 `useSelector` 的方式時，在大部分的情況下，並不會因為這個差異而造成問題，然而依然需要了解這個差異，以確保正確使用，更能在發生問題時，更快思考到可能的原因。

---

## 實作簡易版的 useSelector

在理解 `useSelector` API 後，接著來透過實作簡單版本的 `useSelector`，藉此更認識它的底層邏輯。

這邊的實作將會聚焦在 `useSelector(selector, equalityFn)` 實踐，需要注意：

1. 傳入的 `selector` 參數 `(reduxState) => reduxState.xxx`，能選擇出最終要回傳的 Redux state。
2. 需要在 Redux store state 有任何改變時，觸發重新渲染 => 意即需訂閱 store ，在 store state 改變時觸發 forceRender。
3. 更進一步，需要確認 Redux store state 的改變影響到 useSelector 所選的 state 時，才需要重新渲染，避免無謂的渲染 => 意即需要紀錄上次的 state，才能做新舊 state 比較。
4. 傳入的 `eqalityFn` 參數，可作為判斷新舊 state 是否改變的函式，若沒有傳入，預設用 `===` 判斷新舊 state 是否改變。

### 1.「製作 input / output」的介面

- input: selector 及 equalityFn
- output: selectedState

selector function 的形式會是 `(reduxState) => reduxState.xxx`，而透過 `selector(store.getState())` 就能製作出最終回傳的 `selectedState`。

```jsx
/** useSelector.js file **/
import { useContext } from "react";
// 已製作的 ReduxContext，在此無需關注細節，有興趣瞭解可看上篇內容
import { ReduxContext } from './Provider' 

const useSelector = (
  selector,
  equalityFn
)  => {
  // 從 ReduxContext 中取出 store，可以提供 getState/dispatch 方法
  const store = useContext(ReduxContext); 
    
  // 透過 selector，選出最後要回傳的 Redux State
  const selectedState = selector(store.getState());
    
  // 回傳最後選出的 State
  return selectedState;
}

export default useSelector;
```

### 2. 實踐「若 Redux state 有任何改變時，觸發重新渲染」

當 Redux state 改變時，要觸發重新渲染，換句話說就是利用 `store.subscribe` 訂閱 `forceRender`，如此，當 store state 改變時，就會執行 `forceRender`。

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
    
  // 透過 useReducer，製作用來觸發重新渲染的 forceRender
  const [, forceRender] = useReducer(s => s + 1, 0);
    
  const selectedState = selector(store.getState());

  useEffect(() => {
    // 透過 store.subscribe 訂閱機制
    // dispatch action 到 Redux store 時，呼叫 forceRender
    const unsubscribe = store.subscribe(() => forceRender());
    return unsubscribe;
  }, []);

  return selectedState;
}

export default useSelector;
```

### 3. 實踐「若 useSelecter 所選 state 有改變時，才觸發重新渲染」

可以透過 `useRef` 將前一版本的 `selectedState` 記錄下來，如此就能比對新舊版本的 state 究竟有沒有改變，如果有改變才需要去觸發 `forceRender`。

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

  // 利用 useRef 製作儲存上次的 selectedState
  const prevSelectedState = useRef(null);
  const selectedState = selector(store.getState());

  // 實作 checkForUpdates 來檢查新舊 selectedState 是否有變化
  function checkForUpdates() {
    // 取出最新的 selectedState
    const newSelectedState = selector(store.getState());
    // 若新舊 selectedState 相等，不會重新渲染
    if(newSelectedState === prevSelectedState.current) {
        return;
    }
    // 若新舊 selectedState 不相等，觸發重新渲染
    prevSelectedState.current = newSelectedState;
    forceRender();
  }

  useEffect(() => {
    // dispatch action 到 Redux store 時，呼叫 checkForUpdates
    const unsubscribe = store.subscribe(checkForUpdates);
    return unsubscribe;
  }, []);

  return selectedState;
}

export default useSelector;
```

### 4. 實踐「可用傳入的 equalityFn 客製化 function，比對新舊 state 是否有變化」

可以利用傳入的第二個參數 equalityFn 去判斷新舊的 selectedState 有沒有變化。

```jsx
/** useSelector.js file **/
import { 
    useContext, 
    useReducer, 
    useRef, 
    useEffect 
} from "react";
import { ReduxContext } from './Provider' 

// 預設的 equalityFn，用 strict equal 模式
const defaultEqualityFn = (a, b) => a === b;

const useSelector = (
  selector,
  // 可傳入的客製化的 equalityFn，預設為 defaultEqualityFn
  equalityFn = defaultEqualityFn 
)  => {
  const store = useContext(ReduxContext); 
  const [, forceRender] = useReducer(s => s + 1, 0);

  const prevSelectedState = useRef(null);
  const selectedState = selector(store.getState());

  function checkForUpdates() {
    const newSelectedState = selector(store.getState());
     // 用 equalityFn 來判斷新舊 selectedState 是否相等
     // 若新舊 selectedState 相等，不會重新渲染
    if(equalityFn(newSelectedState, latestSelectedState.current)) {
        return;
    }
    // 若新舊 selectedState 不相等，觸發重新渲染
    prevSelectedState.current = newSelectedState;
    forceRender();
  }

  useEffect(() => {
    // dispatch action 到 Redux store 時，呼叫 checkForUpdates
    const unsubscribe = store.subscribe(checkForUpdates);
    return unsubscribe;
  }, []);

  return selectedState;
}

export default useSelector;
```

至此，就完成了簡易版 `useSelector` 的核心邏輯，接著會討論 `useDispatch` 的部分囉。

---

## 深入認識 useDispatch

`useDispatch` 是 React-Redux 提供的另一個 Hook API，它會回傳 store 的 `dispatch` 方法，，透過 `dispatch` 方法就能發送 actions 到 Redux store，藉此更新 Redux store state。

使用 `useDispatch` 可以讓我們更簡單地在 component 中觸發 Redux actions，而不需要透過 connect HOC 方式或其他複雜的方法。

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

值得注意的是，只要 Redux store 的 instance 是相同的情況下， `dispatch` 的 reference 都會是相同的，通常而言，一個 application 只會有一個 Provider 以及 create 一次 store 傳入，所以 `dispatch` 作為 `useEffect` or 其他 Hooks 的 dependecy 是很安全的，不會觸發無限循環 loop 等問題。

這段是來自於 Redux 官方文件的描述：

> The dispatch function reference will be stable as long as the same store instance is being passed to the <Provider>. Normally, that store instance never changes in an application.

接著，就來實作簡易版的 `useDispatch`。

---

## 實作簡易版的 useDispatch

要實作簡易版的 `useDispatch`，其實非常直觀。只需要從 `ReduxContext` 中取得 Redux store 的 dispatch function，然後回傳它，就可以達成。

```jsx
/** useDispatch.js file **/
import { useContext } from "react";
import { ReduxContext } from './Provider';

const useDispatch = () => {
  // 從 ReduxContext 中取得 store
  const store = useContext(ReduxContext);

  // 回傳 store 的 dispatch function
  return store.dispatch;
}

export default useDispatch;
```

在這個簡易版的 `useDispatch` 中，先使用了 `useContext(ReduxContext)` 來從 `ReduxContext` 中取得 Redux store，接著再直接回傳 store 的 `dispatch` 函式。

如此一來，當開發者在元件中使用 `useDispatch` 時，就可以提取 `dispatch` 並且發送 actions 到 Redux store，而不需要透過 `connect` 加上 `mapDispatchToProps` 發送 actions 囉。

而當從 `ReduxContext` 取得 `store` 時，這個 `store` 是來自於 `Provider` 傳遞的 `store`，而通常而言，`store` 在 App 中會是只在最初創建一次，透過 `createStore(...)` 等方式，所以 `store` 與 `store.dispatch` 都會是 stable，不會隨意改變 reference。

相比於 `useSelector`，`useDisatch` 的實作相對簡單許多。

---

## 總結，回顧最初的目標

當閱讀過 HOC 與 Hooks 型態的原始碼時，的確會認為後者相對而言更容易理解，我覺得有個關鍵是在於鑲嵌層級比較沒那麼多，且 Hooks 比起來是更存粹的 Function，也令人更直覺地理解之。

當然，真正的原始碼更加複雜，有興趣的非常推薦直接去閱讀喔，比起 HOC 真的更好理解了。在此，回顧本文最初的目標：


### 1. 理解為什麼要從 HOC 轉為 Hooks 的寫法，好處為何

從 HOC 轉為 Hooks 主要有幾點好處：

#### 資料來源區分明確

使用 Hooks 後，因為有明確區分「來自父層級的 props 資料方法」 與「來自 Redux 資料方法」，所以能解決「認知負擔增加」、「props 命名衝突進而互相覆蓋」、「型別混雜不好定義」等問題。

#### 程式碼更簡潔

因為無須宣告與關注 `mapStateToProps` 與 `mapDispatchToProps`，也不用使用 HOC `connect` 包裹 React component，進而讓程式碼更加簡潔好讀。

#### 減少元件的鑲嵌層級

如果多層的 HOC 結構之下，會導致偵錯困難，像是 `connect()()()...` 的狀況，就要一層一層去抓問題，然而 Hooks 讓原本多層的鑲嵌扁平化，進而減少偵錯時的困難度。

#### 讓測試更好撰寫

比起 HOC 的模式，Hooks 算是更簡單的 Function 結構，因此相對更好撰寫測試。

### 2. 理解 `useSelector` 與 `useDispatch` Hook APIs

#### useSelector API

`useSelector` 是 React-Redux 提供的 Hook API，用來取用 Redux store 中的狀態。當取用的狀態有所改變時，也會觸發 component 的 re-render。

`useSelector` 主要接受兩個參數 **selector funtion** 與 **options**，透過 selector function 就能取得需要的 Redux state，而透過 options 則能夠調整部分設定。

```jsx
const selectedState = useSelector(selector, options)
```

#### useDispatch API

`useDispatch` 是 React-Redux 提供的另一個 Hook API，它會回傳 store 的 `dispatch` 方法，，透過 `dispatch` 方法就能發送 actions 到 Redux store，藉此更新 Redux store state。

```jsx
const dispatch = useDispatch()
```

### 3. 能實作簡單版本的 `useSelector` 與 `useDispatch`

#### 實作 useSelector 

```jsx
/** useSelector.js file **/
import { 
    useContext, 
    useReducer, 
    useRef, 
    useEffect 
} from "react";
import { ReduxContext } from './Provider' 

// 預設的 equalityFn，用 strict equal 模式
const defaultEqualityFn = (a, b) => a === b;

const useSelector = (
  // 可傳入負責選擇 selectedState 的 selector 函式
  selector,
  // 可傳入的客製的 equalityFn，預設為 defaultEqualityFn
  equalityFn = defaultEqualityFn 
)  => {
  const store = useContext(ReduxContext); 
  // 利用 useReducer 製作 forceRender，藉此在特定時機觸發重新渲染
  const [, forceRender] = useReducer(s => s + 1, 0);

  // 用 useRef 儲存前一次的 selectedState，
  // 藉此用於判斷新舊 selectedState 是否改變
  const prevSelectedState = useRef(null);
  const selectedState = selector(store.getState());

  function checkForUpdates() {
    const newSelectedState = selector(store.getState());
     // 用 equalityFn 來判斷新舊 selectedState 是否相等
     // 若新舊 selectedState 相等，不會重新渲染
    if(equalityFn(newSelectedState, latestSelectedState.current)) {
        return;
    }
    // 若新舊 selectedState 不相等，觸發重新渲染
    prevSelectedState.current = newSelectedState;
    forceRender();
  }

  useEffect(() => {
    // 若 dispatch action 到 Redux store 時，呼叫 checkForUpdates
    const unsubscribe = store.subscribe(checkForUpdates);
    return unsubscribe;
  }, []);

  // 回傳選擇出來的 selectedState
  return selectedState;
}

export default useSelector;
```

#### 實作 useDispatch 

```jsx
/** useDispatch.js file **/
import { useContext } from "react";
import { ReduxContext } from './Provider';

const useDispatch = () => {
  // 從 ReduxContext 中取得 store
  const store = useContext(ReduxContext);

  // 回傳 store 的 dispatch function
  return store.dispatch;
}

export default useDispatch;
```

以上就是本文的內容，希望對閱讀的你有幫助，若有興趣也可閱讀下方更多的參考資料囉。

---

#### 參考資料
- [Redux Doc Hooks](https://react-redux.js.org/api/hooks)
- [Reat-Redux source code useSelector](https://github.com/reduxjs/react-redux/blob/7.x/src/hooks/useSelector.js)
- [Reat-Redux source code useDispatch](https://github.com/reduxjs/react-redux/blob/7.x/src/hooks/useDispatch.js)
- [The evolution of React APIs and code reuse](https://frontendmastery.com/posts/the-evolution-of-react-patterns/)
- [React-redux | 為了瞭解原理，那就來實作一個 React-redux 吧！](https://medium.com/%E6%89%8B%E5%AF%AB%E7%AD%86%E8%A8%98/developing-react-redux-from-zero-to-one-e27eddfbce39)
- 與[ChatGPT4](https://openai.com/gpt-4)對談完成














