---
title: "Understanding JavaScript Variable Passing: Pass by Value, Pass by Reference, or Pass by Sharing?"
date: 2021-05-20
description: In JavaScript, you often hear that primitive type variables are passed by value, while object type variables are passed by reference. However, when researching deeper, you'll encounter the term pass by sharing, or even assertions that JavaScript is entirely pass by value. What's really going on? This article will explore how variables are stored in memory and copied, gradually building an understanding of pass by value, pass by reference, and pass by sharing in JavaScript.
tag: JavaScript
---

## Introduction

As mentioned in Huli's article, "[Deep Dive into JavaScript Parameter Passing: Call by Value or Reference?](https://blog.techbridge.cc/2018/06/23/javascript-call-by-value-or-reference/)": "Coming back to research parameter passing was a beautiful mistake - I originally intended to write about deep and shallow copying." My experience writing this article was similar.

I initially encountered issues with object `shallow copy` and `deep copy` at work and planned to research and write about copying. However, as I wrote, I realized I needed to first explain the `pass by reference` variable passing mechanism to better clarify why shallow and deep copying are necessary.

So I thought I'd simply start by briefly explaining `pass by value` and `pass by reference` as an introduction to my article on copying? Not quite, because deeper investigation revealed concepts like `pass by sharing` and claims that `JavaScript is all pass by value` - knowledge I hadn't previously encountered.

As I continued researching, I decided to write this article - partly because I found the topic fascinating, partly because there was substantial information to cover, and partly because knowledge only truly becomes your own when you organize and output it. And so begins this exploration of `pass by value`, `pass by reference`, and `pass by sharing` in JavaScript.

---

## Primitive Types and Objects in Memory

To properly understand the concepts of `pass by value`, `pass by reference`, and `pass by sharing`, we need to understand several aspects of JavaScript:

1. The two data types
2. How variable data is stored in memory
3. The behavior and results of copying variables
4. The behavior and results of passing variables to functions
5. With this knowledge, we can understand `pass by value`, `pass by reference`, and `pass by sharing`!

Starting with the first item, JavaScript has two types of data:

- Primitive types: **Representing single values**, such as `string`, `number`, `boolean`, `null`, `undefined`, `symbol`.
- Object types: **Representing complete concepts or collections of data**, which can contain multiple primitive types and have their own properties or methods, such as `object`, `array`, `function`.

```javascript
// Primitive type variables
const a = 5;
const b = '15';
const c = true;
const d = null;
const e = undefined;
......
```

```javascript
// Object type variables
const objectData = {
  a: 'one',
  b: 2,
  c: true,
};
const arrayData = [1, 2, 3, 4, 5];
......
```

The key difference between these two data types is "how they are stored in memory."

In memory, variables don't directly map to data values. Instead, they first map to a memory location, which then maps to the actual data, as illustrated below:

_Note: The diagrams in this article are simplified for conceptual understanding. Actual memory operations are more complex._

![primitive data in memory](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/01.png)

The `Stack` is a relatively small but quickly accessible memory space where variables are stored in a conceptual table including: "variable name," "memory location," and "data value."

As mentioned earlier, primitive types and object types are stored differently in memory:

- Primitive types: In the `Stack`, **the actual data value is stored directly**, as shown in the image above for primitive type variables.
- Object types: In the `Stack`, **only the memory address (location) of the data value is stored** to serve as a reference. This reference points to the actual data value in the `Heap`, as shown below.

![object data in memory](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/02.png)

The `Heap` is a larger memory space compared to the `Stack`, more suitable for storing larger data like objects, though access is relatively slower.

With this understanding of how the two data types are stored in memory, let's look at how variables are copied.

---

## Copying Variables in Memory

When a variable is copied, the data in the `Stack` is copied and a new memory location is created for the new variable, as shown in the following example and diagram:

```javascript
// Copying primitive type data
let a = 5;
let b = a; // Copying variable a to b
```

![copy primitive type data](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/03.png)

First, we declare variable `a` with memory location `0x001` and value `5`. Then we declare `b = a`, effectively copying variable `a`. We see that `b` has a new location `0x02`, but its data value is the same as `a`: `5`.

Now let's see how copying works with object data:

```javascript
// Copying object data
let a = { number: 5 };
let b = a; // Copying variable a to b
```

![copy object data](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/04.png)

When copying variables, we're still copying data in the `Stack`. However, since object data stores the address of the value rather than the value itself, what gets copied is this address, not the original value. To summarize:

- Primitive types: When copying a variable, the **original value is copied directly**.
- Object types: When copying a variable, **only the address is copied, and this address points to the same value**.

This distinction in copying behavior is the key point of this article, and everything that follows builds on this concept!

Let's explore how these different copying behaviors affect our code.

First, let's observe what happens when we copy a primitive type variable and then modify the original variable:

```javascript
// Copying primitive type data
let a = 5;
let b = a;

console.log(a); // 5
console.log(b); // 5

a = 10;

console.log(a); // 10
console.log(b); // 5 => unchanged, doesn't follow a's changes
```

This code does two main things:

1. Declare variable `a` with value `5`, then declare variable `b` and copy `a` to it with `b = a`. At this point, both print as `5`.
2. Reassign variable `a` to `10` and observe whether this affects the copied variable `b`.

The result shows that the copied variable `b` does not change when variable `a` changes.

The reason is: **When variable data is a primitive type, copying the variable creates a completely new "value"**.

So changing the original variable `a` naturally doesn't affect variable `b` (and vice versa), as illustrated:

![copy primitive type data 2](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/05.png)

Now that we've seen how primitive types behave when the original and copied variables change independently, let's observe objects:

```javascript
// Copying object data
let a = { number: 5 };
let b = a;

console.log(a); // { number : 5 }
console.log(b); // { number : 5 }

a.number = 10;

console.log(a); // { number : 10 }
console.log(b); // { number : 10 } => changed with a
```

This code does two main things:

1. Declare variable `a` with value `{ number: 5 }`, then declare variable `b` and copy `a` to it with `b = a`. At this point, both print as `{ number: 5 }`.
2. Change `a.number = 10` to make variable `a` become `{ number: 10 }` and observe whether this affects the copied variable `b`.

The result clearly shows that the copied variable `b`'s object value changes along with variable `a`, both becoming `{ number: 10 }`.

The reason is: **When variable data is an object type, copying the variable copies the "address" not the value itself. The same address points to the same value.**

Since both variables share the same address pointing to the same value, changing the original variable `a` with `a.number = 10` naturally affects variable `b` (and vice versa), as illustrated:

![copy object data 2](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/06.png)

To summarize again:

- When variable data is a primitive type, copying the variable creates a completely new "value."
- When variable data is an object type, copying the variable copies the "address" not the value itself. The same address points to the same value.

Now let's apply these concepts to function parameter passing!

---

## Understanding Pass by Value Through Function Parameters

As the title suggests, we'll understand `pass by value` through function parameter passing!

First, it's important to know that: **passing parameters to a function behaves like copying variables**.

Let's examine both primitive types and objects, starting with primitive types:

```javascript
function test(primitiveData) {
  primitiveData = primitiveData + 5;
  console.log(primitiveData); // 10
}

let a = 5; // Primitive type data
test(a);

console.log(a); // 5 => unchanged
```

Let's analyze this code's execution flow:

1. Declare `function test(primitiveData)`.
2. Declare variable `a` with primitive type value `5`.
3. When passing `a` to the `test` function, it's equivalent to `primitiveData` copying `a`, like `primitiveData = a`, creating a new local variable `primitiveData` in the function.
4. Since the variable data is a primitive type, **copying the variable directly copies the "value"**, so variables `a` and `primitiveData` **have independent values**.
5. Therefore, changing one variable doesn't affect the other, so the final output of `a` remains unchanged at `5`.

Here's the concept illustrated:

![pass by value 1](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/07.png)

![pass by value 2](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/08.png)

What we've just described is the concept of `pass by value`.

`Pass` refers to passing function parameters, and `by value` means that when passing variables, the function **copies the "value" of the passed variable**. The result is that the function's internal variable value and the passed-in variable value are independent and don't affect each other.

`Pass by value` can also be called `call by value`, since functions can be called.

---

## Understanding Pass by Reference Through Function Parameters

After understanding primitive types and `pass by value`, let's examine object types and `pass by reference`.

```javascript
function test(objectData) {
  objectData.number = 10; // Changing object content
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // Object data
test(a);

console.log(a); // { number: 10 } => changed
```

Again, let's focus on the execution flow:

1. Declare `function test(objectData)`.
2. Declare variable `a` with object type value `{ number: 5 }`.
3. When passing `a` to the `test` function, it's equivalent to `objectData` copying `a`, like `objectData = a`, creating a new local variable `objectData` in the function.
4. Since the variable data is an object type, **copying the variable copies the "address" not the value**, so `objectData` and `a` **have the same address pointing to the same value**.
5. Therefore, changing `objectData.number = 10` modifies `objectData`'s object content, and `a` is also modified, resulting in a final output of `{ number: 10 }`.

Here's the concept illustrated:

![pass by reference 1](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/09.png)

![pass by reference 2](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/10.png)

This describes the concept of `pass by reference`.

`Pass` refers to passing function parameters, and `by reference` means that when passing parameters, the function only **copies the "address" as a reference coordinate to the actual value**. The result is that when changing object content through `objectData.number` or `a.number`, the function's internal variable value and the passed-in variable value affect each other.

Of course, `pass by reference` can also be called `call by reference`.

---

## Wait, What About Pass by Sharing?

Let's look at another example:

```javascript
function test(objectData) {
  objectData = { number: 10 }; // Reassigning the object
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);

console.log(a); // { number: 5 } => What?! It didn't change!
```

Again, focusing on the execution process:

1. Declare `function test(objectData)`.
2. Declare variable `a` with object type value `{ number: 5 }`.
3. When passing `a` to the `test` function, it's equivalent to `objectData` copying `a`, like `objectData = a`, creating a new local variable `objectData` in the function.
4. Since the variable data is an object type, when we use `objectData = { number: 10 }` to **reassign a value, a new address is created for the new object value, and objectData gets a new address pointing to the new value**.
5. Therefore, `a` and `objectData` have different addresses pointing to different values, so the final output of `a` remains `{ number: 5 }`, unchanged by the reassignment of `objectData`.

The key difference from the previous example is that instead of changing the object's content with `objectData.number = 10`, we're reassigning the entire object with `objectData = { number: 10 }`.

Reassignment creates a new value `{ number: 10 }` in the `Heap` memory, with a new corresponding address assigned to `objectData`. In the end, `objectData` has a new address pointing to a new value, independent from variable `a`'s address and value, as illustrated:

![pass by sharing](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/11.png)

Doesn't this concept resemble `pass by value`? Copying a variable also copies the actual value, so the two values are independent and don't affect each other.

So when we look at object data and how changing variable content after copying works, we see a mix of two behaviors:

- **Pass by reference concept**: After passing a parameter to a function, changing content with `object.number = 10` affects both variables because the external and internal variables **share the same address pointing to the same value, so they affect each other**.
- **Pass by value concept**: After passing a parameter to a function, reassigning with `objectData = { number: 10 }` creates a new value and address. Since the external and internal variables **have different addresses pointing to different values, they don't affect each other**.

If objects were truly `pass by reference`, reassignment would also affect the original variable, but it doesn't. Technically, this behavior is called `pass by sharing` (also known as `call by sharing`, `call by object`, etc.).

Let's summarize how changing a "copied new variable (primitiveData or objectData above)" affects the "original variable (a above)" after copying (and vice versa):

- For **primitive types**, the original variable "doesn't" change when the copied variable changes, showing `pass by value` behavior.

  ```javascript
  function test(primitiveData) {
    primitiveData = primitiveData + 5;
    console.log(primitiveData); // 10
  }

  let a = 5; // Primitive type data
  test(a);

  console.log(a); // 5 => unchanged
  ```

- For **object types, when only changing object content**, the original variable "does" change when the copied variable changes, showing `pass by reference` behavior.

  ```javascript
  function test(objectData) {
    objectData.number = 10; // Changing object content
    console.log(objectData); // { number: 10 }
  }

  let a = { number: 5 }; // Object data
  test(a);
  console.log(a); // { number: 10 } => changed
  ```

- For **object types, when reassigning the object**, the original variable "doesn't" change when the copied variable changes, showing `pass by value` behavior.

  ```javascript
  function test(objectData) {
    objectData = { number: 10 }; // Object reassignment
    console.log(objectData); // { number: 10 }
  }

  let a = { number: 5 }; // object data
  test(a);
  console.log(a); // { number: 5 } => unchanged
  ```

Combining these observations, one could say: In JavaScript, primitive type variables are `pass by value`, while object variables are `pass by sharing`.

---

## Why Do Some Say JavaScript is All Pass by Value?

Let's revisit the concept table for copying both primitive and object variables:

![pass by value and pass by sharing](/images/articles/javascript-pass-by-value-pass-by-reference-pass-by-sharing/12.png)

If we ignore what's in the data field of the variable table - whether it's the original value or an address - and look at it intuitively, we're always copying "the value stored in the data field."

From this perspective: **if we consider that what's being passed is always "the value stored in the data field"**, then it could be viewed as JavaScript being all pass by value. This is where that claim comes from.

---

## Conclusion: Focus on How Variable Copying Works, Not Just Technical Terms

If you research numerous domestic and international sources, you'll find that there's no authoritative definition or description of these technical terms that can definitively prove which is absolutely correct.

- In JavaScript, primitive type variables are `pass by value`, while object variables are `pass by sharing`.
- JavaScript is all `pass by value`.

Both statements above can be considered correct, depending on how you define "value" and from which perspective you're looking.

I believe that **the most important thing is the process of exploring these technical term definitions - this process has helped me better understand the behavior and results of "copying variables" in JavaScript, which is a common scenario in development, making it very practical**.

If you want key points for easier memorization, here they are:

1. For primitive type variables, like `const a = 5`, copying a variable copies the "original value," so the original and copied variables "don't" affect each other.
2. For object variables, like `const a = { number: 5 }`, copying a variable copies the "address," and when the same address points to the same value, the original and copied variables "do" affect each other. However, be aware that "reassignment" creates brand new addresses and values.
3. When passing an external variable as a parameter to a function, it means copying the external variable within the function's scope, creating a new internal variable.

These three points all describe "how the variable copying process works," which is the critical aspect. As long as you understand how variable copying works (visualized in the variable tables above), you'll clearly understand whether changes to original and copied variables will affect each other.

To recap the concrete results with code examples:

```javascript
/*** Primitive types ***/
function test(primitiveData) {
  primitiveData = primitiveData + 5;
  console.log(primitiveData); // 10
}

let a = 5; // primitive data
test(a);
console.log(a); // 5 => unchanged

/*** Object types - changing content ***/
function test(objectData) {
  objectData.number = 10; // Changing object content, no reassignment
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);
console.log(a); // { number: 10 } => changed

/*** Object types - reassignment ***/
function test(objectData) {
  objectData = { number: 10 }; // Object reassignment
  console.log(objectData); // { number: 10 }
}

let a = { number: 5 }; // object data
test(a);

console.log(a); // { number: 5 } => unchanged
```

Finally, I'll conclude with passages from two articles:

"In 'The Importance of Vocabulary and Common Language' from 'The World of Programming by Yukihiro Matsumoto,' the author discusses how determining appropriate terms for concepts aims to provide a common vocabulary for design and make developers aware of their existence - this is the true purpose of terminology." —["Technical Term Disputes"](https://www.ithome.com.tw/voice/94877)

Technical terms exist to facilitate communication and understanding concepts, not for arguments.

"Technical terms exist to describe concepts, not the other way around. What's most important is the concept they're trying to express - the resulting 'behavior'." —["JavaScript Things You Must Know #Day26: The Hamlet of Programming — Pass by value, or Pass by reference?"](https://ithelp.ithome.com.tw/articles/10209104)

This statement perfectly reflects my takeaway after organizing this article - we should focus more on the behavior and results exhibited when programs run.

I hope that after reading this article, you better understand the behavior of variable data during copying.

---

#### References

- [基本資料型別和參考資料型別 Primitive Data Type & Reference Data Type - 彭彭直播](https://www.youtube.com/watch?v=43VI2zWSpd0)
- [你不可不知的 JavaScript 二三事#Day26：程式界的哈姆雷特 —— Pass by value, or Pass by reference？](https://ithelp.ithome.com.tw/articles/10209104)
- [深入探討 JavaScript 中的參數傳遞：call by value 還是 reference？](https://blog.techbridge.cc/2018/06/23/javascript-call-by-value-or-reference/)
- [Is JavaScript a pass-by-reference or pass-by-value language?](https://stackoverflow.com/questions/518000/is-javascript-a-pass-by-reference-or-pass-by-value-language)
- [技術名詞紛爭多](https://www.ithome.com.tw/voice/94877)