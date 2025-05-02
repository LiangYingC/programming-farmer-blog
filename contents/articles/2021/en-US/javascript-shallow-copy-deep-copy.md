---
title: Principles and Implementation of Shallow Copy and Deep Copy in JavaScript
date: 2021-06-01
description: When copying Object data types in JavaScript, the address is copied rather than the original value, so manipulating the copied variable can easily affect the original variable and vice versa, potentially causing unexpected bugs. To solve these problems, it's essential to understand the two copying methods for Object data types - Shallow Copy and Deep Copy.
tag: JavaScript
---

## Introduction

In the previous article [Exploring JavaScript Variable Passing: pass by value, pass by reference, or pass by sharing?](/articles/2021/javascript-pass-by-value-pass-by-reference-pass-by-sharing), I mentioned that in JavaScript, data types are mainly divided into "Primitive types" and "Objects", with the biggest difference being:

- When copying **Primitive type data**, the "value" is directly copied. For example: variables containing `string`, `number`, `boolean`, `undefined`, `null`, and `symbol` data.
- When copying **Object data**, the "address" is copied. For example: variables containing `object`, `array`, and `function` data.

The concept is illustrated in the following diagram:

![Primitive type data and Object data](/images/articles/javascript-shallow-copy-deep-copy/01.png)

This translates to the following behavior in code:

```javascript
/*** Primitive types ***/
let a = 5;
let b = a; // Copy primitive data variable

console.log(a); // 5
console.log(b); // 5

b = 10;

console.log(a); // 5 => Unchanged, because a and b have different values
console.log(b); // 10

/*** Object types, changing content ***/
let a = { number: 5 };
let b = a; // Copy object data variable

console.log(a); // { number : 5 }
console.log(b); // { number : 5 }

b.number = 10;

console.log(a); // { number : 10 } => Changed along with b because a and b share the same address, pointing to the same value
console.log(b); // { number : 10 }
```

We can see that copying `Primitive type data` is a **real copy**, meaning the value is truly copied, so the final results won't influence each other.

In contrast, with `Object data`, only the address is copied, so the values can influence each other. This copying method, where copied variables and original variables affect each other, is called **shallow copy**.

Is it impossible to copy `Object data` with "completely new addresses and values"? Actually, it is possible. Through certain methods, we can still copy `Object data` that won't affect each other at all - this method is called **deep copy**.

_Note: The diagrams in this article are simplified to help understand abstract principles. Actual memory operations involve more details._

---

## Principles and Implementation of Shallow Copy

When an `Original Object data` and a `Cloned Object data` **have any layer with the same data address, pointing to the same value, where operations on the two objects affect each other**, this is a **shallow copy**.

![shallow copy 1](/images/articles/javascript-shallow-copy-deep-copy/02.png)

```javascript
/*** Shallow copy: Direct copying ***/
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
// 20 => First layer was affected by clonedData and changed
console.log(originalData.obj.secondLayerNum);
// 200 => Second layer was affected by clonedData and changed
```

From the example above, we can see that `originalData` and `clonedData` affect each other.

It's important to note that "as long as any layer of data shares the same address" - in other words, "as long as they are not two completely independent `Object data`" - it is still a shallow copy.

![shallow copy 2](/images/articles/javascript-shallow-copy-deep-copy/03.png)
_Note: This is a concept diagram. Addresses are not directly stored in the obj but rather the obj variable corresponds to an address_

After looking at the principle conceptual diagram above, let's implement this "first layer won't affect each other, but second layer onwards will affect each other" shallow copy in code!

### 1. Manual copy of first-layer object values

```javascript
/*** Shallow copy: Manual copy of first-layer object values ***/
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
// 10 => First layer was not affected by clonedData
console.log(originalData.obj.secondLayerNum);
// 200 => Second layer was affected by clonedData and changed
```

### 2. Custom shallowCopy function to copy first-layer object values

```javascript
/*** Shallow copy: Custom shallowCopy function to copy first-layer object values ***/
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
// 10 => First layer was not affected by clonedData
console.log(originalData.obj.secondLayerNum);
// 200 => Second layer was affected by clonedData and changed
```

### 3. Object.assign(target, ...sources)

```javascript
/*** Shallow copy: Object.assign ***/
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
// 10 => First layer was not affected by clonedData
console.log(originalData.obj.secondLayerNum);
// 200 => Second layer was affected by clonedData and changed
```

### 4. Spread operator

```javascript
/*** Shallow copy: Spread operator ***/
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
// 10 => First layer was not affected by clonedData
console.log(originalData.obj.secondLayerNum);
// 200 => Second layer was affected by clonedData and changed
```

### 5. Certain Array methods, such as slice(), from(), etc.

```javascript
/*** Shallow copy: Array.prototype.slice() ***/
const originalData = [10, { secondLayerNum: 100 }];
const clonedData = originalData.slice();

clonedData[0] = 20;
clonedData[1].secondLayerNum = 200;

console.log(originalData[0]);
// 10 => First layer was not affected by clonedData
console.log(originalData[1].secondLayerNum);
// 200 => Second layer was affected by clonedData and changed
```

---

## Principles and Implementation of Deep Copy

Now that we've covered shallow copy, let's continue to understand deep copy.

When `Original Object data` and `Cloned Object data` **are two completely independent objects with different data addresses at every layer, not affecting each other**, this is a **deep copy**.

![deep copy](/images/articles/javascript-shallow-copy-deep-copy/04.png)
_Note: This is a concept diagram. Addresses are not directly stored in the obj but rather the obj variable corresponds to an address_

What methods can achieve deep copy?

### 1. JSON.stringify/parse

`JSON.stringify/parse` is commonly used for handling storage operations like Local Storage and Session Storage, but it can also be used to implement deep copy.

The main approach is to first convert the object to a string using `JSON.stringify`, then convert the string back to an object using `JSON.parse`.

```javascript
/*** Deep copy: JSON.stringify/parse ***/
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
// 10 => First layer was "not" affected by clonedData
console.log(originalData.obj.secondLayerNum);
// 100 => Second layer was "not" affected by clonedData
```

However, it's important to note that some values will change after going through `JSON.stringify/parse`, leading to unexpected results:

- undefined: will `disappear along with its key`.
- NaN: will be converted to `null`.
- Infinity: will be converted to `null`.
- regExp: will be converted to an `empty {}`.
- Date: type will change from `Date` to `string`.

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

### 2. Lodash cloneDeep()

The `Lodash library` provides a deep copy method called `cloneDeep()`, which doesn't have the issues with unexpected value changes that `JSON.stringify/parse` has.

```javascript
/*** Deep copy: Lodash cloneDeep() ***/
import { clone, cloneDeep } from 'lodash';

const nestedArr = [['1'], ['2'], ['3']];

const shallowCopyWithLodash = clone(nestedArr); // Implements "shallow" copy
console.log(nestedArr[0] === shallowCopyWithLodash[0]);
// true => Shallow copy (same reference address)

const deepCopyWithLodash = cloneDeep(nestedArr); // Implements "deep" copy
console.log(nestedArr[0] === deepCopyWithLodash[0]);
// false => Deep copy (different reference address)
```

### 3. Recursive deepCopyFunction

You can create a simple "recursive function" that traverses each level of data in an `Object data` and completely copies it into a new object.

```javascript
/*** Deep copy: Recursive deepCopyFunction ***/
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
// 10 => First layer was "not" affected by clonedData
console.log(originalData.obj.secondLayerNum);
// 100 => Second layer was "not" affected by clonedData
```

This is a simple approach, but there are many more adjustments and considerations when creating a deep copy function in depth. You can refer to this article: [How to write a deep copy function that will impress interviewers?](https://juejin.cn/post/6844903929705136141#heading-6)

---

## Summary of Shallow and Deep Copy

Here's a simple diagram summarizing the concepts of shallow and deep copy:

![shallow copy and deep copy](/images/articles/javascript-shallow-copy-deep-copy/05.png)

- **Shallow copy**: The original object data and copied object data are "not completely independent". They might have data pointing to the same address in the first layer, or perhaps in the second layer. Changes to the data content may affect each other.
- **Deep copy**: The original object data and copied object data are "completely independent". No data at any layer points to the same address. Changes to the data content will not affect each other.

From the previous article discussing `pass by value`, `pass by reference`, and `pass by sharing`, to this article discussing `shallow copy` and `deep copy`, we can see that the most important concept is understanding "how `Primitive type data` and `Object data` are copied". If you can visualize how variables operate during the copying process, understanding becomes relatively easy, and you won't need to memorize everything.

If you're still confused, I recommend reading [the previous article](/articles/2021/javascript-pass-by-value-pass-by-reference-pass-by-sharing) again along with this one, which will give you a better chance to understand the entire mechanism.

---

## Postscript: A Bug Encountered in Development

Finally, I want to share a bug I encountered during actual development, which is why I wanted to organize this whole explanation of the `Object data` copying process and shallow/deep copies.

This bug was encountered in a `React` `custom hook`. I've simplified it significantly and included only the key parts:

```javascript
const initialOrderData = {
  totalPayment: 0, // This is Primitive type data, when copied, the value is copied
  orderList: [], // This is Object data, when copied, the address is copied, which needs special attention
};

const useOrderDataHandler = () => {
  const [orderData, setOrderData] = useState(initialOrderData);

  const addOrder = newOrder => {
    setOrderData(prev => {
      const newTotalPayment = prev.totalPayment + newOrder.DiscountedTotalPrice;
      // This operation will cause the bug in resetOrderData below
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
    // There's a bug here!!!
    // Because initialOrderData's orderList
    // has already been changed by addOrder's newOrderList.unshift(newOrder) operation
    // causing orderList to not be reset back to []
  };
  ......

  return {
    addOrder,
    resetOrderData,
    ......
  };
};
```

The most important thing to note in the code above is that `initialOrderData` contains object type data `orderList: []`, so this part in `addOrder` is problematic:

```javascript
const addOrder = newOrder => {
  setOrderData(prev => {
    const newTotalPayment = prev.totalPayment + newOrder.DiscountedTotalPrice;
    // This copy makes newOrderList and initialOrderData.orderList have the same address
    const newOrderList = prev.orderList;
    // Therefore, changing the content of newOrderList affects initialOrderData.orderList
    // causing initialOrderData to be unexpectedly changed
    newOrderList.unshift(newOrder);

    return {
      totalPayment: newTotalPayment,
      orderList: newOrderList,
    };
  });
};
```

Since we know that `orderList` will be a "single-layer" structure with no second-layer object type data, we can fix it using shallow copy methods to "ensure the first layer won't affect each other":

```javascript
const addOrder = newOrder => {
  setOrderData(prev => {
    const newTotalPayment = prev.totalPayment + newOrder.DiscountedTotalPrice;
    // First option: Use Spread operator for shallow copy, so changes to first-layer data won't affect each other
    const newOrderList = [newOrder, ...prev.orderList];

    // Second option: Use concat() for shallow copy, so changes to first-layer data won't affect each other
    const newOrderList = [newOrder].concat(prev.orderList);

    return {
      totalPayment: newTotalPayment,
      orderList: newOrderList,
    };
  });
};
```

We can also completely copy `initialOrderData` from the beginning, but we must be aware that `orderList` in `initialOrderData` is a deep nested object type data, so we need to use deep copy:

```javascript
const initialOrderData = {
  totalPayment: 0,
  orderList: [],
};

const useOrderDataHandler = () => {
  // Deep copy to ensure orderList in initialOrderData is completely copied
  // and won't affect the original source
  const clonedInitialOrderData = JSON.parse(JSON.stringify(initialOrderData))
  const [orderData, setOrderData] = useState(clonedInitialOrderData);
 ......
}
```

This concludes my record and sharing of bugs related to `Object data` copying, which I'll keep in mind for the future.

---

#### References

- [A Deep Dive into Shallow Copy and Deep Copy in JavaScript](https://javascript.plainenglish.io/shallow-copy-and-deep-copy-in-javascript-a0a04104ab5c)
- [Understanding Deep and Shallow Copy in Javascript](https://medium.com/@manjuladube/understanding-deep-and-shallow-copy-in-javascript-13438bad941c)
- [JavaScript 淺拷貝 (Shallow Copy) 與深拷貝 (Deep Copy)](https://awdr74100.github.io/2019-10-24-javascript-deepcopy/)

#### Special Thanks

- Thanks to **zacharyptt** for reminding me in [this issue](https://github.com/LiangYingC/programming-farmer-blog/issues/16) that "**shadow** copy" in the images should be "**shallow** copy".
