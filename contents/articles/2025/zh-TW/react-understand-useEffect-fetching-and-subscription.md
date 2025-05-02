---
title: 深入談談 React useEffect 與其 fetching 與 subscription 的兩大應用場景
date: 2025-01-08
description: 在 React Hook 中，處理 Side Effect 最重要的 API 莫過於 useEffect。本文將探討 useEffect 在實務應用的兩大場景「資料獲取 (Data Fetching)」以及「訂閱/取消訂閱外部事件或資源」時，該如何處理才會是相對合理正確的方式，藉此更理解 useEffect 的使用方式。其中也會牽涉到 useEffect 的 dependence 以及 cleanup 運作囉。
tag: React
---

## 前言

在 React Hook 中，最重要且常用的 API，莫過於 `useEffect`，因為在 Application 中，開發者會處理很多 Component 的 Side Effect，最常見的使用場景會是「Data fetching」、「訂閱/取消外部事件資源的訂閱」，都會使用到 `useEffect`。然而在使用 `useEffect` 時，其實有蠻多需要注意的“眉角”，如果用得不好容易造成意料之外的 Bug。

本文中將聚焦探討 `useEffect` 的「資料獲取 (Data Fetching)」與「訂閱/取消訂閱外部事件或資源」的兩大應用場景，其中牽涉到 `useEffect` dependence 以及 cleanup 的觀念和應用，藉此更理解 `useEffect` 的使用方式，也多少會涵蓋到那些 React 前端工程師面試常見的考題觀念，應該蠻適合年後轉職前閱讀ＸＤＤ

預計會包含：

- 快速回顧 `useEffect` 的使用方式
- 理解 `useEffect` 的 dependencies
- 理解 `useEffect` 的 cleanup
- 深入 `useEffect` 中 data fetching 的使用場景
- 深入 `useEffect` 中 subscription 的使用場景
- 總結來說，使用 `useEffect` 時需要注意的事項

是說，如果你能回答下面的問題，那不需要閱讀本文！（頂多當複習）

- 為什麼需要使用 `useEffect`？
- `useEffect` 的 dependence 需要放入什麼？為何需要放入依賴項目？
- `useEffect` 的 cleanup function 會在何時執行？為何需要清理？
- 如何處理 `useEffect` fetching 時 race condition 與 memory leak 問題？
- 如何避免 `useEffect` subscription 時，不必要的重新訂閱？是否理解 `useEventCallback`？

如果你對以上任何問題沒有把握，那這篇文章多少會對你有所幫助。

接著就開始第一個部分，先來快速回顧 `useEffect` 的使用方式。

---

## 快速回顧 `useEffect` 的使用方式

首先看看 React 官方文件對於 `useEffect` 的描述：

> `useEffect` is a React Hook that lets you synchronize a component with an external system.

這代表 `useEffect` 是用來“同步” component 與“外部系統”互動狀態的 Hook。所謂與外部系統的互動，包含「網路請求 fetching」、「訂閱/取消訂閱外部事件（e.g. DOM, Web API）」等等，這些互動後產生的狀態資料，都不會是由 component 的 input aka props 所帶給 component，也是種 Side Effect，這也讓人更理解為什麼它會叫做 use **Effect**。

它的使用方式乍看蠻單純，只有兩個參數：

> useEffect(setup, dependencies?) 

其中 `setup` 是個 callback 函式，視為一組 Effect，它會在 component 首次 render 以及 `dependencies` 內的**任何資料改變時被重新執行**。至於 `dependencies` 內的任何資料是否改變，是透過 `Object.is` 來判斷。

如果沒傳入 `dependencies`，則 `setup` 會在每次 component render 時都會被執行; 如果 `dependencies` 傳入空陣列 `[]`，則 `setup` 會在 component 首次 render 時被執行。

關於 `setup` 有個非常重要的功能就是它可以 return 回一個 **cleanup** 函式，這個 cleanup 函式會在每次執行 `setup` 前預先被執行以及在 component unmount 時會執行一次，主要是**用來清除先前狀態**。

關於 dependencies 與 cleanup，本文後續章節會講解更加詳細！

先來看看簡單的使用案例，快速複習 `useEffect`：

```jsx
function Timer() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // 透過外部系統 Web API setInterval
    // 設置每秒更新計數器的計時器
    const timerId = setInterval(() => {
      setCount(prevCount => prevCount + 1);
    }, 1000);

    // cleanup: 當 component unmount 或 Effect 重新執行時，清除上次的計時器
    return () => {
      clearInterval(timerId);
    };
  }, []); // 空陣列的 dependencies 意味此 Effect 只在 component 初次載入時被執行

  return <div>Timer: {count} seconds</div>;
}

export default Timer;
```

至此，已經快速地複習 `useEffect` 的定義和簡單的使用方式囉，但前面提過它是「乍看」很簡單，實際上有很多「眉角」要被探討，不然容易誤用，接下來將深入談談。

---

## 理解 `useEffect` 的 dependencies

關於 `useEffect` 的 `dependencies`，不少說明會借用過去 React class component 的生命週期概念來類比它的運作模式。雖然這種類比在大方向上似乎沒有問題，但它容易導致一項**誤解：認為 dependencies 僅是用來「控制執行時機」的參數**。

這種理解可能讓開發者認為「只需要在 `dependencies` 中放入控制執行時機的變數就好」。然而，這種思維方式忽略了 `useEffect` 「**保持內外部資料狀態同步**」的概念，就容易導致某些 Bug 發生，舉例而言：

```jsx
/** 這是 useEffect 使用"有問題"的程式碼 **/

function PageTitle({ title, format = 'default' }) {
  // 這個函數有依賴於 format 的關係，容易被忽略
  const formatTitle = () => {
    switch(format) {
      case 'uppercase':
        return title.toUpperCase();
      case 'lowercase':
        return title.toLowerCase();
      default:
        return title;
    }
  };

  useEffect(() => {
    document.title = formatTitle();
  }, [title]); // ❌ 只依賴 title
  // 如果只關注「執行時機」容易「只想在 title 改變時執行」所以就只放 title
  // 但當 format 參數改變時，標題不會正確更新格式，因為 formatTitle 是舊版本

  return <h1>{formatTitle()}</h1>;
}
```

詳述下為什麼會有問題，主要是因為 `formatTitle` 並沒有被放到 `useEffect` 的 dependencies。

`formatTitle` 這個函式當中，除了 `title` 的外部 prop 狀態外，還包含 `format` 這個外部 prop 狀態。換句話說，當 `format` 改變時，`formatTitle` 必須被重新製作，如果一來計算出的結果才是正確的。

雖然這件事情已經包含在 React 元件重新渲染的邏輯當中，當 `format` prop 改變時，`PageTitle` 元件會被重新渲染，`formatTitle` 自然就被重新製作。

然而！由於 `useEffect` dependencies 中並沒有依賴 `formatTitle`，就會形成**因為 closure 的關係**，`useEffect` 中的 Effect funtion 依然使用到**舊版的** `formatTitle` 也就是相依於**舊版的** `format` 導致在 document title 格式是錯誤的問題。

這種簡單的範例看起來很容易找到問題，然而若 Application 複雜，依賴鏈變得很長，這種問題造成的 bug 將難以查找。

看完以上的程式碼案例和說明，應能更理解「**不能將 dependencies 當作『執行時機』而是應該當作『內外部資料狀態』同步**」的概念。

要修復此範例問題，就是讓 dependencies 放入該依賴的外部資料，也就是 `formatTitle`：

```jsx
/** 這是 useEffect 使用正常的程式碼 **/

function PageTitle({ title, format = 'default' }) {
  const formatTitle = () => {
    switch(format) {
      case 'uppercase':
        return title.toUpperCase();
      case 'lowercase':
        return title.toLowerCase();
      default:
        return title;
    }
  };

  useEffect(() => {
    document.title = formatTitle();
  }, [formatTitle]); // ✅ 該依賴的外部狀態存在
  // 無論改變的是 title 或是 format 都會讓 formatTitle 重新製作
  // formatTitle 更新後，會觸發 Effect function 再度執行

  return <h1>{formatTitle()}</h1>;
}
```

是不是覺得這也太難判斷到底要加入哪些 dependenies？

是的！我也覺得很難判斷這種依賴，所以 ESLint 幫了你，`react-hooks/exhaustive-deps` 這條規則能**幫助開發者檢測 dependencies 是否完整**，如果不完整會提出警告以及提供自動修復的選擇，相關使用可以自己查一下很簡單的，每個使用到 React Hook 的專案都需要安裝此檢查。這種自動化能做的事情，就不要用人腦來判斷了吧。

是說，看到這裡有可能有個疑問就是「如果自動化能判斷 dependencies 是否有問題，那為什麼還需要開發者去寫，而不能由 Compiler 直接加上就好？」，這件事情談起來簡單做起來蠻困難，上述的情境很簡單，但實際的情境會非常複雜，要讓所有情境都自動化同時避免 bug 其實很不容易。

不過呢，現在確實有個 [react-compiler](https://github.com/reactwg/react-compiler/discussions) 專案正執行中！或許未來 dependencies 就能自動化地被加上。

當然，有時確實會遇到「不想要」某些值變化時重新執行 Effect 的情況，或者反過來說有可能是想避免過度執行 Effect，這時候正確的做法不是直接從 dependencies 中移除它，而是能思考幾個方向：

1. 重新思考 Effect 的設計是否合理或足夠直覺
2. 使用 `useCallback` / `useMemo` 等記憶化的方式穩定值

其實以上述舉例的 `PageTitle` 而言，不改也沒什麼大 issues，但如果只是作為示範還是能試試。

第一種方向能思考：如果能讓 `useEffect` 直接依賴於最終版本的 `formattedTitle` 會不會比較直覺？

```jsx
// 將 formatTitle 移出 component，不需要依賴也便於測試
const formatTitle = (title, format) => {
  switch(format) {
    case 'uppercase':
      return title.toUpperCase();
    case 'lowercase':
      return title.toLowerCase();
    default:
      return title;
  }
}

function PageTitle({ title, format = 'default' }) {
  const formattedTitle = formatTitle(title, format)

  useEffect(() => {
    document.title = formattedTitle;
  }, [formattedTitle]); // ✅ 該依賴的最終 formattedTitle 依然在

  return <h1>{formattedTitle}</h1>;
}
```

我覺得這種改法還算合理，因為好處是能讓 `formatTitle` 獨立測試，另外看起來 `PageTitle` 中的邏輯也蠻順眼。

第二種方向能思考：是不是能避免 `formatTitle` 不必要的改變，那就能優化 `useEffect` Effect 的觸發次數？

```jsx
/** 這是 useEffect 使用正常的程式碼 **/

// 引入 useCallback 來優化
import { useCallback } from 'react';

function PageTitle({ title, format = 'default' }) {
  // 使用 useCallback 確保 formatTitle 只會相依於 title, format 變化
  const formatTitle = useCallback(() => {
    switch(format) {
      case 'uppercase':
        return title.toUpperCase();
      case 'lowercase':
        return title.toLowerCase();
      default:
        return title;
    }
  },[title, format]);

  useEffect(() => {
    document.title = formatTitle();
  }, [formatTitle]); // ✅ 該依賴的外部狀態都在，最後會執行到正確 format 版本

  return <h1>{formatTitle()}</h1>;
}
```

確實，第二種方式用 `useCallback` 能夠讓 `formatTitle` 只會在 `title` 和 `format` 改變時才改變，不過大可不必，因為原本 `PageTitle` 就只會在 `title` 和 `format` 改變時才改變，所以這個改動算是多此一舉，並且還改差了，因為 `useCallback` 本身也是成本，加了成本但沒有優化就是改差了。

如果要為這個小段落下個總結，我會說 Action 就是：

1. ESLint `react-hooks/exhaustive-deps` 用起來，依警告修正 dependencies
2. 不要關掉 `react-hooks/exhaustive-deps` (能理解實際開發時，有各種狀況可能需先關，記得留下 TODO 回來優化！)

---

## 理解 `useEffect` 的 cleanup

最初介紹 `useEffect` 時有提到，首個參數 setup 函式能回傳 cleanup 函式，它會在：

- 下一次執行 setup 前被呼叫
- component unmount 時被呼叫

這個機制乍看之下很簡單，但它提供了很重要的功能：**讓開發者可以「確保每次 Effect 執行時都是最初的狀態」或者換句話說「能清理上次 Effect 執行後所產生的影響」**。這裡所指的 Effect 也就是 setup 的執行。

實際來看個例子會更具體：

```jsx
function DelayedCounter() {
  const [count, setCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    console.log(`Effect: 設定 timeout for count ${count}`);
    
    // ❌ 沒有清理 timer，timer 不停疊加
    setTimeout(() => {
      console.log(`Timeout: 更新 displayCount 為 ${count}`);
      setDisplayCount(count);
    }, 1000);
  }, [count]); 

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        立即顯示的數字: {count}
      </button>
      <p>延遲顯示的數字: {displayCount}</p>
    </div>
  );
}
```

當使用者快速點擊按鈕 3 次時，`console.log` 會顯示：

```
// 初次渲染
Effect: 設定 timeout for count 0

// 快速點擊三次按鈕
Effect: 設定 timeout for count 1
Effect: 設定 timeout for count 2
Effect: 設定 timeout for count 3

// 約 1 秒後，所有 timeout 觸發
Timeout: 更新 displayCount 為 0
Timeout: 更新 displayCount 為 1
Timeout: 更新 displayCount 為 2
Timeout: 更新 displayCount 為 3
```

原本預期加上 `setTimeout` 的是實踐類似 debounce 的概念，讓使用者無論 1 秒內點幾次，在 1 秒後都只會更新 1 次 `displayCount` 的畫面！

然而從畫看到的現象是：`displayCount` 快速從 0 -> 1 -> 2 -> 3，而不是直接就是 3。

這背後的原因是「**每次 Effect 執行都產生新的 timer，而舊的 timer 沒有被清除**」，所以 `setDisplayCount(count)` 依然會被觸發多次而不是所需要的 1 秒 1 次。

以此例而言，不清除會造成兩個的問題：
1. 不必要的 count 更新 => 不必要的畫面渲染。
2. 不必要的 timer 累積 => 不必要的記憶體使用。

要解決這個問題，會需要**在每次執行 useEffect 的 setup 前，先清除上次的 timer**，這樣一來就能「只保留最新的 timer」。

```jsx
function DelayedCounter() {
  const [count, setCount] = useState(0);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    console.log(`Effect: 設定 timeout for count ${count}`);
    
    const timerId = setTimeout(() => {
      console.log(`Timeout: 更新 displayCount 為 ${count}`);
      setDisplayCount(count);
    }, 1000);

    // ✅ 正確清理前一個 timer
    return () => {
      console.log(`Cleanup: 清理 timeout for count ${count}`);
      clearTimeout(timerId);
    };
  }, [count]); 

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>
        立即顯示的數字: {count}
      </button>
      <p>延遲顯示的數字: {displayCount}</p>
    </div>
  );
}
```

此時若使用者快速點 3 次的 `console.log`:

```
// 初次渲染
Effect: 設定 timeout for count 0

// 點擊按鈕 (count: 0 -> 1)
Cleanup: 清理 timeout for count 0
Effect: 設定 timeout for count 1

// 快速點擊按鈕 (count: 1 -> 2)
Cleanup: 清理 timeout for count 1
Effect: 設定 timeout for count 2

// 快速點擊按鈕 (count: 2 -> 3)
Cleanup: 清理 timeout for count 2
Effect: 設定 timeout for count 3

// 等待 1 秒後
Timeout: 更新 displayCount 為 3
```

如此一來畫面會只渲染 1 次，就是 0 -> 3 的那次。因為**每次再度執行 setup 前，都會先執行 cleanup 清除上次的 timer**，所以會只剩下最新的 timer，所以最後只執行 timer 中的 `setDisplayCount(3)` 內容更新 1 次畫面。

最後還有一點是，**當 component unmount 不再使用時，也會執行最後一次的 cleanup，將清除不再需要的狀態**（本例而言，是清除最後被創建的 timer）。

單看這個例子似乎覺得沒那麼嚴重，但是如果把 timer 中的內容改成 fetching API 呢？

原本預期是 1 秒內使用者點 n 次，都只會請求最後那次的 API，然而！如果沒有好好應用 cleanup 造成的結果是在 1 秒後請求 n 次的 API，造成 n 次的畫面更新，還有更糟的是這些非同步的 API 響應會以不可預期的順序返回，導致最終顯示錯誤的資料，那是非常嚴重的啊。

因此開發者有沒有好好運用 cleanup 是使用 `useEffect` 時很重要的觀念。

---

## 深入 `useEffect` 中 data fetching 的使用

在上面的例子最後有提到「請求 API」的部分。在 React 應用中，最常見的 Side Effect 就是「**隨著資料狀態改變要發送 API 請求更新資料**」的情境，這時就會用到 `useEffect` 搭配 `fetch`。

雖然現代的資料管理函式庫（如 TanStack Query、SWR 等）已經幫我們處理好這類需求，減少直接使用 `useEffect` 和 `fetch` 的組合，但理解這個基礎概念對於掌握 React 的資料流以及 `useEffect` 的應用非常重要，所以本段落依然會以這兩者的經典組合來做說明囉。

本段落會包含：
- `useEffect` 中發送 API 請求的基本實作與潛在問題
- 如何透過 cleanup 機制避免 Race condition 與 Memory leak
- 如何透過 cleanup 機制取消不必要的 API 請求

### `useEffect` 中發送 API 請求的基本實作與潛在問題

首先，從 `useEffect` 結合 `fetch` 的範例開始，先實作看似 ok 但實際上會有問題的案例。

假定頁面中有個產品列表需要呈現，所以撰寫了產品列表，同時會從外部傳進 `category` 決定獲得的類別產品資料：

```jsx
function ProductList({ category }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products?category=${category}`);
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [category]); // Effect 持續同步 category 的資料狀態

  if (isLoading) return <div>載入商品中...</div>;
  if (error) return <div>錯誤: {error.message}</div>;
  if (products.length === 0) return <div>此分類沒有商品</div>;
  return (
    <div className="grid grid-cols-3 gap-4">
      {products.map(product => (
        <div key={product.id}>
          <h3>{product.name}</h3>
          <p>${product.price}</p>
        </div>
      ))}
    </div>
  );
}
```

上述程式碼有寫過一陣子 React 都能蠻快理解，可以練習想一下 `useEffect` 中有什麼問題。

準備要公佈答案！

（但其實上面的列點就已經破梗提到問題了ＸＤ）

主要有兩個問題：

1. **Race condition** 問題：造成 `products` 最終結果並非使用者預期的 `category`。
2. **Memory leak** 問題：如果 `ProductList` 元件 unmount 後，API 請求才完成，導致最後依然執行 `setProducts(xxx)`，React 會跳出 Memory leak 的警告。

接著來細談這些問題，以及在 `useEffect` 中的解決方案。

### 如何透過 cleanup 機制避免 Race condition 與 Memory leak

#### 1. Race condition 問題

首先來看 **Race condition** 的問題。

先來想想個案例：假設使用者快速切換商品分類，最後顯示的產品結果是哪個分類的？

例如：快速切換 `category` 從 "clothes" -> "electronics" -> "books"。這確實是使用者的真實操作，至少快速切換兩種分類是非常常見的操作行為。

答案是：「不確定」最後顯示的結果是哪個商品分類的產品！

**因為請求 API 的回應時間是不穩定的，所以無法永遠地保證回傳結果的次序。**

所以當「最後回傳的 API 結果商品分類」與「使用者切換到的商品分類」**不一致**時，就會有很大的問題：

```
使用者快速切換分類，幾乎同時發出多個請求：
category: "clothes" -> 發送請求 A
category: "electronics" -> 發送請求 B
category: "books" -> 發送請求 C 
// 預期最後要顯示 "books" 分類結果

本次操作的請求響應順序：
0.2s 請求 C 回應 -> setProducts(books)
0.5s 請求 B 回應 -> setProducts(electronics) 
0.8s 請求 A 回應 -> setProducts(clothes)  
// 糟糕！顯示錯誤的 "clothes" 分類資料
```
 
這個現象背後的原因概念是 Race condition。

在此快速理解 Race condition 的概念，可先看過它維基百科解釋：

> A **race condition** is the condition of an electronics, software, or other system where the system's substantive behavior is dependent on the sequence or timing of other uncontrollable events, leading to unexpected or inconsistent results.

>**競爭條件（race condition）** 是指在電子、軟體或其他系統中，當系統的實質行為依賴於其他不可控事件的順序或時序時所產生的狀況，這可能導致意外或不一致的結果。

乍看不好理解，我自己比較白話（相對不精確）的理解是「**系統中有依賴於『執行時機或次序』的行為，然而其『執行時機或次序是不穩定的狀態』，因此導致非預期、不穩定的結果發生。**」

有先延伸的思考可以探討：

首先若只有「一次性」的行為，是不會出現比較執行時機或次序的情境，所以真實發生的 Race condition，會是「**多個行為幾乎同時發生**」時，如果把這個概念應用到範例，就是「使用者快速切換 `category` 導致併發的 API 請求幾乎同時發生」。

再者重要的概念是「**依賴『非穩定』的執行時機與次序」導致「『不穩定』的結果發生**」，如果把此概念應用到範例，就是「每次請求個別 `products` API 執行時間是不穩定的，會導致無法確定最終回傳的究竟是哪個 `category` 的結果」。

結論來說是「當使用者快速切換 `category` 時，會導致併發的 API 請求，而最後完成的那項請求結果，並不一定是使用者最後切到的 `category` 結果，所以畫面會顯示錯誤的 `products`」，用圖示更易理解：

![race condition example](/images/articles/react-understand-useEffect-fetching-and-subscription/01.png)

此外，使用者還會看到產品列表閃爍的問題，因為每次 `setProducts(xxx)` 被觸發時都會導致畫面重新渲染。

#### 2. Memory leak 問題

再來談談 **Memory leak** 的問題。

關於 Memory leak 的警告在 React 中很常見。以本範例而言，如果當 `ProductList` 元件在 API 請求尚未完成時就被 unmount，此時若無妥善處理，API 請求完成後還是會執行 `setProducts`，這導致 React 跳出警告:

```
Warning: Can't perform a React state update on an unmounted component. 
This is a no-op, but it indicates a memory leak in your application.
```

這警告指出「你正在對已經 unmount 的元件執行 state 更新」。雖然這個操作不會造成程式崩潰(no-op)，但它代表著應用程式中存在記憶體洩漏(memory leak)的問題。

這邊來看個示範案例，假定有 `SearchPage` 使用到 `ProductList`：

```jsx
function SearchPage() {
  const [selectedCategory, setSelectedCategory] = useState('books');
  return (
    <div>
      <button onClick={() => setSelectedCategory('clothes')}>
        衣服
      </button>
      <button onClick={() => setSelectedCategory('books')}>
        書籍
      </button>
      {/* 當 selectedCategory 是 'books' 時才顯示商品列表 */}
      {selectedCategory === 'books' && (
        <ProductList category={selectedCategory} />
      )}
    </div>
  );
}
```

使用者進行相關操作會產生 Memory leak：

1. 進入頁面，`ProductList` 開始請求 "books" 分類的資料
2. 在 API 響應前，使用者點擊「衣服」按鈕
3. `selectedCategory` 變更為 "clothes"，讓 `ProductList` unmount
4. 稍後 "books" 的 API 請求完成，嘗試執行 `setProducts`
5. React 發出警告 Memory leak，因為在已 unmount 的元件執行 state 更新

稍微解釋在此情境下，為什麼會發生 Memory leak？

當開發者在元件中設置事件監聽器、timer 或發起 API 請求送進 State 時，JS 會在記憶體中保留這些資源的參考，以便後續使用。當 React 元件被 unmount 時，這些資源應引用該要被適當地清理掉，才能確保這些資源被清除。然而，如果沒有清理這些資源，即使元件已經不存在了，這些已經不需要使用的資源依然會被保留在記憶體中，形成所謂的 Memory leak 問題。

如果不管這個 React 警告，可能造成什麼問題？

- 效能降低：隨著時間推移，未被釋放的記憶體會不斷累積，導致記憶體資源不足，使得網頁變得緩慢卡頓。
- 網頁壞掉：當記憶體累積到極限後，會導致整個網頁崩潰，直接無法使用。出現類似「網頁無回應」的情況。

#### 3. 透過 cleanup 解決 Race condition 與 Memery leak

從上述探討中可以發現一件事情，無論 Race condition 或者 Memery leak 都跟 `setProduct` 有關：

- Race condition：因在使用者快速切換後，每次打回 API 都重新 `setProduct` 導致可能 set 錯誤分類的產品結果。
- Memery leak: 因在元件 unmount 後依然 `setProduct` 導致記憶體中殘留不必要的資料。

邏輯上能怎麼解決這些問題？

- Race condition：
  - 問題：因在使用者快速切換多個分類後，每次打回 API 都重新 `setProduct` 導致可能 set 錯誤分類的產品結果。
  - 解法：確保「只有使用者『最後一次』切換分類的產品結果才被執行 `setProduct`」顯示在畫面上，這樣就會是正確地顯示結果，同時畫面也不會閃爍。

- Memery leak: 
  - 問題：因在元件 unmount 後依然 `setProduct` 導致記憶體中殘留不必要的資料。
  - 解法：確保「元件 unmount 後，`setProduct` 不會被執行」，讓資料引用不會在 unmount 後觸發。

要怎麼最簡單地達成解法呢？

利用 `useEffect` 的 cleanup 方法，複習 cleanup 執行時機：

- 下一次執行 setup 前被呼叫
- component unmount 時被呼叫

所以開發者能利用 `useEffect` cleanup 加上 Closure 特性，在 `useEffect` 中加上 cancel flag 達成解法：

```jsx
function ProductList({ category }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // setup function 中設定 cancel flag
    let isCancelled = false; 

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/products?category=${category}`);
        const data = await response.json();
        // 只有在 isCancelled 為 true 時執行 setProducts
        if (!isCancelled) {
          setProducts(data);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    // cleanup: 
    // - 當每次執行新的 effect 前，將上一輪 cancel flag 設為 true
    // - 當元件 unmount 時，將 cancel flag 設為 true
    return () => {
      isCancelled = true;
    };
  }, [category]);

  // ... rest of the component
}
```

加上 cancel flag 後，來看看使用者實際執行切換會怎麼樣：

```
【使用者快速切換分類的情境】

- 使用者第一次切換到 "clothes" 分類 
- 執行 "clothes" effect, isCancelled(clothes) = false 並發送請求

- 使用者第二次切換到 "electronics" 分類
- 先執行上一輪的 cleanup，使 isCancelled(clothes) = true
- 執行 "electronics" effect, isCancelled(electronics) = false 並發送請求

- 使用者第三次切換到 "books" 分類
- 先執行上一輪的 cleanup，使 isCancelled(electronics) = true
- 執行 "books" effect, isCancelled(books) = false 並發送請求

// 預期最後要顯示 "books" 分類結果：

- 0.2s 請求 "books" 最先回應
- 因 isCancelled(books) = false, 成功執行 setProducts 顯示 books 結果

- 0.5s 請求 "electronics" 回應
- 因 isCancelled(electronics) = true, 不執行 setProducts 

- 0.8s 請求 "clothes" 最後回應
- 因 isCancelled(clothes) = true, 不執行 setProducts

// 成功！最終顯示正確的 "books" 分類資料！
```

```
【使用者立刻切換造成 unmount 的情境】

- 使用者先進入產品列表頁面，此時是 "clothes" 分類 
- 執行 "clothes" effect, isCancelled(clothes) = false 並發送請求

// 預期元件 unmount 後不會再被 setState：

- 然後使用者立刻切換到登入頁面，造成 ProductList 元件 unmount
- 執行 cleanup, isCancelled(clothes) = true
- 此時請求 "clothes" 的 API 結果回應
- 因 isCancelled(clothes) = true, 不會執行 setProducts

// 成功！與預期一致，unmount 的元件不再 setProducts
```

雖然解法蠻單純就是在 `useEffect` 的 setup, cleanup function 中加上 flag 而已，但我覺得如果直接提解法反而會忽略最重要的理解問題情境，所以花不少篇幅在細談問題的脈絡。

### 如何透過 cleanup 機制取消不必要的 API 請求

至此已經透過 cleanup 處理 Race condition 與 Memory leak 的問題，然而目前還有能優化之處，就是**能取消不必要的 API 請求**。

例如當使用者快速從 clothes 分類切換到 books 分類時，其實前者 clothes 的 API 請求已經不必要了，如果能立刻取消，那也能節省網路請求的資源，尤其時使用者快速切換多個分類時，取消前面多個 API 請求的效益還不錯。

概念上和 cancel flag 很類似，先前在 cleanup 中將 cancel 設定成 true 達成取消更新 state 的功能; 現在則是需要 **在 cleanup 中用某些方式，將 fetch 請求停止**，就能達成將上一輪的 effect 請求停止以及將 unmount 元件的請求停止。

這邊需要利用能讓非同步操作在完成前捨棄的 [`AbortController` API](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)，搭配 `fetch` 中的 `signal` 參數，就能讓直行到一半的 `fetch` 在 cleanup 中被停止。

透過程式碼解釋：

```jsx
function ProductList({ category }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    // 建立 AbortController 實例 abortController
    const abortController = new AbortController();

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/products?category=${category}`,
          {
            // 將 abortController 的 signal 傳給 fetch
            signal: abortController.signal
          }
        );
        const data = await response.json();
        if (!isCancelled) {
          setProducts(data);
        }
      } catch (err) {
        // 另外處理 fetch API 請求被取消的錯誤
        if (err.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        if (!isCancelled) {
          setError(err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProducts();

    // 透過 cleanup 同時處理：
    // 1. 狀態更新的取消
    // 2. API 請求的取消 
    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [category]);

  // ... rest of the component
}
```

這邊稍微思考會注意到一件事，就是有了 abort 後，似乎不需要 cancel flag！因為：
1. AbortController 的 abort 會導致 fetch 請求拋出 AbortError，直接進入 catch block
2. 在 catch block 中，已經處理 AbortError 的情況，此時會直接 return，不會執行後續的 state 更新
3. 由於請求被中斷，因此不會執行到 `setProducts`、`setError` 和 `setIsLoading`

所以可簡化成：

```jsx
function ProductList({ category }) {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const abortController = new AbortController();

    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/products?category=${category}`,
          {
            signal: abortController.signal
          }
        );
        const data = await response.json();
        setProducts(data);
      } catch (err) {
        if (err.name === 'AbortError') {
          console.log('Fetch aborted');
          return;
        }
        setError(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();

    return () => {
      abortController.abort();
    };
  }, [category]);

  // ... rest of the component
}
```

透過上述 cleanup 中 `abortController.abort()` 能達成：
- 每次執行新一輪 effect 前，取消上一輪的 API 請求
- 每次 unmount 時，取消執行中的 API 請求

如此一來，就能讓 API 請求資源得到更好的釋放。

---

## 深入 `useEffect` 中 subscription 的使用

在 React 應用中，除了 data fetching 外，另一個常見的 Side Effect 是「訂閱/取消訂閱外部事件或資源」，其中一個典型的案例是使用 Web API 的 [Intersection Observer](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) 。這類情境下，開發者需特別注意訂閱的建立與清理，以避免產生記憶體洩漏或重複訂閱等問題。

### useEffect 中 subscription 基本應用與潛在問題

首先用 Intersection Observer 做個簡單範例 hook `useIntersectionObserver`：

```js
const useIntersectionObserver = ({ 
  rootMargin = "0px", 
  threshold = 0, 
  onIntersect 
}) => {
  const rootRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          onIntersect(entry.isIntersecting);
        }
      },
      {
        root: rootRef.current,
        rootMargin,
        threshold
      }
    );

    observer.observe(target);

    // ❌ 問題：建立訂閱但沒有清理機制
    // 事件監聽器、Websocket 等「訂閱/取消訂閱外部事件或資源」會遇到類似問題
  }, [rootMargin, threshold, onIntersect]);

  return { rootRef, targetRef };
};
```

這邊有幾個問題：
- **Memory leak**：unmount 時訂閱沒有被取消，依然存在，會造成記憶體資源備佔用。
- **重複訂閱**：當依賴改變時（e.g. threshold 改變）新的 observer 被建立，但舊的依然存在。並且持續累積多個 observer 實例，都沒有被清除。

由於前面段落的內容已經談了很多 cleanup，這邊蠻直覺的知道在每次 effect 開始前，以及每次 unmount 時，需要取消不必要的資源引用，這當然包含訂閱機制。

所以在此能透過 cleanup 清除不必要的訂閱：

```js
const useIntersectionObserver = ({ 
    rootMargin = "0px", 
    threshold = 0, 
    onIntersect 
}) => {
  const rootRef = useRef(null);
  const targetRef = useRef(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          onIntersect(entry.isIntersecting);
        }
      },
      {
        root: rootRef.current,
        rootMargin,
        threshold
      }
    );

    observer.observe(target);

    // ✅ 加入 cleanup 解決問題
    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [rootMargin, threshold, onIntersect]);

  return { rootRef, targetRef };
};
```

前後差異在於「**加入 cleanup 後能確保訂閱的資源被正確釋放**」，在此又再次驗證 cleanup 的重要性。

### 如何透過 useRef 避免不必要的重新訂閱

雖然上述的 `useIntersectionObserver` 看似完好，然而有個潛在的問題在於 `onIntersect` 的依賴項目，會導致不必要的重新訂閱 `IntersectionObserver`。

來看個使用 `useIntersectionObserver` 的例子：

```jsx
// 使用情境
function ScrollTracker() {
  const [count, setCount] = useState(0);

  // useIntersectionObserver 每次 render 都會重新執行
  const { targetRef } = useIntersectionObserver({
    // 此函式每次 render 都會重新創建，但內容並沒改變
    onIntersect: (isIntersecting) => {
      if (isIntersecting) {
        setCount(c => c + 1);
      }
    }
  });

  return <div ref={targetRef}>{count} times visible</div>;
}
```

大部分情況下 `onIntersect` 內的邏輯和資料可能是不會變動的，但卻因為 `onIntersect` 本身 reference 的改變，而導致在 `useIntersectionObserver` 中 `useEffect` setup 不必要地被重新執行導致訂閱重來。

如果這時候開發者解決問題的方式是在 `useEffect` 依賴項目中直接移除 `onIntersect`，那會造成其他問題，像是若遇到外部傳入的 `onIntersect` 內真的有邏輯或資料改變呢？這時候是會有問題的。

於是要解決這個問題需要達成：
1. 避免 `onIntersect` 的 reference 改變就造成 `useEffect` 重新執行。
2. 但當 `onIntersect` 改變時，依然要更新 `useEffect` 中的 `onIntersect` 資料。

這時候，就能透過 `useRef` 來處理這種不必要的重新訂閱問題。

1. 利用 `useRef` 創建 `onIntersectRef` 儲存 `onIntersect`
2. 在 `new IntersectionObserver` 中，使用 `onIntersectRef.current` 替代 `onIntersect`，如此就不需依賴 `onIntersect`
3. 新增一個 `useEffect` 確保 `onIntersect` 改變時，要更新 `onIntersectRef.current` 內容

來看看改變後的程式碼：

```js
const useIntersectionObserver = ({ 
  rootMargin = "0px", 
  threshold = 0, 
  onIntersect 
}) => {
  const rootRef = useRef(null);
  const targetRef = useRef(null);
  // 利用 useRef 儲存 onIntersect
  const onIntersectRef = useRef(onIntersect);

  // 讓 onIntersectRef.current 同步最新的 onIntersect
  useEffect(() => {
    onIntersectRef.current = onIntersect;
  }, [onIntersect]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // 使用 ref 儲存的 onIntersect 資料
          onIntersectRef.current(entry.isIntersecting);
        }
      },
      {
        root: rootRef.current,
        rootMargin,
        threshold
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [rootMargin, threshold]); 
  // ✅ onIntersect 不再是依賴，不再導致不必要的重新訂閱

  return { rootRef, targetRef };
};
```

### 使用 useEventCallback 的封裝進一步優化

這邊可以將 `useRef` 相關邏輯封裝成 hook 函式，藉此讓相關邏輯能複用在未來有需要的地方，將這個命名為 `useEventCallback`，這個命名包含兩個意涵：

1. Event: 處理事件，通常是指未來才會被執行的邏輯。
2. Callback: 用在 Callback 函式。

```js
/** 封裝 useEventCallback hook **/
const useEventCallback = (callback) => {
  const callbackRef = useRef(callback); // 將 callback 儲存在 ref
  
  useEffect(() => {
    callbackRef.current = callback; // 確保 ref 中 callback 持續更新
  }, [callback]);
  
  // 這邊需注意要再用 useRef.current 封裝確保 return 的值記憶體 reference 不變
  return useRef((...args) 
    => callbackRef.current(...args)
  ).current;
};
```

透過這個 `useEvenCallback` 能夠確保 return 的 callback function 記憶體位置是穩定不變，無需被當成依賴項目，藉此減少不必要的重新執行，同時還能確保永遠拿到最新 callback 的值。

使用上很簡單：

```js
import useEventCallback from './useEventCallback.js'

/** 用 useEventCallback 優化的 useIntersectionObserver hook **/
const useIntersectionObserver = ({ 
  rootMargin = "0px", 
  threshold = 0, 
  onIntersect 
}) => {
  const rootRef = useRef(null);
  const targetRef = useRef(null);
  
  // 使用 useEventCallback 包裝 callback
  const stableOnIntersect = useEventCallback(onIntersect);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          // 使用記憶體位置穩定的 stableOnIntersect
          stableOnIntersect(entry.isIntersecting);
        }
      },
      {
        root: rootRef.current,
        rootMargin,
        threshold
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
      observer.disconnect();
    };
  }, [rootMargin, threshold]);

  return { rootRef, targetRef };
};
```

當然 `useEventCallback` 可以應用在更多情境，像是：

```jsx
import useEventCallback from './useEventCallback.js'

function ChatRoom({ onMessage, roomId }) {
  const [messageCount, setMessageCount] = useState(0);

  // 確保 handleMessage 是穩定，無須依賴
  const handleMessage = useEventCallback((data) => {
    onMessage(data);
    setMessageCount(count => count + 1);
  });

  useEffect(() => {
    const ws = new WebSocket(`ws://chat/${roomId}`);
    ws.onmessage = (event) => handleMessage(event.data);
    return () => ws.close();
  }, [roomId]); // 只有 roomId 改變時，才會再次同步 Effect
}
```

其實有很多 library 都已經封裝好 `useCallback` 這類的邏輯，只需要知道何時使用即可，像是 [MUI 中的 useCallback](https://github.com/mui/material-ui/blob/master/packages/mui-utils/src/useEventCallback/useEventCallback.ts)，有興趣可以自行閱讀原始碼。

總結來說，在使用這類 `useEffect` 中「訂閱/取消訂閱外部事件或狀態」時，需要注意：

1. 記得要用 cleanup 取消訂閱
2. 可以考慮使用 `useEventCallback` 這類邏輯去優化 callback

---

## 總結來說，使用 `useEffect` 時需要注意的事項

本篇寫了不少篇幅，著重在使用 `useEffect` 的主要情境和使用時需要注意的問題脈絡，最後用比較列點的方式來說說使用 `useEffect` 時，需注意的主要事項：

1. 在處理元件 side effect 時才需考慮使用 `useEffect`，例如：API 請求, 訂閱外部事件或狀態等
2. `useEffect` 依賴項目的概念是持續「同步」依賴項目的資料狀態
3. `useEffect` 要搭配 `react-hooks/exhaustive-deps` 的 ESLint 規則，確保依賴項目的正確性
4. `useEffect` 的 cleanup 函式很重要，會在每次執行 setup 前、每次 unmount 時執行 cleanup
5. 在處理 `useEffect` 中的 Race condition 或 Memory leak 問題時，都能先思考 cleanup 的應用
6. 在 `useEffect` 中有使用到元件傳入的 callback 時，可以考慮用 `useEventCallback` 優化，確保 callback 的記憶體引用不變，減少不必要的重新訂閱

其實 `useEffect` 的使用確實不容易，尤其在牽涉到複雜依賴鏈時，真的會需要多熟悉官方文件、使用已經封裝好相關邏輯的 Library，以及愛用 ESLint 這類自動化檢測工具進行開發啊。

希望本篇文章中觀念或案例的分享，有幫助到看完本篇文章的人，能夠更理解 `useEffect` 的使用方式啦。

---

#### 參考資料

- [useEffect official doc](https://react.dev/reference/react/useEffect)
- [useEventCallback MUI code](https://github.com/mui/material-ui/blob/master/packages/mui-utils/src/useEventCallback/useEventCallback.ts)
- [react-compiler project](https://github.com/reactwg/react-compiler/discussions)
- [React 思維進化](https://www.tenlong.com.tw/products/9786263337695)
- 與[Claude 3.5 Sonnet](https://claude.ai/new)共編



