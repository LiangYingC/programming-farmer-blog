---
title: JS Variable Declaration, Differences Between var and let/const
date: 2020-10-25
description: When I started learning JS in 2019, using let/const was already advocated, yet many resources online still use var. What are their differences?
tag: JavaScript
---

If you started learning JS in 2019 like me, you might have a question: while learning we use `let/const` to declare variables, why do some JS code samples found online use `var` to declare variables? What are the differences between them?

Driven by curiosity, this article about the differences between `var` and `let/const` was born. The outline is as follows:

- After ES6, from var to let/const
- var has function scope, let/const have block scope
- Binding differences between var and let in for loops
- Different hoisting behavior between var and let/const
- var allows redeclaration, let/const throw errors

_p.s. The third part about for loops is what I find most interesting and challenging to explain. Recommended for reading & discussion!_

---

## After ES6, from var to let/const

Why are we learning `let/const` now (2019), but still seeing `var` declarations online?

Because the current mainstream JavaScript is ES6, which recommends using `let` and `const` to declare variables. The code you find online might have been written before ES6, when variables were declared using the `var` syntax.

In short, after ES6, it's recommended to use **`let`** and **`const`** rather than **`var`** to declare variables (reasons will be explained in this article).

The main differences between `var` and `let/const` are:

- **Different scopes**
- **Binding differences in for loops**
- **Different variable hoisting behavior**
- **Differences in redeclaration**

The main benefits of these changes are: **making JS variable operations more rigorous, reducing unintuitive, error-prone, or variable redeclaration possibilities, thus facilitating larger or collaborative development**. I'll discuss and provide examples for each of these points. The explanations presented here are based on my understanding; corrections are welcome if there are any errors.

---

## var has function scope, let/const have block scope

Before ES6, there was no concept of block scope, only global scope and function scope. Thus, variables declared with `var` have function scope, meaning **the smallest effective range is the function**.

After ES6, the concept of block-level division was added, and variables declared with `let/const` have block scope, meaning **the smallest effective range is the block**.

**Scope refers to "the effective range of a variable."** The largest is the global scope, meaning the variable is effective throughout the entire range. A block refers to a range enclosed by `{ }` curly braces.

In summary:

- **`var` has "function scope"**, meaning variables declared within a function have their effective range limited to that function. However, it doesn't have block scope, so variables declared within a block will still work outside the block, not constrained by it.
- **`let/const` have "block scope"**, meaning variables declared within a block have their effective range limited to that block.

Examples make this clearer. Let's declare a corgi dog's name as "Toast" within a block `{ }` using `var` and `let` to see the results.

```javascript
/// "var" is not limited by blocks, variable access outside the block succeeds ///

{
  var corgiDogName = 'Toast';
}

console.log(corgiDogName);
//Toast
```

```javascript
/// "let" is limited by blocks, variable access outside the block fails ///
{
  let corgiDogName = 'Toast';
}

console.log(corgiDogName);
//ReferenceError: corgiName is not defined
```

Although `var` isn't limited by blocks, it is limited by function scope:

```javascript
/// "var" is limited by functions, variable access outside the function fails ///

function callCorgi() {
  var corgiDogName = 'Toast';
}

console.log(corgiDogName);
//ReferenceError: corgiDogName is not defined
```

```javascript
/// Even when declaring the same variable name dogName with var, due to "function scope", there's no conflict between variables with the same name ///

//Name the corgi dog "Toast", then call with callCargi()
function callCargi() {
  var dogName = 'Toast';
  console.log(dogName);
}

//Name the mixed breed dog "Thick Slice", then call with callMix()
function callMix() {
  var dogName = 'Thick Slice';
  console.log(dogName);
}

callCargi(); //Toast
callMix(); //Thick Slice
```

From the examples above, we can see two benefits of limiting scope:

1. **Avoid conflicts between variables with the same name.**
2. **Maintain the principle of least privilege, preventing improper access to variable data.**

Previously with `var` declarations, only function scope provided these benefits. **Now with `let/const` declarations, these benefits apply to "block scopes" like if and for statements, reducing conflicts in collaborative or large-scale projects.**

---

## Binding differences between var and let in for loops

Let's start the second part with a classic example.

```javascript
/// Using a for loop to execute five times, printing i every 0.1 seconds ///

for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 100);
}
```

What do you think the execution result will be?

(A) 0, 1, 2
(B) 3, 3, 3

Is it A? No, no, no! It's actually B.

I think many people who haven't learned `var`, including myself, would intuitively choose A, because if we learned `let`, and **replaced `var` with `let`, the answer would be A**, which seems more in line with the purpose of a for loop!!! Unfortunately, the actual execution result is B.

The expected result should be 0 1 2, but it mysteriously becomes 3 3 3, which is related to the variable declaration syntax `var/let`. What happened?

To explain this issue, we need to discuss two points:

1. **The time delay of `setTimeout()` and the "execution timing" of `console.log(i)` within the function.**
2. **How the value in `console.log(i)` within the function "comes about".**

First, let's look at the first point. When entering the for loop, the variable `var i = 0` is declared, and condition checking begins. When `i < 3`, `i + 1`, after execution, we need to wait 0.1 seconds before executing `function() { console.log(i); }` within `setTimeout()`.

JavaScript is an "asynchronous" language, so during the 0.1 seconds wait before executing `function() { console.log(i); }`, it will first complete the for loop that can already be executed.

So now we understand the conclusion of the first point:
For `function`, **the execution timing of `console.log(i)` is after the for loop has completed.**

```javascript
/// Due to asynchronicity and delay time, the for loop will be executed first, then the function ///

for (var i = 0; i < 3; i++) {
  // The for loop is thinking: I'll have to wait for your setTimeout 0.1 seconds, so I'll do my work first, not wasting time.
  setTimeout(function () {
    console.log(i);
  }, 100);
}
// 3 3 3
```

To clarify, what I've described in the first point so far isn't related to the difference between `var` and `let`; it merely explains the situation with asynchrony and timing. Now, let's move on to the second point: how the value in `console.log(i)` comes about, which is related to the difference between `var` and `let`.

`var` has function scope. Since there's no wrapping outside this for loop code, **the `i` declared by `var` exists in the global window (browser) and is only bound once, or we can say it shares a single instance.**

Plus, the for loop completes before `console.log(i)` executes, so the final value of `console.log(i)` is 3.

As for `let`, it has "block scope." Each time, i is recorded in the created zone. **More precisely, each iteration creates a new environment (context), and this environment records the current variable i value without overwriting the variable value in the previous environment, thus generating multiple `i` values.**

I've created a diagram to facilitate understanding the "overall concept," though there might be discrepancies in details.

![for loop with let and var](https://i.imgur.com/PQ05GIL.png)

Let's summarize. In for loops:

- **With `var`, binding happens only once, and it doesn't have block scope.** Ultimately, only one value exists in the global scope (in this case), or we can say there's only one instance.
- **With `let`, repeated binding occurs, and it has block scope,** or we can say there are multiple environments recording variables. Ultimately, multiple values exist within the for loop block, or we can say there are multiple instances.

In practice, although even with just var, we can handle such situations using "Immediately Invoked Function Expression (IIFE)," it's more complex and less intuitive. After switching to let, we can handle it simply and have a more intuitive understanding of the for loop results!

```javascript
/// By changing var i to let i, the problem is easily solved ///

for (let i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log(i);
  }, 100);
}
// 0 1 2
```

```javascript
/// Without changing var i, using IIFE is relatively complex and unintuitive ///

for (var i = 0; i < 3; i++) {
  (function (x) {
    setTimeout(function () {
      console.log(x);
    }, 100 * x);
  })(i);
}
// 0 1 2
```

Phew, now onto the second-to-last part. The remaining parts have fewer words, so you're almost done reading!

---

## Different hoisting behavior between var and let/const

Let's start with another question:

```javascript
console.log(i);
var i = 5;
```

What do you think the result of this program will be?

- (A) 5
- (B) ReferenceError
- (C) undefined

Think about it for a moment XD

If you're like me and use `let` more often than `var`, you might think the answer is (B) ReferenceError. Of course, it's not that straightforward; the actual result is (C) undefined.

Very unintuitive... because `undefined` means the value couldn't be found, it has been declared but not assigned, while `ReferenceError` means `i` couldn't be found at all, it hasn't been declared. So generally, you'd expect the result of the code above to be a "ReferenceError for an undeclared variable."

But the result is `undefined`, which means: **Although we can't see it, `i` was actually declared before `console.log(i)`, just not assigned a value yet.**

Isn't that quite counterintuitive? Because there's no code before `console.log(i)`... This situation can be imagined as equivalent to the following code:

```javascript
/// Due to var's direct variable hoisting, the code above is equivalent to the code below ///

console.log(i);
var i = 5;
//undefined

var i;
console.log(i);
i = 5;
//undefined
```

This is because `var` has the characteristic of "**hoisting**," and it's not just `var`; functions have this characteristic too. **For variable declaration with `var`, "variable hoisting" simply means: before executing any code, variables are placed in memory. The feature of this is that you can use variables before they are declared in the code.**

```javascript
/// Due to hoisting, you can use variables before declaring them, so you can write the declarations together at the end ///

i = 2;
n = 3;
console.log(i + n);
var i;
var n;
// 5
```

In this situation, as long as there's an assignment, there won't be an error, even if the variable hasn't been declared yet.

What problems does this cause? When you develop the habit of "declaring later," what if you forget to use `var` to declare variables in the end? It won't cause errors; the variables just become global, potentially causing bugs:

```javascript
/// No var declaration in a function, leading to global contamination ///

var x = 1;

function addFunc(y) {
  x = 100;
  x = x + y;
}

addFunc(50);
console.log(x);
// 150, expected to be 1, but the x inside the function leaked out
```

And with `let`, hoisting is relatively safer (`let` still has hoisting, just different; you can search for the keyword TDZ), so **developers used to `let` usually declare variables first, rather than operating on variables before declaring them, reducing the chance of development errors.**

```javascript
/// Using variables first, then declaring them directly "causes errors," more strictly cultivating the habit of declaring first, then using ///

console.log(i);
let i = 5;
//ReferenceError

i = 5;
console.log(i);
let i;
//ReferenceError
```

This usage pattern not only reduces errors but is also more intuitive.

---

## var allows redeclaration, let/const throw errors

Finally, let me mention a small point that helps prevent development errors or conflicts: **with `var`, you can repeatedly declare variables with the same name, but with `let/const`, redeclaring variables with the same name will cause errors.**

```javascript
var myDogName = 'Toast';
var myDogName = 'Thick Slice';
console.log(myDogName);
//Thick Slice

let myDogName = 'Toast';
let myDogName = 'Thick Slice';
console.log(myDogName);
//SyntaxError: Identifier 'myDogName' has already been declared

const myDogName = 'Toast';
const myDogName = 'Thick Slice';
console.log(myDogName);
//SyntaxError: Identifier 'myDogName' has already been declared
```

This point particularly helps beginners or collaborative developers prevent errors and easily locate the source of errors.

---

## Summary of differences between var and let/const

Without realizing it, I've written quite a bit, but the process of organizing and learning has allowed me to understand and review loop operations in detail, variable hoisting, and more. It was quite fun!

There's a lot of content, so here's a three-point summary:

1. **`var` has function scope, `let/const` have block scope.** The latter can avoid more cases of variable name conflicts and extraction conflicts, and situations where block variables contaminate the global scope. It also makes for loops more intuitive and convenient.
2. **`var` automatically hoists variables, `let/const` are more rigorous.** The latter can avoid forgetting to declare variables or variables contaminating the global scope due to lack of declaration.
3. **`var` can redeclare variables with the same name, `let/const` cannot.** The latter can avoid some development errors.

In summary, **`let/const` makes variable declarations more rigorous, thereby increasing readability and preventing errors.** The most important call to action, I think, is:

**In JS, don't use var anymore; please use let/const to declare variables!**

#### [Special Thanks]

Thanks to **Jason Wu** for providing perspectives and consultation on `var/let` for loops.

---

#### References

- [重新認識 JavaScript: Day 18 Callback Function 與 IIFE | Kuro Hsu](https://ithelp.ithome.com.tw/articles/10192739)
- [鐵人賽：ES6 開始的新生活 let, const | 卡斯伯](https://wcc723.github.io/javascript/2017/12/20/javascript-es6-let-const/)
- [Day 05 : ES6 篇 - let 與 const | eyesofkids](https://ithelp.ithome.com.tw/articles/10185142)
- [[JavaScript] 你應該使用 let 而不是 var 的 3 個重要理由 | realdennis](https://medium.com/@realdennis/%E6%87%B6%E4%BA%BA%E5%8C%85-javascript%E4%B8%AD-%E4%BD%BF%E7%94%A8let%E5%8F%96%E4%BB%A3var%E7%9A%843%E5%80%8B%E7%90%86%E7%94%B1-f11429793fcc)
- [let keyword in the for loop | stack overflow](https://stackoverflow.com/questions/16473350/let-keyword-in-the-for-loop)
- [JavaScript 入門篇付費課程 | 六角學院](https://www.hexschool.com/courses/javascript.html)