---
title: 淺談前端錯誤發生時的處理機制，從畫面層到監控層
date: 2023-09-30
description: 在軟體服務中，如果在錯誤發生時，有良好的錯誤處理與監控的機制，能更快速地查找問題並修復完成，藉此讓使用者困擾的時間下降、體驗更佳。軟體中的錯誤處理範圍涵蓋很大，本文主要分享關於「前端錯誤發生時的處理流程」，包含錯誤畫面的顯示(UI)、錯誤資訊的記錄(Log)、錯誤監控的警告(Alert)。
tag: Frontend Infra
---

## 前言

在軟體專案中，錯誤處理是很重要的一塊，涵蓋範圍很廣，且針對不同的產品性質也有不同的錯誤處理和監控方式。在本文分享的是「前端錯誤發生時的處理機制」，而且會偏向「泛用型」的整體概念和實作，適用於不同種類的產品。

因為近期剛好在工作專案中，有碰到部分優化前端處理錯誤的項目，包含錯誤畫面、錯誤記錄、錯誤監控等等，藉此讓**錯誤發生時**能更快地查找問題、修復問題。所以藉此機會梳理前端錯誤處理的概覽，並順道分享，讓有需要的人可以參考囉。

基本上期望能達到的目標就是有了這套「前端錯誤發生時的處理機制」後：
- 當使用者主動提供錯誤截圖後，開發團隊能更有效率地進行修復 => 對應**錯誤畫面**
- 當使用者只提供錯誤時間後，開發團隊能自行獲得更多資訊開始修復 => 對應**錯誤記錄**
- 當使用者發生錯誤時，即便沒有主動通知，開發團隊能自行開始修復 => 對應**錯誤監控**

本文主要分成以下段落：

1. 前端錯誤處理系統概覽
2. 錯誤畫面的處理
3. 錯誤紀錄的處理
4. 錯誤監控的處理
5. 總結

在錯誤畫面、錯誤紀錄、錯誤監控的章節中，都會包含詳細的「概念說明」以及簡要的「實作示範」，透過直接示範概念的實踐，讓內容更加實際些。

關於實作示範的部分，技術或工具會用到 Next.js、GCP Logging / Monitoring 以及 Slack 示範，但範例都是簡單通用的版本，所以即便沒有用過上述技術也能大方向理解怎麼做，當然也可以用其他技術工具實踐相同概念。

另外，網頁中的錯誤類型很多，這邊不多做介紹，會直接以「React error boundary」抓到的 Unexpected error 作為示範，但實作概念是可以套用到不同錯誤類型。

是說標題中有“淺談”，是因為我認為內容偏淺，比較適合「尚未實作過錯誤處理和監控的前端工程師」，如果你已經知道如何抓 Error 顯示畫面、送 Error 到 Log、跳錯誤 Error 到 Slack，那就大概不需要閱讀了哦。

我認為理解完這篇後，比較是對擴展前端的廣度，更理解全局觀，但技術不深。

總之，期望閱讀完後能夠：

**理解基本的前端錯誤處理與監控機制全貌，並大致理解能如何實作之**。

---

## 前端錯誤處理系統概覽

通常想到前端錯誤處理，會直覺認為就是發生錯誤時的「錯誤畫面」顯示而已，但如果只是這樣考量就比較侷限在單點，而非全局觀，除了畫面之外，至少還有「錯誤紀錄」、「錯誤監控」的設置，才能讓錯誤處理的流程系統更加完善，讓除錯效率變高。

通常技術實作的背後，都有個為什麼，因此先談談為什麼需要有「錯誤畫面」、「錯誤紀錄」、「錯誤監控」？

### 為什麼需要錯誤畫面

如果發生錯誤時，連錯誤畫面都沒有，那麼就會造成兩個狀況：

1. 使用者遇到功能問題，根本不知道發生什麼事，也不知道該怎麼辦
2. 使用者想要反映問題，但也無法提供任何有意義的截圖畫面

所以呢，**當使用者遇到錯誤時顯示設計好的錯誤畫面**，除了能讓使用者體驗比較好外，畫面上也需要有部分資訊，讓開發者看到錯誤截圖後，可以更快地辨別、查找、解決問題。

> 好的錯誤畫面，讓使用者看到後，知道如何行動; 讓開發者看到後，獲得除錯初步資訊。

### 為什麼需要錯誤紀錄

如果使用者連截圖都沒給，只提供一個錯誤發生時間，那該怎麼辦？

如果錯誤是跟使用者裝置或瀏覽器版本有關，光從畫面截圖是看不出來，也不好進一步詢問使用者，那該怎麼辦？

這時候，**若在錯誤發生時，有把查詢錯誤所需要的詳細資訊紀錄到某個地方**，就能解決這個問題。即便使用者只給時間，開發者也能用時間去查詢錯誤詳細資訊; 而紀錄的項目中，若有使用者的裝置或瀏覽器版本等等，也能幫助開發者有更多資訊找到可能的錯誤原因。

而通常稱呼這個紀錄資訊叫做「Log(日誌)」。大部分公司都會將 Log 送到第三方服務儲存，像是：Sentry 或 Cloud Logging 之類，除了不用維護儲存點之外，那些服務通常也附帶不錯的查詢功能，這樣才能在大量 Log 中，快速找到想要查看的錯誤 Log。

> 好的錯誤紀錄，能讓開發者快速查詢到解決問題所需要的錯誤細節。

_p.s 用第三方服務雖然不需要維護之，但通常要付錢啦，所以也需要考量成本問題，尤其 Log 量大時。_

### 為什麼需要錯誤監控

如果使用者尚未主動通知前，開發者就已經發現問題，並著手處理甚至修復之，那是不是會更有效率？

如果客戶尚未反映錯誤前，產品經理就已經知道問題，並準備好一套可以提供給客戶的完整說明，那是不是會讓客戶覺得都在可控範圍內？

這些都可以**透過設置錯誤發生時的監控警告**來達成。當有錯誤發生送進第三方服務時，可以設置特定錯誤條件的警告，發送通知到 Slack、Email 等等地方通知團隊，藉此讓團隊儘早查看錯誤 Log 並處理之，無需等到使用者反映問題才能處理。

這類錯誤監控機制，通常可以在第三方服務中設定，例如：Sentry、Cloud Monitoring。

順帶一提，錯誤監控不只能設定在 Production site，在 Staging / Dev site 也可以設置。這樣的好處是，假設上一些功能到 Staging / Dev site 時，如果有錯誤警告跳出，就可以趕緊修復，讓真實使用者不會遇到該錯誤。

> 好的錯誤監控，能化被動為主動，讓團隊提早處理錯誤。

### 為什麼「前端」需要關注錯誤處理

我認為軟體產品是由團隊負責，所以無論是團隊中的任何職能，都需要關心這個產品的錯誤狀況，只是每個職能關注的點不同，而身為前端工程師，更虛特別需要關注的是：

1. 有些錯誤發生在前端程式碼中，例如：前端元件報錯 Unexpected error (有可能是 API runtime 資料格式有誤、某些 API 不支援特定瀏覽器版本等等)。
2. 有些客戶端資訊可由前端紀錄，例如：使用者發生錯誤所在的頁面網址、詳細裝置資訊、前端 APP 版號等，部分錯誤如果有這些資訊可以更快解決。
3. 錯誤畫面需要有什麼資訊，能讓使用者體驗更好、讓開發者解決錯誤更有效率，這是涵蓋在前端錯誤處理的系統中。

而從產品的角度來看，可以思考幾個問題來確認錯誤處理是否有做好：

1. 如何讓使用者遇到錯誤後，知道發生什麼事、能做什麼？
2. 如何讓使用者遇到錯誤後，僅提供錯誤時間或截圖，團隊就有機會處理好問題？
3. 如何在發生錯誤時收到警告通知，藉此在使用者未主動反應前，團隊就能著手處理？

這些問題，如果有前端參與處理錯誤處理機制，就能更有效率地解決。

### 前端錯誤處理機制的全貌

綜合上述關於的概念，大致可以用一張圖，示意前端錯誤處理機制的全貌：

![frontend basic error system overview](/images/articles/frontend-basic-error-system/01.png)


這三個層級是彼此分離的，可以獨自存在毋須一次擁有，真實情況下，團隊都有時間、人力資源等等的考量，很多時候並非要一次到位且也沒必要，像是剛起步的新創產品何時 sunset 都不知道，無需立刻放資源完善全部。但通常在穩定獲利的完善產品中，會好好處理這三者。

整體概念圖如下：





接著會深入談談這畫面、紀錄、監控層級各自需要注意的項目，以及簡要地實踐之。

---

## 畫面層級的處理

畫面的處理是前端本職所在，錯誤畫面需要顧及兩個最主要的層面：

1. 使用者體驗：讓使用者知道發生什麼、還可以做什麼
2. 開發者體驗：讓開發者知道怎麼查錯誤

關於要讓使用者知道發生什麼事，可以透過設計不同錯誤對應在畫面上顯示的「標題」與「訊息」;而讓使用者知道還可以怎麼做，可以透過設計操作「按鈕」讓使用者更直覺地明白還可以怎麼做。

若使用者提供當下截圖給開發者，那畫面上有什麼訊息是能夠幫助開發者查詢呢？其實只要「錯誤標題」和「錯誤訊息」是設計過的（背後對應特定的 Error Code），那就能加速查詢，但如果錯誤紀錄 Log 做得好，只要有「錯誤發生時間」即可，因為有了發生時間，就能查詢到當下錯誤的所有細節藉此更快地推測和除錯。

錯誤畫面示意圖，主要是注意資訊內容，UI 細節可忽略：

![frontend error UI 1](/images/articles/frontend-basic-error-system/02.png)

*(Error Boundary Page Example)*

![frontend error UI 2](/images/articles/frontend-basic-error-system/03.png)

*(Error Modal Example)*

可以看到其中都有 **occured time**，無論錯誤標題或內容是什麼，只要有錯誤發生時間，就能進一步查詢錯誤紀錄 Log。

實作上，要做的事情有兩件：

1. 抓取錯誤：不同的錯誤類型會有不同的抓取方式，常見的有 `try catch`, `window.onerror`, `addEventListener('error', function)`, `error boundary` 等等。
2. 畫出畫面：透過前端語言框架，畫出顯示錯誤標題、內容、時間的錯誤畫面，並提供使用者操作用的按鈕。

本文中示範的是在 Next.js APP 中，透過 [React error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) 去抓取 Unexpected errors 並顯示在錯誤畫面上。

首先會製作 `ErrorBoundary` class component

```jsx
// ErrorBoundary.js file
import React from 'react'
import { connect } from 'react-redux'
import ErrorFallback from './ErrorFallback'
import { ENVIRONMENT } from '../../../../config'
import { unAuthPost } from '../../../../lib/api/request'
import { checkIsClientSide, getDeviceInfo } from '../../../../lib/general/window'

class ErrorBoundary extends React.Component {
    constructor (props) {
        super(props)
        this.state = {
            error: null,
            errorInfo: null,
            hasError: false
        }
    }

    static getDerivedStateFromError (error) {
        return { hasError: true, error }
    }

    componentDidCatch (error, errorInfo) {
        this.setState({ errorInfo })
        if (checkIsClientSide()) {
            const deviceInfo = getDeviceInfo()
            const userInfo = this.props.user
            unAuthPost(
                '/api/log',
                {
                    severity: 'CRITICAL',
                    logData: {
                        message: `EXT-${ENVIRONMENT} Unexpected Page Crash Error`,
                        pathName: window.location.pathname,
                        title: error.message,
                        stack: error.stack,
                        userName: userInfo?.name,
                        companyName: userInfo?.currentCompanyDetail?.name,
                        deviceOS: deviceInfo?.os?.name,
                        deviceType: deviceInfo?.device?.type,
                        browserName: deviceInfo?.client?.name,
                        browserVersion: deviceInfo?.client?.version,
                        timeZone: Intl?.DateTimeFormat()?.resolvedOptions()?.timeZone
                    }
                }
            )
        }
    }

    render () {
        if (this.state.hasError) {
            // You can render any custom fallback UI
            return (
                <ErrorFallback
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                    resetError={() => this.setState({
                        error: null,
                        errorInfo: null,
                        hasError: false
                    })}
                />
            )
        }
        return this.props.children
    }
}

const mapStateToProps = (state) => {
    return {
        user: state.user
    }
}

export default connect(mapStateToProps, null)(ErrorBoundary)
```

---

## 記錄層級的處理

紀錄層級顧名思義就是在錯誤發生時，把錯誤發生當下的資料記錄下來，方便後續查詢，需要注意：

- 可以紀錄瀏覽器、裝置相關資訊，例如：使用的版本或型號。因為有的錯誤只發生在特定瀏覽器或裝置。
- 可以紀錄操作者的資訊，例如：公司或使用者 id。因為有的錯誤只發生在特定客戶或使用者
- **不可以**紀錄安全性敏感的資料，例如：使用者輸入錯誤的密碼。因為使用者可能不小心輸入到在其他網站使用的密碼，紀錄下來就有嚴重的資安疑慮，並且就算是錯誤的密碼也不行，因為就更好推測出正確密碼是什麼，總之，有資安疑慮的資料需要避免紀錄。

紀錄的方式通常會是

---

## 監控層級的處理

---
