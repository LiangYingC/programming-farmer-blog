---
title: parseInt / parseFloat / Number, Comparing Methods for Converting Strings to Numbers
date: 2020-11-29
description: Recently at work, I encountered choices between using parseInt or Number for string type conversion, so I read the ES6 specifications and MDN definitions to broadly understand the differences between parseInt / parseFloat / Number. The article explains why parseInt(010, 10) results in 8.
tag: JavaScript
---

## Introduction

Recently at work, I was using `Number` to convert strings to numbers, when a colleague suggested using the `parseInt` method. Besides ensuring the input type is a string, it also allows specifying which "base" to use when converting a string to a number. Driven by curiosity, I decided to research the differences between `parseInt` / `parseFloat` / `Number` and organize my findings into this article.

---

## parseInt(string, radix) Introduction

Commonly used for "converting a string to an integer number," and through the second parameter, you can control which numeral system to use for the conversion.

### 1. Parameters

1. `string`: The string to be converted to a number. **If the parameter passed is not a string, it will actually be converted to a string via toString. It's recommended to always pass a string type rather than a number type to avoid unexpected situations** (examples will be introduced later).

2. `radix`: Specifies which numeral system to use when converting the string parameter. Valid values range from 2 to 32. For example, passing 10 means conversion in base 10; passing 16 means conversion in base 16. **It's recommended to always specify this parameter**, although the [ES6 specification](http://www.ecma-international.org/ecma-262/6.0/#sec-parseint-string-radix) mentions that *"If radix is undefined or 0, it is assumed to be 10 except when the number begins with the code unit pairs 0x or 0X, in which case a radix of 16 is assumed."* However, the actual behavior depends on browser implementations, so it's advisable to specify it.

### 2. Key Characteristics

1. During execution, it first ensures the first parameter is a string type (through `toString`), then starts the conversion using the radix numeral system. The conversion begins from the start of the string and stops when it encounters a "non-numeric value," returning the result.
2. Following point 1, if the string starts with a "non-numeric value & non-negative sign," it immediately returns NaN.
3. Following point 1, if it encounters a "." (which is a non-numeric value), it immediately ends the evaluation. **The returned result will only be an integer, not a float**.
4. If the string starts with 0x or 0X, and no radix is specified, it will use base 16 for conversion.
5. If the input is undefined / null / empty string / Infinity / or no parameter at all, it returns NaN.
6. If the input is an object with a key 'toString' and value as a function, it will use the return value of this function as the first parameter, e.g., `parseInt({ toString: function() { return "3" } });`.

### 3. Code Examples

```javascript
/* Parameters containing only numeric values */
parseInt('15', 10); // 15, using base 10
parseInt('015', 10); // 15, using base 10
parseInt('015', 8); // 13, using base 8

/* Parameters with non-numeric values but starting with 0x */
parseInt('0x15'); // 21, automatically using base 16

/* Results when parameters contain both numeric and non-numeric values */
parseInt('px105', 10); // NaN
parseInt('105px', 10); // 105
parseInt('1px05', 10); // 1
parseInt('10.5', 10); // 10
parseInt('10 5', 10); // 10

/* Results are NaN when parameters are null or undefined or '' or Infinity */
parseInt('', 10); // NaN
parseInt(null, 10); // NaN

/* Parameter is an object with key 'toString' and value as a function */
parseInt(
  {
    toString: function () {
      return '15';
    },
  },
  10
); // 15

/* When the first parameter is not a string type, unexpected situations can occur */
parseInt(010, 10); // Can you guess the expected result?
```

### 4. Explaining Unexpected Situations

As mentioned above, it's recommended to pass a string type as the first parameter to avoid strange situations. For example, `parseInt(010, 10)`, where the first parameter is a number type with value 010, and the second parameter is 10. At first glance, one might expect the result to be 010.

But the result will be 8!!!

The reason is that the first parameter will first be converted to a string via `toString()`, and **`toString()` will interpret the number 010 as octal and convert it to decimal** _(when no parameter is passed to `toString()`, it defaults to decimal)_. So 010 "converted from octal back to decimal" results in `0*8^2 + 1*8^1 + 0*8^0 = 8`.

Thus, `parseInt(010, 10)` gets converted to `parseInt('8', 10)`, leading to a final result of 8.

To avoid unexpected situations and improve readability, it's recommended to:

- Pass a string type as the first parameter.
- Always specify the second parameter. (For readability + to avoid browser defaults other than base 10).

---

## parseFloat (string) Introduction

Commonly used for "converting strings with decimal points to float numbers." Similar to parseInt(string, radix), but with a few differences:

### 1. Parameters

Can only take one string parameter, so it always uses base 10 (decimal literal) for conversion.

### 2. Key Characteristics

Main differences from parseInt:

- When converting a string to a number, **if a "." is encountered at the beginning, it's preserved and a 0 is added in front; if it's in the middle, it's preserved; if it's at the end, it's removed**.
- Can convert Infinity to Infinity.

### 3. Code Examples

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

## Number(value) / Number ( [ value ] ) Introduction

Can implement "converting various types to integer & float number types." Notable differences from parseInt and parseFloat include:

1. Automatically determines which numeral system to use for conversion, not specified by parameters. Usually judged by the beginning of the input, e.g., `0x ⇒ base 16`; `0o ⇒ base 8`; `0b ⇒ base 2`.
2. If the input value contains non-numeric values, it returns NaN. Unless the beginning is '-' or '0x'.
3. Often returns number type results even for types other than string.

### 1. Parameters

`value` is used to construct the Number object, and the result will be of number type. For example: `Number('10')` ⇒ 10; `Number('10.5')` ⇒ 10.5.

### 2. Key Characteristics

1. No parameter at all / undefined or null or empty string, all return 0.
2. If value is a string containing only numeric values, whether Integer or Float, it directly converts to number type.
3. If value is a string containing non-numeric values and not starting with '0x' (indicating base 16), it returns NaN.
4. If value is a string starting with '0x', it automatically processes using base 16.
5. If value is boolean, true returns 1; false returns 0.
6. If value is Infinity, it returns Infinity.
7. If value is a Date object, it returns a Unix timestamp.

### 3. Code Examples

```javascript
/* Results returning 0 */
Number(undefined); // 0
Number(null); // 0
Number(''); // 0

/* Results returning NaN */
Number('10px'); // NaN

/* Results returning number type values */
Number(true); // 1
Number('10'); // 10
Number('0xf'); // 15

/* Returns Unix timestamp */
const date = new Date('December 25, 2020 03:03:03');
Number(date); // 1608836583000

/* Various base results */
Number('0x11'); // 17, processed as base 16
Number('0o11'); // 9, processed as base 8
Number('0b11'); // 3, processed as base 2
```

---

## Using parseInt or Number?

Overall, if the goal is to "**convert string type to number type**," I would recommend using parseInt / parseFloat for the following reasons:

1. If the input is not a string type, in TS it will directly report an error, and without TS it will return NaN, avoiding situations where it returns 0 or 1.

```javascript
parseInt(null, 10); // NaN
parseInt(true, 10); // NaN

Number(null); // 0
Number(true); // 1
```

2. When converting calculations with units, like '10px' or '5rem', it conveniently automatically removes the trailing unit, retaining only the numeric value.

```javascript
const headerHeight = '60px';

/* parseInt approach */
const contentHeight1 = `
    ${100 - parseInt(headerHeight, 10)}px
`; // 40px

/* Number approach */
const contentHeight2 = `
    ${100 - Number(headerHeight.replace('px', ''))}px
`; // 40px
```

3. `parseInt` can clearly specify the numeral system for conversion, improving readability.

---

## Final Summary: The Correct Way to Use parseInt

Much has been mentioned above, but to summarize once more, here are the recommended correct practices for using `parseInt(string, radix)`.

1. **Always provide the second parameter, radix** for two reasons:

   - Better readability; it's immediately clear which base is being used to convert the string.
   - In some browsers, especially older ones, the default may not always be base 10 when the second parameter is omitted, potentially leading to unexpected results.

2. **Only pass string types**: As mentioned, passing number types can lead to unexpected situations, like `parseInt(010, 10)` resulting in 8. Therefore, using `parseInt` only for strings is safer.

3. **Only pass strings without spaces**: Primarily because spaces will end the parsing, for example:
   ```javascript
   parseInt('12 345'); // 12, not 12345
   ```
   This can be avoided by using methods like `parseInt(value.replace(/s+/g, ''), 10);`.

To conclude, here's a brief comparison of parseInt vs parseFloat vs Number for a clearer understanding:

```javascript
/* Passing an integer string */
Number('111'); // 111
parseInt('111', 10); // 111 (base 10)
parseInt('111', 2); // 7 (base 2)
parseFloat('111'); // 111

/* Passing a float string */
Number('11.1'); // 11.1
parseInt('11.1', 10); // 11 (encounters non-numeric value, stops parsing)
parseInt('11.1', 2); // 3 (encounters non-numeric value, stops parsing)
parseFloat('11.1'); // 11.1

/* Passing a string ending with non-numeric values */
Number('111px'); // NaN
parseInt('111px', 10); // 111
parseFloat('11.1px'); // 11.1

/* Passing a value with spaces */
Number('11 1'); // NaN
parseInt('11 1', 10); // 11
parseFloat('1.1 1'); // 1.1

/* Passing an empty string */
Number(''); // 0
parseInt('', 10); // NaN
parseFloat(''); // NaN

/* Passing undefined */
Number(undefined); // NaN
parseInt(undefined); // NaN
```

--- 

#### References

- [ES6 ECMA Doc| parseInt](http://www.ecma-international.org/ecma-262/6.0/#sec-parseint-string-radix)
- [ES6 ECMA Doc | parseFloat](http://www.ecma-international.org/ecma-262/6.0/#sec-parsefloat-string)
- [ES6 ECMA Doc | Number](http://www.ecma-international.org/ecma-262/6.0/#sec-number-constructor)
- [MDN | parseInt](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/parseInt)
- [MDN | parseFloat](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/parseFloat)
- [MDN | Number](https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Number)
- [Number() vs parseInt()](https://thisthat.dev/number-constructor-vs-parse-int/)
- [二、八、十與十六進位 (數字系統) 轉換](https://www.footmark.info/introduction-to-computer/digital-system-conversion/)
