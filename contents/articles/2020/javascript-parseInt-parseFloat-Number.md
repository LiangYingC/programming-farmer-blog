---
title: parseInt / parseFloat / Number，將字串轉型為數字的方法比較
date: 2020-11-29
description: 最近在工作時遇到 string 要用 parseInt 還是 Number 轉型的選擇，因此閱讀 ES6 規格與 MDN 的定義，來大致理解 parseInt / parseFloat / Number 三者差異。文中有解釋：為什麼 parseInt(010, 10) 的結果會是 8 的原因。
tag: javaScript
---

## 前言

最近在工作時，是使用 `Number` 去將 string 轉換為 number，這時候同事建議可以使用 `parseInt` 方法，除了能確保傳入的 type 為 string 外，也能夠指定要用「幾進位制」的方式，將 string 轉換成 number，因此在好奇心驅使下，就來稍微研究下 `parseInt` / `parseFloat` / `Number` 三者差異，順便整理成文章。

---

## parseInt(string, radix) 介紹

通常應用於「 將 string 轉換成 integer number 」，並且可透過傳入的第二個參數，控制轉換時要使用何種進位制度處理。

### 一、參數

1. `string` : 將轉換成 number 的 string。 **如果傳入的參數並非 string，其實也都會先透過 toString 轉換成 string。使用時建議都傳入 string type 不要傳入 number type，以避免預料外的狀況**（後續會介紹案例）。

2. `radix` : 將以何種進位制度轉換 string 參數，可傳入 2 - 32 的有效值。舉例而言，如果傳入 10 就是以 10 進位轉換 ; 傳入 16 就是以 16 進位轉換。**使用時建議都要傳入**，雖然在 [ES6 規格書](http://www.ecma-international.org/ecma-262/6.0/#sec-parseint-string-radix)中有提到 「 *If radix is undefined or 0, it is assumed to be 10 except when the number begins with the code unit pairs 0x or 0X, in which case a radix of 16 is assumed。 」，*但實際上還是要根據各家瀏覽器實作而定，因此建議傳入。

### 二、重點特性

1. 執行時會先確保第一個參數為 string 型別 (透過 `toString`) ，接著開始採用 radix 進位制度轉換。轉換時會從 string 開頭處理，遇到「非數字的值」後，就會結束並回傳。
2. 承上述第 1 點，因此如果 string 一開頭就為「非數字的值 ＆ 非負號 」，會直接回傳 NaN。
3. 承上述第 1 點，因此如果遇到 「 . 」 屬非數字值直接結束判斷，**回傳結果只會是 integer ，無 float**。
4. 如果 string 開頭為 0x or 0X 時，且無傳入 radix，會採用 16 進位轉換。
5. 如果傳入的是 undefined / null / 空字串 / Infinity / 完全沒傳參數，會回傳 NaN。
6. 如果傳入的是 object 且 key 為 toString , value 為 function , 會將 return 的值當做第一個參數使用，如：`parseInt({ toString: function() { return "3" } });`。

### 三、程式範例

```javascript
/* 參數僅含有數字值 */
parseInt('15', 10); // 15，採用 10 進位
parseInt('015', 10); // 15, 採用 10 進位
parseInt('015', 8); // 13, 採用 8 進位

/* 參數雖有非數字值，但開頭為 0x */
parseInt('0x15'); // 21，自動採用 16 進位

/* 參數中含有數字值與非數字值時的結果 */
parseInt('px105', 10); // NaN
parseInt('105px', 10); // 105
parseInt('1px05', 10); // 1
parseInt('10.5', 10); // 10
parseInt('10 5', 10); // 10

/* 參數為 null or undefined or '' or Infinity 的結果均為 NaN */
parseInt('', 10); // NaN
parseInt(null, 10); // NaN

/* 參數為  object 且 key 為 toString , value 為 function */
parseInt(
  {
    toString: function () {
      return '15';
    },
  },
  10
); // 15

/* 當第一參數不傳入 string type，容易發生預期外的狀況 */
parseInt(010, 10); // 可以思考看看，預期為多少？
```

### 四、預期外狀況說明

上面有提到第一個參數都建議傳入 string 型別，不然容易有奇怪的狀況發生，舉例而言就是 `parseInt(010, 10)`，第一個參數傳入 number type 的值 010 ，第二個參數傳入 10。乍看之下會預期結果應該要是 010。

But，結果會是 8 !!!

原因是第一個參數會先被 `toString()` 轉型成 string，而 **`toSting()` 會將數字 010 判斷成 8 進位且將其轉換為 10 進位** _（當沒有 `toSting()` 傳入參數，預設轉 10 進位）_，所以這時候 010 「 由 8 進位轉回 10 進位 」的結果就是 `0*8^2 + 1*8^1 + 0*8^0 = 8`。

所以 `parseInt(010, 10)` 將被轉換成 `parseInt('8', 10)` ，因而最終結果會產出 8 。

為了避免預期外的狀況，並增加可讀性，因此才會建議：

- 第一個參數傳入 string type。
- 第二個參數都要傳入。（可讀性 + 避免瀏覽器預設非 10 進位）。

---

## parseFloat (string) 介紹

通常應用於「 將含有小數點的字串，轉換為 float number 使用 」與 parseInt(string, radix) 相似，但有幾點差異：

### 一、參數

只能傳入一個 string 參數，因此預設都使用 10 進位 (decimal literal) 的模式轉換。

### 二、重點特性

與 parseInt 不同之處主要在於：

- 當將 string 轉換為 number 過程中，**如果在開頭遇到「 . 」會予以保留，並在前方補 0 ; 在中間遇到「 . 」會予以保留 ; 在結尾遇到「 . 」會移除**。
- 可以將 Infinity 轉為 Infinity。

### 三、程式範例

```javascript
parseFloat('0.1'); // 0.1
parseFloat('.1'); // 0.1
parseFloat('0.1.'); // 0.1
parseFloat(Infinity); // Infinity
parseInt({
  toString: function () {
    return '0.1';
  },
}); // 0.1
```

---

## Number(value) / Number ( [ value ] ) 介紹

可以實踐「 多種型別轉換成 integer & float number 型別 」，與 parseInt、parseFloat 比較明顯的差異在於：

1. 會自動判斷要用何種進位制度轉換，非經由參數指定，通常可透過傳入的開頭判斷，例如：`0x ⇒ 16 進位` ; `0o ⇒ 8 進位` ; `0b ⇒ 2 進位`。
2. 傳入的值如果帶有非數字值，會 NaN。除非是開頭為 '-' or '0x'。
3. 傳入 string 以外的 type 許多時候也會回隊 number type 的結果。

### 一、參數

`value` 是用來建構 Number 物件的值，結果會回傳 number type 。例如：`Number('10')` ⇒ 10 ; `Number('10.5')` ⇒ 10.5。

### 二、重點特性

1. 完全沒傳入參數 / 傳入 undefine 或 null 或空字串，皆會回傳 0 。
2. value 為 string ，且僅含有數字值，無論是 Integer 或 Float，會直接轉換成 number 型別。
3. value 為 string ，且包含非數字值且非為開頭的 '0x' (表示 16 進位)，會回傳 NaN。
4. value 為 string ，且開頭為 '0x' ，會自動使用 16 進位處理。
5. value 為 boolean ，若傳入 true 會回傳 1 ; 傳入 false 會回傳 0 。
6. value 傳入 Infinity，會回傳 Infinity。
7. value 傳入 Date 物件，會回傳 Unix 時間戳記 。

### 三、程式範例

```javascript
/* 回傳結果是 0 */
Number(undefined); // 0
Number(null); // 0
Number(''); // 0

/* 回傳結果是 NaN */
Number('10px'); // NaN

/* 回傳結果是 number 型別的值 */
Number(true); // 1
Number('10'); // 10
Number('0xf'); // 15

/* 回傳時間 Unix 戳記 */
const date = new Date('December 25, 2020 03:03:03');
Number(date); // 1608836583000

/* 各種進位結果 */
Number('0x11'); // 17，用 16 進位處理 11
Number('0o11'); // 17，用 8 進位處理 11
Number('0b11'); // 17，用 3 進位處理 11
```

---

## 使用 parseInt 抑或是 Number ?

綜合之下，如果目的是要將「 **string type 轉型為 number type** 」，會建議使用 parseInt / parseFloat，有幾個原因：

1. 如果傳入的是 string type 以外的 type 時，在 TS 下會直接報錯，在沒有 TS 下會傳回 NaN，不會產生回傳 0 或 1 等的狀況。

```javascript
parseInt(null, 10); // NaN
parseInt(true, 10); // NaN

Number(null); // 0
Number(true); // 1
```

2. 在轉換帶有單位的運算時，像是 '10px' or '5rem' 等等的運算時，可以方便地自動去除尾部單位，只保留數字值。

```javascript
const headerHeight = '60px';

/* parseInt 的寫法 */
const contentHeight1 = `
    ${100 - parseInt(headerHeight, 10)}px
`; // 40px

/* Number 的寫法 */
const contentHeight2 = `
    ${100 - Number(headerHeight.replace('px', ''))}px
`; // 40px
```

3. `parseInt` 可以很明確的指定要轉換的進位制，因此可讀性也佳。

---

## 最後總結使用 parseInt 的正確姿勢

上面其實已經有提到不少，再次總結整理使用 `parseInt(string, radix)` 比較推薦的正確姿勢。

1. **使用時，都傳入第二個參數 radix**，有兩個原因：

   - 可讀性較佳，一看就知道適用幾進位制在轉換 string。
   - 在某些瀏覽器尤其舊版的情況下，不一定預設沒傳入第二個參數時，就是 10 進位轉，可能會有預期外的結果。

2. **只傳入 string type**：上面已經提到過傳入 number type 可能會有預料外的狀況，像是 `parseInt(010, 10)` 結果會是 8。因此只將 `parseInt` 用來處理 string 是較安全的。

3. **只傳入沒有空格的 string**：主要是遇到空格，會直接結束 parsing，例如
   ```javascript
   parseInt('12 345'); // 12, not 12345
   ```
   可以透過 `parseInt(value.replace(/s+/g, ''), 10);` 等方式避免有空格出現。

以上，就是關於 parseInt vs parseFloat vs Number 的理解和整理，最後來個簡要的比較，更一目瞭然 ～

```javascript
/* 傳入 integer 字串 */
Number('111'); // 111
parseInt('111', 10); // 111 ( 10 進位)
parseInt('111', 2); // 7 ( 2 進位)
parseFloat('111'); // 111

/* 傳入 float 字串 */
Number('11.1'); // 11.1
parseInt('11.1', 10); // 11 (遇到非數字值，stop parsing)
parseInt('11.1', 2); // 3 (遇到非數字值，stop parsing)
parseFloat('11.1'); // 11.1

/* 傳入 string 結尾含有非數字的值 */
Number('111px'); // NaN
parseInt('111px', 10); // 111
parseFloat('11.1px'); // 11.1

/* 傳入含有空白的值 */
Number('11 1'); // NaN
parseInt('11 1', 10); // 11
parseFloat('1.1 1'); // 1.1

/* 傳入空字串 */
Number(''); // 0
parseInt('', 10); // NaN
parseFloat(''); // NaN

/* 傳入 undefined */
Number(undefined); // NaN
parseInt(undefined); // NaN
parseFloat(undefined); // NaN

/* 傳入 null */
Number(null); // 0
parseInt(null); // NaN
parseFloat(null); // NaN

/* 傳入 boolean */
Number(true); // 1
Number(false); // 0
parseInt(true); // NaN
parseFloat(true); // NaN

/* 傳入 Infinity */
Number(Infinity); // Infinity
parseInt(Infinity); // NaN
parseFloat(Infinity); // Infinity
```

---

#### 【 參考資料 】

- [ES6 規格書 | parseInt](http://www.ecma-international.org/ecma-262/6.0/#sec-parseint-string-radix)
- [MDN | parseInt](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/parseInt)
- [ES6 規格書 | parseFloat](http://www.ecma-international.org/ecma-262/6.0/#sec-parsefloat-string)
- [MDN | parseFloat](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/parseFloat)
- [ES6 規格書 | Number](http://www.ecma-international.org/ecma-262/6.0/#sec-number-constructor)
- [MDN | Number](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [Number() vs parseInt()](https://thisthat.dev/number-constructor-vs-parse-int/)
- [二、八、十與十六進位 (數字系統) 轉換](https://www.footmark.info/introduction-to-computer/digital-system-conversion/)
