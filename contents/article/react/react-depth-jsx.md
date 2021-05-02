---
title: 深入理解 React.createElement 與 JSX
date: 2021-05-01
description: 在寫 React 時，總是非常順手地使用 JSX 語法，然而用久了總會思考到：究竟 JSX 被編譯後結果為何？背後的 Raw API 為何？JSX 有什麼特色？這些疑問都會在文中探討！
category: react
---

## 前言

在寫 React 時，總是非常順手地使用 `JSX` 語法，因為比起使用 `React Raw API` 來說更佳簡潔以及容易閱讀 UI 結構等因素，所以 `JSX` 讓開發者使用 React 時效率更佳，用了一陣子後會很理所當然地一直用下去。

然而究竟 `JSX` 被編譯後結果為何？背後的 `Raw API` 為何？都會在本文有所探討。

在提到 `JSX` 語法糖前，先來了解比較根本的方法，也就是也就是 React 提供用來創建 DOM 的 `Raw API` : `createElement`。

<hr>

## Using React.createElement to create DOM element

概略來說，React.js 是套能夠用來創造/操作 DOM 的前端框架，它有將 browser API 封裝成較為聲明式（declarative）的 API，其中「創建 DOM 」 的 Raw API 即為 `React.createElement`，舉例而言，如果要創建下面的 Hello World Element：

```javascript
<div class="container">Hello World !</div>
```

用 `React.createElement` 結果為：

```javascript
const containerElement = React.createElement(
    'div',
    { className: 'container'},
    'Hello World !'}
);
```

通常使用 `React.createElement` 最主要會傳入三個參數 `component`、`props`、 `...children`。完整的函式為 `React.createElement(component, props, ...children)`。

- **component** : 可以傳入 `string`，代表 elementType，例如：div、span ; 或是傳入被創建好的 `component name`，例如：Container、Button 等。
- **props** : 可傳入 `object`，代表提供給 element 的 props，如果沒有任何 props 可以傳入 `null`。
- **...childern** : 可傳入要提供給 component 的 childern，可為 `component` or `strng`，如果有多個 children 時需組合時，可以用 `array` 傳入。

由於第二個參數 `props` 中，也可以傳入 `children` ，因此上面的例子，可以只傳入兩個參數寫成：

```javascript
const containerElement = React.createElement('div', {
  className: 'container',
  children: 'Hello World !',
});
```

假如把 `containerElement` console.log 出來，會得到下面的結果：

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

從中可以看到 `containerElement` 本質上是個 object，其中許多的 key，會藉由 `createElement` 的參數傳入，像是 `type`、`props`，而 `key`、`ref` 等，其實都能藉由 props 一起傳入，像是：

```javascript
const containerElement = React.createElement('div', {
  className: 'container',
  children: 'Hello World !',
  key: 'helloWroldKey',
  ref: 'helloWroldRef',
});
```

印出來，就能看到 key、ref 的值都被填入：

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

延伸地來看，在 React 中，當使用 `ReactDOM.render` 時，其實就是把類似 object 的內容 pass 給 `ReactDOM.render` 讓它去處理 render 相關的事宜。完整的 code 比較像下面這樣：

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

讓我們聚焦回 `React.createElement` 上，省略 `import React` 的內容，(以下使用到 `React.createElement`，都需要 `import React`，但都先省略)，再多看個多層次的 element 範例：

```javascript
<div class="container">
  <span class="word">Hello</span>
  <span class="word">World !</span>
</div>
```

將上面的 html 改寫成用 `createElement` 創建，如下：

```javascript
const containerElement = React.createElement('div', {
  className: 'container',
  children: [
    React.createElement('span', { key: '1', className: 'word', children: 'Hello' }),
    ' ', // Hello Word ! 兩個字中間的空格
    React.createElement('span', { key: '2', className: 'word', children: 'World !' }),
  ],
});
```

這邊就可以發現 children 有多個 element 時，可以透過傳入 array 達成。為了便於閱讀和管理可以抽幾個變數，重構成下面這樣：

```javascript
const createElement = React.createElement;
const helloElement = createElement('span', { key: '1', className: 'word', children: 'Hello' });
const worldElement = createElement('span', { key: '2', className: 'word', children: 'World !' });

const containerElement = createElement('div', {
  className: 'container',
  children: [helloElement, ' ', worldElement],
});
```

當然 `children` 不一定要用 `props` 傳，也可寫在第三個參數：

```javascript
const createElement = React.createElement;
const helloElement = createElement('span', { key: '1', className: 'word' }, 'Hello');
const worldElement = createElement('span', { key: '2', className: 'word' }, 'World !');

const containerElement = createElement('div', {
  className: 'container',
  children: [helloElement, ' ', worldElement],
});
```

理解如何用 React Raw API `ceateElement` 創建 element 後，接著進入到 `JSX`。

<hr>

## Using JSX to create DOM element

先不解釋 JSX 是什麼，直接來看段 code，同樣地將一樣的 `Hello World !` 用 React render 出來

1. `createElement` 的寫法：

```javascript
const createElement = React.createElement;
const helloElement = createElement('span', { key: '1', className: 'word' }, 'Hello');
const worldElement = createElement('span', { key: '2', className: 'word' }, 'World !');

const containerElement = createElement('div', {
  className: 'container',
  children: [helloElement, ' ', worldElement],
});
```

2. `JSX` 的寫法：

```javascript
<div className="container">
  <span key={1} className="word">
    Hello
  </span>
  <span key={2} className="word">
    World !
  </span>
</div>
```

`JSX` 是一種似 `HTML` 結構並混合 `JavaScript` 語法功能的語法糖（Syntatic Sugar），背後其實封裝了 React Raw API，但相較於 React Raw API，更加簡潔與直觀，並帶有明顯的 UI 結構，因此更好閱讀與理解。一眼就能理解為什麼寫 React 時，通常都是直接用 `JSX` 語法，而非使用 `createElement`。不過，依然必須要清楚 **JSX 僅是一種 React 提供的語法糖 ，並且「不能」被瀏覽器直接理解。**。

由於 `JSX` 瀏覽器看不懂，因此必須透過編譯的方式處理成 `JavaScript`，瀏覽器才能理解，例如使用 Babel 編譯，舉例而言，上面的 `JSX` 編譯出來的結果如下：

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

_[Babel 編譯結果由此去](https://babeljs.io/repl#?browsers=defaults%2C%20not%20ie%2011%2C%20not%20ie_mob%2011&build=&builtIns=usage&corejs=3.6&spec=false&loose=false&code_lz=MYewdgzgLgBArgSxgXhgHgCYIG42AGwEMIIA5QgWwFNkAiUMKQhMKgJ1oD4AoGdCAA6EwMANZUAnsgDeARgC-eIiXLU6AdxBsMXXnxgAJKvnwg9aAPSDhPPmmsjxU6QCZFBYmUo1am7bv0YAHUtfAwYAEJzKyEwHkssbFtAmG4gA&debug=false&forceAllTransforms=false&shippedProposals=false&circleciRepo=&evaluate=false&fileSize=false&timeTravel=false&sourceType=module&lineWrap=true&presets=react&prettier=true&targets=&version=7.11.6&externalPlugins=)_

JSX 主要有幾個特色：

### 一、JSX 內可使用 JavaScript Expression

由於 `JSX` 是綜合了 `HTML` 與 `JavaScript` 的語法糖，在其中可使用任何合法的 `JavaScript Expression`，藉此發揮 `JavaScript` 語言本身能力，像是可以使用 `{}` 包覆變數，以及可以使用 `map` 一次 render 出 lists data。因為它們都是合法的 `JavaScript Expression`。

舉例而言下面這段 `JSX`：

```javascript
<div className="container">
    <div>Hello Belly<div>
    <div>Hello Toast<div>
    <div>Hello Mochi<div>
</div>
```

可以用 `JavaScript Expression`中的 `{}`、`map` 等改寫成：

```javascript
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

在此的`HelloUsers` 是作為自定義的 function component，因此命名為大寫開頭。另外因為 `class` 為 `HTML` 保留字元，所以在 `JSX` 中，命名 `class` 時的 key 為 `className`。

因為只要 `JavaScript Expression` 就合法，因此也可以在 `{}` 中直接呼叫 function，並回傳合法的值：

```javascript
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

從上面這些範例，其實可以發現 `JSX` 擁抱了一個重要的概念：**render 的邏輯和 UI 邏輯從根本上就綁在一起的事實**。

### 二、JSX 本身是 JavaScript Function

由於 `JSX` 在編譯後，就成了一般的 `JavaScript Function` (createElement)，且會被呼叫，最後產出的結果為 `JavaScript Object`(element object)。因此可以將 `JSX` 視為一個變數使用：

```javascript
const helloUsersElement = (
    <div className="container">
        <div>Hello Belly<div>
        <div>Hello Toast<div>
        <div>Hello Mochi<div>
    </div>
);
```

更可以如下面範例，作為 function 的回傳值：

```javascript
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

### 三、JSX 可使用自定義的 component 當 element

在前面曾經提及 `createElement` 第一個參數可以傳入 `component`，並非僅有 string `elementType`(div、span...)。因此在 `JSX` 中，自然也可使用自定義的 component name 當作 element，要特別注意的是：在使用自定義的 component 時，要使用「大寫」才合法。

```javascript
const userLists = ['Belly', 'Toast', 'Mochi'];

const HelloUser = name => {
  return <div>Hello {name} !</div>;
};

const HelloUsers = () => {
  return (
    <div className="container">
      {userLists.map(name => {
        // 自定義的 component element，須為大寫開頭
        // key 與 name 都是 props
        return <HelloUser key={name} name={name} />;
      })}
    </div>
  );
};
```

可以把上述的 `JSX` 丟進 Babel 轉譯，就會變成下面這樣：

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
      // 自定義的 component element，須為大寫開頭
      // key 與 name 都是 props
      return React.createElement(HelloUser, {
        key: name,
        name: name,
      });
    })
  );
};
```

以上就是 `JSX` 主要幾個特點，當然還有更多細節，可以閱讀文末的 React 官方文件。

<hr>

## React 17 版後，新的 JSX Transform 方式

在 2020 年 9 月時，React 團隊釋出了 17 版本，其中有項與 `JSX` Transform 有關，就是在 17 版後，`JSX` Transform 將不再依賴於 React 環境，而是會在 runtime 時，引入 `jsx-runtime` 處理。

由於在瀏覽器中，是無法直接使用 `JSX` 語法，因此開發者需要用到 Babel or TypeScript 之類的工具協助編譯成 `JavaScript`，藉此讓瀏覽器能看得懂。新的 `JSX` Transform 方式是與 Babel 合作，再不打破現有的編譯機制情況下，引入新的 `jsx-runtime`。

這次的轉換並不會影響到 `JSX` 語法，更不會改變過往已經存在的 `React.createElement`（未來也不打算 sunset），因此不需要對過往的 code 做出修改，舊有的 `JSX` Transform 方式依然會保留。

以上是濃縮 React 官方文件內容的結果，實際上來說，如果升級到 React 17 版本，那麼**將可以單獨使用 JSX 語法，而不再需要 import React**。如下面的範例：

### 一、舊有的 `React.createElement` 轉換方式

在專案中的程式碼如下：

```javascript
import React from 'react';

const HelloWorld = () => {
  return <div class="container">Hello World !</div>;
};
```

必須要 `import React from 'react'`，因為轉譯後的結果是用 `React.createElement` 執行：

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

根據官方說法，這樣會有兩個問題：

1. 如果要使用 `JSX`，那麼就一定要在 React scope 環境下，因為背後是 `React.createElement`
2. 有些效能的優化與簡化，在 `React.createElement ` 會遇到瓶頸（[詳細的內容在此](https://github.com/reactjs/rfcs/blob/createlement-rfc/text/0000-create-element-changes.md#motivation)）

### 二、新版的 `jsx-runtime` 轉換方式

在專案中的程式碼如下：

```javascript
const HelloWorld = () => {
  return <div class="container">Hello World !</div>;
};
```

編譯後的結果如下：

```javaScript
// Inserted by a compiler (don't import it yourself !)
import { jsx as _jsx } from "react/jsx-runtime";

const HelloWorld = () => {
  return _jsx("div", {
    class: "container",
    children: "Hello World !"
  });
};
```

不再需要 `import React`，編譯器 (compiler)，會自動引入 `jsx-runtime` 中處理 `JSX` 轉換的 functon。此項改動是兼容過往所有的 `JSX` 程式碼，因此不需要特別去修改過去的 component 或檔案。

比較需要特別注意的是 **`react/jsx-runtime`、`react/jsx-dev-runtime` 中的等等新的 `JSX` 轉換方式的 function，是透過編譯器自動引入的，如果想要在專案源碼中不使用 JSX 創建元素，那麼還是要使用 `React.createElement`** 。

<hr>

## 總結

內容有點多，總結幾個重點：

1. 在 React 中，可以透過 `React.createElement(component, props, ...children)` 或 `JSX` 創建 DOM element。
2. `React.createElement` 的結果會返回一個 element object，最終會透過 `ReactDOM.render` 的機制渲染。
3. `JSX` 將 render 邏輯與 UI 邏輯結合，並可使用 `JavaScript Express` 語法，比起 `React.createElement` 更加簡潔且直觀。
4. 在 React 17 版以前，JSX 編譯後是透過 `React.createElement` 處理 ; 在 React 17 之後，則是透過引入 `react/jsx-runtime` 相關的方法處理。
5. `react/jsx-runtime` 是編譯器在轉譯後自動引入，如果在專案源碼中要不透過 `JSX` 創建 element，還是要使用 `React.createElement` 非 `_jsx` 等等。

認真要探討的話還有很多細節呢！有興趣的可以再閱讀文末參考資料中的文章，或是 [createElement 的原始碼](https://github.com/facebook/react/blob/fd61f7ea53989a59bc427603798bb111c852816a/packages/react-dom/src/client/ReactDOMComponent.js#L413)。

<hr>

#### 【 參考資料 】

- [介紹 JSX | React 官方文件](https://zh-hant.reactjs.org/docs/introducing-jsx.html)
- [深入 JSX | React 官方文件](https://zh-hant.reactjs.org/docs/jsx-in-depth.html)
- [Introducing the New JSX Transform | React 官方文件](https://zh-hant.reactjs.org/blog/2020/09/22/introducing-the-new-jsx-transform.html)
- [What is JSX? | KenC](https://kentcdodds.com/blog/what-is-jsx)
