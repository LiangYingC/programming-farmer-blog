---
title: 透過程式範例，熟悉 JS 執行流程的關鍵：Event Loop
date: 2021-07-25
description: 在學習 JavaScript 執行流程時，一定會需要深入理解 Event Loop，其中包含 Call Stack、Callback Queue、Macrotasks、Microtasks 等概念，將在本文中整理說明，期待閱讀完後，就能更完整地回答 promise 與 setTimeout 混在一起時，誰先執行的相關問題。
category: javaScript
---

## 前言

前陣子回 AppWorks School，擔任模擬面試官，準備非同步題目時，發現對於 `Event Loop` 的概念有些遺失，尤其是關於 `Task(macrotask)` 與 `Microtask` 的執行順序和流程。過往也沒用文字梳理相關知識，藉此寫偏文章整理我對 `Event Loop` 及相關觀念的理解。

期許閱讀完文章後，能大致回答下面幾個問題：

1. 為何 `JavaScript` 可以非同步執行任務？
2. 什麼是 `Event Loop` ?
3. 什麼是 `Task(Macrotask)` 與 `Microtask`？
4. `Event Loop` 的運作流程？
5. 如何避免 `Event` 處理成本高時，造成的卡頓問題？

最後一個段落，還會提供幾題混雜 `setTimeout` / `Promise` 的範例，來練習測驗是否真正理解程式運作流程哦（也是面試可能遇到的考題ＸＤ）。

接著就先開始理解第一個觀念： `Call Stack`。

<hr>

## 在 Call Stack 中，一次執行一項任務

`JavaScript` 是單線程 (Single Thread) 的語言，一次僅能執行一項任務。可以結合 `Call Stack(執行堆疊)` 的運作概念來理解這件事情。

`Call Stack` 或稱作 `Execution Stack`是一個紀錄著目前程式執行狀態的空間。在 `JavaScript` 運行時，會將所執行到的任務，先移入到 `Call Stack` 中最上方，待執行完畢後，才會將該項任務移出。

透過下方這段程式碼的運行，來理解 `Call Stack`：

```javascript
function fn1() {
  console.log('fn1');
}

function fn2() {
  fn1();
  console.log('fn2');
}

function fn3() {
  fn2();
  console.log('fn3');
}

fn3();
// 印出的順序為 fn1 -> fn2 -> fn3
```

程式碼運行的步驟如下：

1. `fn3` 被呼叫，移入 Stack 最上方執行。
2. 執行 `fn3` 時，遇到 `fn2` 並呼叫之，於是將 `fn2` 移入 Stack 最上方執行。
3. 執行 `fn2` 時，遇到 `fn1` 並呼叫之，於是將 `fn3` 移入 Stack 最上方執行。
4. 執行 `fn1`，印出 `'fn1'`，`fn1` 執行完畢，移出 Stack。
5. 執行在最上方的 `fn2`，印出 `'fn2'`，`fn2` 執行完畢，移出 Stack。
6. 執行在最上方的 `fn3`，印出 `'fn3'`，`fn3` 執行完畢，移出 Stack。

_p.s. 事實上 `Call Stack` 第一步該為「**執行全域環境 (Global execution context)**」其後才會開始堆疊每個 `function` 的執行環境。_

利用 [loupe](http://latentflip.com/loupe) 這套工具，就能更加具體、視覺化地理解整個運作流程：

![Call Stack on Loupe](/article/javaScript/javascript-browser-event-loop/01.gif)
_[(透過 loupe 網站自行玩玩看)](http://latentflip.com/loupe/?code=ZnVuY3Rpb24gZm4xKCkgewogICAgY29uc29sZS5sb2coJ2ZuMScpOwp9CgpmdW5jdGlvbiBmbjIoKSB7CiAgICBmbjEoKTsKICAgIGNvbnNvbGUubG9nKCdmbjInKTsKfQoKZnVuY3Rpb24gZm4zKCkgewogICAgZm4yKCk7CiAgICBjb25zb2xlLmxvZygnZm4zJyk7Cn0KCmZuMygpOyA%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

可以看到，當執行到某一行任務時，就會把該任務加入 `Call Stack` 中，如果是單純的一行程式(例如：`console.log`)，就會立刻被運行完畢，並移出 `Call Stack`。

但如果是運行到 `function` ，則會需要 `function` 內全部執行完畢 (return something or undefined) 後，才移出 `Call Stack`。

有趣的是，當第一個 `function` 中又呼叫第二個 `function` 時，會優先執行「比較晚被呼叫」的第二個 `function`，待第二個執行完後，才會再回到第一個 `function` 繼續執行，例如：`fn1` 雖然是最晚被執行的，卻是最早被執行完畢 ; 而 `fn3` 是最早被執行的，卻是最晚被執行完畢。

從程式運作的 GIF 圖中，可以看到 `function` 是會被堆疊上去的，而最上方的 `function`，會最早執行完畢被移出 `Call Stack`。

從這個 `Call Stack` 中，可以發現兩件事：

- `function` 的執行順序遵循「後進先出」（LIFO, Last In First Out）的模式。
- 一次只能執行在 `Call Stack` 中最上方的一個任務。

所以能想像到，假設有個任務耗時非常久，例如：網路請求取回資料(`XMLHttpRequest`) or `setTimeout(fn, 3000)` 等等，將會阻塞卡死下方所有任務。

<hr>

## Web APIs，讓同時執行多項任務變成可能

由於 `JavaScript` 一次僅能做一件任務，所以如果要解決單個任務運行過久的阻塞問題，會需要「其他機制」的協助。

這個其他機制會從哪裡來呢？就是從 `JavaScript` 的「執行環境」提供，執行環境像是 `Browser` 或是 `Node.js` 等等。

在 `Browser` 執行環境中，為了解決阻塞問題，有提供 `Web APIs` 協助處理需時較久的任務，例如：`XMLHttpRequest(XHR)`、`setTimeout`、`setInterval` 等等。

藉此讓原本同時間只能進行一項的任務，變成可以進行多項，因為多出來的項目，`Browser` 會幫忙處理。

而 `Web APIs` 協助處理完負責的邏輯後，會吐回 Callback 任務，Callback 任務不會直接被放回到 `Call Stack` 中，而是先排入 `Callback Queue` 中等待，當 `Call Stack` 為空時，才會將 `Callback Queue` 中的任務，移入 `Call Stack` 中，並開始執行。

![Call Stack + Web APIs + Callback Queue](/article/javaScript/javascript-browser-event-loop/02.png)

透過 `setTimeout` 的範例，來理解整個運作過程：

```javascript
function fn1() {
  console.log('fn1');
}

function fn2() {
  console.log('fn2');
}

function fn3() {
  console.log('fn3');

  setTimeout(fn1, 1000);
  // 1. 執行 setTimeout 時，會先丟給 Web API 倒數 0.1s。
  // 2. 倒數 0.1s 完畢，fn1 被轉移到 Queue 等待 Stack 清空。
  // 3. Stack 清空後，fn1 被轉移到 Stack 中執行。

  fn2();
}

fn3();
// 印出的順序為 fn3 -> fn2 -> fn1
```

![Browser Event Loop with setTimeout on Loupe](/article/javaScript/javascript-browser-event-loop/03.gif)
_[(透過 loupe 網站自行玩玩看)](http://latentflip.com/loupe/?code=ZnVuY3Rpb24gZm4xKCkgewogIGNvbnNvbGUubG9nKCdmbjEnKTsKfQoKZnVuY3Rpb24gZm4yKCkgewogIGNvbnNvbGUubG9nKCdmbjInKTsKICBmbjEoKTsKfQoKZnVuY3Rpb24gZm4zKCkgewogIGNvbnNvbGUubG9nKCdmbjMnKTsKICAKICBzZXRUaW1lb3V0KGZuMSwgMTAwMCk7CiAgCiAgZm4yKCk7Cn0KCmZuMygpOw%3D%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

執行的步驟如下：

1. `fn3` 被呼叫，移入 Stack 中執行。
2. 印出 `'fn3'`，接著執行到 `setTimeout(fn1, 1000)`。
3. 將 `fn1` 交給 Web API 倒數 0.1s，數完後 fn1 移到 Queue 等待。(**不阻塞 Stack**)
4. `fn3` 繼續執行，遇到 `fn2`，於是將 `fn2` 移入 Stack 最上方執行。
5. 印出 `'fn2'`，`fn2` 執行完畢，移出 Stack。
6. `fn3` 執行完畢，移出 Stack。
7. 將 Queue 中存在的 `fn1` 移入 Stack 中執行。
8. 印出 `'fn1'`，`fn1` 執行完畢，移出 Stack。

經由程式運作的 GIF 圖能具體看到兩個關鍵：

1. `setTimeout(fn1, 1000)` 的倒數 0.1s 並沒有阻塞 `Call Stack` 中任務的執行，因為是由 `Web APIs` 協助進行，藉此達成同時間多項任務的運行。
2. `setTimeout(fn1, 1000)` 並非保證 `fn1` 一定會在 0.1s 後執行，因為倒數完 0.1s 後，只是將 `fn1` 排入 `Callback Queue` 等待，直到 `Call Stack` 為空時，才會再將 `fn1` 移入其中執行。因此只能說是「保證會等待至少 0.1s 後，才執行 `fn1`」。

至此，已經可以理解為什麼 `JavaScript` 是 `single thread` ，執行時，卻可以同時進行多項任務。

<hr>

## 初探 Event Loop : 究竟是什麼？

其實前面所述之內容，已經包含 `Event Loop` 的概念。

概觀來說，「 所謂的 `Event Loop`，就是事件任務在 `Call Stack` 與 `Callback Queue` 間，非同步執行的循環機制。」這邊僅提及概觀，意思是還有細節的 `Task(Macrotask)`、`Microtask` 尚未說明，會在之後詳細介紹。

![Call Stack + Web APIs + Callback Queue + Event Loop](/article/javaScript/javascript-browser-event-loop/04.png)

需要強調一點，就是 `JavaScript` 語言本身沒有 `Event Loop`，而是要搭配「執行環境」後，才會有 `Event Loop` 機制。像是 `Browser` 或 `Node.js` 的執行環境下，就會有各自的 `Event Loop` 機制。

到此稍微整理重點：

- `Event Loop` 是一種處理非同步任務執行順序的機制。
- `Event Loop` 是在 JS 執行環境中才有的機制，例如：有 `Browser` 中的 `Event Loop`、`Node` 中的 `Event Loop` 等。
- `Browser Event Loop` 會關聯到 `Call Stack`、`Web APIs`、`Callback Queue` 間的交互作用。
  - 如果遇到 `setTimeout`、`XHR` 等非同步任務，就會交由 `Web APIs` 處理，不阻塞 `Call Stack`。
  - `Web APIs` 處理完非同步邏輯後，會將 Callback 任務丟回 `Callback Queue` 等待。
  - 當 `Call Stack` 為空後，就會收到 Callback 任務，並執行之。

附上這張 `Browser Event Loop` 的經典全貌圖，到此，應能大致理解這張圖的意涵。

![Browser Event Loop Whole Concept](/article/javaScript/javascript-browser-event-loop/05.png)

其中有個兩個特別的地方要提醒：

1. 在 `Callback Queue` 中，有各種不同類型的 `Queue`，像是 `Timer Queue`、`Network Queue` 等等，因此可以說，在 `Event Loop` 中，可能同時包涵多種類的 `Queue`。
2. Web APIs 並非只有協助耗時較久的任務，還有其他許多任務，像是 `DOM event(click, scroll...)` 等等，因此如果遇到 `onClick` 等事件，也會進入到 `Web API` + `Callback Queue` + `Call Stack` 的循環中。

關於第二點，直接用 loupe 操作示意：

![Browser Event Loop Example with onClick](/article/javaScript/javascript-browser-event-loop/06.gif)
_[(透過 loupe 網站自行玩玩看)](http://latentflip.com/loupe/?code=CmNvbnNvbGUubG9nKCd0b3AnKTsKCiQub24oJ2J1dHRvbicsICdjbGljaycsIGZ1bmN0aW9uIG9uQ2xpY2soKXsKICAgICAgICBjb25zb2xlLmxvZygnQ2xpY2snKTsKfSk7CiAKIGNvbnNvbGUubG9nKCdib3R0b20nKTsKIAoKIAoKCgoKCg%3D%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

可以看到每次點擊 Click 按鈕後，事件會先交由 `Web API` ，接著再進入到 `Callback Queue` 與 `Call Stack` 中，運行 `Event Loop` 機制。

<hr>

## 深入 Event Loop： Task(Macrotask) 與 Microtask

在 `Event Loop` 的運作中，事件任務其實有兩種型態，分別為 `Task(Macrotask) 大型任務` 與 `Microtask 微任務`。

從[這篇 MDN 上的文](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)中，可以得知兩者的定義如下：

### `Task(Macrotask) 大型任務`

> A **task** is any JavaScript code which is scheduled to be run by the standard mechanisms such as initially starting to run a program, an event callback being run, or an interval or timeout being fired. These all get scheduled on the **task queue**.

包含但不限於這些任務：

- 解析 HTML
- 執行 JavaScript 主線程式 (mainline)、script
- 更換 URL
- setTimeout、setInterval => callback event（傳入的第一個 cb fn 參數）
- 發布 Event 事件 => callback event (onClick、onScroll 等等)
- 獲取網路資源 => callback event (XHR 後的 callback fn)

_p.s. `Task` 其實就是坊間常聽聞的 `Macrotask`，本文從此開始也會用 `Task` 表述大型任務。_

這些 `Task` 被觸發後，會排入特定類別的 `Task Queue` 中，例如：`setTimeout`、`setInterval` 的 callback 會被排入 `Timer Queue`、Event 事件的 callback 會被排入 `DOM Event Queue` 中。

這種不同類型的 `Queue`，可以讓事件迴圈根據不同任務的類型，調整執行的優先權。例如：對於處理使用者輸入，這類強調立即反應的任務，可能就會給予較高的優先權。不過不同瀏覽器實作出來的結果都會不同，因此可以說是由瀏覽器決定何種類型會最先被執行。

意思是，**不同類型的大型任務，其處理優先順序，並沒有保證誰先觸發誰就先執行，這都還是要看瀏覽器如何實作**。

前面提過的 `Callback Queue` 其實就是指 `Task Queue`，概念圖如下：

![Browser Event Loop with Task Queue](/article/javaScript/javascript-browser-event-loop/07.png)

### `Microtask 微任務`

> A **microtask** is a **short function** which is executed after the function or program which created it exits and only if the JavaScript execution stack is empty, but before returning control to the event loop being used by the user agent to drive the script's execution environment.

顧名思義，microtask 就是較為小型的任務，其非同步 callback 不會被放入 `Task Queue` 中，而是會以 `Microtask Queue` 處理，包含但不限於：

- Promise then callback ([executor 是同步的](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Promise))
- MutationObserver callback

在此先關注實作上最常用到的 `Promise`。

`Microtask` 通常不會有 `Task` 那麼耗損效能，會盡量儘早執行，執行的時機，是在一個 `Task` 執行之後 `Call Stack` 為空時進行。

還記得先前提過還有些 `Event Loop` 的細節的任務運作沒介紹嗎？

沒錯，就是 `Microtask` 的概念，加入後，概念圖如下：

![Browser Event Loop with Task Queue and Microtask Queue](/article/javaScript/javascript-browser-event-loop/08.png)

至此，對於 `Task` 與 `Microtask` 有初步的理解，接下來要詳細的探討兩者在 `Event Loop` 中**運作循環的流程**。

<hr>

## Task(Macrotask) 與 Microtask 的運作流程

![Event Loop Flow with Task Queue and Microtask Queue](/article/javaScript/javascript-browser-event-loop/09.png)

這張圖是經典的 `Task` 與 `Microtask` 在 `Event Loop` 中的運作圖，來看看幾個重點：

1. 在一次的循環中，首先會先檢查 `Task Queue` 中，是否有 `Task` 存在，
2. 如果有 `Task` 就執行之，沒有就直接進入檢查 `Microtask Queue`。
3. 當進行完一個 `Task` 後，會進入檢查 `Microtask Queue` 是否有 `Microtask` 的階段。
4. 如果有 `Microtask` 就執行之，並且會將 `Microtask Queue` 中所有 `Microtask` 執行完畢後，才會進入下個 `render` 的階段。
5. 如果有需要 `render` 就渲染，不需要就不執行。接著再回到第一步。

從中可以發現一個關鍵是：**在單次的循環中，最多只處理一項大型任務，但是所有微任務都會被處理完畢**。

可從下面這段程式的執行過程來理解：

```javascript
<script>

console.log('script start');

setTimeout(function () {
  console.log('setTimeout callback');
}, 1000);

new Promise(function (resolve, reject) {
  console.log('promise 1 resolve');
  resolve();
}).then(function () {
  console.log('promise 1 callback');
});

new Promise(function (resolve, reject) {
  console.log('promise 2 resolve');
  resolve();
}).then(function () {
  console.log('promise 2 callback');
});

console.log('script end');

</script>

// 印出的順序 => 可先自行思考，接著看完運作流程會有答案。
```

1. 有 `script` 的 `Task` 存在，於是執行此 `Task`，開始跑 `script`。
2. 遇到 `console.log('script start')` 印出 `script start`。
3. 遇到 `setTimeout`，交給 `Web API` 非同步倒數，到數完畢後，丟到 `Task Queue` 等待執行時機。
4. 遇到 `promise 1`，先同步執行 `executor` 印出 `promise 1 resolve`。
5. `resolve` 完畢後，將 `promise 1` 的 `callback function` 丟到 `Microtask Queue` 等待執行時機。
6. 遇到 `promise 2`，先同步執行 `executor` 印出 `promise 2 resolve`。
7. `resolve` 完畢後，將 `promise 2` 的 `callback function` 丟到 `Microtask Queue` 等待執行時機。
8. 遇到 `console.log('script end')` 印出 `script end`。
9. 此時 `script` 這項 `Task` 執行完畢，進入檢查 `Microtask Queue` 是否有待執行項目的時機。
10. `Microtask Queue` 有 `promise 1` 與 `promise 2` 兩個 `callback`，會全部執行完畢，印出 `promise 1 callback` 與 `promise 2 callback`。
11. 此時 `Microtask Queue` 無項目，進入到是否 `render`，畫面可能更新。
12. 結束一輪的循環 ，重投開始新一輪循環。
13. 檢查 `Task Queue`，發現有先前 `setTimeout` 的 `callback`，執行印出 `setTimeout callback`。
14. 此時 `setTimeout callback` 這項 `Task` 執行完畢，進入檢查 `Microtask Queue` 是否有待執行項目的時機。
15. 此時 `Microtask Queue` 無項目，進入到是否 `render`，畫面可能更新。
16. 再次循環，發現已無任何任務，結束。

所以印出來的結果會是：

- 第一次循環

  - script start
  - promise 1 resolve
  - promise 2 resolve
  - script end
  - promise 1 callback
  - promise 2 callback

- 第二次循環
  - setTimeout callback

雖然 loupe 網站中沒有呈現 `Microtask Queue`，依然可視覺化地觀察程式的運作流程：

![setTimeout and promise execute flow on Loupe](/article/javaScript/javascript-browser-event-loop/10.gif)
_[(透過 loupe 網站自行玩玩看)](http://latentflip.com/loupe/?code=Y29uc29sZS5sb2coJ3NjcmlwdCBzdGFydCcpOwoKc2V0VGltZW91dChmdW5jdGlvbiAoKSB7CiAgY29uc29sZS5sb2coJ3NldFRpbWVvdXQgY2FsbGJhY2snKTsKfSwgMTAwMCk7CgpuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7CiAgY29uc29sZS5sb2coJ3Byb21pc2UgMSByZXNvbHZlJyk7CiAgcmVzb2x2ZSgpOwp9KS50aGVuKGZ1bmN0aW9uICgpIHsKICBjb25zb2xlLmxvZygncHJvbWlzZSAxIGNhbGxiYWNrJyk7Cn0pOwoKbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgewogIGNvbnNvbGUubG9nKCdwcm9taXNlIDIgcmVzb2x2ZScpOwogIHJlc29sdmUoKTsKfSkudGhlbihmdW5jdGlvbiAoKSB7CiAgY29uc29sZS5sb2coJ3Byb21pc2UgMiBjYWxsYmFjaycpOwp9KTsKCmNvbnNvbGUubG9nKCdzY3JpcHQgZW5kJyk7!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

這個例子蠻重要的，如果能理解，對於 `Event Loop` 的運作就有大致的理解，如果尚不太懂，可以多看幾次。

<hr>

## 如何透過 setTimeout 避免使用者操作卡頓

至少有兩種可能，會導致使用者操作卡頓：

1. 某個事件任務觸發頻率過高，導致該事件篩滿 `Task Queue`，其他 `Task` 被排擠。
2. 某個事件任務執行的處理成本過高，導致 `Call Stack` 光執行這個 `Task` 就過久。

當然還有其他可能，但先聚焦於這兩種常見的情境。

### 事件任務觸發頻率過高

最常見的例子，就是 `scroll`、`mousemove` 等事件，這兩個事件在使用者操作的情況下，瘋狂觸發的頻率極高，如果不做特別處理，可能會導致其他 `Task` 被卡住，無法執行，進而衍生出網頁有問題的狀況。

舉一個情境，下面這段程式中含有 `onClick` 與 `onMousemove` 兩種事件：

```javascript
// 在 Loupe 左下方整個 document 區塊，滑鼠滑動會觸發 mousemove 事件
$.on('document', 'mousemove', function onMousemove() {
  console.log('Mousemove Callback Execute');
});

// 在 Loupe 左下方 Click Me 按鈕，點擊後會觸發 click 事件
$.on('button', 'click', function onClick() {
  console.log('Click Callback Execute');
});
```

來看看運行結果：

![onMousemove without setTimeout on Loupe](/article/javaScript/javascript-browser-event-loop/11.gif)
_[(透過 loupe 網站自行玩玩看)](http://latentflip.com/loupe/?code=CgokLm9uKCdkb2N1bWVudCcsICdtb3VzZW1vdmUnLCBmdW5jdGlvbiBvbk1vdXNlbW92ZSgpewogICAgICAgIGNvbnNvbGUubG9nKCdNb3VzZW1vdmUgQ2FsbGJhY2sgRXhlY3V0ZScpOwp9KTsKIAogCiQub24oJ2J1dHRvbicsICdjbGljaycsIGZ1bmN0aW9uIG9uQ2xpY2soKXsKICAgICAgICBjb25zb2xlLmxvZygnQ2xpY2sgQ2FsbGJhY2sgRXhlY3V0ZScpOwp9KTsKIAoKIAoKCgoKCg%3D%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

注意右下 `Task Queue` 區塊，會發現到，由於一開始滑動到 Click Me 按鈕時，已觸發許多的 `mousemove` 事件，因此之後無論怎麼點擊按鈕，`onClick` 事件永遠會在一大群 `onMousemove` 事件之後，因此 `Click Callback Execute` 會被 `Mousemove Callback Execute` 卡住無法執行。

要解決這個問題，可以利用 `setTimeout` 的方式處理。

當觸發 `mousemove` 後，並非直接觸發 `Mousemove Callback Execute` 邏輯，而是先觸發 `setTimeout`，讓 `Mousemove Callback Execute` 先被排入 `Web API` 後，才會再被排入 `Task Queue`。

```javascript
// 在 Loupe 左下方整個 document 區塊，滑鼠滑動會觸發 mousemove 事件
$.on('document', 'mousemove', function onMousemove() {
  // 透過 setTimeout，讓 Click Callback Execute 有機會安插在 Mousemove Callback Execute 之間執行
  setTimeout(function timeoutCallback() {
    console.log('Mousemove Real Callback Execute');
  }, 0);
});

// 在 Loupe 左下方 Click Me 按鈕，點擊後會觸發 click 事件
$.on('button', 'click', function onClick() {
  console.log('Click Callback Execute');
});
```

直接來看運行結果 :

![onMousemove with setTimeout on Loupe](/article/javaScript/javascript-browser-event-loop/12.gif)
_[(透過 loupe 網站自行玩玩看)](http://latentflip.com/loupe/?code=CgokLm9uKCdkb2N1bWVudCcsICdtb3VzZW1vdmUnLCBmdW5jdGlvbiBvbk1vdXNlbW92ZSgpewogICAgc2V0VGltZW91dChmdW5jdGlvbiB0aW1lb3V0Q2FsbGJhY2soKXsKICAgICAgICBjb25zb2xlLmxvZygnTW91c2Vtb3ZlIFJlYWwgQ2FsbGJhY2sgRXhlY3V0ZScpOwogICAgfSwgMCk7Cn0pOwogCiAKJC5vbignYnV0dG9uJywgJ2NsaWNrJywgZnVuY3Rpb24gb25DbGljaygpewogICAgY29uc29sZS5sb2coJ0NsaWNrIENhbGxiYWNrIEV4ZWN1dGUnKTsKfSk7CiAKCiAKCgoKCgo%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

注意 `Task Queue` 區塊，會發現 `onClick` 事件，有機會安插在 `timeoutCallback` 之間執行，意思即為 `Click Callback Execute` 會在 `Mousemove Callback Execute` 之間執行，而不會被阻塞在所有的 `Mousemove Callback Execute` 之後。

因此運用 `setTimeout` 的非同步概念，是有機會解決(或減緩)第一個問題。

_p.s. 關於如何處理這種頻繁觸發的 event，延伸的概念為 Debounce 和 Throttle，有興趣可以再 Google。_

### 事件任務處理成本過高

一般而言，瀏覽器會試著在每秒鐘，可以更新頁面 60 次，讓畫面流暢反應。換句話說，每 16 ms，更新畫面一次。

而可以看到在 `Event Loop` 的最後一個階段，正是繪製、更新畫面，因此理想上，一次循環中「 `Task` 以及產生所有的 `Microtask`，都要在 16 ms 內完成」，如此一來，才能安全地保證畫面的運作順暢。

當一個 `Task` 處理的時間成本過高時，就可能導致使用者操作上卡頓的情況發生，因此如果有這種情況，可以透過拆解 `Task` 的大小，讓每次執行的 `Task` 時間成本降低。

在此將舉一個在 [忍者 JavaScript 開發技巧探秘第二版](https://www.books.com.tw/products/0010773867) 410 頁的範例程式碼，來做說明。

假定有段程式如下，會進行一個時間處理成本高的任務：

```javascript
const tbody = document.querySelector('tbody');

// 在 tbody 中，1 次建立 20000 個表格列
const rowCount = 20000;
for (let i = 0; i < rowCount; i++) {
  const tr = document.createElement('tr');

  // 每一個表格列，建立 6 個資料欄，每個欄位包含 1 個文字節點
  for (let t = 0; t < 6; i++) {
    const td = document.createElement('td');
    const tdText = document.createTextNode(`${i}-${t}`);
    td.appendChild(tdText);
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}
```

這段程式碼，總共要建立幾十萬個 DOM 節點，並還要寫入文字，因此執行成本是很高的，很容易阻礙使用者與頁面進行互動。

因此可以利用 `setTimeout` 將 `Task` 拆小，使頁面更流暢地進行繪製或互動。

```javascript
// 將 20000 切分成 4 個階段執行
const rowCount = 20000;
const devideInto = 4;
const chunkRowCount = rowCount / devideInto;

let iteration = 0;
const tbody = document.querySelector('tbody');

const generateRows = () => {
  // 在 tbody 中，1 次建立 5000 個表格列
  for (let i = 0; i < chunkRowCount; i++) {
    const tr = document.createElement('tr');
    // 每一個表格列，建立 6 個資料欄，每個欄位包含 1 個文字節點
    for (let t = 0; t < 6; t++) {
      const td = document.createElement('td');
      const tdText = document.createTextNode(`${i}-${t}`);
      td.appendChild(tdText);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  iteration++;

  // 如果尚未進行完畢，就再次將 generateRows 轉到 Web API 再丟進 Task Queue
  // 透過 setTimeout 讓原本執行 1 次 20000 個的 Task，轉為執行 4 次 5000 個的 Task
  if (iteration < devideInto) setTimeout(generateRows, 0);
};

// 啟動 generateRows，將 generateRows 轉到 Web API 再丟進 Task Queue
setTimeout(generateRows, 0);
```

其執行結果概念差異如下(圖取自書中 412 頁)：

![onMousemove with setTimeout on Loupe](/article/javaScript/javascript-browser-event-loop/13.jpg)

最重要的差異在於原本需要長時間才完成的任務，透過 `setTimeout` 的切分，讓網頁有機會重新繪製，中間也可能可以安插新的任務（由瀏覽器控管），因此避免畫面長時間的卡住。

上述例子中，設定 setTimeout 延遲 0 秒進行，代表的意義並非 0 秒後就會執行，而是至少 0 秒後進行。意思上相近於通知瀏覽器，儘早執行該項 `callback Task`。但同時間也賦予瀏覽器能夠在切分的 `Task` 與 `Task` 間重新調整的權利（例如：重新繪製畫面）。

<hr>

## 總結，回答前言中的那些問題

至此應可回答前言所提到的幾個問題：

### 一、 為何 `JavaScript` 可以非同步執行任務？

因為在不同的 `執行環境` 會有不同的 `API` 協助非同步任務的運行。

舉例而言，在 `Browser` 執行環境中，非同步的任務像是 `setTimeout`、`setInterval` 計時器的計時或是 `XHR` 網路請求等，都會由 `Web APIs` 提供協助進行處理。因此能讓單執行緒的 `JavaScript` 在 `Browser` 運行起來，是能同時間執行多項任務。

### 二、什麼是 `Event Loop` ?

`Event Loop` 是一種在 `JavaScript` 的執行環境中，處理非同步任務執行順序的機制。

舉例而言，在 `Browser` 執行環境中，非同步的任務會交由 `Web APIs` 進行處理，處理完後通常會有 `Callback Task` 這些 `Task` 會被丟到 `Callback Queue` 中等待，直到時機正確，就會被丟到 `Call Stack` 中執行。

而 `Event Loop` 就是在處理 `Callback Queue` 到 `Call Stack` 間，非同步任務執行順序的機制，其中包括 `Task` 與 ``Microtask` 的運作流程。

### 三、什麼是 `Task` 與 `Microtask`？

在 `JavaScript` 中的任務分為兩種，一種是 `Task` 大型任務，一種是 `Microtask` 微任務。

`Task`，是一個獨立自主的工作單位，包含著：`script 運行`、`setTimeout/setInterval callbacl`、`DOM event callback` 等等。其會被排入 `Task Queue` 中等待執行。

`Microtask`，相較於 `Task` 較為小型且較不損耗效能，通常要儘早執行，藉此幫助在繪製畫面前，更新完資料狀態。其會被排入 `Microtask Queue` 中等待執行。

在一次 `Event Loop` 的循環中，最多只會處理一項 `Task`，其餘在 `Task Queue` 繼續等待，但所有 `Microtask` 都會被處理完畢，`Microtask Queue` 會被清空。

### 四、`Event Loop` 的運作流程？

在一次的 `Event Loop` 運作流程中：

1. 首先會先檢查 `Task Queue` 中，是否有 `Task` 存在，
2. 如果有 `Task` 就執行之，沒有就直接進入檢查 `Microtask Queue`。
3. 當進行完一個 `Task` 後，會進入檢查 `Microtask Queue` 是否有 `Microtask` 的階段。
4. 如果有 `Microtask` 就執行之，並且會將 `Microtask Queue` 中所有 `Microtask` 執行完畢後，才會進入下個 `render` 的階段。
5. 如果有需要 `render` 就渲染，不需要就不執行。接著再回到第一步。

### 五、如何避免 `Event` 處理成本高時，造成的卡頓問題？

通常有可能是「事件觸發頻率過高」或「事件處理時間成本過高」，這兩種都有機會透過 `setTimeout` 或其所延伸出的 `throttle` 或 `debounce` 解決。

1. 事件觸發頻率過高：`setTimeout` 可以讓事件的 `Task` 先進入 `Web APIs` 倒數，之後才丟到 `Task Queue` 中，在停留在 `Web APIs` 倒數期間，其他的事件 `Task` 就能夠先行安插進 `Task Queue` 中執行，而不會永遠被卡在最後方。

2. 事件處理時間成本過高：`setTimeout` 可以讓處理成本高的單一 `Task` 拆分成多個 `Task`，藉此讓瀏覽器有機會運行重繪畫面或在之間安插其他任務。

### 總結感想

老實說，`Event Loop` 還有更多內容或細節可以探討，例如直接去閱讀 [HTML 規範文件](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops)，但就目前為止的觀念，應該能應付許多非同步的開發情境囉。當然拉，還有面試情境ＸＤ。

最後下方的內容，就直接看些實際的程式題，試試看回答印出來的結果會是什麼吧。

建議每個題目都可先想想看，再往下滑看答案喔。

<hr>

## 最後來點，promise 與 setTimeout 混雜執行的挑戰

```javascript
// 印出來的英文結果為何？

function fn1() {
  console.log('a');
}

function fn2() {
  console.log('b');
}

function fn3() {
  console.log('c');

  setTimeout(fn1, 0);

  new Promise(function (resolve) {
    resolve('d');
  }).then(function (resolve) {
    console.log(resolve);
  });

  fn2();
}

fn3();
```

1. 一開始運行的 `mainline script` 本身就是 `Task`，`Task` 開始運行。
2. 觸發 `fn3` 開始執行，接著印出 `c`。
3. 觸發 `setTimeout`，`fn1` 會經由 `Web API` 被丟到 `Task Queue` 中。
4. 觸發 `promise`，`console.log(resolve)` 被丟到 `Microtask Queue` 中。
5. 觸發 `fn2` 開始執行，接著印出 `b`。
6. 結束主線程的 `Task`，開始執行 `Microtask`，執行 `console.log(resolve)`，印出 `d`。
7. 進入下一輪 Event Loop，找到 `Task Queue` 中有 `fn1`，執行印出 `a`。

結果為：`c` -> `b` -> `d` -> `a`。

```javascript
// 印出來的英文結果為何？

function fn1() {
  console.log('a');
}

function fn2() {
  setTimeout(function () {
    new Promise(function (resolve) {
      console.log('b');
      resolve('c');
    }).then(function (resolveValue) {
      console.log(resolveValue);
    });
  }, 0);

  console.log('d');
}

function fn3() {
  console.log('e');

  setTimeout(fn1, 0);

  new Promise(function (resolve) {
    console.log('f');
    resolve('g');
  }).then(function (resolveValue) {
    console.log(resolveValue);
  });

  fn2();
}

fn3();
```

這題是上題的延伸，較需特別注意的是 `Promise` 的 `executor` (`Promise` 的 `callback`) 是同步執行，`then` 的 `callback` 才會是非同步執行。

結果為：`e` -> `f` -> `d` -> `g` -> `a` -> `b` -> `c`。

_[可透過 Loupe 自行玩看看](http://latentflip.com/loupe/?code=CgpmdW5jdGlvbiBmbjEoKSB7CiAgY29uc29sZS5sb2coJ2EnKTsKfQoKZnVuY3Rpb24gZm4yKCkgewogIHNldFRpbWVvdXQoZnVuY3Rpb24gKCl7CiAgICAgICBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7CiAgICAgICAgICAgY29uc29sZS5sb2coJ2InKTsKICAgICAgICAgICByZXNvbHZlKCdjJyk7CiAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNvbHZlVmFsdWUpIHsKICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNvbHZlVmFsdWUpOwogICAgICAgfSk7CiAgfSwgMCk7CiAgCiAgY29uc29sZS5sb2coJ2QnKTsKfQoKZnVuY3Rpb24gZm4zKCkgewogIGNvbnNvbGUubG9nKCdlJyk7CgogIHNldFRpbWVvdXQoZm4xLCAwKTsKCiAgbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgewogICAgY29uc29sZS5sb2coJ2YnKTsKICAgIHJlc29sdmUoJ2cnKTsKICB9KS50aGVuKGZ1bmN0aW9uIChyZXNvbHZlVmFsdWUpIHsKICAgIGNvbnNvbGUubG9nKHJlc29sdmVWYWx1ZSk7CiAgfSk7CgogIGZuMigpOwp9CgpmbjMoKTsKCiAKCgoKCgo%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

```javascript
setTimeout(function onTimeout() {
  console.log('timeout callback');
}, 0);

Promise.resolve()
  .then(function onFulfillOne() {
    console.log('fulfill one');
  })
  .then(function onFulfillTwo() {
    console.log('fulfill two');
  });

function innerLog() {
  console.log('inner');
}

innerLog();

console.log('outer');
```

這題轉換了些寫法，但概念與上面相同，值得注意的是 `Microtask` (`then callback`) 會被全部執行完畢，才會進入下個循環。

結果為：`inner` -> `outer` -> `fulfill one` -> `fulfill two` -> `timeout callback`。

```javascript
console.log('script start');

async function asyncOne() {
  await asyncTwo();
  console.log('async one');
}
async function asyncTwo() {
  console.log('async two');
}
asyncOne();

setTimeout(function onTimeout() {
  console.log('timeout callback');
}, 0);

new Promise(function (resolve) {
  console.log('promise executor');
  resolve();
}).then(function onFulfill() {
  console.log('fulfill');
});

console.log('script end');
```

這題特別需要注意的是 `Promise` 的語法糖 `aync` `await`，其實蠻單純的，就是在 `aync` 中，如果「遇到 `await`」就是同步進行(類似在 `executor`)，如果「沒有 `await`」就是非同步進行，一樣會被丟進 `Microtask Queue` 中等待。

結果為： `script start` -> `async two` -> `promise executor` -> `script end` -> `async one` -> `fulfill` -> `timeout callback`。

其中 `script start` -> `async two` -> `promise executor` -> `script end` 是第一個循環中的 `Task` 階段，`async one` -> `fulfill` 是第一個循環中的 `Microtask` 階段，`timeout callback` 是第二個循環中的 `Task` 階段。

假設上述題目還有不理解的內容，會建議將本文再看過一遍理解看看，或是直接閱讀下方參考文件的部分，或許有更適合你吸收的文章喔！

<hr>

#### 【 參考資料 】

- [所以說 event loop 到底是什麼玩意兒？| Philip Roberts | JSConf EU](https://www.youtube.com/watch?v=8aGhZQkoFbQ)
- [我知道你懂 Event Loop，但你了解到多深？](https://yeefun.github.io/event-loop-in-depth/)
- [Day 11 [EventLoop 01] 一次弄懂 Event Loop（徹底解決此類面試問題）](https://ithelp.ithome.com.tw/articles/10241081)
- [JS 原力覺醒 Day15 - Macrotask 與 MicroTask](https://ithelp.ithome.com.tw/articles/10222737)
- [忍者 JavaScript 開發技巧探秘第二版：Chapter13 搞懂事件](https://www.books.com.tw/products/0010773867)
