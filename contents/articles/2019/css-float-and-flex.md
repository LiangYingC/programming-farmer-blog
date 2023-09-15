---
title: 用 clearfix 解決 float 浮動問題的三種方式
date: 2019-11-05
description: 這篇文章會說明 float 遇到的問題，以及三種利用「 clear:both 」處理的解決方式。
tag: css
---

## 前言

在 CSS 還沒有 `display: flex` 可以很暢快的玩弄排版前，通常會利用 `float` 來進行平行橫向的排版，然而使用`float`而導致的浮動副作用總是令人恨得牙癢癢，因此這篇文章主要來探索「 利用 `clear:both` 清除浮動（clearfix）的三種方式 」，學一學後，恩.....還是繼續回去用 flex 好了 (非誤為真 RRR )。

---

## float 造成元素高度消失

首先先理解問題是什麼：**當我們利用 `float` 排版，結果會造成使用 `float` 的元素區塊本身的高度被無視**，進而下方的元素擠上來，形成的排版錯誤狀況。延伸地說，也可能造成父元素的高度坍塌，因為忽略掉父元素內容物的高度。直接看例子比較清楚，由下例可以發現 Footer 非預期性地往上跑了：

![Chinese Salty Egg](/images/articles/css-float-and-flex/01.gif)

為什麼會導致這樣的錯誤？

float 屬性，顧名思義是「 讓元素區塊直接產生浮起來的效果 」，聽起來很玄，追究這種浮起來的原因，其實是**因為 Left / Right 區塊的 height 被忽略**，可以視為 height 變成 0（實際上有值，但被忽視），所以造成 Footer 區塊因為上方沒有高度，所以往上移動的現象。

---

## clearfix 清除浮動問題

現在了解為何 float 會造成問題後，接著來看如何透過設定「 **清除浮動 ( clearfix )** 」 的技巧來解決。

### 方法一：利用 CSS 屬性 clear: both

首先來理解 `clear` 屬性，**當一個元素中的 CSS 有 `clear` 屬性時，就會「 清除該元素上方所遭遇的浮動情況 」，因此就不會忽略其上方的元素高度，進而回到垂直排列的正常狀況**。也就是說，如果在 Footer 加上 `clear: both` ，就能讓 Left / Right 區塊的浮動情況消失（能再度看見 height ），所以排版會再度回復正常。

簡而言之，**我們需要回到正常垂直排列的元素的 CSS 屬性中加入 `clear: both`**，以上例而言，就是 Footer 中加入。

```css
.footer {
  clear: both;
}

/* 
  clear: left 只清除左邊浮動效果
  clear: right 只清除右邊浮動效果
  clear: both 清除全部的浮動效果 -> 通常直接採用這個處理
*/
```

![clear: both](/images/articles/css-float-and-flex/02.gif)

可以發現加入 `clear: both` 後，Footer 區塊確實回到 Right 區塊下方。

### 方法二：利用 .clearfix 與 clear: both

為了要讓清除浮動變得更便利、規格化，我們可以在 CSS 直接設定 `.clearfix` 選擇器，並賦予 `clear: both` 屬性。當元素需要清除浮動時，則在需要清除浮動的元素後方，安插 `<div class="clearfix"></div>` HTML 程式碼，就可以達到清除浮動的效果。

就是把 **`<div class="clearfix"></div>`** 當成清除浮動的工具，安插在浮動元素的 HTML 後。

```html
<div class="wrap">
  <div class="box left">Left</div>
  <div class="box right">Right</div>

  <div class="clearfix"></div>
  <!--新增用來清除上面的浮動-->

  <div class="box footer">Footer</div>
</div>
```

```css
.left {
  float: left;
}

.right {
  float: right;
}

.clearfix {
  /* 新增用來清除浮動的屬性 */
  clear: both;
}
```

![clearfix](/images/articles/css-float-and-flex/03.gif)

好，先整理一下，目前已經可以透過兩種方式解決浮動問題，包括：

1.  在浮動元素後元素的 CSS 中，加上 `clear: both` 屬性。
2.  在 HTML 中，浮動元素後加上 `<div class="clearfix"></div>` ; 並且在 CSS 中，加入 `.clearfix {clear: both;}` 。

然而這些都非最方便的方式，第二種方式已能將 `<div class="clearfix"></div>` 當作工具使用，但還是太麻煩，接著來講最方便，但也相對難理解的第三種方法。

### 方法三：利用 .clearfix::after 清除浮動

這個方法是利用偽元素 `::after` 與 `.clearfix` 來處理浮動問題。在解釋前，有個觀念可以先放心中：方法二「 利用 .clearfix 與 clear: both 」與方法三「 .clearfix::after 清除浮動 」，**兩者原理是一模一樣的，只是換了程式碼的呈現方式**，讓清除浮動更簡便。先看看程式碼的差異，之後再開始解釋：

HTML 的設定：

```html
<!--- HTML 改動了兩處 --->

<!-- 1. 用一個父層級 div 包覆著浮動的部分：把 wrap 區塊，改為包覆著 Left & Right -->
<!-- 2. 在該父層級 div 加上 clearfix 的 class name：在 wrap 區塊，加上 clearfix class name -->

<div class="wrap clearfix">
  <div class="box left">Left</div>
  <div class="box right">Right</div>
</div>

<div class="box footer">Footer</div>
```

CSS 浮動與清除浮動的設定：

```css
/* CSS 將 .clearfix 改為以偽元素 ::after 綜合處理*/

.left {
  float: left;
}

.right {
  float: right;
}

.clearfix::after {
  /* 1. 新增 ::after */
  content: ''; /* 2. 新增 content，注意需要加上 "" */
  display: block; /* 3. 新增 display，也可以用 table */
  clear: both;
}
```

整理下改動的三個重點：

1. 在 CSS 中，將 `.clearfix` 選擇器加上 `::after` 並改動 HTML 結構
2. 在 .clearfix::after 屬性中加上 `content: ""`
3. 在 .clearfix::after 屬性中加上 `display: block`

首先要了解 `::after` 是 CSS 偽元素的一種，所謂的 **CSS 偽元素（Pseudo Element），就是指它並不是真正的網頁元素，然而，可以透過 CSS 來操控，表現出網頁元素的相關行為，像是新增內容**。

最常見的就是 `::before` 與 `::after` 兩者預設是 `display: inline-block` 呈現。

- `::before` 是指可以用 CSS 操控在原本的元素「之前」的內容 。
- `::after` 是指可以用 CSS 操控在原本的元素「之後」的內容，。

![::after 的效果圖](/images/articles/css-float-and-flex/04.png)

以上範例，就是用 `.example::after` 操作 example 元素後方的內容（新增內容）。如此一來，可以了解到： **`::after` 可以在選定的元素後方，新增元素**。

所以重點來了，還記得前面提到的重要觀念，方法二和方法三只是差異在程式碼的呈現，因此我們可以將方法二中的 `<div class="clearfix"></div>` 元素區塊刪除，改用 `.clearfix::after` 的方式，創造帶有 `clear: both` 的隱形元素區塊替代。

因此 HTML 會產生變化，**請仔細搭配註解閱讀會較好理解**：

```html
<div class="wrap clearfix">
  <!--新增 clearfix-->
  <div class="box left">Left</div>
  <div class="box right">Right</div>

  <!-- 將這行 <div class="clearfix"></div> 刪除 -->
  <!-- 透過 .clearfix::after 在這裡會新增元素區塊，並實踐 clear: both -->
</div>

<div class="box footer">Footer</div>
```

ok，到這裡能理解的話，就差不多了，接著看 CSS 的變化，因為需要新增的元素區塊必須要包含幾個屬性：「隱形的內容」、「區塊」並帶有「 `clear: both` 」，綜合以上結果區塊屬性為：

- **content : ""**
- **display : block**
- **clear : both**

```css
/* CSS 將 .clearfix 以偽元素 ::after 處理 */

.clearfix::after {
  /* ::after，藉此新增內容區塊在 clearfix 元素最後方 */
  content: ''; /* "" 內容為隱形，不加就不會產生區塊*/
  display: block; /* 添加「區塊」屬性，可用 table 代替*/
  clear: both; /* 帶有清除浮動的屬性 */
}
```

特別提為何可以用 `display: table` 取代 `display: block` ，是因為 table 也帶有區塊性質，且更適應於 IE 6 / 7 瀏覽器。但現在基本上已捨棄 IE6 / 7 瀏覽器且 table 反而會造成其他問題，於是推薦使用 `display: block` 即可。

這樣的方便性呢，就是**只要將 clearfix 加入想清除浮動元素的父元素的 class 中就能達成啦**，非常方便！

![clearfix3](/images/articles/css-float-and-flex/05.gif)
_[codepen 有興趣可以玩玩](https://codepen.io/LiangC/pen/VwwQJPp)_

---

## 總結：其實都是 clear: both 的延伸

看完了三種 `clearfix` 的方式後，有沒有發現這三種方法，原理其實都是利用了 `clear: both` 而已，只是為了讓使用上更便利，因此產生了各種 clearfix 的解方。

以上三種方式而言，**個人推薦方法三：透過 .clear::after 來處理**。

```css
/* CSS 將 .clearfix 以偽元素 ::after 處理*/

.clearfix::after {
  content: '';
  display: block;
  clear: both;
}
```

網路上查詢的話，還可以發現其他的方式來處理浮動問題，像是利用 `overflow` 撐起父元素高度，或是新的 `display:flow-root` 。但目前主流還是使用偽元素 `::after` 或是其延伸的方式來處理，無論用哪種方式處理 float 造成的問題，只要知道為什麼使用、能避免什麼問題又或可能延伸造成什麼問題即可。

事實上現在 CSS 中已經有 「 `grid` 」 與 「 `flex` 」的出現，需要使用到 「 float 」 排版的情況減少很多，所以...也不一定要用 ＸＤＤ

#### 參考資料

- [清除浮动的四种方式及其原理理解 | 掘金](https://juejin.im/article/59e7190bf265da4307025d9)
- [用 clearfix 解決 Bootstrap grid 跑版問題，以及其原理 | 關節 ](https://medium.com/@kansetsu7/%E5%88%A9%E7%94%A8clearfix%E8%A7%A3%E6%B1%BAbootstrap-grid-system%E8%B7%91%E7%89%88%E5%95%8F%E9%A1%8C-%E4%BB%A5%E5%8F%8A%E5%85%B6%E8%83%8C%E5%BE%8C%E5%8E%9F%E7%90%86-58f6f461e4ca)
- [CSS 偽元素 ( before 與 after ) | OXXO](https://www.oxxostudio.tw/articles/201706/pseudo-element-1.html)
