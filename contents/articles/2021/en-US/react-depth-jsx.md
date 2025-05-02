---
title: Deep Understanding of React.createElement and JSX
date: 2021-05-01
description: When writing React, we're accustomed to using JSX syntax, but after using it for a while, questions arise - What does JSX compile to? What's the underlying Raw API? What are JSX's features? We'll explore these questions in this article!
tag: React
---

## Introduction

When writing React, we're accustomed to using `JSX` syntax because it's more concise and makes UI structure easier to read compared to using the `React Raw API`. This makes developers more efficient when using React, and after using it for a while, it becomes second nature to continue using it.

However, what does `JSX` compile to? What's the underlying `Raw API`? These questions will be explored in this article.

Before discussing the `JSX` syntactic sugar, let's understand the more fundamental method, which is the `Raw API` that React provides to create DOM: `createElement`.

---

## Using React.createElement to create React element

In general, React.js is a frontend framework that can create/manipulate the DOM, encapsulating browser APIs into a more declarative API. The Raw API for "creating DOM" is `React.createElement`. For example, if you want to create the following Hello World Element:

```html
<div class="container">Hello World !</div>
```

Using `React.createElement`, it would be:

```javascript
const containerElement = React.createElement(
  'div',
  { className: 'container' },
  'Hello World !'
);
```

When using `React.createElement`, you typically pass in three parameters: `component`, `props`, and `...children`. The complete function is `React.createElement(component, props, ...children)`.

- **component**: You can pass a `string` representing an elementType, such as div, span; or pass in a created `component name`, such as Container, Button, etc.
- **props**: You can pass an `object` representing the props provided to the element. If there are no props, you can pass `null`.
- **...children**: You can pass in the children to be provided to the component, which can be a `component` or `string`. If there are multiple children to be combined, you can pass them in an `array`.

Since `children` can also be passed in the second parameter `props`, the above `Hello World !` example can be written with just two parameters:

```javascript
const containerElement = React.createElement('div', {
  className: 'container',
  children: 'Hello World !',
});
```

If you console.log `containerElement`, you'll get the following result:

```javascript
{
    $$typeof: Symbol(react.element),
    type: "div",
    props: {
        children: "Hello World !"
        className: "container"
    },
    key: null,
    ref: null,
    ...
}
```

From this, you can see that `containerElement` is essentially an object, with many keys passed through the parameters of `createElement`, such as `type`, `props`. Keys like `key` and `ref` can also be passed through props, like:

```javascript
const containerElement = React.createElement('div', {
  className: 'container',
  children: 'Hello World !',
  key: 'helloWroldKey',
  ref: 'helloWroldRef',
});
```

When printed out, you can see that the key and ref values have been filled in:

```javascript
{
    $$typeof: Symbol(react.element),
    type: "div",
    props: {
        children: "Hello World !"
        className: "container"
    },
    key: "helloWroldKey",
    ref: "helloWroldRef",
    ...
}
```

Looking further, in React, when using `ReactDOM.render`, you're essentially passing similar object content to `ReactDOM.render` for it to handle rendering-related matters, rendering React elements to the DOM.

The complete code looks something like this:

```html
<body>
  <div id="root"></div>

  <script type="module">
    import React from 'react';
    import ReactDOM from 'react-dom';

    const containerElement = React.createElement('div', {
      className: 'container',
      children: 'Hello World !',
      key: 'helloWroldKey',
      ref: 'helloWroldRef',
    });

    const rootElement = document.getElementById('root');

    ReactDOM.render(containerElement, rootElement);
  </script>
</body>
```

Let's focus back on `React.createElement`, omitting the `import React` content (all uses of `React.createElement` below require `import React`, but we'll omit it for now). Let's look at a multi-level element example:

```javascript
<div class="container">
  <span class="word">Hello</span>
  <span class="word">World !</span>
</div>
```

Rewriting the above HTML using `createElement` would be:

```javascript
const containerElement = React.createElement('div', {
  className: 'container',
  children: [
    React.createElement('span', {
      key: '1',
      className: 'word',
      children: 'Hello',
    }),
    ' ', // Space between Hello and World !
    React.createElement('span', {
      key: '2',
      className: 'word',
      children: 'World !',
    }),
  ],
});
```

Here we can see that when children have multiple elements, we can achieve this by passing in an array. For better readability and management, we can extract a few variables and refactor it as follows:

```javascript
const createElement = React.createElement;
const helloElement = createElement('span', {
  key: '1',
  className: 'word',
  children: 'Hello',
});
const worldElement = createElement('span', {
  key: '2',
  className: 'word',
  children: 'World !',
});

const containerElement = createElement('div', {
  className: 'container',
  children: [helloElement, ' ', worldElement],
});
```

Of course, `children` don't necessarily have to be passed via `props`; they can also be written as the third parameter:

```javascript
const createElement = React.createElement;
const helloElement = createElement(
  'span',
  { key: '1', className: 'word' },
  'Hello'
);
const worldElement = createElement(
  'span',
  { key: '2', className: 'word' },
  'World !'
);

const containerElement = createElement(
  'div',
  {
    className: 'container',
  },
  [helloElement, ' ', worldElement]
);
```

After understanding how to create elements using the React Raw API `createElement`, let's move on to `JSX`.

---

## Using JSX to create React element

Without explaining what JSX is first, let's look at a piece of code. Similarly, rendering the same `Hello World !` with React:

1. Using `createElement`:

```javascript
const createElement = React.createElement;
const helloElement = createElement(
  'span',
  { key: '1', className: 'word' },
  'Hello'
);
const worldElement = createElement(
  'span',
  { key: '2', className: 'word' },
  'World !'
);

const containerElement = createElement('div', {
  className: 'container',
  children: [helloElement, ' ', worldElement],
});
```

2. Using `JSX`:

```jsx
<div className="container">
  <span key={1} className="word">
    Hello
  </span>
  <span key={2} className="word">
    World !
  </span>
</div>
```

`JSX` is a syntactic sugar that resembles `HTML` structure and incorporates `JavaScript` syntax functionality. It encapsulates the React Raw API but is more concise and intuitive compared to the Raw API, with a clear UI structure, making it easier to read and understand. It's immediately clear why when writing React, developers typically use `JSX` syntax rather than `createElement`. However, it's still important to understand that **JSX is just a syntactic sugar provided by React, and "cannot" be directly understood by the browser**.

Since browsers don't understand `JSX`, it must be compiled into `JavaScript` for browsers to understand, for example, using Babel. The compiled result of the above `JSX` is as follows:

```javascript
const ui = React.createElement(
  // type
  'div',
  // props
  {
    className: 'container',
  },
  // children
  React.createElement(
    'span',
    {
      key: 1,
      className: 'word',
    },
    'Hello'
  ),
  React.createElement(
    'span',
    {
      key: 2,
      className: 'word',
    },
    'World !'
  )
);
```

_[See Babel compilation result here](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=usage&corejs=3.6&spec=false&loose=false&code_lz=MYewdgzgLgBArgSxgXhgHgCYIG42AGwEMIIA5QgWwFNkAiUMKQhMKgJ1oD4AoGdCAA6EwMANZUAnsgDeARgC-eIiXLU6AdxBsMXXnxgAJKvnwg9aAPSDhPPmmsjxU6QCZFBYmUo1am7bv0YAHUtfAwYAEJzKyEwHkssbFtAmG4gA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=react&prettier=true&targets=&version=7.11.6&externalPlugins=)_

JSX has several key features:

### 1. JavaScript Expressions can be used in JSX

Since `JSX` is a combination of `HTML` and `JavaScript` syntax sugar, you can use any valid `JavaScript Expression` within it, leveraging the capabilities of the `JavaScript` language. For example, you can use `{}` to wrap variables, and you can use `map` to render lists of data at once. This is because they are all valid `JavaScript Expressions`.

For example, the following `JSX`:

```jsx
<div className="container">
    <div>Hello Belly</div>
    <div>Hello Toast</div>
    <div>Hello Mochi</div>
</div>
```

Can be rewritten using `JavaScript Expressions` with `{}` and `map`:

```jsx
const userLists = ['Belly', 'Toast', 'Mochi'];

const HelloUsers = () => {
  return (
    <div className="container">
      {userLists.map(name => {
        return <div key={name}>Hello {name} !</div>;
      })}
    </div>
  );
};
```

Here, `HelloUsers` is defined as a custom function component, hence the capitalized naming. Also, since `class` is a reserved word in `HTML`, in `JSX`, the key for naming a `class` is `className`.

Since any `JavaScript Expression` is valid, you can also directly call functions within `{}` and return valid values:

```jsx
const userLists = [
  { firstName: 'Belly', lastName: 'Lee' },
  { firstName: 'Toast', lastName: 'Chen' },
  { firstName: 'Mochi', lastName: 'Chen' },
];

const formatName = user => {
  return user.firstName + ' ' + user.lastName;
};

const HelloUsers = () => {
  return (
    <div className="container">
      {userLists.map(name => {
        return <div key={name}>Hello {formatName(user)} !</div>;
      })}
    </div>
  );
};
```

From these examples, you can see that `JSX` embraces an important concept: **the fact that rendering logic and UI logic are fundamentally tied together**.

### 2. JSX itself is a JavaScript Function

Since `JSX` becomes a regular `JavaScript Function` (createElement) after compilation, which gets called and ultimately produces a `JavaScript Object` (element object), you can use `JSX` as a variable:

```jsx
const helloUsersElement = (
    <div className="container">
        <div>Hello Belly</div>
        <div>Hello Toast</div>
        <div>Hello Mochi</div>
    </div>
);
```

You can also use it as a return value for a function, as in the example below:

```jsx
const formatName = user => {
  return user.firstName + ' ' + user.lastName;
};

function getGreeting(user) {
  if (user) {
    return <h1>Hello {formatName(user)} !</h1>;
  }
  return <h1>Hello Stranger.</h1>;
}
```

### 3. JSX can use custom components as elements

As mentioned earlier, the first parameter of `createElement` can be passed a `component`, not just a string `elementType` (div, span...). Therefore, in `JSX`, you can naturally use custom component names as elements. It's important to note that when using custom components, they must be "capitalized" to be valid.

```jsx
const userLists = ['Belly', 'Toast', 'Mochi'];

const HelloUser = name => {
  return <div>Hello {name} !</div>;
};

const HelloUsers = () => {
  return (
    <div className="container">
      {userLists.map(name => {
        // Custom component element must start with an uppercase letter
        // Both key and name are props
        return <HelloUser key={name} name={name} />;
      })}
    </div>
  );
};
```

You can put the above `JSX` into Babel for transpilation, and it would become something like:

```javascript
const userLists = ['Belly', 'Toast', 'Mochi'];

const HelloUser = name => {
  return React.createElement('div', null, 'Hello ', name, ' !');
};

const HelloUsers = () => {
  return React.createElement(
    'div',
    {
      className: 'container',
    },
    userLists.map(name => {
      // Custom component element must start with an uppercase letter
      // Both key and name are props
      return React.createElement(HelloUser, {
        key: name,
        name: name,
      });
    })
  );
};
```

These are the main features of `JSX`. Of course, there are more details, which you can read about in the official React documentation mentioned at the end of this article.

---

## New JSX Transform Method After React 17

In September 2020, the React team released version 17, which included a change related to `JSX` Transform. In version 17 and beyond, `JSX` Transform will no longer depend on the React environment but will import `jsx-runtime` at runtime for processing.

Since browsers cannot directly use `JSX` syntax, developers need tools like Babel or TypeScript to help compile it into `JavaScript` for browsers to understand. The new `JSX` Transform method is a collaboration with Babel, introducing a new `jsx-runtime` without breaking existing compilation mechanisms.

This transformation does not affect `JSX` syntax, nor will it change the existing `React.createElement` (which they don't plan to sunset in the future), so there's no need to modify existing code. The old `JSX` Transform method will still be preserved.

The above is a condensed summary of the official React documentation. In practical terms, if you upgrade to React 17, **you can use JSX syntax independently without needing to import React**. For example:

### 1. The old `React.createElement` transformation method

The code in your project would look like:

```jsx
import React from 'react';

const HelloWorld = () => {
  return <div class="container">Hello World !</div>;
};
```

You must `import React from 'react'` because the transpiled result uses `React.createElement`:

```javascript
import React from 'react';

const HelloWorld = () => {
  return React.createElement(
    'div',
    {
      class: 'container',
    },
    'Hello World !'
  );
};
```

According to the official statement, this has two issues:

1. If you want to use `JSX`, you must be in the React scope environment because it relies on `React.createElement` behind the scenes.
2. Some performance optimizations and simplifications hit bottlenecks with `React.createElement` ([detailed content here](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#motivation)).

### 2. The new `jsx-runtime` transformation method

The code in your project would look like:

```jsx
const HelloWorld = () => {
  return <div class="container">Hello World !</div>;
};
```

After compilation, the result is:

```javascript
// Inserted by a compiler (don't import it yourself !)
import { jsx as _jsx } from "react/jsx-runtime";

const HelloWorld = () => {
  return _jsx("div", {
    class: "container",
    children: "Hello World !"
  });
};
```

You no longer need to `import React`; the compiler will automatically import the function that handles `JSX` transformation from `jsx-runtime`. This change is compatible with all existing `JSX` code, so there's no need to specifically modify past components or files.

What's particularly noteworthy is that **functions like `react/jsx-runtime`, `react/jsx-dev-runtime`, and other new `JSX` transformation methods are automatically imported by the compiler. If you want to create elements in your project source code without using JSX, you still need to use `React.createElement`, not `_jsx` or similar**.

---

## Summary

There's a lot of content, so here are the key points:

1. In React, you can create React elements through `React.createElement(component, props, ...children)` or `JSX`.
2. `React.createElement` returns an element object, which will ultimately be rendered as a DOM element through the `ReactDOM.render` mechanism.
3. `JSX` combines rendering logic with UI logic and can use `JavaScript Expression` syntax, making it more concise and intuitive than `React.createElement`.
4. Before React 17, JSX was compiled and processed through `React.createElement`; after React 17, it's processed by importing methods from `react/jsx-runtime`.
5. `react/jsx-runtime` is automatically imported by the compiler after transpilation. If you want to create elements without using `JSX` in your project source code, you still need to use `React.createElement`, not `_jsx` or similar.

There are many more details to explore! If you're interested, you can read the articles in the references at the end of this article, or check out the [source code of createElement](https://github.com/facebook/react/blob/fd61f7ea53989a59bc427603798bb111c852816a/packages/react-dom/src/client/ReactDOMComponent.js#L413).

---

#### References

- [介紹 JSX | React 官方文件](https://zh-hant.reactjs.org/docs/introducing-jsx.html)
- [深入 JSX | React 官方文件](https://zh-hant.reactjs.org/docs/jsx-in-depth.html)
- [Introducing the New JSX Transform | React 官方文件](https://zh-hant.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
- [What is JSX? | KenC](https://kentcdodds.com/blog/what-is-jsx)

#### Special Thanks

- Thanks to **peanshanwu** for reminding me in [this issue](https://github.com/LiangYingC/programming-farmer-blog/issues/15) that `createElement` doesn't create DOM elements but React elements.