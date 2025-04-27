---
title: 理解 JS 原型，從 Prototype, Prototype Chain 到 Prototype Pollution
date: 2024-09-08
description: JS 原型看似離開發者很遠，實際上很近，因為開發者所使用的原生函式一直都跟 Prototype Chain 有關，此外，Prototype 被污染更是種安全性議題，如果開發上能對原型更理解，就更能避免寫出 anti pattern 的程式碼。
tag: JavaScript
---

## 前言

近期正在閱讀 [《Beyond XSS：探索網頁前端資安宇宙》](https://www.tenlong.com.tw/products/9786267383803) 這本由 Huli 撰寫的前端資安書籍，真沒想到會在談資安的書籍碰到 **Prototype Chain**...，有種熟悉的陌生人感，畢竟每次準備面試時都要看過一遍，但時間一久後都似懂非懂，主要是沒有架構性地理解和記錄，於是乎決定寫篇文章，除了能讓自己更架構化地理解外，也能提供給有需要的人閱讀參考參考。

本文預計會從 Prototype 開始談，接著帶入 Prototype Chain，此外也會帶到我在《Beyond XSS》學到的 **Prototype Pollution**，預計包含：

- 從 ECMAScript 的 constructor 與 prototype 談起
- 由 `[[Prototype]]` 串起的 Prototype Chain
- Prototype Chain 的應用方式與注意事項
- 沒想到可以用來攻擊！淺談 Prototype Pollution
- 避免 Prototype Chain 被污染的方式
- 總結，以及可以做什麼

希望讓讀者能更理解 Prototype，除了面試能回答外，更重要的是了解實際開發需要注意什麼。

由於內文頗長，在最後總結段落，會透過簡短回答幾個問題回顧本文重點，包含：
- 什麼是 Prototype
- 什麼是 Prototype Chain
- 什麼是 Prototype Pollution
- 可以做的實際行動

接著就 GOGO 開始這趟 Prototype 之旅吧。

---

## 從 ECMAScript 的 constructor 與 prototype 談起

談 JS Prototype 的文章不少都從 OOP 的 class 概念或繼承概念談起，但我覺得對於純前端出身（aka 轉職成為前端工程師）而言不太好懂，所以在此可以先完全忽略 class 概念，因為 JS 原本是沒有 class 概念。

那該從哪裡下手去理解 Prototype ? 似乎可以從源頭，也就是從 ECMAScript 規格中找尋相關內容，於是在此 [Spec](https://tc39.es/ecma262/#sec-terms-and-definitions-prototype) 找到關於 `prototype` 簡單的定義是：

> `prototype`: object that provides shared properties for other objects

看起來有兩個重點：
1. `prototype` 是個物件
2. `prototype` 存在的目的與“共享” properties 有關，其他物件可通過它來共用屬性

接著還有幾段內容，可以讓我們得知更多資訊：

> When a `constructor` creates an object, that object implicitly references the constructor's `prototype` property for the purpose of resolving property references. 

意旨透過 `constructor` 創建物件時，該物件會隱含地參考 constructor 的 prototype 屬性。這邊會需要理解 `constructor` 是什麼，根據該文件 `constructor` 定義是:

> `constructor`: function object that creates and initializes objects
> The value of a constructor's `prototype` property is a prototype object that is used to implement inheritance and shared properties.

根據定義，可得知：
1. `constructor` 是用來創建 object 的函式，具體來說是用 `constructor` 搭配 `new` 能創建實例的 object
2. `constructor` 的 `prototype` 屬性，能讓被創建出來的 object 共用屬性。

單看文字太抽象，搭配程式碼才易理解，先從 1. 解釋，示範 `constructor` 與 `new`：

```javascript 
// 這是 constructor function `Person`，this 指向被創建的 object
function Person(name, age) {
  this.name = name
  this.age = age
}

const yi = new Person('yi', 28) // 透過 new 創建 yi
console.log(yi) // Person {name: 'yi', age: 28}

const winnie = new Person('winnie', 64) // 透過 new 創建 winnie
console.log(winnie) // Person {name: 'winnie', age: 64}
```

從上述程式碼，能夠得知透過宣告創建人類的 `constructor function`，能夠 `new` 出 yi 與 winnie 兩位人類，各自有自己的姓名與年齡。

接著來探討關於前述第 2. 中提到 `constructor` 的 `prototype` 屬性，能讓被創建出來的 object 共用屬性的部分。

由於人類都會說話，所以希望所有人類被 `new` 後，都能夠共用 `said` 的方法，於是在程式碼中可以如此表述：

```javascript 
function Person(name, age) {
  this.name = name
  this.age = age
}

// 透過 constructor Person 的 prototype 屬性
// 讓所有被 new 創建的 object 共用 said 方法
Person.prototype.said = function (text) {
  console.log(`${this.name}: ${text}`)
}

const yi = new Person('yi', 28)
console.log(yi.said('Hello World!')) // yi: Hello World!

const winnie = new Person('winnie', 64)
console.log(winnie.said('Hello World!')) // winnie: Hello World!
```

至此應可理解 `constructor` 與 `prototype` ：

- **constructor**: 是物件函式，可以搭配 `new` 創建出物件實例(instance)，並且被創建的物件實例，其屬性中，自動會繼承 `constructor.prototype` 中的屬性
- **prototype**: 是存在於 `constructor` 物件之中的屬性，其本身也是物件，而本身物件的屬性會被基於 `constructor` 創建的物件實例繼承

可以發現兩者的解釋相輔相成、密不可分呢。

另外這種被 `new` 創建的物件實例，會**繼承** `constructor.proptotype` 的屬性，也可被稱之為 **Prototypal Inheritance**。

_p.s. ECMAScript 內容會持續更新，因此未來有可能不同。_

---

## 由 `[[Prototype]]` 串起的 Prototype Chain

雖然已經知道 `winnie.said` 會指向到 `Person.prototype.said`，但有個關鍵的問題尚未被討論：

程式碼或者說 JS 引擎是如何知道 `winnie.said` 要指向 `Person.prototype.said`?

因為 `winnie` 是個物件，理論上當呼叫 `winnie.said` 時，由於其中找不到 `said`，所以應該要回傳 `undefined` 才對吧？之所以沒有這樣，一定是因為程式背後做了一些邏輯判斷，那些邏輯判斷會是什麼呢？

讓我們先把 `winnie` 印出來看看會有什麼內容：

![object prototype log 1](/images/articles/javascript-understand-prototype-and-prototype-pollution/01.png)

發現在 `winnie` 物件中有個隱含的 `[[Prototype]]` 物件，並且裡面有 `said` 函式，正是 `Person.prototype.said` 的那個函式！

再細看更可以發現 `[[Prototype]]` 內有 `constructor: ƒ Person` 的存在，這其實代表 `winnie` 物件是由 `Person` 構建而成。

更進一步地說，`winnie` 的原型物件 `[[Prototype]]` 的內容繼承自 `Person` 的 `prototype`，也就是 `Person.prototype`。

所以當執行 `winnie.said` 後觸發的邏輯會像是：
1. 先尋找 `winnie` 物件本身中是否有 `said`，如果有就回傳，沒有就往其原型物件尋找
2. 往 `winnie` 中的 `[[Prototype]]` 原型物件尋找，找到 `said` 於是回傳

看到這裡可能會想說，那應該可以透過 `winnie.[[Prototype]].said` 找到 `Person.prototype.said` 吧？

```javascript
winnie.[[Prototype]].said === Person.prototype.said 
// `SyntaxError: Unexpected token '['`
```

很遺憾不能，如果執行 `winnie.[[Prototype]].said` 只會得到 `SyntaxError: Unexpected token '['` 的錯誤，主要是因為 `[[Prototype]]` 為 JS 的內部私有屬性不能直接存取使用，然而有其他方法能讓開發者取得原型物件：

1. `Object.getPrototypeOf(object)`：這是 ECMAScript 中有定義的標準做法，透過這個方法將可以獲得 object 的原型物件
2. `object.__proto__`：這是個大多瀏覽器有實作，但為“非標準”作法，如果去 ECMAScript 文件中查詢，會發現有個 deprecated 的項目，因此建議實際開發上，若要查找原型屬性和方法，盡量用標準做法 `Object.getPrototypeOf` 為佳

可透過程式碼驗證上述兩個方法：

```javascript
// 取得 Object.getPrototypeOf(winnie) 並證明其指向 Person.prototype
Object.getPrototypeOf(winnie) === Person.prototype // true
Object.getPrototypeOf(winnie).said === Person.prototype.said // true

// 取得 winnie.__proto__ 並證明其指向 Person.prototype
winnie.__proto__ === Person.prototype // true
winnie.__proto__.said === Person.prototype.said // true
```

當然更可以驗證 `winnie.said` 是否指向原型物件：

```javascript
// 驗證 winne.said 指向原型物件 Person.prototype.said
winnie.said === Person.prototype.said // true
```

接著進一步來看個有趣的執行，如果執行 `winnie.valueOf` 會回傳什麼？

想像起來會是 `undefined`，因為 `winnie` 本身物件 與 `Person.prototype` 原型都沒有 `valueOf`，那就應該回傳 `undefined` 吧？

並非如此，最後會拿到 `ƒ valueOf()`，那這個函式又是從哪裡來的？

從下圖中可以找到答案：

![object prototype log 2](/images/articles/javascript-understand-prototype-and-prototype-pollution/02.png)

會發現在 `constroctor Person` 所創建出的原型物件 `[[Prototype]]` 中，依然還存在上一層的 `[[Prototype]]`，展開後會看到 `valueOf` 函式身在其中！

所以當執行 `winnie.valueOf` 的邏輯是：
1. 先尋找 `winnie` 物件本身中是否有 `valueOf`，如果有就回傳，沒有就往原型物件查找
2. 往 `winnie` 的 `[[Prototype]]` 原型物件尋找，如果有就回傳，沒有就再往更上層的原型物件查找
3. 往 `winnie` 的 `[[Prototype]]` 原型物件上層的 `[[Prototype]]`，如果有就回傳，因此找到 `valueOf` 便回傳之。這邊可以注意到該 `[[Prototype]]` 的 `constructor` 為 `ƒ Object`，也是 JS 本身內建的 Object `constructor`

```javascript
// 驗證 winnie.valueOf 指向 Object.prototype.valueOf
winnie.valueOf === Object.prototype.valueOf // true

// 背後其實代表 winnie 的原型的原型指向 Object.prototype
winnie.__proto__.__proto__ === Object.prototype // true
winnie.__proto__.__proto__.valueOf === Object.prototype.valueOf // true
```

上面所舉出的例子是「找得到結果的情況」，有沒有可能最終找不到結果呢？

有，就是找不到且**已經沒有更上層的** `[[Prototype]]` 時（`[[Prototype]]` 為 `null`），就會回傳 `undefined`。

舉例而言，當執行 `winnie.notDefinedOf` 的邏輯是：
1. 先尋找 `winnie` 物件本身中是否有 `notDefinedOf`，如果有就回傳，沒有就往原型物件查找
2. 往 `winnie` 中的 `[[Prototype]]` 原型尋找，如果有就回傳，沒有就再往更上層的原型物件查找
3. 往 `winnie` 中的 `[[Prototype]]` 的 `[[Prototype]]` 查找，如果有就回傳，沒有就再往更上層的原型物件查找，結果發現已沒有更上層的 `[[Prototype]]` 內容，於是回傳 `undefind`

```javascript
/** 概念演示流程 */

// 發現 winnie 無 notDefinedOf 接著查找上層原型
winnie.notDefinedOf ->

// 依然無 notDefinedOf 屬性，接著查找上層原型
winnie.__proto__.notDefinedOf ->

// 依然無 notDefinedOf 屬性，接著查找試圖查找上層原型
winnie.__proto__.__proto__.notDefinedOf ->

// 發現上層原型回傳 null，於是停止
// 最終 winnie.notDefinedOf 結果會回傳 undefined
winnie.__proto__.__proto__.__proto__ // null
```

上述在 `[[Prototype]]` 中尋找物件屬性的「過程」其實就是 **Prototype Chain**。

更完整的解釋 **Prototype Chain**：

> 當呼叫 Object Data 屬性，如果找不到該屬性時，會往其 Prototype 物件查找，如果找到就回傳屬性所對應的值，如果找不到，就會往 Prototype 物件的更上層的 Prototype 物件查找，重複此邏輯，直到找到該屬性就會回傳對應的值，或直到 Prototype 物件為 `null` 也就代表沒有更上層的 Prototype 物件內容，這時就會回傳 `undefined`。這個過程，就是 **Prototype Chain**。

這算是種概念上的解釋，我認為只要概念正確，換句話說都是可以的，像是：

> 當呼叫 Object Data 屬性，如果找不到該屬性時，會往該物件的 `__proto__` 查找，如果找到就回傳屬性所對應的值，如果找不到，就會往 `__proto__` 的 `__proto__` 中查找，重複此邏輯，直到找到該屬性就會回傳對應的值，或直到呼叫的 `__proto__` 為 `null`，那就會回傳 `undefined`。這個過程，正是 **Prototype Chain**。

這邊的 Object Data 是指物件類型的資料，像是物件、陣列都是如此。

事實上前端開發者們幾乎每天都在運用 Prototype Chain，像是呼叫 `[...].filter` 時，就是呼叫 `Array` 物件的原型物件方法，也就是 `Array.prototype.filter` 函式。

![array prototype log](/images/articles/javascript-understand-prototype-and-prototype-pollution/03.png)

是說有個有趣的問題是：字串或數字這類的資料，並非 object type 而是 primitive type，理應沒有 `[[Prototype]]`，為什麼可以有它們自己的方法像是 `"hello".toUpperCase()` 之類？

原因是當執行 `"hello".toUpperCase()` 時，其實 JS 引擎背後會先把 `"hello"` 透過類似 `new String("hello")` 的方式創建臨時物件實例，這麼一來就能夠呼叫到 `String.prototype.toUpperCase()`。

---

## Prototype Chain 的應用方式與注意事項

到目前為止，已經大致理解 Prototype、Prototypal Inheritance 與 Prototype Chain，並且得知每次開發時能呼叫的 Object 或 Array 原生方法，是因為有 Prototype Chain 才能使用。

那麼 Prototype Chain 還有其他應用方式嗎？

蠻直覺的，就是當開發者有需要讓 `new` 出來的實例都能“共用”特定屬性時，像是：

```javascript
// constructor Dog
function Dog(name){ 
    this.name = name
}

// 利用 prototype 使 new Dog 的物件實例都會吠叫
Dog.prototype.bark = function(voice) {
  console.log(voice)
}

const dogA = new Dog('肚子')
const dogB = new Dog('吐司')
dogA.bark('旺旺') // '旺旺'
dogB.bark('嗚嗚') // '嗚嗚'
console.log(dogA.bark === dogB.bark) // true，來源都是原型物件
```

這邊可能會有個疑惑說，難道不能在 `Dog` 中寫 `this.bark=function(voice){...}`，不是一樣嗎？

可以試試看：

```javascript
// constructor Dog
function Dog(name){ 
    this.name = name
    // 換個方式來安插 bark 到每隻 new 出的狗狗實例
    this.bark = function(voice) {
      console.log(voice)
    }
}

const dogA = new Dog('肚子')
const dogB = new Dog('吐司')
dogA.bark('旺旺') // '旺旺'
dogB.bark('嗚嗚') // '嗚嗚'
console.log(dogA.bark === dogB.bark) // false，記憶體位置不同！
```

的確以「功能面」而言是相同，但是以「記憶體」而言卻是不同，這代表佔用的記憶體會更多，當然如果資料量很小的差異不大，然而如果資料量越大時影響就會越大。所以這類情境就會建議用 Prototype 特性來處理囉。

這邊補充一下，記憶體位置不同主要體現於 Object 類型資料，像是物件、陣列、函式等，如果是純字串或數字，兩者記憶體就沒差，歡迎參考 [JS 變數傳遞探討：pass by value 、 pass by reference 還是 pass by sharing？
](/articles/2021/javascript-pass-by-value-pass-by-reference-pass-by-sharing) 或 Google 關建字 JS Primitive Data vs Object Data 之類。

另外 JS 本身的 `class` 語法糖，其繼承概念，本身也是藉由 Prototype 特性實作出來的，但本文不討論 `class` 所以只是稍微提一句。

總之，繼承這個概念其實在程式應用的領域很廣泛，而 JS 正是用 Prototype 特性去實踐繼承這個概念。

聽起來很好用，那有什麼缺點或注意事項嗎？當然有缺點。

大方向的概念跟在使用“共用的資料或函式“時都要小心一樣，因為影響範圍會很大，而且如果沒有好好測試，就容易發生改 A 壞 B 的情況，而 Prototype 這類的情況只會更加嚴重，因爲不像一般共用函式，開發者要有意識地「手動 `import`」後使用函式功能，Prototype 屬性是「自動繼承」函式功能，所以更可能無意識地造成 Bug。

以下是幾點關於 Prototype 的注意事項：

### 1. 避免去修改原生 Prototype 的內容！

最重要最重要的一點就是「**避免去修改 JS 原生 Prototype 的內容**」，因為會同時影響到幾乎所有該物件資料的呼叫方式，範圍過廣完全不可預期，也代表難以維護。

隨意舉個案例：

```javascript
// 假設 A 開發者在 Object.prototype 上添加一個方法 toObjectString
Object.prototype.toObjectString = function() {
  return JSON.stringify(this);
};

// A 開發者想說那這樣未來大家使用就方便了吧！可以這樣用：
const person = { name: 'Alice', age: 25 };
console.log(person.toObjectString()); // {"name":"Alice","age":25}

// 但是，這樣的修改其實影響到其他所有物件，可能產生非預期行為
// 例如當 B 開發者使用 for...in 迴圈時
const data = { a: 1, b: 2, c: 3 };
for (let key in data) {
  // B 開發者預期會依序印出 a, b, c
  // 但是，結果會是 a, b, c, toObjectString
  console.log(key); //
}
```

上述這樣的案例該怎麼處理比較好？就直接做一個獨立的“共用函式” `transObjToString(obj)` 就好了，需要用到的時候，就 `import` 這個共用函式來使用即可，還很好寫 unit test。

上面案例還另一個問題：如果未來瀏覽器真的在 `Object.prototype` 中實作 `toObjectString` 函式，而且邏輯還跟 A 開發者實作的不同，那整個專案有用到的地方可能就會壞掉。

再次強調重點就是：**幾乎所有的情況，都不需要去修改 JS 原生的 Prototype Chain**，我自己就遇過專案中有 legacy 是在原生的 Prototype Chain 埋東西的，真的會困擾到 Orz

順帶一提，ESLint 有規則可以避免開發者去修改 JS 原生的 Prototype Chain，例如 [no-extend-native
](https://eslint.org/docs/latest/rules/no-extend-native)，頗方便。

有沒有發現我是寫“幾乎所有的情況”，代表有些情況可能真的需要修改 JS 原生的 Prototype Chain？

有的，假定有專案想要使用「大多瀏覽器都支援，卻有少數瀏覽器不支援」JS 的原生方法時，或許可以考慮這個方式。例如：假設在大部分瀏覽器都可以使用 `Array.prototype.map` 卻有個神秘瀏覽器不支援，而你們專案一定需要支援，那就可以考慮在 `Array.prototype.map` 中加上一些判斷，`if` 遇到神秘瀏覽器就做其他邏輯，`else` 都走 JS 原生邏輯之類。

總之，就是在處理兼容性時，才會可以“稍微考慮”竄改 JS Prototype Chain 的方式。

[MDN:Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain) 的章節中，最後一句正是相關警語呢：

> the native prototypes **should never** be extended unless it is for the sake of compatibility with newer JavaScript features.

這段最後我還是想說聲，即便是兼容性議題，還是能找到其他處理方式，原生 Prototype Chain 能不動就不動！

### 2. 避免製造過長的 Prototype Chain

簡而言之，過長的 Prototype Chain 可能會造成效能的問題，原因蠻好理解，就是每一步向上層原型物件查找的過程，其實都需要跑一段程式邏輯，如果次數過多，那就會需要更多時間處理。

要實際感受這件事情，可以寫個“模擬” Prototype Chain 查找過程的函式就會更有感：

```javascript
function findPropertyInPrototypeChain(obj, property) {
  let currentObj = obj;

  while (currentObj !== null) {
    // hasOwnProperty 可以確認 obj 自身是否有特定屬性，
    // 若有找到就代表成功，直接回傳屬性值
    if (currentObj.hasOwnProperty(property)) { 
      console.log(`Found '${property}' in object.`);
      return currentObj[property];
    }
    // 若沒有找到就代表需要往更上一層的原型物件查找
    console.log(`Property '${property}' not found. Moving up the prototype chain...`);
    currentObj = Object.getPrototypeOf(currentObj);
  }

  console.log(`Property '${property}' not found in any prototype level.`);
  return undefined;
}
```

單看這個 `findPropertyInPrototypeChain` 能得知時間複雜度是 O(n)，而那個 n 代表的正是 Prototype Chain 的長度，因此也可以說 Prototype Chain 會與效能好壞有相關性。

通常實際的判斷邏輯會更加複雜，可能還要考量環境等等，總之，光是這個模擬的簡單邏輯就能驗證 Prototype Chain 如果超長，確實會讓效能更差。

### 3. 避免隨處修改 Prototype Chain

建議只在一處修改 `constructor` 的 Prototype Chain，不然會造成難以預期的狀況：

```javascript
// constructor Dog file
export function Dog(name, nickName){ 
    this.name = name
    this.nickName = nickName
}
Dog.prototype.bark = function(voice) {
  console.log(voice)
}

// 在 A 檔案中修改 prototype bark
import Dog from '...'
Dog.prototype.bark = function(voice) {
  console.log(`${this.name}: ${voice}`)
}

// 在 B 檔案中修改 prototype bark
import Dog from '...'
Dog.prototype.bark = function(voice) {
  console.log(`${this.nickName}: ${voice}`)
}

// 在 C 檔案中使用 prototype bark
import Dog from '...'
const dogA = new Dog('肚子', '小肚')
dogA.bark('旺旺') // ??，無法預期結果，要看最後執行 Dog.prototype.bark 的內容
```

最好就是在一開始的 Dog file 中定義好 `Dog.prototype.bark` 的行為就好，如果真的需要修改或優化，也去這個單一源頭處理，才更能避免無法預期的狀況。

---

## 沒想到可以用來攻擊！淺談 Prototype Pollution

文章至此大致將 Prototype 大多需要知道的概念談完了，尤其是最重要的「避免」對 Prototype Chain 做什麼，很多時候不做什麼比要做什麼重要很多呢。

接著將進入我閱讀 [《Beyond XSS：探索網頁前端資安宇宙》](https://www.tenlong.com.tw/products/9786267383803) 後才學到的 Prototype Pollution 觀念和案例，算是個人學後的輸出，但僅止於“淺談”，如果想深入理解，推薦購買原書閱讀，原書不僅有 Prototype Pollution，更有許多意想不到的網頁攻擊/防禦手法，雖然知識量很大且不限於前端工程，所以不易理解，但真的頗有趣，如果是有過兩年前端工程師經驗（這不一定只是我認為至少初始知識量比較合理）且對資安議題有興趣的人會蠻適合閱讀。

推書推完了，直接進入正題：什麼是 Prototype Pollution？

**Prototype Pollution** 是指攻擊者利用插入程式碼等方式，修改原型物件的 prototype，從而影響所有繼承該原型的物件行為，產生安全性漏洞，如果搭配其他程式碼的執行，就能進一步產生意想不到的攻擊。

這邊至少可細分兩件攻擊者必須做的事：
1. 攻擊者會試著找出「能夠污染 Prototype Chain 的方式」，造成安全性漏洞
2. 攻擊者還需要找出「要污染的內容」，而污染的內容搭配其他程式碼的執行，就能產生真正的攻擊

先來針對第一點，**找出污染 Prototype Chain 的方式**，假定專案中有段程式碼：

```javascript
// 宣告 merge 函式用來合併兩個物件
function merge(target, source) {
    for (let key in source) {
        if (typeof source[key] === 'object') {
            target[key] = merge(target[key] || {}, source[key]);
        } else {
            target[key] = source[key];
        }
    }
    return target;
}

// 正常使用 merge 看似沒事
const styleConfig = { theme: 'light' };
const newStyle = { fontSize: 14 }
merge(styleConfig, newStyle);
console.log(styleConfig); // {theme: 'light', fontSize: 14}
```

現在有個功能，讓使用者能透過輸入客製化 JSON config 更新樣式配置，大致程式碼如下：

```html
......省略
  <body>
    <!-- 演示輸入 JSON 樣式配置的功能 -->
    <h2>輸入自定義 JSON 樣式:</h2>
    <textarea id="configInput">{ "theme": "light" }</textarea>
    <button id="applyButton">送出配置</button>
    <div id="configResult"></div>

    <!-- 用來顯示是否成功污染 Object.prototype.isPolluted -->
    <button id="checkPollutedResultButton">檢查污染</button>
    <div id="checkPollutedResult"></div>

    <script>
      function merge(target, source) {
        for (let key in source) {
          if (typeof source[key] === "object") {
            target[key] = merge(target[key] || {}, source[key]);
          } else {
            target[key] = source[key];
          }
        }
        return target;
      }

      // 用來送出最新的客製化樣式
      function applyConfig() {
        const configInput = document.getElementById("configInput").value;
        const config = { theme: "default" };
        merge(config, JSON.parse(configInput));
        const configResult = `最新的配置結果: ${JSON.stringify(
          config,
          null,
          2
        )}`;
        document.getElementById("configResult").textContent = configResult;
      }

      // 用來檢測是否成功污染 Object.prototype.isPolluted 的函式
      function checkPollutedResult() {
        document.getElementById(
          "checkPollutedResult"
        ).textContent = `Object.prototype.isPolluted 的值：${Boolean(
          Object.prototype.isPolluted
        )}`;
      }

      document.addEventListener("DOMContentLoaded", function () {
        document
          .getElementById("applyButton")
          .addEventListener("click", applyConfig);
        document
          .getElementById("checkPollutedResultButton")
          .addEventListener("click", checkPollutedResult);
      });
    </script>
  </body>
......省略
```

現在攻擊者的目標是找到「污染 Object Prototype」的方式。

因為是演示，所以我有加入一段 `checkPollutedResult` 相關的程式碼，假設成功污染到 `Object.prototype.isPolluted`，那麼點擊 `checkPollutedResultButton` 將會印出 `true` 的結果。

那該怎麼樣污染 `Object.prototype` 內的屬性呢？

觀察程式碼可以發現 `merge` 這個函式中，會有 `target[key] = source[key]` 的邏輯，如果能讓它執行時是 `obj.__proto__.isAdmin = true` 就能達成目標！因為 `obj.__proto__` 會指向原型物件的 `prototype`。

同時，這個演示 App 本身就有輸入框能輸入，輸入的值會作為 `source` 參數傳入 `merge`，讓我們再看一次 `merge`:

```javascript
function merge(target, source) {
  for (let key in source) {
    if (typeof source[key] === "object") {
      target[key] = merge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```

可以發現它就是把 `source` 整合進去 `target`，假設傳進去 `{ "__proto__": "64" }` 就會經歷到 `target[__proto__] = "64"` 的邏輯，因為 `"64"` 這個值並非 `"object"` 就此結束。

但如果傳入的值是 `{ "__proto__": { "isPolluted": true } }`，由於 `{ "isPolluted": true }` 是 `"object"` 所以會再次以 `{ "isPolluted": true }` 作為 `source` 參數傳入 `merge` 再跑一次，最後就會經歷到 `target["__proto__"]["isPolluted"] = true` 的過程！

因此當輸入的 JSON 中，含有 `{ "__proto__": { "isPolluted": true } }`，就能成功污染到 `Object.prototype.isPolluted`，可參見下方測試的畫面：

![prototype pollution example](/images/articles/javascript-understand-prototype-and-prototype-pollution/04.gif)

以這個案例來說，攻擊者能在輸入框傳入 `{ "__proto__": xxx }`，並且透過在瀏覽器中印出 `Object.prototype` 就能驗證是否成功污染。

如果確認能成功污染，接著將進行到第二階段：**找出要污染的內容**，當污然的內容搭配其他程式碼執行時，就能產生真正的攻擊。

這邊設計另一個演示案例(下方有提供連結和程式碼)，跟剛剛邏輯不同之處在於：

- 新增 user 身份，並且會在一開始打 API 拿回 user 的 admin 狀態，BUT 這邊模擬剛好打 API 遇到 fail 的狀況
- 新增刪除配置的按鈕，只有 user 是 admin 時才會出現
- 新增把自定義 config 存入 localStorage 的邏輯，因此使用者就可以在一開始網頁渲染後，就看到上次操作的自定義 config

程式碼比剛剛複雜不少，有時間的人，可先透過[這個 demo-prototype-pollution 練習題連結](https://codesandbox.io/p/sandbox/wv39f3)進入玩看看，想想看在**不能直接改 CSS 的前提下**，要做什麼操作，達成「讓原本權限上不會顯示的“刪除配置按鈕“顯示出來」的攻擊。

_p.s 此演示案例是我針對“前端工程師”設計的大漏洞，目的是想讓前端工程師的讀者能簡單玩玩看，藉此更理解 Prototype Pollution。真正專案的程式碼會複雜很多，而且蠻多會牽涉到前端工程以外的領域，像是 API 互動等。_

如果沒時間或不想玩的人，可以直接往下看，首先來點程式碼註解：

```html
......省略
<body>
    <!-- 演示輸入 JSON 樣式配置的功能 -->
    <p>請透過輸入資料等操作，想辦法讓 "刪除配置" 按鈕顯現，不能直接改 CSS。</p>
    <h2>輸入自定義 JSON 樣式:</h2>
    <textarea id="configInput"></textarea>
    <button id="applyButton">送出配置</button>
    <!-- 這個刪除配置的按鈕，只有 user 有 admin 權限 true 才會出現 -->
    <button id="deleteButton">刪除配置</button>
    <div id="configResult"></div>

    <script>
      // 宣告一個空物件當作 user 資料存取空間
      const user = {};

      // 模擬 getUserAdmin API 請求，但最後失敗的情境
      function sendUserAdminApiRequest() {
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            reject(new Error("API 請求失敗"));
          }, 2000);
        });
      }

      // 打 API 去取回 user admin 的資料
      function getUserAdminData() {
        sendUserAdminApiRequest()
          .then((response) => {
            // 如果 API 成功，會把 Admin 狀態加入
            user.isAdmin = response;
            renderDeleteButton();
          })
          .catch((error) => {
            // 如果 API 失敗，會印出失敗訊息
            console.error("API 請求失敗:", error.message);
          });
      }

      // 用來合併物件的功能，是能用來污染 Prototype 的漏洞
      function merge(target, source) {
        for (let key in source) {
          if (typeof source[key] === "object") {
            target[key] = merge(target[key] || {}, source[key]);
          } else {
            target[key] = source[key];
          }
        }
        return target;
      }

      // 用來判斷是否為 JSON 資料
      function isValidJSON(jsonString) {
        try {
          JSON.parse(jsonString);
          return true;
        } catch (e) {
          return false;
        }
      }

      // 負責渲染 delete button，只有 user 是 admin 才顯示
      function renderDeleteButton() {
        const deleteButton = document.getElementById("deleteButton");
        deleteButton.style.display = user.isAdmin ? "inline-block" : "none";
      }

      // 負責渲染自定義的樣式結果，包含：
      // 1. 如果無傳進去 newConfig 的話，就設定 moreConfig 為 localStorage 取出的內容
      // 2. 最後使用 merge 將 config 和 config 結合後渲染到畫面
      function renderCustomizedConfig(newConfig) {
        const config = { theme: "light" };
        const moreConfig = isValidJSON(newConfig)
          ? JSON.parse(newConfig)
          : isValidJSON(localStorage.getItem("storedConfigInput"))
          ? JSON.parse(localStorage.getItem("storedConfigInput"))
          : {};

        merge(config, moreConfig);

        const configResult = `樣式結果: ${JSON.stringify(
          config,
          null,
          2
        )}`;
        document.getElementById("configResult").textContent = configResult;
      }

      // 按下 "送出配置" 時會送出的邏輯，包含：
      // 1. 取得使用者輸入的內容
      // 2. 渲染出最新的自定義樣式結果
      // 3. 將自定義樣式結果存進去 localStorage 中
      function applyCustomizedConfig() {
        const configInput = document.getElementById("configInput").value;
        renderCustomizedConfig(configInput);
        window.localStorage.setItem(
          "storedConfigInput",
          JSON.parse(JSON.stringify(configInput))
        );
      }

      // 初始化邏輯
      document.addEventListener("DOMContentLoaded", function () {
        renderCustomizedConfig(); // 初始化渲染自定義樣式
        renderDeleteButton(); // 初始化 delete button 的顯示

        getUserAdminData(); // 觸發打 API 拿回 user admin 資料

        document
          .getElementById("applyButton")
          .addEventListener("click", applyCustomizedConfig);
      });
    </script>
  </body>
......省略
```

開始解答。

先講**結論**：攻擊者會找出要污染的內容是 `Object.prototype.isAdmin`，而搭配的污染方式是在輸入框中輸入 `{ "__proto__": { "isAdmin": true } }` 並送出。接著只要按下網頁的重新整理讓網頁再次渲染後，便導致 user admin 的“刪除配置按鈕”被顯示出來了！


可參見下方測試的畫面：

![prototype pollution example 2](/images/articles/javascript-understand-prototype-and-prototype-pollution/05.gif)

結論雖然單純，但如果要從零找到這個結論，是需要一定的思考過程跟脈絡，接著就來細談**思考過程**：

首先回顧一下，剛剛已驗證 `merge` 這個函式其實有問題，能夠用來污染 Object Prototype Chain，亦即可以在輸入框傳入 `{ "__proto__": { "key": "value" } }`， 就能造成 `Object.prototype.key = 'value'`。

接著來思考目標，目標是想要「讓原本只有 user admin 的功能顯示出來」，透過上述程式碼的閱讀，會發現當 `user` 這個物件的 `isAdmin` 為 `true` 時，就會顯示只有 admin 才會看到的功能，也就是會顯示“刪除配置按鈕”。

```javascript
function renderDeleteButton() {
  const deleteButton = document.getElementById("deleteButton");
  // user.isAdmin 為 true 就會顯示“刪除配置按鈕”
  deleteButton.style.display = user.isAdmin ? "inline-block" : "none";
}
```

如果查看 `user` 這個變數的源頭，會發現是 `const user = {}`，亦即初始化時是一個空物件，沒有 `isAdmin` 的 key 存在！那什麼時候才會設置 `user.isAdmin = true` 或 `user.isAdmin = false` 呢？要等到 `getUserAdminData` 這個模擬用的 API 打回來才會設置。

但是！當查看詳細的打 API 內容後，進一步發現，原來當打 API 發生錯誤時，就不會觸發 `user.isAdmin = xxx`，`user` 就會維持空物件，這麼一來，只要想辦法讓打 API 發生錯誤，就能讓 `user` 維持在沒有 `isAdmin` 狀態，然後在這種狀態下，一但呼叫 `user.isAdmin` 就會觸發 Prototype Chain 機制，最終查找到的就會是 `Object.prototype.isAdmin` 的值，亦即 `user.isAdmin = Object.prototype.isAdmin`。

為了讓這個練習題單純些，所以模擬打 API 的結果永遠都是失敗，因此可以認知到 `user.isAdmin = Object.prototype.isAdmin` 為真。

```javascript
const user = {};

// 模擬 getUserAdmin API 請求，但最後失敗的情境
function sendUserAdminApiRequest() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("API 請求失敗"));
    }, 2000);
  });
}

// 打 API 去取回 user admin 的資料
function getUserAdminData() {
  sendUserAdminApiRequest()
    .then((response) => {
      user.isAdmin = response;
      renderDeleteButton();
    })
    .catch((error) => {
      console.error("API 請求失敗:", error.message);
    });
}
```

好了，這麼一來，只需污染 `Object.prototype.isAdmin = true` 就能達成目標，所以能直接在開發者工具中下這行 `Object.prototype.isAdmin = true` 指令就能讓“刪除配置按鈕”顯示嗎？經過嘗試後發現不行，即便 `Object.prototype.isAdmin = true` 確實會讓 `user.isAdmin` 被污染，但是由於“刪除配置按鈕”的渲染，只發生在一開始網頁載入跑 `renderDeleteButton` 函式的時候發生，在 `renderDeleteButton` 跑完後才去改 `user.isAdmin` 就沒意義了，因為不會 re-render。如果想說用重新整理讓頁面重新渲染的方式也不行，因為一但重新整理，那麼 `Object.prototype` 會被重置。

既然如此，那就來看看渲染邏輯，閱讀過後會發現有個 `renderCustomizedConfig` 會在 `renderDeleteButton` 之前執行，因此可以看看 `renderCustomizedConfig` 裡面有沒有能污染 Prototype Chian 的方式。

閱讀 `renderCustomizedConfig` 後，發現它會從 `localStorage` 中取出上次的 customized config 結果，並且透過有問題的 `merge` 函式，將 default config 與 customized config 合併。如此一來，只需要想辦法讓 `localStorage` 中存入 `{ "__proto__": { "isAdmin": true } }`，就能觸發 `config["__proto__"]["isAdmin"] = true` 進而污染 Prototype Chian 達成目標。

```javascript
function renderCustomizedConfig(newConfig) {
  const config = { theme: "light" };
  const moreConfig = isValidJSON(newConfig)
    ? JSON.parse(newConfig)
    : isValidJSON(localStorage.getItem("storedConfigInput"))
    ? JSON.parse(localStorage.getItem("storedConfigInput"))
    : {};

  merge(config, moreConfig);

  const configResult = `樣式結果: ${JSON.stringify(
    config,
    null,
    2
  )}`;
  document.getElementById("configResult").textContent = configResult;
}
```

把客製化設定檔存入 `localStorage` 的邏輯在 `applyCustomizedConfig` 函式中，而它正是按下“送出配置按鈕”時會觸發的邏輯，最終，攻擊者只需要在輸入框輸入 `{ "__proto__": { "isAdmin": true } }`，並且再次按下重新整理網頁的按鈕，就會讓 `Object.prototype.isAdmin = true` 成真，進而導致 `user.isAdmin` 成真，接著渲染完畢後，“刪除配置按鈕”就顯示出來了！

```javascript
function applyCustomizedConfig() {
  const configInput = document.getElementById("configInput").value;
  renderCustomizedConfig(configInput);
  window.localStorage.setItem(
    "storedConfigInput",
    JSON.parse(JSON.stringify(configInput))
  );
}
```

如果上述內容有不清楚的，可以多看幾遍或是搭配自己操作一次，就會比較明白了～

當然在真實世界中，權限都該由後端控管和檢查，即便真的能讓一些被隱藏的操作顯示，也不可能直接被攻擊，畢竟如果只是想要顯示操作的按鈕，改一下 CSS 就行，這邊比較像是硬是用 Prototype Chain 去鑽漏洞。然而，藉由這個例子，不難想像可藉由 Prototype Chain 的方式，改變某些判斷條件，讓渲染內容有所改變，導致更嚴重的攻擊發生，像渲染能執行的程式碼，或把不該送的東西送到後端（而後端又沒檢查），都可能導致意想不到的後果。

最後再次整理，假設攻擊者要用 Prototype 攻擊，大概念下需要：
1. 攻擊者會試著找出「**能夠污染 Prototype Chain 的方式**」，造成安全性漏洞
2. 攻擊者還需要找出「**要污染的內容**」，而污染的內容搭配“其他程式碼”的執行，就能產生真正的攻擊

這邊有個專有名詞叫 **Prototype Pollution Gadgets** 專門用來指那些「原本正常無害，但假如 Prototype 被污染後，就會導致意想不到的攻擊」的程式碼片段。稍微提一下而已，如有興趣可以自己查資料，閱讀 《Beyound XSS》。

---

## 避免 Prototype Chain 被污染的方式

既然談到 Prototype Chain 有可能被攻擊者污染，那接續就來看看有什麼避免被攻擊的方式。

### 1. 將 `__proto__`, `prototype` 等關鍵字過濾掉

由於攻擊者的攻擊需要成立，一定需要透過 `__proto__`、 `prototype`、`constructor` 等關鍵字的輸入值，才有辦法污染 Prototype Chain，因此可以把這些關鍵字過濾掉就好，可以用到 **sanitize** 相關的函式庫處理，像是：DOMPurify。

另外像是 `merge` 之類的 function 就可以把相關的 key 都過濾掉，像是：

```javascript
function merge(target, source) {
  for (let key in source) {
    // 過濾掉 "__proto__", "prototype", 和 "constructor"
    if (key === "__proto__" || key === "prototype" || key === "constructor") {
      continue;
    }
    
    if (typeof source[key] === "object" && source[key] !== null) {
      target[key] = merge(target[key] || {}, source[key]);
    } else {
      target[key] = source[key];
    }
  }
  return target;
}
```

當然實務上，開發者通常不會自己撰寫 `merge` 這類函式，而是直接用 lodash 等函式庫處理，就不用自己造輪子，那如果是用第三方函式庫需要注意什麼？最需要注意的是，假定有新的版本是修補安全性漏洞的話，就要趕緊著升級版本！

然而，通常開發者不會每天都關心第三方函式庫是否更新，所以應變方式可在 CICD 流程中，安插安全性檢測的 job，利用像是 **Trivy** 等 security scanner 的工具，藉此在每次部署自動掃描函式庫是否有問題。
 
### 2. 將 `__proto__`, `prototype` 等關鍵字轉成純 Property 處理

雖然可以用上述改 `merge` 的方式一樣，直接完全“忽略”掉 `__proto__` 等關鍵字來增加安全性，然而假定有需要使用 `__proto__` 這類 key 的時候，那該怎麼做呢？

有個 JS 方法是 `Object.defineProperty` 可以定義 Object 的 Property，可藉此把 `__proto__` 等關鍵字當作是 **普通的物件屬性 key**，藉此避免污染到原型物件，程式碼概念如下：

```javascript
// 取自 lodash v5 原始碼
function baseAssignValue(object, key, value) {
  // 假定遇到 key 等於 '__proto__'，就將其定義為為 Object 的純 Property 處理
  if (key === '__proto__') {
    Object.defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    })
  } else {
    object[key] = value
  }
}
```

乍看之下由於 `Object.defineProperty` 中的設定檔是 `'configurable': true`, `'enumerable': true`, `'value': value`, `'writable': true`，所以與 `object.__proto__` 似乎無意，畢竟都能賦值且修改，但是，不一樣的是 `object.__proto__` 會修改到 `Object.prototype` 而 `Object.defineProperty(object, key, {'value': value, ...}` 則不會修改到 `Object.prototype`，因此就能避免 Prototype Chain 被污染。

針對上述設計的演示案例中的 `merge`，只需要判斷當 `key` 為 `__proto__`, `prototype`...時，改用 `Object.defineProperty` 的方式賦值就會相對安全。

### 3. 透過 `Object.create(null)` 創建無 Prototype Chian 的物件

針對絕對不能被污染的重要物件，或許可以考慮利用 `Object.create(null)` 來創建，創建出的結果，並不會繼承 `Object.prototype` 的屬性：

```javascript
const obj = Object.create(null);
console.log(obj.toString); // undefined
console.log(obj.hasOwnProperty); // undefined
```

以演示案例而言，只需要把創造 `user` 物件的方式改為用 `Object.create` 就能避免被污染。

除此之外其實還有用 `new Map` 的方式，創造 `user` 類物件來使用，不會繼承到 Prototype Chain，也是一種避免 `user` 被污染的方法。

### 4. 透過 `Object.freeze(Object.prototype)` 或 `Object.seal(Object.prototype)` 阻止 `Object.prototype` 新增屬性

有兩個方式可以直接阻止物件新增屬性，分別是：
- **Object.freeze**: 完全凍結物件，無法新增、修改或刪除任何屬性，也無法改變屬性的屬性設定值（如 writable、configurable）。
- **Object.seal**: 封閉物件，無法新增或刪除屬性，但仍然可以修改現有屬性的值，算是彈性比 freeze 大。

```javascript
// 利用 “Object.freeze” 凍結 Object.prototype
Object.freeze(Object.prototype);

// 嘗試修改 Object.prototype 的屬性失敗
Object.freeze(Object.prototype);
Object.prototype.toString = 'string';
console.log(Object.prototype.toString); // f toString()

// 嘗試新增屬性給 Object.prototype 也會失敗
Object.prototype.newProp = 'new';
console.log(Object.prototype.newProp); // undefined
```

```javascript
// 利用 “Object.seal” 封閉 Object.prototype
Object.seal(Object.prototype);

// 現有屬性可以修改，會成功
Object.prototype.toString = "string";
console.log(Object.prototype.toString); // string

// 但是新增新屬性或刪除屬性都會失敗
Object.prototype.newProp = 'new';
console.log(Object.prototype.newProp); // undefined
```

但把 `Object.prototype`（或 `Array.prototype` 等）直接封死並非最佳做法，因為很多第三方函式庫，會利用原型的特性，做 polyfill 的功能，藉此能讓同一個方法支援多個瀏覽器或裝置環境。 

所以除非是非常特定情境，例如確定不會用第三方且安全性要開到最大，才會考慮用這種方式，當然相對起來是 `Object.seal` 更溫和些。

### 延伸的其他方式

上述的方式都是試圖直接阻止 Prototype Chain 被污染，而其中在實務中的最佳做法，大概會是 loadash 採用的第二種方式「將 `__proto__`, `prototype` 等關鍵字轉成純 Property 處理」，當然，還是要依照專案的情境而定。

不過，單獨污染原型通常沒意義，實際上還會搭配進一步的手法，像是因為 Prototype Pollution 導致某些條件改變，進一步讓某些 `script` 被插入執行等等，那只要讓 `script` 不能夠執行，也就能阻止整個攻擊。

這邊就牽涉到很多延伸出的安全性手段，像是 **CSP(Content Security Policy)** 的設定、有沒有做 **Sanitization** 等等，比較超出本文範圍，有興趣的話跟上面說得一樣，可以自行查資料或閱讀《Beyond XSS》啦。

---

## 總結，以及可以做什麼

從 Prototype 的定義、Prototypal Inheritance 、Prototype Chain 到 Prototype Pollution，大致上把 JS 原型的概念和簡單應用整理完畢，接著快速回顧幾個問題：

### 什麼是 Prototype

在 JavaScript 中，**Prototype** 是個物件，用來實現 Object 資料間的屬性共享。

具體來說，每個 Object 資料都有個原型物件的內部屬性 `[[Prototype]]`，如果在程式碼中想要取得該原型物件，可以透過 `obj.__proto__` 或 `Object.getPrototypeOf(obj)` 進行。

而原型物件的內容，則來源於物件的 `constructor` 中的 `prototype` 屬性值，舉例來說：

```javascript
// constructor Dog
function Dog(name){ 
    this.name = name
}

// 利用 prototype 使 new Dog 的物件實例都會吠叫
Dog.prototype.bark = function(voice) {
  console.log(voice)
}

const dogA = new Dog('肚子')
const dogB = new Dog('吐司')
// bark 的來源都是 constructor.prototype
console.log(dogA.bark === dogB.bark) // true
console.log(dogA.bark === dogA.__proto__.bark) // true
console.log(dogA.__proto__.bark === Dog.prototype.bark) // true
```

### 什麼是 Prototype Chain

這算是查找物件屬性過程的概念描述。

在 Javascript 中，當呼叫 Object Data 屬性，如果找不到該屬性時，會往其 `[[Prototype]]` 物件查找，如果找到就回傳屬性所對應的值，如果找不到，就會往 `[[Prototype]]` 物件的更上層的 `[[Prototype]]` 物件查找，重複此邏輯，直到找到該屬性就會回傳對應的值，或直到 Prototype 為 `null` 也就代表沒有更上層的 Prototype 內容，這時就會回傳 `undefined`。

這個過程，就是 **Prototype Chain**。

### 什麼是 Prototype Pollution

**Prototype Pollution** 是種安全性漏洞，攻擊者可以利用這類漏洞修改 JavaScript 的原型物件（通常是 `Object.prototype`）。這樣的污染可能導致物件呼叫屬性的回傳值改變，搭配其他程式碼(Prototype Pollution Gadgets)，進一步引發更嚴重的安全性問題。


### 所以理解這些後，可以做什麼？

我認為理解後，在實務上可以做得是：

### 1. 避免去修改原生 JS 的 Prototype Chain

因為改動原生 JS Prototype Chain 影響範圍太廣，會導致很多無法預期的問題發生。

最好要透過自動化像是 ESLint 的規則去限制開發者亂改，並且要在 CICD 的過程跑 ESlint 檢測。

另外 Code Review 的流程中，也要對此有敏感性，一但看到 `__proto__`, `prototype` 等字元出沒，就要稍微想到 Prototype Chain，並且更好的是在重要的物件處理上，稍微想一下會不會有問題，需不需要用 `Object.create` 或者 `Map` 的方式去處理重要的資料。

### 2. 如果需所有 Object 資料都能使用的方法，可以考慮用 Prototypal Inheritance

Prototypal Inheritance 的好處就是可以讓所有繼承的 Object 都擁有該屬性方法，而且記憶體位置相同，如此一來除了能共同維護外，也可以讓記憶體佔比變少。

不過如果只是在單一專案內，我個人比較傾向直接宣告一個獨立的共用函式，然後 `import` 到需要的檔案使用即可，不一定需要用 Prototype 的特性。

但如果是在提供給別人使用的函式庫中，似乎更能考慮是否有適合的場景使用其特性。

### 3. 不要相信使用者的輸入

任何跟使用者輸入有關之處，包含網址、輸入框等等，都要小心會被輸入 `__proto__`, `prototype` 等關鍵字，如果後續把資料與物件混合時處理不佳，就有可能會導致 Prototype Pollution。

不過很多第三方函式庫都會對此有處理，可以直接用就好，像是如果用 lodash 的 `merge` 就會自帶過濾。

### 4. 定期進行安全性檢查

即便使用第三方函式庫，也有可能因為有安全性漏洞而導致原型被污染，所以盡量能在 CICD 時進行安全性檢查，就能自動地被提醒要進行第三方函式庫的版本升級，藉此盡量地避免安全性漏洞。

---

希望看完本文後，對於 Prototype 相關的概念有更加清楚明瞭，我自己在本文撰寫過程中，最多新知識是在於 Prototype Pollution 安全性相關的議題，因為是近期閱讀書籍後才認真瞭解的概念，實際了解後發現蠻有趣的，趁這次重新整理時，也算把這塊不足之處也補齊吧！

---

#### 參考資料

- [Prototype | ECMA](https://tc39.es/ecma262/#sec-terms-and-definitions-prototype)
- [Inheritance and the prototype chain | MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain)
- [《Beyond XSS：探索網頁前端資安宇宙》](https://www.tenlong.com.tw/products/9786267383803)
- [該來理解 JavaScript 的原型鍊了](https://blog.huli.tw/2017/08/27/the-javascripts-prototype-chain/#%E6%8E%A2%E7%A9%B6%E5%8E%9F%E7%90%86)
- [JavaScript | 關於 Object ，一口氣全說完](https://medium.com/enjoy-life-enjoy-coding/javascript-%E9%97%9C%E6%96%BC-object-%E4%B8%80%E5%8F%A3%E6%B0%A3%E5%85%A8%E8%AA%AA%E5%AE%8C-4bb924bcc79f)
- 與[ChatGPT 4](https://openai.com/gpt-4)共編
- 與[Claude 3.5](https://claude.ai/new)共編









































