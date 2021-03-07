---
title: 宣告變數， var 與 let / const 差異
date: '2020-10-25'
description: '2019 開始學 JS 時，已經倡導使用 let / const，然而網路上資料常有 var，它們差異在哪？'
category: 'JavaScript'
---

如果你像我一樣在 2019 年時開始學 JS，多少會有個疑惑：學習時是用 `let / const` 宣告變數，怎麼網路上查詢的 JS 程式碼，有些是用 `var` 宣告變數的呢？它們之間有什麼差異？

因好奇驅使，於是誕生這篇談 「 `var` 」 與 「 `let / const` 」 幾項差異的文，大綱如下：

- ES6 後，從 var 到 let / const
- var 是函式作用域，let / const 是區塊作用域
- var 與 let ，for 迴圈的綁定（bind）差異
- var 的提升與 let / const 不同
- var 允許重複宣告，let / const 會出錯

_p.s. 第三部分 for loop 是我覺得最有趣且難解釋的，推薦閱讀＆討論 !_

<hr>

## ES6 後，從 var 到 let / const

為何現在 (2019) 學習的是 `let / const` ，卻在網上看到 `var` 宣告變數 ？

因為目前 JavaScript 主流是 ES6 版本，在這個版本中，是推薦使用 `let` 和 `const` 宣告變數，而在網上查詢的資料，很可能是 ES6 版本前撰寫的程式碼，那時候宣告變數的方式還是用 `var` 語法。

總言之，在 ES6 版本後，會推薦用 **`let`** 與 **`const`** ，而非 **`var`** 宣告變數（原因本文會有說明）。

而`var` 與 `let` / `const` ，主要有幾項差異：

- **作用域 (scope) 不同**
- **for 迴圈的綁定 (bind) 差異**
- **變量提升 (hoisting) 不同**
- **重複宣告的差異**

這些改變的主要好處是： **讓 JS 變數的操作更加嚴謹，減少不直覺、出錯或重複宣告的可能性，藉此讓多人或個人大型開發更順利**。接下來將一一討論及舉例，文中是我理解後的解釋脈絡，如有誤，歡迎不吝指正。

<hr>

## var 是函式作用域，let / const 是區塊作用域

在 ES6 前，並沒有區塊作用域（block scope）的概念，僅有全域（global scope）與函式作用域（function scope），所以 `var` 宣告的變數，具有函式作用域（function scope）的性質，代表**切分最小單位的有效範圍是 function**。

直到 ES6 後，新增區塊切分的概念， `let / const` 宣告的變數，才具有區塊作用域（block scope）的性質，**切分最小單位的有效範圍是 blcok**。

而所謂的**作用域就是「變數有效的作用範圍」**，最大為全域作用範圍，意指變數有效範圍是全部範圍。而上文所稱的區塊是指 `{ }`大括號範圍 。

綜合整理：

- **`var` 具有「函式作用域」**，亦即在函式中宣告的變數，有效作用範圍會被限制在該函式中。但不具有區塊作用域，所以在區塊中宣告的變數，依然會作用到區塊之外，並不會被區塊限制住。
- **`let / const` 具有「區塊作用域」**，亦即在區塊中宣告的變數，有效作用範圍會被限制在該區塊中。

看例子更好懂，在區塊`{ }`中，用` var` / `let`，宣告柯基犬的名字為吐司來看看結果。

```javascript
/// 「var」 不受區塊限制，區塊外變數存取成功。///

{
  var corgiDogName = '吐司';
}

console.log(corgiDogName);
//吐司
```

```javascript
///「let」會受區塊限制，區塊外變數存取失敗。///
{
  let corgiDogName = '吐司';
}

console.log(corgiDogName);
//ReferenceError: corgiName is not defined
```

雖然 `var` 不受區塊限制，但會受到函式範圍限制，如下:

```javascript
/// 「var」 受函式限制，函式外變數存取失敗。///

function callCorgi() {
  var corgiDogName = '吐司';
}

console.log(corgiDogName);
//ReferenceError: corgiDogName is not defined
```

```javascript
/// 即使用 var 宣告相同的變數名稱 dogName，但因為「 函式作用域 」，所以不會讓同名變數衝突。 ///

//將柯基犬命名為吐司，之後用 callCargi() 呼叫
function callCargi() {
  var dogName = '吐司';
  console.log(dogName);
}

//將米克斯犬命名為厚片，之後用 callMix() 呼叫
function callMix() {
  var dogName = '厚片';
  console.log(dogName);
}

callCargi(); //吐司
callMix(); //厚片
```

由上述範例，可以看出限定作用域範圍有兩個好處：

1. **避免同名變數的衝突。**
2. **能維持最小權限的原則，以避免變數資料被不當存取。**

而過往用 `var` 宣告，僅有 function 函式範圍有這樣的好處，而**如今用 `let / const ` 宣告，就能讓上述好處發生在 if、for 等「 區塊作用域 」當中，藉此降低多人協作或大型專案的衝突情況**。

<hr>

## var 與 let ，for 迴圈的綁定（bind）差異

讓我們用一個經典案例作為第二部分的開場。

```javascript
/// 用 for 迴圈執行五次，每隔 0.1 秒會印出 i ///

for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 100);
}
```

你覺得上述的程式執行的結果為何？

（Ａ） 0 、 1 、 2
（Ｂ） 3 、 3 、 3

是不是 A 啊 ～ No ～ No ～ No ～ 其實是 B 哦。

我想很多沒學過 `var` 的人，包括我，都會直覺性的選擇 A ，因為如果我們學的是 `let` ，而**將 `var` 替換成 `let` ，答案就會是 A** ，這不是更符合 for 的效用嗎！！！ 可惜事與願違，真正執行的結果會是 B。

上述預期結果應該是 0 1 2 ，卻莫名變成 3 3 3，正與宣告變數語法 `var / let` 有關。究竟怎麼了？

要解釋這個問題，要分成兩點討論：

1. **`setTimeout()` 的時間延遲，與 function 中 `console.log(i)` 的「 執行時間點 」。**
2. **function 中 `console.log(i)` 的「 值怎麼來 」的。**

首先來看第一點，當進入 for 迴圈時，宣告變數 `var i = 0` ，並開始條件判斷，當 `i < 3` 時， `i + 1`，執行完後，接著需要等待 0.1 秒的時間，才會進行 `setTimeout()` 內的 `function() { console.log( i ) ; }`。

而 JavaScript 是「異步/非同步」語言，因此在等待執行 `function() { console.log( i ) ; }` 前的這 0.1 秒內，會先執行完已經能執行的 for 迴圈。

所以現在能理解第一點的結論：
`function` 中，**`console.log( i )` 的執行時間點會在 for 迴圈執行完畢之後**。

```javascript
///因為非同步與延遲時間，所以會先執行完 for 迴圈後，才執行 function。///

for (var i = 0; i < 3; i++) {
  // for 迴圈正在 murmur : 還要等你 setTimeout 0.1 秒，不如我先做一做，不要浪費時間。
  setTimeout(function () {
    console.log(i);
  }, 100);
}
// 3 3 3
```

澄清一下，目前為止所提的第一點，其實與 `var` 和 `let` 的差異是沒關係的，只是說明非同步和時間點的狀況。接著進入到第二點，`console.log(i)` 的值是怎麼來的，這就與 `var` 和 `let` 的差異有關了。

`var` 是函式作用域，這段 for 迴圈程式碼外沒有任何包覆，所以 **`var` 所宣告的 `i` 會存在於全域 window (瀏覽器) 當中，且只會被綁定（bind）一次，也可以說是共用一個 instance**。

加上 for 迴圈會先跑完，才 `console.log( i )`，所以最後 `console.log( i )` 的值會才會是 3。

至於 `let` 則是「 區塊作用域 」每次 i 都會被紀錄在創造出來的區域中，**更精確地說，是每次迭代都會建立一個新的環境（context），而這個環境會紀錄當下的變數 i 值，不會覆蓋掉上一個環境裡面的變數值，因此可以產生多個 `i` 值。**。

我有做張示意圖，便於理解「整體概念」，但細節上可能有出入。

![for loop with let and var](https://i.imgur.com/PQ05GIL.png)

讓們適時地整理一下，在 for 迴圈中，

- **`var` 的情況只會綁定一次，而且不具區塊作用域**，最終會只有一個值存在於全域中（以此例而言），也可以說只有一個 instance。
- **`let` 的情況會發生重複綁定，而且具有區塊作用域**，或者說多個紀錄變數的環境，最終會有多的值存在於 for 迴圈區塊中，也可以說會有多個 instance。

就實作而言，雖然僅有 var 的情況下也可以用「立即呼叫執行函式 IIFE」處理這樣的狀況，但較為複雜且不直覺，改用 let 後，就能簡單處理，且能更直覺地知道 for 迴圈結果啦！

```javascript
///將 var i 改為 let i 後，輕易解決問題。///

for (let i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 100);
}
// 0 1 2
```

```javascript
///不改 var i 的情況下，以 IIFE 相對複雜且不直覺。///

for (var i = 0; i < 3; i++) {
  (function (x) {
    setTimeout(function () {
      console.log(x);
    }, 100 * x);
  })(i);
}
// 0 1 2
```

呼，接下來進入倒數第二 part，剩下的 part 字數較少 ， 你就快看完了！

<hr>

## var 的提升與 let / const 不同

讓我們再次以一個問題開始 :

```javascript
console.log(i);
var i = 5;
```

你覺得上述的程式執行的結果為何？

- （Ａ） 5
- （Ｂ） ReferenceError
- （Ｃ） undefined

可以想一下 XD

如果你跟我一樣比較少使用 `var` ，常使用 `let` 的話，應該會認為是（Ｂ） ReferenceError。當然，不會那麼容易，印出來的結果其實是 （Ｃ） undefined。

非常不直覺啊...，因為 `undefined` 代表找不到值，已經被宣告，但尚未賦值，而 `ReferenceError` 則表示根本找不到 `i` ，尚未宣告。所以一般而言，會預期上述程式碼結果應該為「尚未宣告變數的`ReferenceError`」。

但以結果來說，卻是印出`undefined` ，即是代表：**雖然我們看不見，但其實在 `console.log(i)` 之前，`i` 就已經被宣告了，只是尚未賦值。**

是不是頗違反直覺，因為 `console.log(i)` 前，根本沒有程式碼...。上述狀況，我們可以想像成下面這段程式碼來表示：

```javascript
///由於 var 直接變量提升，所以上面程式碼等同下面程式碼///

console.log(i);
var i = 5;
//undefined

var i;
console.log(i);
i = 5;
//undefined
```

這其中是因為 `var` 有著「**提升（hoisting）**」的特性，其實不僅是 `var` ，function 也有這個特性。**以 `var` 宣告變數而言，「 變數提升 」簡而言之是: 在執行任何程式碼前，會把變數放進記憶體中，這樣的特點是，可以在程式碼宣告該變數之前使用它。**

```javascript
/// 因為 hoisting，所以可以在宣告變數前，就預先使用變數，所以可以寫完後一起宣告///

i = 2;
n = 3;
console.log(i + n);
var i;
var n;
// 5
```

在這樣的情況下，只需要有賦值就不會出錯，即使尚未宣告變數也不會出錯。

這樣會造成什麼問題？當養成了「 後宣告 」的習慣，如果最後忘了用 `var` 宣告呢？並不會出錯，只是變數會跑到全域中，變成全域變數，可能造成些 bug，像是：

```javascript
/// 函式中沒有用 var 宣告，導致污染到全域 ///

var x = 1;

function addFunc(y) {
  x = 100;
  x = x + y;
}

addFunc(50);
console.log(x);
// 150，預期應該要是 1，但函式中的 x 跑出來了
```

而在 `let` 中呢，相對的 hoisting 是較安全的（ `let` 還是有 hoisting，只是情況不同，可以搜尋關鍵字 TDZ ），所以 **習慣用 `let` 的開發者，通常會先宣告變數，而不會習慣先運算變數後宣告的情況，藉此降低開發出錯的機率** 。

```javascript
/// 先使用變數，後宣告會直接「出錯」，更嚴謹的養成先宣告，後使用///

console.log(i);
let i = 5;
//ReferenceError

i = 5;
console.log(i);
let i;
//ReferenceError
```

這樣的使用方式除了降低錯誤外，也相對直覺。

<hr>

## var 允許重複宣告，let / const 會出錯

最後再提一個能幫助防止開發錯誤或衝突的小地方，就是用 **`var` 可以重複宣告同樣名稱的變數，而 `let / const` 如果重複宣告同名變數會出錯**。

```javascript
var myDogName = '吐司';
var myDogName = '厚片';
console.log(myDogName);
//厚片

let myDogName = '吐司';
let myDogName = '厚片';
console.log(myDogName);
//SyntaxError: Identifier 'myDogName' has already been declared

const myDogName = '吐司';
const myDogName = '厚片';
console.log(myDogName);
//SyntaxError: Identifier 'myDogName' has already been declared
```

這點對初學者或多人學做而言更能防止錯誤、容易尋找到錯誤所在。

<hr>

## var 與 let / const 差異總結

啊啊不知不覺寫了頗長，但整理、學習的過程又讓再次了解、複習迴圈的細部運作與變量提升等等，算是蠻好玩的 !

內容比較多，在此三點總結：

1. **`var` 屬於函式作用域，`let/const`屬於區域作用域**，後者能避免更多情況下的同名變數與提取變數衝突、區塊內變數污染到全域的情況，且讓 for loop 使用更直覺方便。
2. **`var` 會自動提升變數，`let/const` 則較為嚴謹**，後者能避免忘記宣告變數或因無宣告讓變數污染到全域的情況。
3. **`var` 能重複宣告同名變數，`let/const` 不能重複宣告同名變數**，後者能避免些開發上的錯誤情況。

綜合來說就是 **`let/const` 將宣告變數變得更加嚴謹，藉此增加易讀性、防止出錯**，而最重要的 CTA ，我想就是：

**在 JS 中，不要再用 var 請都使用 let / const 宣告變數吧！**

#### 【 特別感謝 】

感謝 **Jason Wu** 在 `var / let` for loop 時給予的觀點與諮詢。
<br>

#### 【 參考資料 】

- [重新認識 JavaScript: Day 18 Callback Function 與 IIFE | Kuro Hsu](https://ithelp.ithome.com.tw/articles/10192739)
- [鐵人賽：ES6 開始的新生活 let, const | 卡斯伯](https://wcc723.github.io/javascript/2017/12/20/javascript-es6-let-const/)
- [Day 05 : ES6 篇 - let 與 const | eyesofkids](https://ithelp.ithome.com.tw/articles/10185142)
- [[JavaScript] 你應該使用 let 而不是 var 的 3 個重要理由 | realdennis](https://medium.com/@realdennis/%E6%87%B6%E4%BA%BA%E5%8C%85-javascript%E4%B8%AD-%E4%BD%BF%E7%94%A8let%E5%8F%96%E4%BB%A3var%E7%9A%843%E5%80%8B%E7%90%86%E7%94%B1-f11429793fcc)
- [let keyword in the for loop | stack overflow](https://stackoverflow.com/questions/16473350/let-keyword-in-the-for-loop)
- [JavaScript 入門篇付費課程 | 六角學院](https://www.hexschool.com/courses/javascript.html)
