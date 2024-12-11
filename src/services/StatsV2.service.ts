import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'
import syveApi from '../apis/SyveApi.js'
import dexScreenerApi from '../apis/DexScreenerApi.js'
import { sleep } from '../utils/utils.js'

export interface ISignalStats {
    message: IMessageFromTelegramSignal
    signalData: ISignalData
}

export interface IMessageFromTelegramSignal {
    details: {
        tokenId?: string
        price?: number
        lastBuyDate?: string
        lastBuyTime?: number
        tradersBoughtCount: number
        tradersBoughtTextArr: string[]
        tradersAddresses: string[]
    }
    id: number
    type: string
    date: string
    date_unixtime: string
    from: string
    from_id: string
    text: string
    text_entities: Array<any>
}

export interface ITelegramSignals {
    name: string
    type: string
    id: string
    messages: IMessageFromTelegramSignal[]
}

export interface IGetCandlesResponse {
    code: string
    data: {
        candles: {
            close: number
            high: number
            low: number
            open: number
            time: number
            volume: number
        }[]
        oldestTs: string
        symbol: string
        version: number
    }
}

export interface ISignalData {
    pairAddress: string
    dayCandles: IGetCandlesResponse
    minuteCandles: IGetCandlesResponse
    worstBuyPrice: number
    goodBuyPrice: number
    highestPrice: number
}

export class StatsV2Service {
    telegramSignalsFilePath: string
    signalsStatsFilePath: string

    constructor() {
        this.telegramSignalsFilePath = path.join(
            path.resolve(),
            'diff',
            'chatHistory.json'
        )
        this.signalsStatsFilePath = path.join(
            path.resolve(),
            'diff',
            'signalsStats.txt'
        )
    }

    async getStatsAndWriteToFile({
        telegramSignals,
        dexToolsPage,
        browser,
    }: {
        telegramSignals: ITelegramSignals
        dexToolsPage: puppeteer.Page
        browser: puppeteer.Browser
    }) {
        for (const message of telegramSignals.messages) {
            try {
                // Получить все возможные данные и записать в переменную
                const { signalData } = await this.#getAllDataForSignal({
                    message,
                    browser,
                    dexToolsPage,
                })

                console.log(message, signalData)

                const dataToWrite = { message, signalData }

                fs.appendFileSync(
                    this.signalsStatsFilePath,
                    JSON.stringify(dataToWrite, null, 2) + '\n******'
                )
            } catch (error) {
                console.log(
                    'Error in handling message inside for cycle' + error
                )

                await sleep(10000)
            }

            await sleep(10000)
        }
    }

    readSignalsStatsFromFile() {
        const text = String(fs.readFileSync(this.signalsStatsFilePath))
        const signalsStats: {
            message: IMessageFromTelegramSignal
            signalData: ISignalData
        }[] = []
        text.split('******').forEach((el) => {
            el.trim()

            let parsed
            try {
                parsed = JSON.parse(el)
            } catch (error) {}

            try {
                parsed.message.details.tradersAddresses = []

                for (const text of parsed.message.details
                    .tradersBoughtTextArr) {
                    const address = text.split('\n')[0].slice(15)

                    parsed.message.details.tradersAddresses.push(address)
                }
            } catch (error) {}

            if (parsed) {
                signalsStats.push(parsed)
            }
        })

        return signalsStats
    }

    async launchBrowser({ headless = true }): Promise<puppeteer.Browser> {
        const browser = await puppeteer.launch({ headless })
        return browser
    }

    async createDexToolsPage({
        browser,
    }: {
        browser: puppeteer.Browser
    }): Promise<puppeteer.Page> {
        const page = await browser.newPage()

        await page.goto(
            'https://www.dextools.io/app/ru/ether/pair-explorer/0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
        )

        return page
    }

    #calcTokenHighestPriceAfterSignal({
        dayCandles,
        messageTime,
    }: {
        dayCandles: IGetCandlesResponse
        messageTime: string
    }) {
        const msgTime = Number(messageTime) * 1000
        let candlesToDelete = 0

        for (const candle of dayCandles.data.candles) {
            if (candle.time < msgTime) {
                candlesToDelete++
            }
        }

        candlesToDelete--

        if (candlesToDelete < 0) {
            candlesToDelete = 0
        }

        const noBadDayCandles = dayCandles.data.candles.slice(candlesToDelete)

        const heights = []
        for (const candle of noBadDayCandles) {
            heights.push(candle.high)
        }

        return Math.max(...heights)
    }

    calcStats({ signalsStats }: { signalsStats: ISignalStats[] }) {
        const errCounters = { forCycleErr: 0 }
        const stats = []
        const walletStats: any = {}
        const signalsProfitBlank = {
            20: 0,
            50: 0,
            100: 0,
            300: 0,
            500: 0,
            1000: 0,
            more: 0,
            averageProfit: 0,
            totalProfit: 0,
            profitsCounter: 0,
            moreArr: [0],
        }
        const signalsProfit = {
            byWorstPrice: Object.assign({}, signalsProfitBlank),
            byMyPrice: Object.assign({}, signalsProfitBlank),
            byGoodPrice: Object.assign({}, signalsProfitBlank),
        }

        for (const signalStats of signalsStats) {
            try {
                const goodWallets = [
                    '0x0D260D8aD1CCAe73f0d53BE60Ff6Aa6ed94A01FC',
                    '0x1071316b698da9947b2F267A02fD77e17ef2Fb5b',
                    '0x2e120B2626f32fc10b1E7f3576cb17b28eDBFaC3',
                    // '0x31b47c9b70F6ed771457b99eD92585938e2C43cF',
                    '0x37e38E229ecEBBf9a6F4B8479B71508Ece16D597',
                    // '0x3e57efEf507b4db7aCFa2eE79CeCA6B19e18D106',
                    '0x3eB81b24F5c89fe0119998bb8772413D32fEC77C',
                    '0x5c1Ef9FDF2dC91eA2eFD2F21cD2AC24A243FDAF3',
                    '0x6cdD2717F39E75808eeFE90B09065Cbaf392d504',
                    '0x717B882A78cB7bFAa53305769f67C65b6b1B5375',
                    // '0x772f0bB499aD06490f988359b5a1dF96ac32b9E2',
                    '0xB37FC112feBaE7a0c86A2564D6D85E8DD3ee7ee7',
                ]

                // CalcTokenHighestPrice
                const tokenHighestPrice =
                    this.#calcTokenHighestPriceAfterSignal({
                        dayCandles: signalStats.signalData.dayCandles,
                        messageTime: signalStats.message.date_unixtime,
                    })
                const myPrice = signalStats.message.details.price ?? 0
                const worstBuyPrice = signalStats.signalData.worstBuyPrice
                const goodBuyPrice = signalStats.signalData.goodBuyPrice
                const myBuyTime =
                    Number(signalStats.message.date_unixtime) * 1000
                const lastWhaleBuyTime =
                    signalStats.message.details.lastBuyTime ?? 0

                const whalesCount =
                    signalStats.message.details.tradersBoughtCount

                signalStats.message.details.tradersAddresses.forEach(
                    (address) => {
                        if (!walletStats[address]) {
                            walletStats[address] = Object.assign(
                                {},
                                signalsProfitBlank
                            )
                        }
                    }
                )

                // if (whalesCount < 3) {
                //     continue
                // }

                // if (signalStats.signalData.dayCandles.data.candles.length < 2) {
                //     continue
                // }

                let isGoodTradedTraded = false
                for (const iterator of signalStats.message.details
                    .tradersAddresses) {
                    if (goodWallets.includes(iterator)) {
                        isGoodTradedTraded = true
                    }
                }

                if (!isGoodTradedTraded) {
                    continue
                }

                const dataToReturn = {
                    name: signalStats.message.details.tokenId,
                    whalesCount,
                    tokenHighestPrice,
                    goodBuyPrice,
                    worstBuyPrice,
                    myPrice,
                    worstBuyPriceHigherThanGood:
                        (worstBuyPrice / goodBuyPrice) * 100 - 100,
                    worstBuyPriceHigherThanMyPrice:
                        (worstBuyPrice / myPrice) * 100 - 100,
                    myBuyTimeLaterThanLastWhale:
                        lastWhaleBuyTime === 0
                            ? 'Unknown'
                            : myBuyTime - lastWhaleBuyTime,
                    tokenHighestPriceMoreThanWorst:
                        (tokenHighestPrice / worstBuyPrice) * 100 - 100,
                    tokenHighestPriceMoreThanMyPrice:
                        (tokenHighestPrice / myPrice) * 100 - 100,
                    tokenHighestPriceMoreThanGoodPrice:
                        (tokenHighestPrice / goodBuyPrice) * 100 - 100,
                }

                signalsProfit.byGoodPrice.totalProfit +=
                    dataToReturn.tokenHighestPriceMoreThanGoodPrice
                signalsProfit.byMyPrice.totalProfit +=
                    dataToReturn.tokenHighestPriceMoreThanMyPrice
                signalsProfit.byWorstPrice.totalProfit +=
                    dataToReturn.tokenHighestPriceMoreThanWorst

                signalsProfit.byGoodPrice.profitsCounter++
                signalsProfit.byMyPrice.profitsCounter++
                signalsProfit.byWorstPrice.profitsCounter++

                if (dataToReturn.tokenHighestPriceMoreThanGoodPrice < 20) {
                    signalsProfit.byGoodPrice[20]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanGoodPrice < 50
                ) {
                    signalsProfit.byGoodPrice[50]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanGoodPrice < 100
                ) {
                    signalsProfit.byGoodPrice[100]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanGoodPrice < 300
                ) {
                    signalsProfit.byGoodPrice[300]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanGoodPrice < 500
                ) {
                    signalsProfit.byGoodPrice[500]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanGoodPrice < 1000
                ) {
                    signalsProfit.byGoodPrice[1000]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanGoodPrice > 1000
                ) {
                    signalsProfit.byGoodPrice.more++
                    signalsProfit.byGoodPrice.moreArr.push(
                        dataToReturn.tokenHighestPriceMoreThanGoodPrice
                    )
                }

                if (dataToReturn.tokenHighestPriceMoreThanMyPrice < 20) {
                    signalsProfit.byMyPrice[20]++
                } else if (dataToReturn.tokenHighestPriceMoreThanMyPrice < 50) {
                    signalsProfit.byMyPrice[50]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanMyPrice < 100
                ) {
                    signalsProfit.byMyPrice[100]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanMyPrice < 300
                ) {
                    signalsProfit.byMyPrice[300]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanMyPrice < 500
                ) {
                    signalsProfit.byMyPrice[500]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanMyPrice < 1000
                ) {
                    signalsProfit.byMyPrice[1000]++
                } else if (
                    dataToReturn.tokenHighestPriceMoreThanMyPrice > 1000
                ) {
                    signalsProfit.byMyPrice.more++
                    signalsProfit.byMyPrice.moreArr.push(
                        dataToReturn.tokenHighestPriceMoreThanMyPrice
                    )
                }

                if (dataToReturn.tokenHighestPriceMoreThanWorst < 20) {
                    signalsProfit.byWorstPrice[20]++
                    signalStats.message.details.tradersAddresses.forEach(
                        (address) => {
                            walletStats[address][20]++
                        }
                    )
                } else if (dataToReturn.tokenHighestPriceMoreThanWorst < 50) {
                    signalsProfit.byWorstPrice[50]++
                    signalStats.message.details.tradersAddresses.forEach(
                        (address) => {
                            walletStats[address][50]++
                        }
                    )
                } else if (dataToReturn.tokenHighestPriceMoreThanWorst < 100) {
                    signalsProfit.byWorstPrice[100]++
                    signalStats.message.details.tradersAddresses.forEach(
                        (address) => {
                            walletStats[address][100]++
                        }
                    )
                } else if (dataToReturn.tokenHighestPriceMoreThanWorst < 300) {
                    signalsProfit.byWorstPrice[300]++
                    signalStats.message.details.tradersAddresses.forEach(
                        (address) => {
                            walletStats[address][300]++
                        }
                    )
                } else if (dataToReturn.tokenHighestPriceMoreThanWorst < 500) {
                    signalsProfit.byWorstPrice[500]++
                    signalStats.message.details.tradersAddresses.forEach(
                        (address) => {
                            walletStats[address][500]++
                        }
                    )
                } else if (dataToReturn.tokenHighestPriceMoreThanWorst < 1000) {
                    signalsProfit.byWorstPrice[1000]++
                    signalStats.message.details.tradersAddresses.forEach(
                        (address) => {
                            walletStats[address][1000]++
                        }
                    )
                } else if (dataToReturn.tokenHighestPriceMoreThanWorst > 1000) {
                    signalsProfit.byWorstPrice.more++
                    signalsProfit.byWorstPrice.moreArr.push(
                        dataToReturn.tokenHighestPriceMoreThanWorst
                    )
                    signalStats.message.details.tradersAddresses.forEach(
                        (address) => {
                            walletStats[address].more++
                        }
                    )
                }

                signalStats.message.details.tradersAddresses.forEach(
                    (address) => {
                        walletStats[address].totalProfit +=
                            dataToReturn.tokenHighestPriceMoreThanWorst
                        walletStats[address].profitsCounter++
                    }
                )

                stats.push({ signalStats, stats: dataToReturn })
            } catch (error) {
                console.log(error)
                errCounters.forCycleErr++
            }
        }

        signalsProfit.byGoodPrice.averageProfit =
            signalsProfit.byGoodPrice.totalProfit /
            signalsProfit.byGoodPrice.profitsCounter
        signalsProfit.byMyPrice.averageProfit =
            signalsProfit.byMyPrice.totalProfit /
            signalsProfit.byMyPrice.profitsCounter
        signalsProfit.byWorstPrice.averageProfit =
            signalsProfit.byWorstPrice.totalProfit /
            signalsProfit.byWorstPrice.profitsCounter

        for (const key in walletStats) {
            walletStats[key].averageProfit =
                walletStats[key].totalProfit / walletStats[key].profitsCounter
        }

        console.log(stats)
        console.log(signalsProfit)
        console.log(walletStats)
    }

    // Плохо возвращает дневки
    async getHistoryCandles({
        page,
        res, // 1m 5m 15m 30m 1d
        pair,
        ts, // Примет new Date('2023-11-20T07:30') и вернет именно для этого времени нулевую свечу
    }: {
        page: puppeteer.Page
        res: string
        pair: string
        ts: number
    }): Promise<{ historyCandles: IGetCandlesResponse }> {
        await page.setExtraHTTPHeaders({
            'user-agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'upgrade-insecure-requests': '1',
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'accept-encoding': 'gzip, deflate, br',
            'accept-language': 'en-US,en;q=0.9,en;q=0.8',
        })

        const url = new URL(
            'https://www.dextools.io/chain-ethereum/api/generic/history/candles/v3?sym=usd&span=month&timezone=3'
        )

        url.searchParams.append('res', res)
        url.searchParams.append('pair', pair.toLowerCase())
        url.searchParams.append('ts', String(ts))

        await page.bringToFront()

        await sleep(3000)
        await page.waitForSelector('body')

        const historyCandles = await page.evaluate(async (url) => {
            try {
                const res = await fetch(url)
                const resJson = await res.json()

                return resJson
            } catch (error) {
                return error
            }
        }, url)

        if (
            historyCandles.__proro__ === Error.prototype ||
            historyCandles.code !== 'OK'
        ) {
            console.log('historyCandles', historyCandles)

            throw new Error('Cant get candles', historyCandles)
        }

        return { historyCandles }
    }

    // Better not to use
    async getLatestCandles({
        page,
        latest, // 1m 5m 15m 30m 1d
        pair,
    }: {
        page: puppeteer.Page
        latest: string
        pair: string
    }): Promise<{ latestCandles: IGetCandlesResponse }> {
        const url = new URL(
            'https://www.dextools.io/chain-ethereum/api/generic/history/candles/v3?sym=usd&timezone=3'
        )

        url.searchParams.append('latest', latest)
        url.searchParams.append('pair', pair.toLowerCase())

        await page.bringToFront()

        await sleep(300)

        const latestCandles = await page.evaluate(async (url) => {
            try {
                const res = await fetch(url)
                const resJson = await res.json()

                return resJson
            } catch (error) {
                return error
            }
        }, url)

        if (
            latestCandles.__proro__ === Error.prototype ||
            latestCandles.code !== 'OK'
        ) {
            console.log('latestCandles', latestCandles)

            throw new Error('Cant get candles', latestCandles)
        }

        return { latestCandles }
    }

    parseTelegramSignalsFromFile(): ITelegramSignals {
        const text = String(fs.readFileSync(this.telegramSignalsFilePath))
        try {
            const json: ITelegramSignals = JSON.parse(text)
            const details = {}

            for (const signal of json.messages) {
                this.#addDetailsFromMessage({ signal })
            }

            return json
        } catch (error) {
            throw new Error('Cant parse file with signals' + error)
        }
    }

    #addDetailsFromMessage({ signal }: { signal: IMessageFromTelegramSignal }) {
        let splittedOnBodyAndBuyers
        try {
            splittedOnBodyAndBuyers = signal.text.split('\n\n')
        } catch (error) {
            return
        }

        const body = splittedOnBodyAndBuyers.shift()
        const bodySplitted = body?.split('\n')
        let tradersBoughtTextArr = splittedOnBodyAndBuyers

        const detailsToAdd = {
            tokenId: '',
            price: 0,
            lastBuyDate: '',
            lastBuyTime: 0,
            tradersBoughtTextArr,
            tradersBoughtCount: tradersBoughtTextArr.length,
            tradersAddresses: [],
        }

        detailsToAdd.tokenId = bodySplitted?.[1].toLowerCase() ?? ''

        let price = bodySplitted?.[3] ?? ''
        if (price !== '') {
            detailsToAdd.price = Number(price.match(/[\d.]/g)?.join(''))
        }

        let dateFromtext = bodySplitted?.[bodySplitted?.length - 1] ?? ''
        const indexOfFirstDigit = dateFromtext.indexOf(
            dateFromtext.match(/[\d]/)?.join('') ?? ''
        )
        let dateText = dateFromtext.slice(indexOfFirstDigit, -3)
        const date = new Date(dateText)
        detailsToAdd.lastBuyDate = dateText
        detailsToAdd.lastBuyTime = date.getTime()

        signal.details = detailsToAdd
    }

    async #getAllDataForSignal({
        message,
        browser,
        dexToolsPage,
    }: {
        message: IMessageFromTelegramSignal
        browser: puppeteer.Browser
        dexToolsPage: puppeteer.Page
    }) {
        // Получить цену хорошую и плохую

        let signalData

        try {
            if (!message.details.tokenId) {
                throw new Error('Token id not found')
            }

            const { pairAddress } = await this.getPairAddress({
                browser,
                tokenId: message.details.tokenId,
            })
            console.log('Pair address Ive got', pairAddress)

            const { historyCandles: dayCandles } = await this.getHistoryCandles(
                {
                    pair: pairAddress,
                    page: dexToolsPage,
                    res: '1d',
                    ts: new Date().getTime() - 14 * 24 * 60 * 60 * 1000,
                }
            )

            await sleep(1000)

            const highestPrice = dayCandles.data.candles.reduce(
                (prev, curr) => {
                    const max = Math.max(prev.high, curr.high)

                    if (max === prev.high) {
                        return prev
                    } else {
                        return curr
                    }
                },
                dayCandles.data.candles[0]
            ).high

            const { historyCandles: minuteCandles } =
                await this.getHistoryCandles({
                    pair: pairAddress,
                    page: dexToolsPage,
                    res: '1m',
                    ts: Number(message.date_unixtime) * 1000,
                })

            signalData = {
                pairAddress,
                dayCandles,
                minuteCandles,
                worstBuyPrice: minuteCandles.data.candles[0].high,
                goodBuyPrice: minuteCandles.data.candles[0].open,
                highestPrice,
            }
        } catch (error) {
            throw error
        }

        return { signalData }
    }

    async getPairAddress({
        tokenId,
        browser,
    }: {
        tokenId: string
        browser: puppeteer.Browser
    }): Promise<{ pairAddress: string }> {
        console.log('Trying to get pairs data by token address: ', tokenId)
        let pairs
        try {
            pairs = await dexScreenerApi.getPairsDataByTokenAddress({
                tokenAddress: tokenId,
            })
            console.log('pairs', pairs)

            return { pairAddress: pairs[0].pairAddress }
        } catch (error) {
            console.log('Cant get pairs data from dexScreenerApi')
        }

        let dataFromDexScreenerPage
        if (!pairs) {
            console.log('Trying to get data from dexScreener browser page')
            dataFromDexScreenerPage = await this.getDataFromDexScreenerPage({
                browser,
                tokenId: tokenId,
            })
        }

        if (!dataFromDexScreenerPage) {
            throw new Error('Cant get pair address by token address')
        }

        let pairAddress

        return { pairAddress: dataFromDexScreenerPage.pairAddress }
    }

    async getDataFromDexScreenerPage({
        browser,
        tokenId,
    }: {
        browser: puppeteer.Browser
        tokenId: string
    }) {
        const page = await browser.newPage()
        await page.goto(
            `https://dexscreener.com/ethereum/${tokenId.toLocaleLowerCase()}`
        )
        await page.waitForSelector(
            '.chakra-stack > .chakra-link[title="Open in block explorer"]'
        )

        const details = await page.evaluate(() => {
            const dataToReturn = { pairAddress: '' }

            // document.querySelector(
            //     '[title="Open in block explorer"]'
            // ).href
            const href = (
                document.querySelector(
                    '.chakra-stack > .chakra-link[title="Open in block explorer"]'
                ) as HTMLAnchorElement
            )?.href

            dataToReturn.pairAddress = href.split('address/')[1].toLowerCase()

            return dataToReturn
        })

        await page.close()

        return details
    }
}

const statsV2Service = new StatsV2Service()
export default statsV2Service
