---
title: FP
date: 2021-07-25
description: 在學習 JavaScript 執行流程時，一定會需要深入理解 Event Loop，其中包含 Call Stack、Callback Queue、Macrotasks、Microtasks 等概念，將在本文中整理說明，期待閱讀完後，就能更完整地回答 promise 與 setTimeout 混在一起時，誰先執行的相關問題。
category: javaScript
---

## 複習些 functional programming 的觀念

> 如果熟悉 FP 可跳過這個段落。

如果真的想理解 Redux Middleware 以及其 Source Code，就一定要先理解 functional programming 的部分觀念和實作，否則將相當挫折。

因此先複習 functional programming 部分觀念，僅針對與 Redux Middleware 有關的部分重點說明，藉此讓接下來實作 Redux Middleware 相關功能更加地順利。

### 一、High order function (HOF)

JavaScript 中，函式為一等公民，意思是函式**能被作為函式的參數使用**或**能被作為函式回傳的結果使用**。滿足下列其一，即可稱為 Higher-order function (HOF) ：

- 傳入 function 參數的 function
- return function 的 function

```javascript
/* 1. listener function can be a argument of subscribe function. */
function subscribe(listener) {
  let isSubscribed = true;

  listeners.push(listener);

  /* 2. subscribe function can return unsubscribe function */
  return function unsubscribe() {
    if (!isSubscribed) {
      return;
    }

    const index = listeners.indexOf(listener);
    listeners.splice(index, 1);

    isSubscribed = false;
  };
}
```

### 二、Currying

Currying 算是基於 HOF 所衍生出的概念之一，定義為：**把帶有多個參數的函式，轉換成一次帶一個參數的多個連續函式**。

光看定義不易懂，直接看案例更具體：

```javascript
/* Without Currying */
function add(x, y) {
  return x + y;
}

const result = add(5, 10); // 一個步驟算出結果

/* With Currying */
function add(x) {
  return function (y) {
    return x + y;
  };
}

const result = add(5)(10); // 兩個步驟算出結果
```

將 Currying 的函式改寫成箭頭函式會更簡潔：

```javascript
/* Currying concept by arrow function */
const add = x => y => x + y;

const result = add(5)(10); // 兩個步驟算出結果
```

好處是**可以將每個步驟做成獨立功能並重新命名，增加獨立性與可讀性**。

舉實際程式碼案例：實作取得 9 折的優惠價格，非 Currying 與 Currying 的比較如下：

```javascript
/* Without Currying */

function getDiscountPrice(price, discount) {
  return price * discount;
}

const price = getDiscountPrice(100, 0.9);

/* With Currying */

const getDiscountPrice = discount => price => price * discount;

// 抽象獨立出打 9 折的專用 function，增加可讀性和專一功能性，藉此讓使用更安全
// 由於 closure 特性，所以 0.9 並不會被 Garbage collection 機制回收
const getTenPercentOff = getDiscountPrice(0.9);

const price = getTenPercentOff(100);
```

### 三、Compose

Compose 算是基於 HOF 所衍生出的概念之一，定義為：**傳入 compose 的多個 function 參數，最後會被組合為單一 function，並由最右方參數的 funcion 開始執行**。

同樣光看定義不容易懂，程式碼的實踐如下：

```javascript
const compose = function(fn1, fn2, fn3) {
  return function(x) {
    return fn1(fn2(fn3(x)); // fn1、fn2、fn3 被組合為一個 function 執行並回傳
  };
};

function consoleSentence(sentence) {
    return console.log(sentence)
}

function toUpperCase(sentence) {
    return sentence.toUpperCase();
};

function exclaim(sentence) {
    return sentence + '!'
};

// 呼叫後，會由最右邊的 toUpperCase callback 開始執行
const shout =
    compose(consoleSentence, exclaim, toUpperCase)

shout("send in the clowns") // "SEND IN THE CLOWNS!"
```

改為箭頭函式的寫法：

```javascript
const compose
    = (fn1, fn2, fn3) => (x) => fn1(fn2(fn3(x));
```

傳入無限數量的 fn 的寫法：

```javascript
const compose =
  (...fns) =>
  x =>
    fns.reversed().reduce((prev, fn) => fn(prev), x);

// or

const compose =
  (...fns) =>
  x =>
    fns.reduceRight((prev, fn) => fn(prev), x);
```

至此已經快速複習了 HOF、Currying、Compose 的觀念，接著來實作 Redux Middleware 相關功能吧！

- [[JS] Functional Programming and Currying ｜ PJ](https://pjchender.dev/javascript/js-functional-programming-currying/)
- [[Day04] Currying, Pointfree, Higher Order Function ｜ 林子暘](https://pjchender.dev/javascript/js-functional-programming-currying/)
