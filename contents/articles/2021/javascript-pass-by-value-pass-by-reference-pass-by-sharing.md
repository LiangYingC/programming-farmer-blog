---
title: JS 變數傳遞探討：pass by value 、 pass by reference 還是 pass by sharing？
date: 2021-05-20
description: 在 JS 中，時常會聽到基本型別 (Primitive type) 的變數是 pass by value，物件型別 (Object) 的變數是 pass by reference 的說法，然而當深入查找後，又會發現 pass by sharing，更甚至看到 JS 都是 pass by value，究竟是怎麼回事呢？本文將由記憶體儲存變數的方式、複製變數的方式談起，一步步理解 JS 中的 pass by value、pass by reference 以及 pass by sharing。
tag: javaScript
---

## 前言

如同這篇 Huli 所寫的《[深入探討 JavaScript 中的參數傳遞：call by value 還是 reference？](https://blog.techbridge.cc/2018/06/23/javascript-call-by-value-or-reference/)》文章中提到的一句話：「會再重新回來研究參數傳遞這個問題完全是個美麗的錯誤，我本來要寫的主題是深拷貝跟淺拷貝。」會寫這篇也是如此。

原本僅是在工作中遇到關於 object `淺拷貝(Shallow copy)`與`深拷貝(Deep copy)`的問題，打算研究拷貝主題並寫篇文章，然而文章寫下去就發現要先解釋 `pass by reference` 的變數傳遞方式，才能更好地解釋：為什麼會需要淺拷貝與深拷貝。

ok，這麼一來就先簡單寫 `pass by value` 以及 `pass by reference` 當作淺深拷貝文章開頭即可吧？並非如此，因為深究後才發現還有 `pass by sharing` 以及 `JavaScript 都是 pass by value 的說法`，這些是我過往所不知道的知識呀。

因此資料讀著讀著，就決定輸出成文，一來覺得非常有趣，二來資料量頗大，三來整理輸出過後的知識才是自己的，於是開始這趟探討 JavaScript 中的 `pass by value` 、 `pass by reference` 以及 `pass by sharing`之旅囉。

---

## 在記憶體中的基本型別 (Primitive type) 與物件型別 (Object) 資料

想好好理解 `pass by value`、`pass by reference`、`pass by sharing` 的概念，會需要理解 JS 的幾個項目：

1. 兩種資料型別。
2. 變數資料儲存在記憶體中的概念。
3. 複製變數的行為和結果。
4. 函式中傳遞變數的行為和結果。
5. 有上述的知識，就能理解 `pass by value`、`pass by reference`、`pass by sharing` 囉！

從第一個項目開始，在 JS 中，有兩種資料型別分別為：

- 基本型別 (Primitive type)：**代表單一值**，如 `string`、`number`、`boolean`、`null`、`undefined`、`symbol`。
- 物件型別 (Object)：**代表一組完整的概念，是資料的集合體**，可以將多個基本型別放入其中，物件也有自己的屬性或方法，如 `object`、`array`、`function`。

```javascript
// 基本型別的變數資料
const a = 5;
const b = '15';
const c = true;
const d = null;
const e = undefined;
......
```

```javascript
// 物件型別的變數資料
const objectData = {
  a: 'one',
  b: 2,
  c: true,
};
const arrayData = [1, 2, 3, 4, 5];
......
```

兩者資料型別有個很大的差異在於「儲存在記憶體中的方式不同」。

在記憶體中，變數並非直接對應到資料的值，而是會先對應到一個記憶體位置，記憶體位置才會對應到真正的資料，概念如下圖：

_p.s 本文的附圖都是便於理解抽象概念所做，實際在記憶體運作往往更加複雜。_

![primitive data in memory](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/01.png)

`Stack` 是相對小但存取相對快的記憶體空間，變數會以變數表的概念儲存於其中，表中包含：「變數名稱」、「記憶體位置」、「資料的值」。

剛有提到 `Primitive type data` 與 `Object data` 儲存在記憶體中的方式不同：

- 基本型別 (Primitive type)：在 `Stack` 中，**會直接儲存資料值 (value)**，如上面那張圖，都是 `Primitive type data` 的變數。
- 物件型別 (Object)：在 `Stack` 中，**僅會儲存資料值所在的記憶體位置的地址 (address)**，用以當作參考 (reference)，這個參考會指向 `Heap` 中的資料值，如下圖。

![object data in memory](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/02.png)

`Heap` 相對於 `Stack` 是較大的記憶體空間，更適合儲存 `Object data` 這種較大的資料，當然相對存取會比較慢。

綜合以上，就能理解兩種資料型別在記憶體中儲存的概念，接著進入到在記憶體中，複製變數的行為和結果。

---

## 在記憶體中，複製變數的行為和結果

當複製變數發生時，會複製記憶體中 `Stack` 的資料，並產生一組新的記憶體位置指向新的變數，如下列範例與概念圖：

```javascript
// Primitive type data 的複製
let a = 5;
let b = a; // 複製 a 的變數 b
```

![copy primitive type data](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/03.png)

先宣告 `a` 變數，其記憶體位置是 `0x001`，資料的值是 `5`。接著在宣告 `b = a` ，等同複製 `a` 變數，這時候會發現 `b` 擁有一組新的位置 `0x02`，資料則是和 `a` 相同都是值 `5`。

上述是 `Primitive data` 複製的行為和結果，接續看 `Object data` 的情況是如何：

```javascript
// Object data 的複製
let a = { number: 5 };
let b = a; // 複製 a 的變數 b
```

![copy object data](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/04.png)

在複製變數時，一樣是複製 `Stack` 內的資料，只是由於 `Object data` 在資料中儲存的並非值 (value) 而是值所在的地址 (Address)，因此複製時會複製的就是這份地址，而非原始的值。整理一下：

- 基本型別 (Primitive type)：在複製變數時，會**直接複製原始的值**。
- 物件型別 (Object)：在複製變數時，**僅複製地址，而地址背後會指向相同的值**。

以上複製變數的行為和結果，是本篇中最關鍵的重點，接下來的內容都是基於此而延伸！

接續來嘗試看看，這兩種複製變數行為的不同，在程式中，會造成什麼關鍵的影響。

首先觀察，複製 `Primitive type data` 的變數後，當改動原始變數的值時，是否會對複製變數的值造成影響：

```javascript
// Primitive type data 的複製
let a = 5;
let b = a;

console.log(a); // 5
console.log(b); // 5

a = 10;

console.log(a); // 10
console.log(b); // 5 => 沒有跟著 a 改變
```

上面這段 code，主要做兩件事：

1. 宣告變數 `a`，並且將 `a` 賦值為 `5`，接著宣告變數 `b` 並且複製 `a` 變數，讓 `b = a`，這時候印出來的值都是 `5`。
2. 將變數 `a` 重新賦值為 `10`，觀察看看是否會影響到複製的變數 `b`。

結果而言，複製的變數 `b` 的值，並不會跟著變數 `a` 值的改變而改變。

背後的原因是：**當變數資料為 `Primitive type data` 時，在複製變數時，會完全複製一份新的「值 (value)」**。

所以改變原始變數 `a` 的值時，自然不會影響到變數 `b` 的值（反之亦然）。如下圖概念：

![copy primitive type data 2](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/05.png)

看完 `Primitive type data` 原始變數 `a` 與複製變數 `b` 彼此任意改變變數的內容，都不會互相影響後，接續觀察 `Object data`：

```javascript
// Object data 的複製
let a = { number: 5 };
let b = a;

console.log(a); // { number : 5 }
console.log(b); // { number : 5 }

a.number = 10;

console.log(a); // { number : 10 }
console.log(b); // { number : 10 } => 跟著 a 改變
```

上面這段 code 主要做兩件事：

1. 宣告變數 `a`，並且將 `a` 賦值為物件 `{ number : 5}`，接著宣告變數 `b` 並且複製 `a` 變數，讓 `b = a`，這時候印出來的值都是 `{ number : 5}`。
2. 利用 `a.number = 10` 將變數 `a` 改變為 `{ number : 10}`，觀察看看是否會影響到複製的變數 `b`。

結果而言，很明顯地發現到：複製的變數 `b` 的物件值，會跟著變數 `a` 值的改變而改變，都變成 `{ number : 10}`。

背後的原因是：**當變數資料為 `Object data` 時，在複製變數時，是複製一份新的「地址 (address)」，並非複製值 (value)，而相同的地址背後會指向同樣的值**。

因為兩個變數的地址相同，是指向同一個值，所以透過 `a.number = 10` 改變原始變數 `a` 的值時，自然就會直接影響到變數 `b` 的值（反之亦然）。如下圖概念：

![copy object data 2](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/06.png)

至此再做一次整理：

- 當變數資料為 `Primitive type data` 時，在複製變數時，會完全複製一份新的「值 (value)」。
- 當變數資料為 `Object data` 時，在複製變數時，是複製一份新的「地址 (address)」，並非複製值 (value)，而相同的地址背後會指向同樣的值。

接著要將同樣的概念，帶進 function 的傳遞參數中囉！

---

## 從 function 的傳遞參數，理解 pass by value

如標題所述，要從 function 的傳遞參數，理解本文的命題重點之一 `pass by value` ！

首先，要知道一個觀念是：**function 中的傳遞參數，行為如同複製變數**。

一樣分成 `Primitive type` 及 `Object` 探討，從 `Primitive type` 開始，直上範例：

```javascript
function test(primitiveData) {
  primitiveData = primitiveData + 5;
  console.log(primitiveData); // 10
}

let a = 5; // Primitive type data
test(a);

console.log(a); // 5 => 沒被改變
```

以執行的流程面來閱讀上面的 code：

1. 宣告 `function test(primitiveData)` 。
2. 宣告變數 `a` 賦值為基本型別的資料 `5`。
3. 將 `a` 丟進 `test` 函式中時，等同於是 `primitiveData` 複製 `a`，可以想成 `primitiveData = a`，產出函式中新的區域變數 `primitiveData`。
4. 由於變數資料是基本型別，**複製變數時是直接複製「值 (value)」**，所以變數 `a` 與變數 `primitiveData` **擁有各自獨立的值**。
5. 因此改變任一變數的內容不會影響另一個變數，所以最後 `a` 印出依然不變，是原本的 `5`。

概念圖解如下：

![pass by value 1](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/07.png)

![pass by value 2](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/08.png)

其實上述的內容，講述的正是 `pass by value` 的概念。

`pass` 可以想成是傳遞函式參數的「傳遞」，`by value` 可以想成是傳遞變數時，是**複製了傳遞進來的「值 (value)」**。產生的結果就是函式內變數的值與傳入變數的值，各自獨立，不會互相影響。

`pass by value` 同時也可以稱之為 `call by value`，畢竟函式可以用呼叫的 (call)。

---

## 從 function 的傳遞參數，理解 pass by reference

了解 `Primitive type data` 以及` pass by value` 後，接著來看到 `Object data` 以及 `pass by reference`。

```javascript
function test(objectData) {
  objectData.number = 10; // 改變物件內容
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // Object data
test(a);

console.log(a); // { number: 10 } => 跟著改變
```

同樣關注執行流程：

1. 宣告 `function test(objectData)` 。
2. 宣告變數 `a` 賦值為物件型別的資料 `{ number : 5}`。
3. 將 `a` 丟進 `test` function 中，等同於是 `objectData` 複製 `a`，可以想成 `objectData = a`，形成函式中新的區域變數 `objectData`。
4. 由於變數資料是物件型別，**複製變數時是複製「地址 (address)」而非值**，所以 `objectData` 與 `a` **擁有同樣的地址，指向同樣的值**。
5. 因此透過 `objectData.number = 10`，改變 `objectData` 的物件內容時，`a` 也同時被修改，最後印出的值是新的 `{ number: 10 }`。

概念圖解如下：

![pass by reference 1](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/09.png)

![pass by reference 2](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/10.png)

上述在談的情況就是 `pass by reference` 的概念。

`pass` 可以想成是傳遞函式參數的「傳遞」，`by reference` 則是指傳遞參數時，僅是**複製了參數的「地址 (address)」作為真正值的參考座標 (reference)**。產生的結果就是函式內變數的值與傳入變數的值，透過 `objectData.number` or `a.number` 改變物件內容時，是會互相影響的。

當然，`pass by reference` 也可以被稱之為 `call by reference`。

---

## 咦，怎麼又冒出個 pass by sharing ?

先不多說，上個範例 code：

```javascript
function test(objectData) {
  objectData = { number: 10 }; // 物件重新賦值
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);

console.log(a); // { number: 5 } =>  那尼！居然沒跟著改變！
```

同樣關注執行過程：

1. 宣告 `function test(objectData)` 。
2. 宣告變數 `a` 賦值為物件型別的資料 `{ number : 5}`。
3. 將 `a` 丟進 `test` function 中，等同於是 `objectData` 複製 `a`，可以想成 `objectData = a`，形成函式中新的區域變數 `objectData`。
4. 由於變數資料是物件型別，透過 `objectData = { number : 10 }` **重新賦值，此時產生一個新的地址對應新的物件值，objectData 會擁有新的地址，指向新的值**。
5. 因此 `a` 與 `objectData` 的地址不同，指向的值也不同，所以最後印出的 `a` 是 `{ number: 5 }`，沒有因為 `objectData` 重新賦值而被改變。

和上一個例子很相似，最大差異就在於並非透過 `objectData.number = 10` 去改變物件的值，而是透過 `objectData = { number : 10 }`「重新賦值」的方式，改變整個 `objectData` 的值。

重新賦值的行為，會在記憶體 `Heap` 中，產生新的 `{ number : 10 }` 的值，並且對應產生新的地址，給予 `objectData`。因此最終 `objectData` 是擁有新的地址，指向新的值，與 `a` 變數的地址和值是互相獨立的，不會互相影響，概念如下圖：

![pass by sharing](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/11.png)

這概念是不是很像 `pass by value` 呢？複製變數後，也跟著複製變數真正的值 (value)，所以兩個值獨立，並不會互相影響。

所以統整一下 `Object data` 複製變數後，改變變數內容的行為，混合了兩種形式：

- **pass by reference 的概念** : 傳遞參數進函式後，透過 `object.number = 10` 改變內容，由於外部變數與內部變數的**地址相同，指向同樣的值，因此會互相影響**。
- **pass by value 的概念** : 傳遞參數進函式後，透過 `objectData = { number: 10 }` 重新賦值，此時會創建新的值與地址。由於外部變數與內部變數的**地址不同，指向不同的值，因此並不會互相影響**。

如果 `Object type` 是全然地 `by reference` ，那麼在「重新賦值」時，也該跟著改變，但它並沒有。在技術上，這種行為偏向稱為 `pass by sharing`(或稱為 `call by sharing `、`call by object` 等)。

到這邊可以稍微整理，複製變數後，改變「複製的新變數 (上述的`primitiveData or objectData`)」對「原始變數 (上述的 `a`)」造成的影響（反之亦然）：

- 如果遇到**基本型別 (Primitive type)**，原始變數「不會」跟著複製變數的改變而變，表現出的行為結果是 `pass by value`。

  ```javascript
  function test(primitiveData) {
    primitiveData = primitiveData + 5;
    console.log(primitiveData); // 10
  }

  let a = 5; // Primitive type data
  test(a);

  console.log(a); // 5 => 沒被改變
  ```

- 如果遇到**物件型別 (Object)，且僅針對物件的內容做改變**，原始變數「會」跟著複製變數的改變而變，表現出的行為結果是 `pass by reference`。

  ```javascript
  function test(objectData) {
    objectData.number = 10; // 改變物件內容
    console.log(objectData); // { number: 10 }
  }

  let a = { number: 5 }; // Object data
  test(a);
  console.log(a); // { number: 10 } => 跟著改變
  ```

- 如果遇到**物件型別 (Object)，且對物件做重新賦值**，原始變數「不會」跟著複製變數的改變而變，表現出的行為結果是 `pass by value`。

  ```javascript
  function test(objectData) {
    objectData = { number: 10 }; // 物件重新賦值
    console.log(objectData); // { number: 10 }
  }

  let a = { number: 5 }; // object data
  test(a);
  console.log(a); // { number: 5 } => 沒被改變
  ```

因此綜合上述，便有種說法是：在 JavaScript 中，`Primitive type` 的變數資料是 `pass by value`，而 `Object` 的變數資料是 `pass by sharing` (綜合了 `pass by value` / `pass by reference`)。

---

## 為什麼有 JavaScript 都是 pass by value 的說法 ?

再次回顧無論是複製 `Primitive type` 變數與複製 `Object` 變數的概念表：

![pass by value and pass by sharing](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/12.png)

如果不去管變數表中的資料欄位，被複製的內容到底是原本的值或是地址，直觀地來看，其實都是在複製「資料欄位內儲存的值」。

所以說若角度是以：**複製時傳遞的都是「資料欄位內儲存的值(value)」來看的話，就可能會被視為 JavaScript 都是 pass by value**。因此才有相關的說法產生。

---

## 總結：比起技術名詞，更該在意「複製變數的過程是如何運行的」

如果查詢許多國內外資料，就會發現對於這些技術名詞的定義或描述，其實並沒有一個權威性的存在能證明誰是絕對正確的。

- JavaScript 中，`Primitive type` 的變數資料是 `pass by value`，而 `Object` 的變數資料是 `pass by sharing`。
- JavaScript 都是 `pass by value`。

如同上面這兩句話，都可以說是對的，端看對於「value」的定義是什麼、從哪個角度看待。

我認為，**最重要的是探討這些技術名詞定義或技術語句的「過程」，這些過程讓我更了解在 JavaScript 中「複製變數」會產生的行為與結果，而複製變數，則是開發中很常會遇到的情況，所以很實用**。

如果要有重點更方便於記憶的話，我的重點是：

1. 如果是 `Primitive type` 的變數值，例如：`const a = 5`，那麼複製變數時，是會複製「原始的值 (value)」，因此原始變數與複製變數「不會」互相影響。
2. 如果是 `Object` 的變數值，例如：`const a = { number : 5 }`，那麼複製變數時，是會複製「地址 (address)」，當相同地址指向相同的值時，原始變數與複製變數「會」互相影響。但需要注意「重新賦值」的行為，會產生全新的地址和全新的值。
3. 將外部變數當作參數，傳入 function 時，就代表在 funcion 作用域中，複製外部變數，產生新的內部變數。

這三句話，都是指「複製變數的過程是如何運行的」，而這些過程是最關鍵的。只要腦中有複製變數的過程在運行（上述那些變數表的圖），就會很清楚原始變數與複製變數的變化，究竟會不會互相影響了。

具體展現的結果，化做程式範例再次統整複習：

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
  objectData = { number: 10 }; // 物件重新賦值
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);

console.log(a); // { number: 5 } => 沒被改變
```

最後呢，用兩篇文章的段落來總結：

「在《松本行弘的程式設計世界》的〈語彙與共通語言的重要性〉這篇文章中，作者談到，為某個概念決定適當的名詞，目的是在設計時能有共同的語彙，也能讓開發者意識到它們的存在，這才是名詞存在的真正意義。」—《[技術名詞紛爭多](https://www.ithome.com.tw/voice/94877)》

技術名詞是為了便於溝通和理解概念而存在，如果用以吵架，那就沒有意義了。

「技術名詞是為了描述概念而存在，而不是概念為了技術名詞而存在。最重要的是背後期望表達的概念，也就是體現出來的『行為』。」—《[你不可不知的 JavaScript 二三事#Day26：程式界的哈姆雷特 — Pass by value, or Pass by reference？](https://ithelp.ithome.com.tw/articles/10209104)》

這句話完全體現了我整理文章後的心得，我們更該注重的是程式運行時，展現出的行為與結果。

希望看完這篇整理的你，能更理解變數資料在複製時，產生的行為囉。

---

#### 參考資料

- [基本資料型別和參考資料型別 Primitive Data Type & Reference Data Type - 彭彭直播](https://www.youtube.com/watch?v=43VI2zWSpd0)
- [你不可不知的 JavaScript 二三事#Day26：程式界的哈姆雷特 —— Pass by value, or Pass by reference？](https://ithelp.ithome.com.tw/articles/10209104)
- [深入探討 JavaScript 中的參數傳遞：call by value 還是 reference？](https://blog.techbridge.cc/2018/06/23/javascript-call-by-value-or-reference/)
- [Is JavaScript a pass-by-reference or pass-by-value language?](https://stackoverflow.com/questions/518000/is-javascript-a-pass-by-reference-or-pass-by-value-language)
- [技術名詞紛爭多](https://www.ithome.com.tw/voice/94877)
