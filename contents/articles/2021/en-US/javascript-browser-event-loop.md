---
title: "Understanding JavaScript Execution Flow: The Event Loop Explained Through Code Examples"
date: 2021-07-25
description: When learning JavaScript execution flow, it's essential to understand the Event Loop, including concepts like Call Stack, Callback Queue, Macrotasks, and Microtasks. This article explains these in detail, helping you better understand execution order when combining promises, setTimeout, and other asynchronous operations.
tag: JavaScript
---

## Introduction

Recently, I returned to AppWorks School as a mock interviewer and while preparing asynchronous questions, I realized I had forgotten some concepts about the `Event Loop`, especially regarding the execution order and process of `Tasks (Macrotasks)` and `Microtasks`. Since I hadn't previously written down this knowledge, I'm using this article to organize my understanding of the `Event Loop` and related concepts.

After reading this article, you should be able to answer the following questions:

1. Why can `JavaScript` execute tasks asynchronously?
2. What is the `Event Loop`?
3. What are `Tasks (Macrotasks)` and `Microtasks`?
4. How does the `Event Loop` work?
5. How can we prevent lag caused by high-cost `Event` handling?

In the final section, I'll provide several examples mixing `setTimeout` and `Promise` to test your understanding of program execution flow (these are also common interview questions).

Let's start by understanding the first concept: `Call Stack`.

---

## The Call Stack: Executing One Task at a Time

`JavaScript` is a single-threaded language, meaning it can only execute one task at a time. We can understand this by looking at how the `Call Stack` works.

The `Call Stack`, also known as the `Execution Stack`, is a space that records the current execution state of a program. When JavaScript runs, it places tasks to be executed at the top of the `Call Stack`, and only removes them after execution is complete.

Let's understand the `Call Stack` through the following code:

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
// Output order: fn1 -> fn2 -> fn3
```

The code execution steps are as follows:

1. `fn3` is called and moved to the top of the Stack for execution.
2. While executing `fn3`, we encounter and call `fn2`, which is then moved to the top of the Stack for execution.
3. While executing `fn2`, we encounter and call `fn1`, which is moved to the top of the Stack for execution.
4. We execute `fn1`, print `'fn1'`, and after `fn1` is complete, it's removed from the Stack.
5. We execute the function now at the top, `fn2`, print `'fn2'`, and after `fn2` is complete, it's removed from the Stack.
6. We execute the function now at the top, `fn3`, print `'fn3'`, and after `fn3` is complete, it's removed from the Stack.

_Note: In reality, the first step in the `Call Stack` is "**executing the global environment (Global execution context)**", after which the execution environments of each `function` begin to stack._

Using the [loupe](http://latentflip.com/loupe) tool, we can more concretely and visually understand the entire operation:

![Call Stack on Loupe](/images/articles/javascript-browser-event-loop/01.gif)
_[(Try it yourself on the loupe website)](http://latentflip.com/loupe/?code=ZnVuY3Rpb24gZm4xKCkgewogICAgY29uc29sZS5sb2coJ2ZuMScpOwp9CgpmdW5jdGlvbiBmbjIoKSB7CiAgICBmbjEoKTsKICAgIGNvbnNvbGUubG9nKCdmbjInKTsKfQoKZnVuY3Rpb24gZm4zKCkgewogICAgZm4yKCk7CiAgICBjb25zb2xlLmxvZygnZm4zJyk7Cn0KCmZuMygpOyA%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

We can see that when execution reaches a certain line, that task is added to the `Call Stack`.

If it's a simple program (e.g., `console.log`), it will be executed immediately and removed from the `Call Stack`. 

However, if we're executing a `function`, it needs to be completely executed (returning something or undefined) before it's removed from the `Call Stack`.

Interestingly, when the first `function` calls a second `function`, the **"more recently called"** second `function` is executed first. After the second function completes, execution returns to the first `function` to continue. For example, `fn1` is executed last but completes first, while `fn3` is executed first but completes last.

From the GIF of program operation, we can see that `functions` are stacked, and the `function` at the top will be the first to complete execution and be removed from the `Call Stack`.

From this `Call Stack` example, we can observe two things:

- Function execution order follows the "Last In, First Out" (LIFO) pattern.
- Only the task at the very top of the `Call Stack` can be executed at any given time.

So we can imagine: in a single-threaded environment where only one task can be executed at a time, if a task takes an extremely long time, such as a network request (`XMLHttpRequest`) or `setTimeout(fn, 3000)`, it will block all subsequent tasks.

---

## Web APIs: Making Simultaneous Execution of Multiple Tasks Possible

Since `JavaScript` can only do one task at a time, we need "another mechanism" to help resolve the blocking problem caused by long-running tasks.

Where does this other mechanism come from? It comes from the `JavaScript` "execution environment," such as `Browser` or `Node.js`.

In the `Browser` execution environment, `Web APIs` are provided to help handle time-consuming tasks like `XMLHttpRequest (XHR)`, `setTimeout`, `setInterval`, etc. When these items are encountered, they are first handed over to the `Browser` for processing, which prevents blocking the original thread, thereby **enabling multiple tasks to be executed simultaneously, rather than just one at a time**.

When the `Web APIs` finish processing their assigned logic, they return a Callback task to be executed. This Callback task isn't placed directly back into the `Call Stack`; instead, it's first queued in the `Callback Queue`. When the `Call Stack` is empty, only then are tasks from the `Callback Queue` moved into the `Call Stack` for execution.

![Call Stack + Web APIs + Callback Queue](/images/articles/javascript-browser-event-loop/02.png)

Let's understand the entire process through a `setTimeout` example:

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
  // 1. When setTimeout executes, the countdown logic of 1s is handed to Web API.
  // 2. After the 1s countdown is complete, the fn1 Callback is moved to the Queue, waiting for the Stack to clear.
  // 3. After the Stack clears, the fn1 Callback is moved to the Stack for execution.

  fn2();
}

fn3();
// Output order: fn3 -> fn2 -> fn1
```

![Browser Event Loop with setTimeout on Loupe](/images/articles/javascript-browser-event-loop/03.gif)
_[(Try it yourself on the loupe website)](http://latentflip.com/loupe/?code=ZnVuY3Rpb24gZm4xKCkgewogIGNvbnNvbGUubG9nKCdmbjEnKTsKfQoKZnVuY3Rpb24gZm4yKCkgewogIGNvbnNvbGUubG9nKCdmbjInKTsKICBmbjEoKTsKfQoKZnVuY3Rpb24gZm4zKCkgewogIGNvbnNvbGUubG9nKCdmbjMnKTsKICAKICBzZXRUaW1lb3V0KGZuMSwgMTAwMCk7CiAgCiAgZm4yKCk7Cn0KCmZuMygpOw%3D%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

The execution steps are as follows:

1. `fn3` is called and moved to the Stack for execution.
2. `'fn3'` is printed, then we reach `setTimeout(fn1, 1000)`.
3. `fn1` is passed to the Web API for a 1s countdown, after which fn1 moves to the Queue to wait. (**This doesn't block the Stack**)
4. `fn3` continues executing, encounters `fn2`, and `fn2` is moved to the top of the Stack for execution.
5. `'fn2'` is printed, `fn2` completes execution, and is removed from the Stack.
6. We execute the function now at the top, `fn3`, print `'fn3'`, and after `fn3` is complete, it's removed from the Stack.
7. The `fn1` stored in the Queue is moved to the Stack for execution.
8. `'fn1'` is printed, `fn1` completes execution, and is removed from the Stack.

From the GIF of program operation, we can clearly see two key points:

1. The 1s countdown process of `setTimeout(fn1, 1000)` doesn't block the execution of other tasks in the `Call Stack`, because it's handled by `Web APIs`, thus achieving the running of multiple tasks.
2. `setTimeout(fn1, 1000)` does not guarantee that `fn1` will execute exactly after 1s. After 1s, `fn1` is only queued in the `Callback Queue` to wait until the `Call Stack` is empty, at which point `fn1` will be moved into the Stack for execution. Therefore, we can only say "it guarantees that `fn1` will execute at least 1s later."

At this point, we can understand why `JavaScript` is single-threaded but can still execute multiple tasks simultaneously.

---

## Exploring the Event Loop: What Exactly Is It?

The content described above already includes the concept of the `Event Loop`.

> In a nutshell, the `Event Loop` is the **asynchronous execution cycle mechanism** for event tasks between the `Call Stack` and `Callback Queue`.

This is just an overview, meaning there are still details about `Tasks (Macrotasks)` and `Microtasks` that haven't been explained, which will be covered in more detail later.

![Call Stack + Web APIs + Callback Queue + Event Loop](/images/articles/javascript-browser-event-loop/04.png)

It's important to emphasize that the `JavaScript` language itself doesn't have an `Event Loop`; rather, it works with an "execution environment" to establish an `Event Loop` mechanism. Environments like `Browser` or `Node.js` each have their own `Event Loop` mechanism.

Let's summarize the main points so far:

- The `Event Loop` is a mechanism for handling the execution order of asynchronous tasks.
- The `Event Loop` exists in JS execution environments, such as the `Browser Event Loop` or `Node Event Loop`.
- The `Browser Event Loop` is associated with the interaction between the `Call Stack`, `Web APIs`, and `Callback Queue`.
  - When asynchronous tasks like `setTimeout` or `XHR` are encountered, they are handled by `Web APIs`, not blocking the `Call Stack`.
  - After the `Web APIs` finish handling asynchronous logic, they throw the Callback task back to the `Callback Queue` to wait.
  - When the `Call Stack` is empty, it receives and executes the Callback task.

Here's a classic full picture of the `Browser Event Loop`, which should help you understand its meaning:

![Browser Event Loop Whole Concept](/images/articles/javascript-browser-event-loop/05.png)

There are two special points worth noting:

1. In the `Callback Queue`, there are different types of `Queues`, such as `Timer Queue`, `Network Queue`, etc. So we can say that in the `Event Loop`, there may be multiple types of `Queues` at the same time.
2. Web APIs don't just help with time-consuming tasks; they also handle many other tasks like `DOM events (click, scroll...)`. So when we encounter events like `onClick`, they also enter the `Web API` + `Callback Queue` + `Call Stack` cycle.

Regarding the second point, let's demonstrate it directly using loupe:

![Browser Event Loop Example with onClick](/images/articles/javascript-browser-event-loop/06.gif)
_[(Try it yourself on the loupe website)](http://latentflip.com/loupe/?code=CmNvbnNvbGUubG9nKCd0b3AnKTsKCiQub24oJ2J1dHRvbicsICdjbGljaycsIGZ1bmN0aW9uIG9uQ2xpY2soKXsKICAgICAgICBjb25zb2xlLmxvZygnQ2xpY2snKTsKfSk7CiAKIGNvbnNvbGUubG9nKCdib3R0b20nKTsKIAoKIAoKCgoKCg%3D%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

We can see that each time the Click button is clicked, the event is first handed to the `Web API`, then enters the `Callback Queue` and `Call Stack`, running the `Event Loop` mechanism.

---

## Deep Dive into the Event Loop: Tasks (Macrotasks) and Microtasks

In the operation of the `Event Loop`, event tasks actually have two types: `Tasks (Macrotasks)` and `Microtasks`.

From [this article on MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide), we can learn the following definitions:

### `Tasks (Macrotasks)`

> A **task** is any JavaScript code which is scheduled to be run by the standard mechanisms such as initially starting to run a program, an event callback being run, or an interval or timeout being fired. These all get scheduled on the **task queue**.

These include but are not limited to:

- Parsing HTML
- Executing JavaScript mainline and scripts
- URL changes
- setTimeout, setInterval => callback events (the callback fn parameter passed in)
- Publishing Event events => callback events (onClick, onScroll, etc.)
- Obtaining network resources => callback events (callback fn after XHR)

_Note: `Task` is actually what is commonly known as `Macrotask`. From this point on, I'll also use `Task` to refer to macrotasks._

When these `Tasks` are triggered, they are queued in specific `Task Queues`. For example, callbacks from `setTimeout` and `setInterval` are queued in the `Timer Queue`, while callbacks from Event events are queued in the `DOM Event Queue`.

These different types of `Queues` allow the event loop to adjust execution priorities based on different task types. For instance, tasks emphasizing immediate response, such as handling user input, might be given higher priority. However, different browsers implement this differently, so it can be said that the browser determines which type will be executed first.

This means that **for different types of macrotasks, their processing priority does not guarantee that whoever triggers first will execute first; this still depends on how the browser implements it**.

The `Callback Queue` mentioned earlier actually refers to the `Task Queue`, as shown in the concept diagram below:

![Browser Event Loop with Task Queue](/images/articles/javascript-browser-event-loop/07.png)

### `Microtasks`

> A **microtask** is a **short function** which is executed after the function or program which created it exits and only if the JavaScript execution stack is empty, but before returning control to the event loop being used by the user agent to drive the script's execution environment.

As the name suggests, microtasks are smaller tasks whose asynchronous callbacks are not placed in the `Task Queue` but are handled by the `Microtask Queue`. These include but are not limited to:

- Promise then callbacks ([executor is synchronous](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Promise))
- MutationObserver callbacks

Let's focus on `Promise`, which is most commonly used in implementation.

`Microtasks` typically don't consume as much performance as `Tasks` and are executed as early as possible. They execute after a `Task` completes and the `Call Stack` is empty.

Remember earlier I mentioned there were some details about the `Event Loop` that weren't covered? 

Yes, that's the concept of `Microtasks`. After adding them, the concept diagram looks like this:

![Browser Event Loop with Task Queue and Microtask Queue](/images/articles/javascript-browser-event-loop/08.png)

At this point, we have a basic understanding of `Tasks` and `Microtasks`, so let's now explore in detail how these two operate in the **operation cycle flow** of the `Event Loop`.

## Operation Flow of Tasks (Macrotasks) and Microtasks

![Event Loop Flow with Task Queue and Microtask Queue](/images/articles/javascript-browser-event-loop/09.png)

This diagram is a classic representation of how `Tasks` and `Microtasks` operate in the `Event Loop`. Let's look at some key points:

1. In one cycle, we first check if there are any `Tasks` in the `Task Queue`.
2. If there is a `Task`, we execute it; if not, we proceed directly to checking the `Microtask Queue`.
3. After completing a `Task`, we check if there are any `Microtasks` in the `Microtask Queue`.
4. If there are `Microtasks`, we execute them, and we only proceed to the next `render` phase after completing all `Microtasks` in the `Microtask Queue`.
5. If rendering is needed, we render; if not, we don't execute. Then we return to step 1.

A crucial insight from this is:

> **In a single cycle, only one macrotask (Task) is processed, but all microtasks (Microtask) are processed.**

We can understand this through the execution of the following program:

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

// What is the order of the output? => Think about it first, then the answer will be clear after understanding the operation flow.
```

1. There's a `script` `Task`, so this `Task` is executed, and the `script` starts running.
2. We encounter `console.log('script start')` and print `script start`.
3. We encounter `setTimeout`, which is asynchronously counted down by the `Web API`, and after the countdown, it's thrown into the `Task Queue` to wait for execution.
4. We encounter `promise 1`, first execute the `executor` synchronously, and print `promise 1 resolve`.
5. After `resolve` is complete, we throw the `promise 1` `callback function` into the `Microtask Queue` to wait for execution.
6. We encounter `promise 2`, first execute the `executor` synchronously, and print `promise 2 resolve`.
7. After `resolve` is complete, we throw the `promise 2` `callback function` into the `Microtask Queue` to wait for execution.
8. We encounter `console.log('script end')` and print `script end`.
9. At this point, the `script` `Task` is complete, and we enter the phase of checking if there are pending items in the `Microtask Queue`.
10. There are two callbacks in the `Microtask Queue`: `promise 1` and `promise 2`. Both are executed, printing `promise 1 callback` and `promise 2 callback`.
11. At this point, there are no items in the `Microtask Queue`, so we proceed to whether to `render`, and the screen might be updated.
12. One cycle is complete, and a new cycle begins from the start.
13. We check the `Task Queue` and find there's a `setTimeout` `callback`, which we execute, printing `setTimeout callback`.
14. At this point, the `setTimeout callback` `Task` is complete, and we enter the phase of checking if there are pending items in the `Microtask Queue`.
15. There are no items in the `Microtask Queue`, so we proceed to whether to `render`, and the screen might be updated.
16. We cycle again, find there are no more tasks, and end.

So the output will be:

- First cycle
  - script start
  - promise 1 resolve
  - promise 2 resolve
  - script end
  - promise 1 callback
  - promise 2 callback

- Second cycle
  - setTimeout callback

Although the loupe website doesn't show the `Microtask Queue`, we can still visually observe the program's operation flow:

![setTimeout and promise execute flow on Loupe](/images/articles/javascript-browser-event-loop/10.gif)
_[(Try it yourself on the loupe website)](http://latentflip.com/loupe/?code=Y29uc29sZS5sb2coJ3NjcmlwdCBzdGFydCcpOwoKc2V0VGltZW91dChmdW5jdGlvbiAoKSB7CiAgY29uc29sZS5sb2coJ3NldFRpbWVvdXQgY2FsbGJhY2snKTsKfSwgMTAwMCk7CgpuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7CiAgY29uc29sZS5sb2coJ3Byb21pc2UgMSByZXNvbHZlJyk7CiAgcmVzb2x2ZSgpOwp9KS50aGVuKGZ1bmN0aW9uICgpIHsKICBjb25zb2xlLmxvZygncHJvbWlzZSAxIGNhbGxiYWNrJyk7Cn0pOwoKbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgewogIGNvbnNvbGUubG9nKCdwcm9taXNlIDIgcmVzb2x2ZScpOwogIHJlc29sdmUoKTsKfSkudGhlbihmdW5jdGlvbiAoKSB7CiAgY29uc29sZS5sb2coJ3Byb21pc2UgMiBjYWxsYmFjaycpOwp9KTsKCmNvbnNvbGUubG9nKCdzY3JpcHQgZW5kJyk7!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

This example is quite important. If you can understand it, you'll have a good grasp of how the `Event Loop` works. If you're still not quite clear, you might want to go through it a few more times.

---

## How to Avoid User Operation Lag Using setTimeout

There are at least two possibilities that can lead to user operation lag:

1. An event task is triggered too frequently, causing that event to fill up the `Task Queue` and squeeze out other `Tasks`.
2. An event task has a high processing cost, causing the `Call Stack` to spend too much time executing just this `Task`.

Of course, there are other possibilities, but let's focus on these two common scenarios.

### Event Task Triggered Too Frequently

The most common examples are `scroll` and `mousemove` events. These two events are triggered extremely frequently during user operations. If not handled properly, they can cause other `Tasks` to be blocked and unable to execute, leading to the perception that the webpage is problematic.

Here's a scenario with `onClick` and `onMousemove` events:

```javascript
// In the lower left area of Loupe, mouse movement over the entire document area will trigger the mousemove event
$.on('document', 'mousemove', function onMousemove() {
  console.log('Mousemove Callback Execute');
});

// In the lower left area of Loupe, clicking the Click Me button will trigger the click event
$.on('button', 'click', function onClick() {
  console.log('Click Callback Execute');
});
```

Let's look at the result:

![onMousemove without setTimeout on Loupe](/images/articles/javascript-browser-event-loop/11.gif)
_[(Try it yourself on the loupe website)](http://latentflip.com/loupe/?code=CgokLm9uKCdkb2N1bWVudCcsICdtb3VzZW1vdmUnLCBmdW5jdGlvbiBvbk1vdXNlbW92ZSgpewogICAgICAgIGNvbnNvbGUubG9nKCdNb3VzZW1vdmUgQ2FsbGJhY2sgRXhlY3V0ZScpOwp9KTsKIAogCiQub24oJ2J1dHRvbicsICdjbGljaycsIGZ1bmN0aW9uIG9uQ2xpY2soKXsKICAgICAgICBjb25zb2xlLmxvZygnQ2xpY2sgQ2FsbGJhY2sgRXhlY3V0ZScpOwp9KTsKIAoKIAoKCgoKCg%3D%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

Notice the `Task Queue` area in the lower right. You'll see that when you first move to the Click Me button, many `mousemove` events are already triggered. So no matter how many times you click the button afterward, the `onClick` event will always be after a large group of `onMousemove` events, so `Click Callback Execute` will be blocked by `Mousemove Callback Execute` and unable to execute.

To solve this problem, we can use `setTimeout`.

Instead of directly triggering the `Mousemove Callback Execute` logic when `mousemove` is triggered, we first trigger `setTimeout`, so `Mousemove Callback Execute` is first queued in the `Web API` before being queued in the `Task Queue`.

```javascript
// In the lower left area of Loupe, mouse movement over the entire document area will trigger the mousemove event
$.on('document', 'mousemove', function onMousemove() {
  // Using setTimeout to allow Click Callback Execute to execute between Mousemove Callback Execute calls
  setTimeout(function timeoutCallback() {
    console.log('Mousemove Real Callback Execute');
  }, 0);
});

// In the lower left area of Loupe, clicking the Click Me button will trigger the click event
$.on('button', 'click', function onClick() {
  console.log('Click Callback Execute');
});
```

Let's look at the result:

![onMousemove with setTimeout on Loupe](/images/articles/javascript-browser-event-loop/12.gif)
_[(Try it yourself on the loupe website)](http://latentflip.com/loupe/?code=CgokLm9uKCdkb2N1bWVudCcsICdtb3VzZW1vdmUnLCBmdW5jdGlvbiBvbk1vdXNlbW92ZSgpewogICAgc2V0VGltZW91dChmdW5jdGlvbiB0aW1lb3V0Q2FsbGJhY2soKXsKICAgICAgICBjb25zb2xlLmxvZygnTW91c2Vtb3ZlIFJlYWwgQ2FsbGJhY2sgRXhlY3V0ZScpOwogICAgfSwgMCk7Cn0pOwogCiAKJC5vbignYnV0dG9uJywgJ2NsaWNrJywgZnVuY3Rpb24gb25DbGljaygpewogICAgY29uc29sZS5sb2coJ0NsaWNrIENhbGxiYWNrIEV4ZWN1dGUnKTsKfSk7CiAKCiAKCgoKCgo%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

Notice the `Task Queue` area. You'll see that the `onClick` event now has a chance to insert itself between `timeoutCallback` events, meaning `Click Callback Execute` will execute between `Mousemove Callback Execute` events, rather than being blocked after all the `Mousemove Callback Execute` events.

So using the asynchronous concept of `setTimeout` has a chance to solve (or alleviate) the first problem.

_Note: For handling frequently triggered events, the extended concepts are Debounce and Throttle._

### Event Task with High Processing Cost

Generally, browsers try to update the page 60 times per second to keep the display running smoothly. In other words, they update the screen once every 16 ms.

We can see that in the last phase of the `Event Loop`, it's about drawing and updating the screen. So ideally, in one cycle, "the `Task` and all the generated `Microtasks` should be completed within 16 ms" to safely guarantee the smooth operation of the screen.

When a `Task` takes too long to process, it can lead to a situation where user operations lag. Therefore, if this occurs, we can break down the `Task` into smaller sizes to reduce the time cost of each executing `Task`.

I'll use an example from page 410 of [Secrets of the JavaScript Ninja, Second Edition](https://www.books.com.tw/products/0010773867) to illustrate.

Suppose we have the following code that performs a high time-cost task:

```javascript
const tbody = document.querySelector('tbody');

// Create 20000 table rows in the tbody at once
const rowCount = 20000;
for (let i = 0; i < rowCount; i++) {
  const tr = document.createElement('tr');

  // For each table row, create 6 data columns, each column containing 1 text node
  for (let t = 0; t < 6; i++) {
    const td = document.createElement('td');
    const tdText = document.createTextNode(`${i}-${t}`);
    td.appendChild(tdText);
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}
```

This code will create tens of thousands of DOM nodes and insert text, which is very costly to execute and can easily hinder user interaction with the page.

We can use `setTimeout` to break the `Task` into smaller pieces, allowing the page to render and interact more smoothly:

```javascript
// Divide 20000 into 4 stages of execution
const rowCount = 20000;
const devideInto = 4;
const chunkRowCount = rowCount / devideInto;

let iteration = 0;
const tbody = document.querySelector('tbody');

const generateRows = () => {
  // Create 5000 table rows in the tbody at once
  for (let i = 0; i < chunkRowCount; i++) {
    const tr = document.createElement('tr');
    // For each table row, create 6 data columns, each column containing 1 text node
    for (let t = 0; t < 6; t++) {
      const td = document.createElement('td');
      const tdText = document.createTextNode(`${i}-${t}`);
      td.appendChild(tdText);
      tr.appendChild(td);
    }
    tbody.appendChild(tr);
  }
  iteration++;

  // If not yet complete, move generateRows to Web API again to throw into Task Queue
  // Using setTimeout to transform the Task of executing 20000 rows once into a Task of executing 5000 rows 4 times
  if (iteration < devideInto) setTimeout(generateRows, 0);
};

// Start generateRows, move generateRows to Web API then throw into Task Queue
setTimeout(generateRows, 0);
```

The conceptual difference in execution results is as follows (image from page 412 of the book):

![Task division with setTimeout](/images/articles/javascript-browser-event-loop/13.jpg)

The most important difference is that the task that originally took a long time to complete is broken down through `setTimeout`, allowing the web page to redraw and possibly insert new tasks (managed by the browser) in between, thus avoiding having the screen freeze for an extended period.

In the above example, setting setTimeout to delay by 0 seconds doesn't mean it will execute after exactly 0 seconds, but rather at least 0 seconds later. The meaning is close to notifying the browser to execute the `callback Task` as soon as possible. But at the same time, it gives the browser the right to readjust between divided `Tasks` (e.g., redrawing the screen).

---

## Summary: Answering the Questions from the Introduction

At this point, we should be able to answer the questions mentioned in the introduction:

### 1. Why can `JavaScript` execute tasks asynchronously?

Because different `execution environments` have different `APIs` to assist with asynchronous task execution.

For example, in the `Browser` execution environment, asynchronous tasks such as `setTimeout`, `setInterval` timers or `XHR` network requests are all assisted by `Web APIs`. This allows single-threaded `JavaScript` running in the `Browser` to execute multiple tasks simultaneously.

### 2. What is the `Event Loop`?

The `Event Loop` is a mechanism in the `JavaScript` execution environment that handles the execution order of asynchronous tasks.

For example, in the `Browser` execution environment, asynchronous tasks are handled by `Web APIs`, which, after processing, typically have `Callback Tasks`. These `Tasks` are thrown into the `Callback Queue` to wait until the right time, at which point they're thrown into the `Call Stack` for execution.

The `Event Loop` is the mechanism that handles the execution order of asynchronous tasks from the `Callback Queue` to the `Call Stack`, including the operation flow of `Tasks` and `Microtasks`.

### 3. What are `Tasks` and `Microtasks`?

In `JavaScript`, tasks are divided into two types: `Tasks` (macrotasks) and `Microtasks`.

`Tasks` are independent work units, including: `script execution`, `setTimeout/setInterval callbacks`, `DOM event callbacks`, etc. These are queued in the `Task Queue` to await execution.

`Microtasks` are smaller compared to `Tasks` and generally less performance-intensive. They need to be executed as early as possible to help update data states before the screen is rendered. These are queued in the `Microtask Queue` to await execution.

In one cycle of the `Event Loop`, at most one `Task` is processed, with the rest continuing to wait in the `Task Queue`, but all `Microtasks` are processed, emptying the `Microtask Queue`.

### 4. How does the `Event Loop` work?

In one cycle of the `Event Loop`:

1. We first check if there are any `Tasks` in the `Task Queue`.
2. If there is a `Task`, we execute it; if not, we proceed directly to checking the `Microtask Queue`.
3. After completing a `Task`, we check if there are any `Microtasks` in the `Microtask Queue`.
4. If there are `Microtasks`, we execute them, and we only proceed to the next `render` phase after completing all `Microtasks` in the `Microtask Queue`.
5. If rendering is needed, we render; if not, we don't execute. Then we return to step 1.

### 5. How can we prevent lag caused by high-cost `Event` handling?

Usually, it could be due to "event triggering frequency being too high" or "event processing time cost being too high", both of which can be addressed through `setTimeout` or its derivatives like `throttle` or `debounce`.

1. Event triggering frequency being too high: `setTimeout` can make the event's `Task` first enter `Web APIs` for a countdown, and then be thrown into the `Task Queue`. During the countdown period in `Web APIs`, other event `Tasks` can be inserted into the `Task Queue` for execution, rather than always being blocked at the end.

2. Event processing time cost being too high: `setTimeout` can break a high-cost single `Task` into multiple `Tasks`, allowing the browser to redraw or insert other tasks in between.

### Concluding Thoughts

To be honest, there's much more content and detail that could be explored about the `Event Loop`, such as directly reading the [HTML specification document](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops), but the concepts covered so far should be sufficient for many asynchronous development scenarios. Of course, they're also useful for interview scenarios!

The content below provides some practical code examples to test your understanding of what gets printed out in what order.

I suggest thinking about each example before scrolling down to see the answer.

---

## Finally, Some Challenges with Mixed Promise and setTimeout Execution

```javascript
// What is the order of the English outputs?

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

1. Initially, the running `mainline script` itself is a `Task`, and the `Task` begins to run.
2. `fn3` is triggered and begins to execute, then prints `c`.
3. `setTimeout` is triggered, and `fn1` is thrown into the `Task Queue` via the `Web API`.
4. `promise` is triggered, and `console.log(resolve)` is thrown into the `Microtask Queue`.
5. `fn2` is triggered and begins to execute, then prints `b`.
6. The main thread's `Task` ends, and we begin to execute `Microtasks`, executing `console.log(resolve)`, which prints `d`.
7. We enter the next round of the Event Loop, find `fn1` in the `Task Queue`, and execute it, printing `a`.

The result is: `c` -> `b` -> `d` -> `a`.

```javascript
// What is the order of the English outputs?

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

This is an extension of the previous example. It's particularly important to note that the `executor` (`callback`) of a `Promise` is executed synchronously, while the `callback` of `then` is executed asynchronously.

The result is: `e` -> `f` -> `d` -> `g` -> `a` -> `b` -> `c`.

_[You can try it yourself on Loupe](http://latentflip.com/loupe/?code=CgpmdW5jdGlvbiBmbjEoKSB7CiAgY29uc29sZS5sb2coJ2EnKTsKfQoKZnVuY3Rpb24gZm4yKCkgewogIHNldFRpbWVvdXQoZnVuY3Rpb24gKCl7CiAgICAgICBuZXcgUHJvbWlzZShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7CiAgICAgICAgICAgY29uc29sZS5sb2coJ2InKTsKICAgICAgICAgICByZXNvbHZlKCdjJyk7CiAgICAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNvbHZlVmFsdWUpIHsKICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNvbHZlVmFsdWUpOwogICAgICAgfSk7CiAgfSwgMCk7CiAgCiAgY29uc29sZS5sb2coJ2QnKTsKfQoKZnVuY3Rpb24gZm4zKCkgewogIGNvbnNvbGUubG9nKCdlJyk7CgogIHNldFRpbWVvdXQoZm4xLCAwKTsKCiAgbmV3IFByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkgewogICAgY29uc29sZS5sb2coJ2YnKTsKICAgIHJlc29sdmUoJ2cnKTsKICB9KS50aGVuKGZ1bmN0aW9uIChyZXNvbHZlVmFsdWUpIHsKICAgIGNvbnNvbGUubG9nKHJlc29sdmVWYWx1ZSk7CiAgfSk7CgogIGZuMigpOwp9CgpmbjMoKTsKCiAKCgoKCgo%3D!!!PGJ1dHRvbiBpZD0iY2xpY2tCdG4iPkNsaWNrIG1lITwvYnV0dG9uPg%3D%3D)_

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

This example uses some different syntax, but the concept is the same as above. It's worth noting that all `Microtasks` (`then callbacks`) will be executed before entering the next cycle.

The result is: `inner` -> `outer` -> `fulfill one` -> `fulfill two` -> `timeout callback`.

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

This example requires special attention to the syntactic sugar of `Promise`: `async` and `await`. It's quite simple: in an `async` function, if you "encounter `await`," it's executed synchronously (similar to in the `executor`); if you "don't encounter `await`," it's executed asynchronously and is thrown into the `Microtask Queue` to wait.

The result is: `script start` -> `async two` -> `promise executor` -> `script end` -> `async one` -> `fulfill` -> `timeout callback`.

Among these, `script start` -> `async two` -> `promise executor` -> `script end` is the `Task` phase of the first cycle, `async one` -> `fulfill` is the `Microtask` phase of the first cycle, and `timeout callback` is the `Task` phase of the second cycle.

If you still don't understand some of the content in the examples above, I would recommend reading this article again, or directly reading the reference documents below. There might be articles that are more suitable for your learning style!

---

#### References

- [所以說 event loop 到底是什麼玩意兒？| Philip Roberts | JSConf EU](https://www.youtube.com/watch?v=8aGhZQkoFbQ)
- [我知道你懂 Event Loop，但你了解到多深？](https://yeefun.github.io/event-loop-in-depth/)
- [Day 11 [EventLoop 01] 一次弄懂 Event Loop（徹底解決此類面試問題）](https://ithelp.ithome.com.tw/articles/10241081)
- [JS 原力覺醒 Day15 - Macrotask 與 MicroTask](https://ithelp.ithome.com.tw/articles/10222737)
- [忍者 JavaScript 開發技巧探秘第二版：Chapter13 搞懂事件](https://www.books.com.tw/products/0010773867)

#### Special Thanks

- Thanks to **hikrr** for pointing out in [this issue](https://github.com/LiangYingC/programming-farmer-blog/issues/13) that "setTimeout(fn, 1000) should be 1s not 0.1s", which has been corrected.