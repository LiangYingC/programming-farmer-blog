---
title: 理解 Redux 原始碼：來實作 Middleware 相關功能吧，如：applyMiddleware
date: 2021-12-10
description: 上篇 Redux 系列文章製作完 createStore 中的 getState、dispatch、subscribe 後，這篇進階到實作 Redux Middleware 相關的功能，如 createStore 傳入的 enhancer 以及 applyMiddleware 等，更深入探討 Redux 吧。
category: sourceCode
---

## 前言

延續上一次分享的[理解 Redux 原始碼：來實作 createStore 的 getState, dispatch, subscribe 吧](/articles/sourceCode/redux-make-createStore-getState-dispatch-subscribe)，這次將更深入探討 Redux 進階應用 Middleware 相關的原始碼。

<hr>

#### 【 參考資料 】
