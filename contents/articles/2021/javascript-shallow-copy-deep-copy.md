---
title: JS 中的淺拷貝 (Shallow copy) 與深拷貝 (Deep copy) 原理與實作
date: 2021-06-01
description: 在 JS 中 Object 資料型別的複製變數時，是複製地址(address)而非原始值(value)，所以操作複製出的新變數時，容易更動到原始變數，反之亦然，因此容易造成非預期的 Bug 發生。為了解決這類問題，就必須了解 Object 資料型別的兩種拷貝方式：淺拷貝(Shallow copy)與深拷貝(Deep copy)。
tag: JavaScript
---

## 前言

在上篇文章 [JS 變數傳遞探討：pass by value 、 pass by reference 還是 pass by sharing？](/articles/2021/javascript-pass-by-value-pass-by-reference-pass-by-sharing) 中有提到： JS 中，資料的型別主要有分為「基本型別 (Primitive type)」 以及「物件 (Object)」，兩者最大的差異在於：

- **Primitive type data** 複製變數時，會直接「 複製值 (value) 」。像是：`string`、`number`、`boolean`、`undefined`、`null`、`symbol` 的變數資料。
- **Object data** 複製變數時，會「 複製地址 (address) 」。像是：`object`、`array`、`function` 的變數資料。

概念如下圖：

![Primitive type data and Object data](/images/articles/javascript-shallow-copy-deep-copy/01.png)

轉換成程式中的表現行為如下：

```javascript
/*** 基本型別 ***/
let a = 5;
let b = a; // 複製 primitive data 變數

console.log(a); // 5
console.log(b); // 5

b = 10;

console.log(a); // 5 => 沒被改變，因為 a 與 b 的值不同
console.log(b); // 10

/*** 物件型別，改變內容 ***/
let a = { number: 5 };
let b = a; // 複製 object data 變數

console.log(a); // { number : 5 }
console.log(b); // { number : 5 }

b.number = 10;

console.log(a); // { number : 10 } => 跟著改變，因 a 與 b 地址相同，指向同個值
console.log(b); // { number : 10 }
```

可以發現到 `Primitive type data` 的複製是 **real copy**，意思是將值(value)真實地複製一份，所以最終結果不會互相影響。

相對地，`Object data` 則是僅複製地址(address)，因此值可能互相影響，這種複製出的變數與原來的變數間會互相影響的複製方法，稱為**淺拷貝(shallow copy)**。

難道 `Object data` 就無法複製一份「全新的地址和值」的變數嗎？有的，透過一些方法，還是能複製完全不會互相影響的兩個 `Object data`，這種方法就稱為**深拷貝(Deep Copy)**。

_p.s 本文的附圖都是便於理解抽象原理所做，實際在記憶體運作往往有更多細節。_

---

## 淺拷貝的原理與實作

當 `Original Object data` 與 `Cloned Object data` 中，**有任何一層的資料地址相同，背後指向的值相同，兩個物件的操作會互相影響**，就為**淺拷貝(shallow copy)**。

![shallow copy 1](/images/articles/javascript-shallow-copy-deep-copy/02.png)

```javascript
/*** 淺拷貝：直接複製 ***/
const originalData = {
  firstLayerNum: 10,
  obj: {
    secondLayerNum: 100,
  },
};
const clonedData = originalData;

clonedData.firstLayerNum = 20;
clonedData.obj.secondLayerNum = 200;

console.log(originalData.firstLayerNum);
// 20 => 第一層有被 clonedData 影響而改變
console.log(originalData.obj.secondLayerNum);
// 200 => 第二層有被 clonedData 影響而改變
```

以上的範例可看出 `originalData` 與 `clonedData` 兩者間會互相影響。

需要注意的是「只要有任何一層的資料地址相同」，換句話說就是「只要並非兩個完完全全獨立的 `Object data`」，就依然是淺拷貝。

![shallow copy 2](/images/articles/javascript-shallow-copy-deep-copy/03.png)
_p.s 概念示意圖，地址並非直接存在 obj 中，而是 obj 變數會對應一個地址_

上面看完原理概念圖，接著就在程式中，實踐這種「第一層不會互相影響，但第二層後會互相影響」的淺拷貝吧！

### 一、手動複製第一層的物件值

```javascript
/*** 淺拷貝：手動複製第一層的物件值 ***/
const originalData = {
  firstLayerNum: 10,
  obj: {
    secondLayerNum: 100,
  },
};
const clonedData = {
  firstLayerNum: originalData.firstLayerNum,
  obj: originalData.obj,
};

clonedData.firstLayerNum = 20;
clonedData.obj.secondLayerNum = 200;

console.log(originalData.firstLayerNum);
// 10 => 第一層沒有被 clonedData 影響
console.log(originalData.obj.secondLayerNum);
// 200 => 第二層被 clonedData 影響而改變
```

### 二、自建 shallowCopy 函式，複製第一層物件值

```javascript
/*** 淺拷貝：自建 shallowCopy 函式，複製第一層物件值 ***/
function shallowCopy(originalObj) {
  let clonedObj = {};
  for (const key in originalObj) {
    clonedObj[key] = originalObj[key];
  }
  return clonedObj;
}

const originalData = {
  firstLayerNum: 10,
  obj: {
    secondLayerNum: 100,
  },
};
const clonedData = shallowCopy(originalData);

clonedData.firstLayerNum = 20;
clonedData.obj.secondLayerNum = 200;

console.log(originalData.firstLayerNum);
// 10 => 第一層沒有被 clonedData 影響
console.log(originalData.obj.secondLayerNum);
// 200 => 第二層被 clonedData 影響而改變
```

### 三、Object.assign(target, ...sources)

```javascript
/*** 淺拷貝：Object.assign ***/
const originalData = {
  firstLayerNum: 10,
  obj: {
    secondLayerNum: 100,
  },
};
const clonedData = Object.assign({}, originalData);

clonedData.firstLayerNum = 20;
clonedData.obj.secondLayerNum = 200;

console.log(originalData.firstLayerNum);
// 10 => 第一層沒有被 clonedData 影響
console.log(originalData.obj.secondLayerNum);
// 200 => 第二層被 clonedData 影響而改變
```

### 四、Spread operator

```javascript
/*** 淺拷貝：Spread operator ***/
const originalData = {
  firstLayerNum: 10,
  obj: {
    secondLayerNum: 100,
  },
};
const clonedData = { ...originalData };

clonedData.firstLayerNum = 20;
clonedData.obj.secondLayerNum = 200;

console.log(originalData.firstLayerNum);
// 10 => 第一層沒有被 clonedData 影響
console.log(originalData.obj.secondLayerNum);
// 200 => 第二層被 clonedData 影響而改變
```

### 五、部分 Array 方法，如：slice()、from() 等

```javascript
/*** 淺拷貝：Array.prototype.slice() ***/
const originalData = [10, { secondLayerNum: 100 }];
const clonedData = originalData.slice();

clonedData[0] = 20;
clonedData[1].secondLayerNum = 200;

console.log(originalData[0]);
// 10 => 第一層沒有被 clonedData 影響
console.log(originalData[1].secondLayerNum);
// 200 => 第二層被 clonedData 影響而改變
```

---

## 深拷貝的原理與實作

看完淺拷貝，緊接著繼續了解深拷貝。

當 `Original Object data` 與 `Cloned Object data` ，**是兩個完全獨立，每一層的資料地址都不同，相互不影響的深層物件**，就為**深拷貝(deep copy)**。

![deep copy](/images/articles/javascript-shallow-copy-deep-copy/04.png)
_p.s 概念示意圖，地址並非直接存在 obj 中，而是 obj 變數會對應一個地址_

有哪些方式可以達成深拷貝呢？

### 一、JSON.stringify/parse

`JSON.stringify/parse` 常見於處理 Local Storge、Session Storage 等 Storage 的儲存操作，其實也可以用來實踐深拷貝。

主要是用 `JSON.stringify` 先把物件轉字串，再用 `JSON.parse` 把字串轉物件即可。

```javascript
/*** 深拷貝：JSON.stringify/parse ***/
const originalData = {
  firstLayerNum: 10,
  obj: {
    secondLayerNum: 100,
  },
};
const clonedData = JSON.parse(JSON.stringify(originalData));

clonedData.firstLayerNum = 20;
clonedData.obj.secondLayerNum = 200;

console.log(originalData.firstLayerNum);
// 10 => 第一層「沒有」被 clonedData 影響
console.log(originalData.obj.secondLayerNum);
// 100 => 第二層「沒有」被 clonedData 影響
```

但需要特別注意有些值經過 `JSON.stringify/parse` 處理後，會產生變化，導致非預期的結果發生：

- undefined : 會`連同 key 一起消失`。
- NaN : 會被轉成 `null`。
- Infinity :會被轉成 `null`。
- regExp : 會被轉乘 `空 {}`。
- Date : 型別會由 `Data` 轉成 `string`。

```javascript
const originalData = {
  undefined: undefined, // undefined values will be completely lost, including the key containing the undefined value
  notANumber: NaN, // will be forced to null
  infinity: Infinity, // will be forced to null
  regExp: /.*/, // will be forced to an empty object {}
  date: new Date('1999-12-31T23:59:59'), // Date will get stringified
};
const faultyClonedData = JSON.parse(JSON.stringify(originalData));

console.log(faultyClonedData.undefined); // undefined
console.log(faultyClonedData.notANumber); // null
console.log(faultyClonedData.infinity); // null
console.log(faultyClonedData.regExp); // {}
console.log(faultyClonedData.date); // "1999-12-31T15:59:59.000Z"
```

### 二、Lodash cloneDeep()

`Loadash library` 本身有提供深拷貝 `cloneDeep()` 的方法，且不會遇到 `JSON.stringify/parse` 部分值會非預期改變的問題。

```javascript
/*** 深拷貝：Lodash cloneDeep() ***/
import { clone, cloneDeep } from 'lodash';

const nestedArr = [['1'], ['2'], ['3']];

const shallowCopyWithLodash = clone(nestedArr); // 實踐「淺」拷貝
console.log(nestedArr[0] === shallowCopyWithLodash[0]);
// true => Shallow copy (same reference address)

const deepCopyWithLodash = cloneDeep(nestedArr); // 實踐「深」拷貝
console.log(nestedArr[0] === deepCopyWithLodash[0]);
// false => Deep copy (different reference address)
```

### 三、Recursive deepCopyFunction

可自建簡單的「遞迴函式」，遍歷 `Object data` 每一層級資料，將其完全複製新的一份。

```javascript
/*** 深拷貝：Recursive deepCopyFunction ***/
function deepCopyFunction(inputObject) {
  // Return the value if inputObject is not an Object data
  // Need to notice typeof null is 'object'
  if (typeof inputObject !== 'object' || inputObject === null) {
    return inputObject;
  }

  // Create an array or object to hold the values
  const outputObject = Array.isArray(inputObject) ? [] : {};

  // Recursively deep copy for nested objects, including arrays
  for (let key in inputObject) {
    const value = inputObject[key];
    outputObject[key] = deepCopyFunction(value);
  }

  return outputObject;
}

const originalData = {
  firstLayerNum: 10,
  obj: {
    secondLayerNum: 100,
  },
};
const clonedData = deepCopyFunction(originalData);

clonedData.firstLayerNum = 20;
clonedData.obj.secondLayerNum = 200;

console.log(originalData.firstLayerNum);
// 10 => 第一層「沒有」被 clonedData 影響
console.log(originalData.obj.secondLayerNum);
// 100 => 第二層「沒有」被 clonedData 影響
```

這是簡單的做法，然而要深入的製作 deep copy function 還有很多可以調整與探討的，可參考這篇：[如何写出一个惊艳面试官的深拷贝?](https://juejin.cn/post/6844903929705136141#heading-6)

---

## 淺深拷貝總結

用一張圖簡易地總結淺深拷貝的概念：

![shallow copy and deep copy](/images/articles/javascript-shallow-copy-deep-copy/05.png)

- **淺拷貝(shallow copy)** : 原始物件資料與複製物件資料「並非完全獨立」，可能第一層就有指向相同地址的資料，也可能第二層才有指向相同地址的資料。彼此資料內容的改變可能會互相影響。
- **深拷貝(deep copy)** : 原始物件資料與複製物件資料「完全獨立」，沒有任何一層資料指向相同的地址。彼此資內容料的改變不會互相影響。

從上篇談 `pass by value`、`pass by reference`、`pass by sharing` 開始，到這篇談 `shallow copy` 與 `deep copy`，都可以發現其實最重要的觀念在於理解「 `Primitive type data` 與 `Object data` 複製的過程 」，如果腦中有他們複製時變數表運作的過程，那理解起來就相對容易，而且也不用特別死背囉。

如果還有些困惑，建議和[前一篇](/articles/2021/javascript-pass-by-value-pass-by-reference-pass-by-sharing)一起再讀一讀，會更有機會理解整個運作機制囉。

---

## 後記，在開發中遇到的 Bug

最後補充紀錄實際在開發時，有看到的 Bug，也是因此才會想整理整套 `Object data` 複製的過程和淺深拷貝。

這個 Bug 是在 `React` 的 `custom hook` 遇到的，已將其簡化很多，僅放上關鍵之處：

```javascript
const initialOrderData = {
  totalPayment: 0, // 這是 Primitive type data，複製時是複製值
  orderList: [], // 這是 Object data，複製時是複製地址，要特別注意
};

const useOrderDataHandler = () => {
  const [orderData, setOrderData] = useState(initialOrderData);

  const addOrder = newOrder => {
    setOrderData(prev => {
      const newTotalPayment = prev.totalPayment + newOrder.DiscountedTotalPrice;
      // 這邊的操作會造成下面 resetOrderData 的 bug
      const newOrderList = prev.orderList;
      newOrderList.unshift(newOrder);

      return {
        totalPayment: newTotalPayment,
        orderList: newOrderList,
      };
    });
  };

  const resetOrderData = () => {
    setOrderData(initialOrderData);
    // 這邊會有 Bug！！！
    // 因為 initialOrderData 中的 orderList
    // 已經被 addOrder 的 newOrderList.unshift(newOrder) 操作給改變了
    // 導致 orderList 無法被 reset 回  []
  };
  ......

  return {
    addOrder,
    resetOrderData,
    ......
  };
};
```

上面這段 code 最需要注意的是 `initialOrderData` 中，有 `orderList: []` 的物件型別資料，因此 `addOrder` 中這段會有問題：

```javascript
const addOrder = newOrder => {
  setOrderData(prev => {
    const newTotalPayment = prev.totalPayment + newOrder.DiscountedTotalPrice;
    // 這層複製，讓 newOrderList 與 initialOrderData.orderList 有同樣的地址
    const newOrderList = prev.orderList;
    // 因此對 newOrderList 的內容改動，會影響到 initialOrderData.orderList
    // 導致 initialOrderData 被非預期地改變
    newOrderList.unshift(newOrder);

    return {
      totalPayment: newTotalPayment,
      orderList: newOrderList,
    };
  });
};
```

由於確定 `orderList` 會是「只有一層」的結構，不會有第二層的物件型別資料，因此可以透過「確保第一層不會互相影響」的淺拷貝方法修改即可：

```javascript
const addOrder = newOrder => {
  setOrderData(prev => {
    const newTotalPayment = prev.totalPayment + newOrder.DiscountedTotalPrice;
    //第一種：透過 Spread operator 淺拷貝，讓第一層的資料改變不會互相影響
    const newOrderList = [newOrder, ...prev.orderList];

    //第二種：透過 concat() 淺拷貝，讓第一層的資料改變不會互相影響
    const newOrderList = [newOrder].concat(prev.orderList);

    return {
      totalPayment: newTotalPayment,
      orderList: newOrderList,
    };
  });
};
```

也可以在一開始就完全地複製一份 `initialOrderData`，但必須注意 `initialOrderData` 中的 `orderList` 是第二層的深層物件型別資料，因此要用深拷貝：

```javascript
const initialOrderData = {
  totalPayment: 0,
  orderList: [],
};

const useOrderDataHandler = () => {
  // 深拷貝，確保 initialOrderData 中的 orderList 被完全複製
  // 不會與原始來源互相影響
  const clonedInitialOrderData = JSON.parse(JSON.stringify(initialOrderData))
  const [orderData, setOrderData] = useState(clonedInitialOrderData);
 ......
}
```

以上就是與 `Object data` 拷貝有關的 Bug 紀錄和分享，藉此未來謹記之。

---

#### 參考資料

- [A Deep Dive into Shallow Copy and Deep Copy in JavaScript](https://javascript.plainenglish.io/shallow-copy-and-deep-copy-in-javascript-a0a04104ab5c)
- [Understanding Deep and Shallow Copy in Javascript](https://medium.com/@manjuladube/understanding-deep-and-shallow-copy-in-javascript-13438bad941c)
- [JavaScript 淺拷貝 (Shallow Copy) 與深拷貝 (Deep Copy)](https://awdr74100.github.io/2019-10-24-javascript-deepcopy/)
