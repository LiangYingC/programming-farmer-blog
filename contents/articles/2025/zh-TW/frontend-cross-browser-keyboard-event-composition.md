---
title: 跨瀏覽器環境下，如何避免使用者在組字 (Composition) 時，按 Enter 送出不完整內容？
date: 2025-12-25
description: 當實作「按下 Enter 時送出內容」功能時，會發現在需要拼字的輸入法，如：繁體中文、日文等語系，會需避免使用者還在組字時(isComposing)就送出文字，這是需要被注意的重要細節問題。然而，在 Safari 跟 Chrome 處理的方式會不同，本文從規格和實作面，探討如何在跨瀏覽器中處理此議題。
tag: Frontend
---

## 前言：Enter 時送出輸入內容的功能，沒那麼單純

近期剛好 Review 同事 PR 時，看到「按下 Enter 時送出輸入內容」這個功能，發現忘記處理「組字時避免送出」的議題，這樣會導致需要拼字選字的語系，使用者還在組字時按下 Enter 就會直接送出，導致使用者輸入到一半就送出結果的問題發生，如下方示意：

![shoud not be sent when is composing. right stuiation](/images/articles/frontend-cross-browser-keyboard-event-composition/01.gif)
_（正常情況：組字時按下 Enter 並非送出，而是結束組字階段。組字階段結束後，按下 Enter 才會送出。）_

![shoud not be sent when is composing. bug situation](/images/articles/frontend-cross-browser-keyboard-event-composition/02.gif)
_（錯誤情況：組字時按下 Enter 直接送出結果，導致尚未輸入完全內容就被送出。）_


於是提醒他能用瀏覽器提供的 **KeyboardEvent.isComposing** API 去處理，概念上是「當使用者按下 Enter 時要先判斷若 `isComposing` 為 true，代表正在組字中，就不送出。」這時以為一切完美，殊不知後續在測試期間，**Safari 的瀏覽器還是出問題啦**。

經過查詢後處理完這個問題，因此寫篇文章來紀錄，**從零開始實踐「按下 Enter 時送出輸入框內容，並且避免在組字時送出」的這個功能**，會包含：
- 最天真的處理方式
- 透過 `isComposing` 來解決組字時被送出的問題
- 為何 Safari 還是會遇到問題？
- 如何解決 Safari 組字時送出的問題？
- Edge, Firefox 會遇到一樣的問題嗎？
- 總結，如何處理跨瀏覽器組字時被送出的問題

過程中除了會示範程式碼外，也會稍微閱讀瀏覽器約定的 composition 組字階段規格，才能理解為什麼 Safari 會有問題以及該如何解決。

---

## 最天真的處理方式：當按下 Enter 時，就送出結果

一開始聽到「按下 Enter 時就送出輸入結果」會很直覺地想到這樣的實作概念：

```javascript
/** Pseudocode */
input.addEventListener('keydown', (e) => {
    // When keydown key is Enter
    if (e.key === 'Enter') {
        // send result & clear input
        sendResult(input.value);
        input.value = '';
    }
});
```

當按下 Enter 時，就送出結果以及做任何需要的操作邏輯。如果是**沒有組字的語言不會有問題**，例如：英文。

![English content without the composition issue](/images/articles/frontend-cross-browser-keyboard-event-composition/03.gif)
_（英文沒有組字的概念，所以按下 Enter 直接送出沒有問題）_

但是，如果是有組字的語言，例如：繁體中文、日文等，就會有問題，因為**即使在組字的情況下，按下 Enter 會被送出，導致結果不完整就被送出。** 本文都會用繁體中文示範：

![shoud not be send when is composing. bug situation](/images/articles/frontend-cross-browser-keyboard-event-composition/02.gif)
_（錯誤情況，組字時按下 Enter 直接送出結果，導致尚未輸入完全內容就被送出）_

接著開始處理組字時被送出的問題。

---

## 透過 isComposing 來解決組字時被送出的問題

要解決組字時被送出的問題，概念來說，只要能判斷 **當按下 Enter 且正在組字，那就不要送出** 即可。

剛好瀏覽器規格上有提供 **KeyboardEvent.isComposing** API，讓開發者能判斷 keydown 發生時，是否正在組字階段，來閱讀 [MDN 文件內容](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing)：

> The KeyboardEvent.isComposing read-only property returns a boolean value indicating if the event is fired within a composition session, i.e., after `compositionstart` and before `compositionend`.

意思是當 `compositionstart` 發生，也就是組字階段開始，`isComposing` 會轉成 `true`；當 `compositionend` 發生，也就是組字階段結束，`isComposing` 會轉成 `false`。或者先簡單說，在 composition session 組字期間，預期 `isComposing` 會是 `true`。

`compositionstart` 與 `compositionend` 概念蠻重要，後面還會用到，但這邊先不擴展。先看實作結果：

```javascript
/** Pseudocode */
input.addEventListener('keydown', (e) => {
    // When keydown key is Enter and is not composing
    if (e.key === 'Enter' && !e.isComposing) {
        // send result & clear input
        sendResult(input.value);
        input.value = '';
    }
});
```

當加上 `!e.isComposing` 的判斷後，代表**非組字階段才會執行送出結果與清空輸入框**的邏輯。

用 Chrome 瀏覽器測試，發現一切正常：

![Chrome. isComposing right situation](/images/articles/frontend-cross-browser-keyboard-event-composition/04.gif)
_（Chrome，正確，組字時按下 Enter 不會直接送出）_

但是！如果用 Safari 測試，發現依然存在組字就送出的問題：

![Safari. isComposing bug situation](/images/articles/frontend-cross-browser-keyboard-event-composition/05.gif)
_（Safari，有誤，組字時按下 Enter 被送出不完整結果）_

Safari 又是你，好像也不意外了，接著深入查詢為什麼 Safari 會有問題。

---

## 為何 Safari 還是會遇到問題？

要探究為什麼 Safari 會有問題，需要先仔細來看剛剛寫的那段程式碼：

```javascript
/** Pseudocode */
input.addEventListener('keydown', (e) => {
    // When keydown event happened
    // keydown key is Enter and is not composing
    if (e.key === 'Enter' && !e.isComposing) {
        // send result & clear input
        sendResult(input.value);
        input.value = '';
    }
});
```

這段程式有個關鍵是「當 `keydown` 事件發生時，`isComposing` 要是 true」，否則就無法在組字狀態下阻止 Enter 送出，這是先前尚未強調的重要概念。

搭配 `isComposing` 的規格定義：「當 `compositionstart` 事件發生，`isComposing` 會轉成 `true`；當 `compositionend` 事件發生，`isComposing` 會轉成 `false`」。

上述兩者能整合為：「當 `keydown` 事件發生時，`compositionstart` 事件已經發生過，但是 `compositionend` 事件尚未發生過」，才能達成「按下 Enter 且在組字階段」的條件。

關鍵是「`keydown` **事件必須早於** `compositionend` **事件，或者反過來說**，`compositionend` **事件必須晚於** `keydown` **事件發生**」。

用流程的方式會更清晰，期望的流程是：

```javascript
// Current Chrome
【使用者按下輸入開始拼字】 ->
compositionstart 觸發，此時 isComposing 為 true ->
【使用者會看到組字時文字出現底線】

【使用者首次按下 Enter】 ->
keydown 事件觸發，key=Enter，此時 isComposing 依然為 true ->
【使用者看到輸入內容未被送出】 ->
compositionend 事件觸發，此時 isComposing 被轉為 false ->
【使用者會看到組字的底線消失】

【使用者再次按下 Enter】->
keydown 事件觸發，key=Enter，此時 isComposing 為 false ->
【使用者會看到輸入的內容被送出】Perfect!
```

把目前在 Chrome 輸入「讚」這個中文字時，相關的 Event Log 出來觀察，會是正確的結果:

![Chrome. keydown and composition event log](/images/articles/frontend-cross-browser-keyboard-event-composition/06.png)
_（Chrome 正確行為，印出 keydown 和 composition 的 Event Log 觀察）_

可以確實地發現 `compositionend` 事件，確實在 `keydown` 事件後才觸發。

當首次按下 Enter 時，先觸發 `keydown`，此時的 `isComposing` 還是 `true`，因此不會送出尚在組字階段的結果([5]行)，其後觸發 `compositionend` 才會將 `isComposing` 轉成 `false`([6]行)。接著再按下第二次 Enter，才會真正地送出組字完成的結果([7]與[8]行)，所以是期待的正確結果。

但是，在 Safari 中會如何呢？直接實測，在 Safari 瀏覽器同樣輸入「讚」這個中文字，印出相關的 Event Log 結果是：

![Safari. keydown and composition event log](/images/articles/frontend-cross-browser-keyboard-event-composition/07.png)
_（Safari 有誤行為，印出 keydown 和 composition 的 Event Log 觀察）_

結果發現 `compositionend` 事件，早於 `keydown` 事件就觸發了！

當首次按下 Enter 時，`compositionend` 會先觸發([5]行)，此時 `isComposing` 就被轉成 `false`，接著才會是 `keydown` Enter 事件發生([6]行)，由於 `isComposing` 已經是 `false`，所以結果直接被送出了。亦即**從使用者角度來看，組字階段按下 Enter 時，內容會直接被送出**。

```javascript
// Current Safari
【使用者按下輸入開始拼字】 → 
compositionstart 觸發，此時 isComposing 為 true ->
【使用者會看到組字時文字出現底線】

【使用者首次按下 Enter】 ->
compositionend 事件先觸發，此時 isComposing 被轉為 false ->
keydown 事件後觸發，key=Enter，此時 isComposing 已是 false ->
【使用者會看到組字中的內容被送出】Bad!
```

從 W3C [3.8.5. Key Events During Composition](https://w3c.github.io/uievents/#events-composition-key-events) 規格來看，其中是有提到 `keydown` 事件的順序需要早於 `compositionend` 事件。因此 Chrome 的實作更吻合，Safari 反而不合理：

![W3C Key Events During Composition Document](/images/articles/frontend-cross-browser-keyboard-event-composition/08.png)
_（W3C Key Events During Composition Document）_

至此已經大致了解為什麼在 Safari 中無法直接透過 KeyboardEvent.isComposing API 簡單地達成組字時按下 Enter 不送出的需求。

主要是**由於 Safari 在 Composition 關鍵事件的實作順序不同，理論上 `keydown` 事件要在 `compositionend` 事件前觸發，但是 Safari 實作成 `compositionend` 早於 `keydown` 觸發，於是在 Enter `keydown` 事件發生時，組字狀態 `isComposing` 預先被轉成 `false` 了，自然無法阻擋送出**。

在 Webkit Bugzilla 中的 [The event order of keydown/keyup events and composition events are wrong on macOS](https://bugs.webkit.org/show_bug.cgi?id=165004) Issue 中也有相關說明，看起來確實還沒修正。

---

## 如何解決 Safari 組字時送出的問題？

既然已經知道問題的成因，就有辦法來尋找解法。

Safari 的核心問題是「`compositionend` 事件觸發時，已經先把 `isComposing` 轉成 `false`，接著才觸發 `keydown` 事件」，因此只要能自行維護一個狀態 `isComposingSafe` 並滿足以下條件：
- 在 `compositionstart` 事件觸發時，`isComposingSafe` 設為 `true`
- 在 `compositionend` 事件觸發時，`isComposingSafe` 仍為 `true`
- 在 `keydown` 事件觸發時，`isComposingSafe` 仍維持 `true`。關鍵是**在當前事件循環中**，`isComposingSafe` 仍維持 `true`。
- 在 `keydown` 事件觸發後，於**下一個事件循環時**，`isComposingSafe` 才轉為 `false`

透過 `setTimeout(fn, 0)` 就能達成上述目標，讓 `isComposingSafe` 的狀態變化延遲到下一個事件循環，程式碼概念如下：

```javascript
/** Pseudocode */

// isComposing state maintained by ourself to resolve Safari bug
let isComposingSafe = false; 

// When compositionstart event happened
input.addEventListener('compositionstart', (e) => {
    // set isComposingSafe to true when composition starts
    isComposingSafe = true;
});

// When compositionend event happened
input.addEventListener('compositionend', (e) => {
    // use setTimeout to delay setting false until "next event loop"
    // this keeps isComposingSafe true during keydown event (current event loop)
    // and sets it false only after keydown completes (next event loop)
    setTimeout(() => {
        isComposingSafe = false;
    }, 0)
});

// When keydown event happened
input.addEventListener('keydown', (e) => {
    // keydown key is Enter and is 
    // not native composing and 
    // not our state composing
    if (e.key === 'Enter' && !e.isComposing && !isComposingSafe) {
        // send result & clear input
        sendResult(input.value);
        input.value = '';
    }
});
```

是說這段要先知道 Event Loop 的概念才行，如果忘記其概念，可再次閱讀 [透過程式範例，熟悉 JS 執行流程的關鍵：Event Loop](/articles/2021/javascript-browser-event-loop)複習。

接著，在 Safari 中印出相關 Event Log，觀察原生的 `isComposing` 與自定義的 `isComposingSafe` 結果為何：

![Safari. keydown and composition event log with isComposingSafe state](/images/articles/frontend-cross-browser-keyboard-event-composition/09.png)
_（Safari，印出 isComposing 和 isComposingSafe 觀察）_

能發現行為上是：
- 第一次 Enter 時，`isComposingSafe` 依然為 `true`，有成功阻止組字時就送出內容。
- 第二次 Enter 時，`isComposingSafe` 已正確被轉成 `false` 囉，所以有正確送出結果。

透過這個方法，確實解決 Safari 在組字時按下 Enter 就直接送出內容的問題。

我這邊都是用 JS 的程式碼示範，但其實應用到現代前端框架概念也相同，重點是自己控管 `isComposingSafe` 的狀態即可。

e.g. React 的程式碼範例，提供參考：

```javascript
// Implementing custom hook to handle it

import { useRef, useCallback } from 'react';
import type { CompositionEvent, KeyboardEvent } from 'react';

/**
 * Hook to resolve Safari's keyboard.isComposing issues.
 *
 * Use this with keydown events you want to listen to, such as Enter key.
 *
 * ```tsx
 * const { onCompositionStart, onCompositionEnd, getIsComposing } = useSafeKeyboardCompositionEvent();
 *
 * <input
 *   onCompositionStart={onCompositionStart}
 *   onCompositionEnd={onCompositionEnd}
 *   onKeyDown={(e) => {
 *     if (e.key === 'Enter' && !getIsComposing(e)) {
 *       onSubmit();
 *     }
 *   }}
 * />
 */

export default function useSafeKeyboardCompositionEvent() {
  /** 
  * Custom safe isComposing state
  */
  const isComposingRef = useRef(false);

  /**
   * Composition start event handler
   */
  const onCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  /**
   * Composition end event handler
   */
  const onCompositionEnd = useCallback(() => {
    // Delay resetting to keep isComposing true during keydown event
    // Even if compositionend fires before keydown (Safari bug)
    setTimeout(() => {
      isComposingRef.current = false;
    }, 0);
  }, []);

  /**
   * Check if currently composing
   */
  const getIsComposing = useCallback(
    (e: KeyboardEvent<HTMLElement>): boolean => e.nativeEvent.isComposing || isComposingRef.current,
    [],
  );

  return {
    onCompositionStart,
    onCompositionEnd,
    getIsComposing,
    isComposingRef,
  };
}
```

其實有另一招能解決這個問題，就是利用 **keyCode 229**，因為大多瀏覽器會在組字期間，將 `keyCode` 設置為 229，因此可以寫這樣：

```javascript
input.addEventListener('keydown', (e) => {
    // Check: key is Enter, not composing, and keyCode is not 229
    if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
        sendResult(input.value);
        input.value = '';
    }
});
```

不過呢，因為 `keyCode` 已邁入 deprecated ([MDN keyCode deprecated](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/keyCode))，未來瀏覽器可能移除支援，所以就先不推薦這樣做。

--- 

## Edge, Firefox 會遇到一樣的問題嗎？

既然已經看過 Chrome 與 Safari，那麼 Edge 與 Firefox 會是如何呢？

可以同樣輸入中文字「讚」，並且觀察相關 Event Log 來試試。

首先看看 Edge 瀏覽器，實測後事件順序和結果與 Chrome 相同：

![Edge. keydown and composition event log](/images/articles/frontend-cross-browser-keyboard-event-composition/10.png)
_（Edge，印出 keydown 和 composition 相關的 Event Log）_

確實是先 `keydown` 事件 e.key=Enter 發生([5]行)，接著才觸發 `compositionend` 事件組字結束([6]行)，事件順序符合預期，所以不會有問題。從使用者角度來看，就是按下第一次 Enter 時組字狀態結束，按下第二次 Enter 時才送出結果，符合預期。

至於 Firefox 稍微特別一點，與 Chrome 不同之處在於 key 不同：

![Firefox. keydown and composition event log](/images/articles/frontend-cross-browser-keyboard-event-composition/11.png)
_（Firefox，印出 keydown 和 composition 相關的 Event Log）_

可以從圖中看出我特別標記「第一次按下 Enter」和「第二次按下 Enter」的地方，比較有趣的是 Firefox 在組字階段時，會將 event key 轉成 `Process`，因此第一次按下 Enter 時，key 還是 `Process` 而非 `Enter`，然後在第二次按下 Enter 時，key 才真正地印出 `Enter`。

所以我在此才將其標示清楚，標示清楚後可以發現 Firefox 的 event 順序是和 Chrome 類似，都是「第一次 Enter 時先觸發 `keydown` 事件，接著才觸發 `compositionend` 事件」，只是差異在 event key 不同而已。

以結論來說也同樣不會有問題，從使用者角度來看，就是按下第一次 Enter 時組字狀態結束，按下第二次 Enter 時才送出結果，符合預期。

---

## 總結，如何處理跨瀏覽器組字時被送出的問題

文章最後，來總結「如何處理跨瀏覽器組字時被送出的問題」。

首先呢，不要傻傻地只用 event key 是否為 Enter 判斷是否送出內容，而是除了「Enter 時送出內容」外，還要考量「**組字時按下 Enter 不能送出內容**」。

再來就要考量 Application 的應用場景，假如完全不想支援 Safari 瀏覽器，那麼大部分的情況下，可以直接用 [KeyboardEvent.isComposing](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing) 這個 API 處理就好，至少在 Chrome, Edge, Firefox 瀏覽器目前實測都 ok，以 JS 來說可以這樣寫，其他前端框架概念相同語法不同而已：

```javascript
/** Pseudocode */
input.addEventListener('keydown', (e) => {
    // When keydown event happened
    // keydown key is Enter and is not composing
    if (e.key === 'Enter' && !e.isComposing) {
        // send result & clear input
        sendResult(input.value);
        input.value = '';
    }
});
```

不過如果想要兼容 Safari 瀏覽器，那就要處理 **Safari 的 Composition 事件順序不符合 W3C 規範** 的問題，如果單純依賴 `e.isComposing` 是無法解決，於是有兩種解決方案。

### 推薦的解決方案

為了確保跨瀏覽器都能正常運作，**推薦的做法是自行維護 `isComposingSafe` 狀態**：

```javascript
/** Pseudocode */
let isComposingSafe = false;

input.addEventListener('compositionstart', () => {
    isComposingSafe = true;
});

input.addEventListener('compositionend', () => {
    setTimeout(() => {
        isComposingSafe = false;
    }, 0);
});

input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.isComposing && !isComposingSafe) {
        sendResult(input.value);
        input.value = '';
    }
});
```

這個做法的關鍵在於：
- 透過 `compositionstart` 和 `compositionend` 自己掌握組字狀態
- 利用 `setTimeout(fn, 0)` 讓 `isComposingSafe` 在**下一個事件循環**才轉 `false`
- 這樣即使 Safari 的 `compositionend` 提早觸發，`isComposingSafe` 在 `keydown` 事件發生時依然是 `true`，成功阻擋送出

同時保留 `!e.isComposing` 的判斷，確保在其他瀏覽器也能正常運作。

是說如果不想自己解決應也有套件可用，可以問問 AI 或者自行查詢，但如果需求單純也可以直接實作就好。

### 短期解決方案

還有另一種解法是利用 `keyCode` 等於 229 的作法，主要是 Safari 瀏覽器也會在組字階段時，將 `keyCode` 轉為 229，所以就能加個條件阻擋即可：

```javascript
......

if (e.key === 'Enter' && !e.isComposing && e.keyCode !== 229) {
    // send result & clear input
        sendResult(input.value);
        input.value = '';
}

......
```

這個方法程式碼簡單很多，但因為 `keyCode` 已被標記為 deprecated，未來可能移除支援，所以不太推薦長期使用。如果是快速 Prototype 或短期專案，倒是可以考慮這個簡單做法。

### 延伸分享

在處理這個議題時，會觀察到相對其他議題，這個議題的英文文章不多，我想有可能是因為使用英文語系的開發者，相對來說不會遇到組字狀態的問題，畢竟英文沒有這個情況，反而是查到不少日文文章，想必韓文、中文文章應該也不少，總之趁著這個機會，多貢獻一篇繁體中文文章也蠻好的。

是說可以試試看平常在用的 Application 放到 Safari 上打繁體中文時，會不會在組字時按下 Enter 就被送出，或許會意外地發現，哦，沒想到他們會有這個 Bug 呢！畢竟有 Application 測試時可能只用英文囉，或者根本不打算支援 Safari 也是有可能啦ＸＤ

像是 Figma 的 Comment 就能遇到這個問題：

![Figma Comment Safari Composition Bug](/images/articles/frontend-cross-browser-keyboard-event-composition/12.png)
_（Figma 的評論，如果用 Safari 在組字狀態時，按下 Enter 會直接被送出啊）_

期待 Safari 某日會修掉這個問題吧！

---

## 參考資料

- [MDN - KeyboardEvent.isComposing](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/isComposing)
- [W3C UI Events - Key Events During Composition](https://w3c.github.io/uievents/#events-composition-key-events)
- [WebKit Bugzilla - The event order of keydown/keyup events and composition events are wrong on macOS](https://bugs.webkit.org/show_bug.cgi?id=165004)
- [Understanding Composition Browser Events](https://developer.squareup.com/blog/understanding-composition-browser-events/)
- [SafariでIME確定時のEnterを上手く制御できなかった話](https://zenn.dev/spacemarket/articles/149aa284ef7b08)
- [IME（全角）入力におけるjsイベント現状調査](https://qiita.com/darai0512/items/fac4f166c23bf2075deb)
- [透過程式範例，熟悉 JS 執行流程的關鍵：Event Loop](/articles/2021/javascript-browser-event-loop)
- Claude Opus4.5 協助校稿
