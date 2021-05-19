---
title: JS 變數傳遞探討：pass by value 、 pass by reference 還是 pass by sharing？
date: 2021-05-20
description: 在 JS 中，時常會聽到基本型別(Primitive type)的變數是 pass by value，物件型別(Object)的變數是 pass by reference 的說法，然而當深入探詢後，卻又會發現 pass by sharing，更甚至會聽到 JS 都是 pass by value，究竟是怎麼回事呢？
category: javaScript
---

## 前言

如同這篇 Huli 所寫的《[深入探討 JavaScript 中的參數傳遞：call by value 還是 reference？](https://blog.techbridge.cc/2018/06/23/javascript-call-by-value-or-reference/)》文章中提到的一句話：「會再重新回來研究參數傳遞這個問題完全是個美麗的錯誤，我本來要寫的主題是深拷貝跟淺拷貝。」會寫這篇也是美麗錯誤呢。

原本僅是在工作中遇到關於 object `淺拷貝(Shadow copy)`與`深拷貝(Deep copy)`的問題，打算研究拷貝的主題並寫篇文章，然而文章寫下去就發現要先解釋 `pass by reference` 的變數傳遞方式，才能更好地解釋：為什麼會需要淺拷貝與深拷貝。

ok，這麼一來就先簡單寫 `pass by value` 以及 `pass by reference` 當作淺深拷貝文章開頭即可吧？並非如此，因為深究後才發現還有 `pass by sharing` 以及 `JavaScript 都是 pass by value 的說法`，這些是我過往所不知道的知識呀。

因此資料讀著讀著，就決定輸出成文，一來覺得非常有趣，二來資料量頗大，三來整理輸出過後的知識才是自己的，於是開始這趟探討 JavaScript 中的 `pass by value` 、 `pass by reference` 以及 `pass by sharing`之旅囉。

<hr>

## Primitive type（基本型別）與 pass by value（傳值）

先來看段 code ，快速地理解 `pass by value`(或稱為 `call by value`)的概念

```javascript
let a = 5;
let b = a;

console.log(a); // 5
console.log(b); // 5

a = 10;

console.log(a); // 10
console.log(b); // 5
```

上面這段 code，主要做兩件事：

1. 宣告變數 `a`，並且將 `a` 賦值為 `5`，接著宣告變數 `b` 並且複製 `a` 變數，讓 `b = a`，這時候印出來的值都是 `5`。
2. 將變數 `a` 重新賦值為 `10`，觀察看看是否會影響到複製的變數 `b`。

結果而言，複製的變數 `b` 的值，並不會跟著變數 `a` 值的改變而改變，背後的原因是**當變數傳遞的方式為 `pass by value` 時，複製變數時，會完全複製一份新的「值 (value)」**，如下圖的概念：

_p.s 本文的附圖都是便於理解抽象概念所做，實際在記憶體運作往往更加複雜。_

![pass by value data 1](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/01.png)

變數以變數表的概念儲存於記憶體中，分為「變數本身」以及「變數所對應的資料」。以 `pass by value` 的變數而言，資料會直接以「值 (value)」的形式儲存於名為 stack 的記憶體空間（較小的空間但相對存取快），因此複製變數時，連資料的值也一起複製 pass 過去，就形成全新的值。因此改變原本變數 `a` 的值，並不會影響到新的變數 `b` 的值。

那什麼樣的變數資料會以 `pass by value` 的方式處理呢？答案是 `基本型別(Primitive type)` 的資料，例如：`string`、`number`、`boolean`、`null`、`undefined`、`symbol` 的資料類型，都是 `pass by value`。

以上這些資料的值，都會直接儲存於 stack 空間中，概念如下圖：

![pass by value data 2](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/02.png)

<hr>

## Object（物件型別）與 pass by reference（傳址）

接著來到 `pass by reference`(或稱為 `call by reference`)，一樣先看段 code

```javascript
let a = { number: 5 };
let b = a;

console.log(a); // { number : 5 }
console.log(b); // { number : 5 }

a.number = 10;

console.log(a); // { number : 10 }
console.log(b); // { number : 10 }
```

上面這段 code 主要做兩件事：

1. 宣告變數 `a`，並且將 `a` 賦值為物件 `{ number : 5}`，接著宣告變數 `b` 並且複製 `a` 變數，讓 `b = a`，這時候印出來的值都是 `{ number : 5}`。
2. 利用 `a.number = 10` 將變數 `a` 改變為 `{ number : 10}`，觀察看看是否會影響到複製的變數 `b`。

結果而言，很明顯地發現到：複製的變數 `b` 的物件值，會跟著變數 `a` 值的改變而改變，都變成 `{ number : 10}`。背後的原因是**當變數的傳遞方式為 `pass by reference` 時，資料會以「地址 (reference)」的形式儲存於 stack 中，真正的值會儲存在名為 Heap 的記憶體空間中（空間較大但相對存取慢），而地址會再指向真正的變數值。**

當使用 `by reference` 的變數時，其實是先到 stack 中查找到資料的地址，接著再透過地址查找到真正的值。

因此當 b 複製 a 時，其實僅是複製了 a 變數在 stack 中儲存的地址，並沒有複製值，而「同個地址」背後都是指向「同樣的值」 `{ number : 5}`，所以 a 將值改變成 `{ number : 10 }` 的時候，b 的值也會跟著改變成 `{ number : 10 }`，如下方示意圖：

![pass by reference data 1](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/03.png)

![pass by reference data 2](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/04.png)

到此為止，就大致了解 `pass by value` 以及 `pass by reference` 的概念和行為。

<hr>

## 咦，怎麼又冒出個 pass by sharing ?

先不多說，上個簡單的範例 code

```javascript
let a = { number: 5 };
let b = a;

console.log(a); // { number : 5 }
console.log(b); // { number : 5 }

a = { number: 10 };

console.log(a); // { number : 10 }
console.log(b); // { number : 5 } 那尼！！！居然沒有跟著改變！！！
```

老樣子，先描述上面這段 code ：

1. 宣告變數 `a`，並且將 `a` 賦值為物件 `{ number : 5}`，接著宣告變數 `b` 並且複製 `a` 變數，讓 `b = a`，這時候印出來的值都是 `{ number : 5}`。
2. 利用將變數 `a = { number: 10 }` 將 `a` 重新賦值為 `{ number : 10}`，觀察看看是否會影響到複製的變數 `b`。

這邊特別注意的是，與上一個例子不同的地方在於，並非以 `a.number = 10` 的方式修改變數 `a`，而是利用 `a = { number: 10 }` 直接「重新賦值」`a` 變數。就結果而言，**可以發現到，如果是利用重新賦值的方式(等於定義新的物件對象)，就不會影響到複製出來的 `b` 變數！**

概念如下圖，在 Heap 中新增 `{ number : 10 }` 及對應的新地址，而 `a` 的資料會更新成新產生的地址：

![pass by sharing data 1](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/05.png)

![pass by sharing data 2](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/06.png)

這種改變的行為概念上似乎混合了兩種形式：

- **pass by reference** : 複製時的確是複製地址（reference），似於 by reference。
- **pass by value** : 由於重新賦值時，等同於複製新的值，似於 by value。

如果 `Object type` 是全然地 `by reference` ，那麼在重新賦值時，就應該跟著改變，但它並沒有。在技術上，這種行為偏向稱為 `pass by sharing`(或稱為 `call by sharing `、`call by object` 等)。

到這邊可以稍微整理，複製變數後，改變「原始變數(上例的 `a`) 」對「複製的新變數(上例的 `b`) 」造成的影響：

- 如果遇到**基本型別 (Primitive type)**，那麼複製的新變數「不會」跟著原始變數的改變而改變，表現出的行為結果是 `pass by value`。
- 如果遇到**物件型別 (Object)，且僅針對物件的內容做改變**，那麼複製的新變數「會」跟著原始變數的改變而改變，表現出的行為結果是 `pass by reference`。
- 如果遇到**物件型別 (Object)，且對物件做重新賦值**，那麼複製的新變數「不會」跟著原始變數的改變而改變，表現出的行為結果是 `pass by value`。

因此綜合上述，便有種說法是：在 JavaScript 中，`Primitive type` 的變數資料是 `pass by value`，而 `Object` 的變數資料是 `pass by sharing`(綜合了 `pass by value` / `pass by reference`)。
。

補充一下，雖然上面的說法是：改變 `a` 對 `b` 造成的影響，但反過來也一樣，如果在 `pass by value` 表現行為的情況下，改變 `b` 並不會對 `a` 造成影響 ; 如果在 `pass by reference` 表現行為的情況下，改變 `b` 是會對 `a` 造成影響的喔，如下面程式範例。

```javascript
let a = { number: 5 };
let b = a;

console.log(a); // { number : 5 }
console.log(b); // { number : 5 }

b.number = 10; // 改變 b，最後也會對 a 造成影響！

console.log(a); // { number : 10 }
console.log(b); // { number : 10 }
```

這邊的思考重點其實是「腦中要有變數表的圖在跑」，回顧 reference 被複製的圖後，會發現兩變數會互相影響是很合理的現象，再次附圖供參考。

![pass by reference data 1](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/03.png)

<hr>

## function 中的傳遞參數，行為如同複製變數

到這邊會不會有個想法是，為什麼會叫做「`pass`」by value / reference / sharing 呢？

如過以複製變數的概念來看，較不好理解為何會叫做「`pass`」 by value / reference / sharing，但是如果以 function「傳遞」參數的維度思考，就較容易理解這個命名。先講個重點：**傳遞參數的行為，就如同複製變數**，來看幾個範例就會慢慢理解這句話的意思 。

```javascript
function test(primitiveData) {
  primitiveData = primitiveData + 5;
  console.log(primitiveData); // 10
}

let a = 5; // primitive data
test(a);

console.log(a); // 5 => 沒被改變
```

以執行的流程面來閱讀上面的 code：

1. 宣告變數 `a` 賦值為基本型別的資料 `5`。
2. 將 `a` 丟進 `test` function 中，此時會將 `primitiveData` 會複製 `a`，可以想像成 `primitiveData = a`，形成 function 中新的區域變數。
3. 由於變數資料是基本型別，是 `pass by value`，`a` 與 `primitiveData` **各自的值互相獨立**。
4. 因此改變任一變數並不會互相影響，所以最後印出的結果沒有改變，都是 `5`。

概念的圖解如下：

![primitive data with function 1](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/07.png)

![primitive data with function 2](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/08.png)

```javascript
function test(objectData) {
  objectData.number = 10; // 改變物件內容，無重新賦值
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);

console.log(a); // { number: 10 } => 跟著改變
```

同樣關注執行流程：

1. 宣告變數 `a` 賦值為物件型別的資料 `{ number : 5}`。
2. 將 `a` 丟進 `test` function 中，此時會將 `objectData` 會複製 `a`，可以想像成 `objectData = a`，形成 function 中新的區域變數。
3. 由於變數資料是物件型別，且透過 `objectData.number = 10` **改變物件內容，沒有重新賦值，都是指向「 同樣的 reference 」**。
4. 因此 `a` 與 `objectData` 會互相影響，最後印出的 `a` 是 `{ number: 10 }`，被改變了。

概念的圖解如下：

![object data with function 1](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/08.png)

![object data with function 2](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/09.png)

```javascript
function test(objectData) {
  objectData = { number: 10 }; // 物件重新賦值
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);

console.log(a); // { number: 5 } => 沒被改變
```

同樣關注執行流程：

1. 宣告變數 `a` 賦值為物件型別的資料 `{ number : 5}`。
2. 將 `a` 丟進 `test` function 中，此時會將 `objectData` 會複製 `a`，可以想像成 `objectData = a`，形成 function 中新的區域變數。
3. 由於變數資料是物件型別，透過 `objectData = { number : 10 }` **重新賦值，因此 `a` 與 `objectData` 是指向「 不同的 reference 」**。
4. 因此 `a` 與 `objectData` 不會互相影響，最後印出的 `a` 是 `{ number: 5 }`，沒有被改變。

概念和上面的例子很相似，差異就在於「重新賦值」是產生新的物件以及新地址：

![object data with function 3](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/11.png)

根據上面的三個例子，能明白**可將傳遞參數的過程視為複製變數來思考**，就能理解為何在某些情況下 `function` 內部變數與外部變數會相互影響，某些情況下又不會，一切的源頭都與變數對應的資料是 `值(value)` 或 `地址(reference)` 有關囉。

<hr>

## 為什麼有 JavaScript 都是 pass by value 的說法 ?

再次回顧無論是複製**基本型別**變數與複製**物件型別**變數的概念表：

![pass by value and pass by sharing](/article/javascript/javascript-pass-by-value-pass-by-reference-pass-by-sharing/12.png)

如果不去管變數表中的資料欄位，被複製的到底是原本的值或是地址，直觀地來看，其實都是在複製「資料欄位內儲存的值」。假如角度是以：**複製時傳遞的都是「資料欄位內儲存的值(value)」來看的話，就有可能會被視為 JavaScript 都是 pass by value**。因此才會有相關的說法產生。

<hr>

## 總結：比起技術名詞，更該在意「複製變數的過程是如何運行的」

如果查詢許多國內外資料後，就會發現對於這些技術名詞的定義或描述，其實並沒有一個窮微性的存在能證明誰是絕對正確的。

- JavaScript 都是 `pass by value`
- JavaScript 中，`Primitive type` 的變數資料是 `pass by value`，而 `Object` 的變數資料是 `pass by sharing`

如同上面這兩句話，其實都可以說是對的，端看對於「value」的定義是什麼、從哪個角度看待。

我認為，**最重要的是探討這些技術名詞定義或技術語句的「過程」，這些過程讓我更了解在 JavaScript 中「複製變數」會產生的行為與結果，而複製變數，則是開發中很常會遇到的情況，所以很實用**。

如果要有重點更方便於記憶的話，我的重點條列是：

1. 如果是 `Primitive type` 的變數值，例如：`const a = 5`，那麼複製變數時，是會複製「原始的值(value)」。
2. 如果是 `Object` 的變數值，例如：`const a = { number : 5 }`，那麼複製變數時，是會複製「地址(reference)」，地址背後會指向原始的值。
3. 將外部變數當作參數，傳入 function 時，就代表在 funcion 作用域中，複製外部變數，產生新的內部變數。

這三句話，都是指「複製變數的過程是如何運行的」，而我認為這些過程是最關鍵的。只要腦中有變數複製的過程在運行（那張變數表的圖），就會很清楚原始變數與複製變數的變化，究竟會不會互相影響了。

具體展現的結果，化做程式範例再次統整：

```javascript
/*** 基本型別 ***/
function test(primitiveData) {
  primitiveData = primitiveData + 5;
  console.log(primitiveData); // 10
}

let a = 5; // primitive data
test(a);
console.log(a); // 5 => 沒被改變

/*** 物件型別之改變內容 ***/
function test(objectData) {
  objectData.number = 10; // 改變物件內容，無重新賦值
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);
console.log(a); // { number: 10 } => 跟著改變

/*** 物件型別之重新賦值 ***/
function test(objectData) {
  objectData.number = 10; // 改變物件內容，無重新賦值
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);
console.log(a); // { number: 10 } => 跟著改變
```

最後呢，用兩篇文章的段落來總結：

「在《松本行弘的程式設計世界》的〈語彙與共通語言的重要性〉這篇文章中，作者談到，為某個概念決定適當的名詞，目的是在設計時能有共同的語彙，也能讓開發者意識到它們的存在，這才是名詞存在的真正意義。」—《[技術名詞紛爭多](https://www.ithome.com.tw/voice/94877)》

技術名詞是為了便於溝通和理解概念而存在，如果用以吵架，那就沒有意義了。

「技術名詞是為了描述概念而存在，而不是概念為了技術名詞而存在。最重要的是背後期望表達的概念，也就是體現出來的『行為』。」—《[你不可不知的 JavaScript 二三事#Day26：程式界的哈姆雷特 — Pass by value, or Pass by reference？](https://ithelp.ithome.com.tw/articles/10209104)》

這句話完全體現了我整理文章後的心得。

希望看完這篇整理的你，能更理解變數資料在複製時，產生的行為囉。

<hr>

#### 【 參考資料 】

- [你不可不知的 JavaScript 二三事#Day26：程式界的哈姆雷特 —— Pass by value, or Pass by reference？](https://ithelp.ithome.com.tw/articles/10209104)
- [深入探討 JavaScript 中的參數傳遞：call by value 還是 reference？](https://blog.techbridge.cc/2018/06/23/javascript-call-by-value-or-reference/)
- [重新認識 JavaScript: Day 05 JavaScript 是「傳值」或「傳址」？](https://ithelp.ithome.com.tw/articles/10191057)
- [基本資料型別和參考資料型別 Primitive Data Type & Reference Data Type - 彭彭直播](https://www.youtube.com/watch?v=43VI2zWSpd0)
- [Is JavaScript a pass-by-reference or pass-by-value language?](https://stackoverflow.com/questions/518000/is-javascript-a-pass-by-reference-or-pass-by-value-language)
- [11.2. By Value Versus by Reference](https://docstore.mik.ua/orelly/webprog/jscript/ch11_02.htm)
- [技術名詞紛爭多](https://www.ithome.com.tw/voice/94877)
