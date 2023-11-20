import puppeteer from 'puppeteer'
import fs from 'fs'
import path from 'path'

export interface IMessageFromTelegramSignal {
    details: {
        tokenId?: string
        price?: number
        lastBuyDate?: string
        lastBuyTime?: number
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

export class StatsV2Service {
    telegramSignalsFilePath: string

    constructor() {
        this.telegramSignalsFilePath = path.join(
            path.resolve(),
            'diff',
            'chatHistory.json'
        )
    }

    async calcStatsAndWriteToFile({
        browser,
        telegramSignals,
    }: {
        browser: puppeteer.Browser
        telegramSignals: ITelegramSignals
    }) {
        for (const message of telegramSignals.messages) {
            // Получить все возможные данные и записать в переменную
            // const { signalData } = await this.#getAllDataForSignal({ message })

            return

            // Сделать расчеты и записать в signalStats
            // Записать в новую переменную все вместе и сделать запись в файл
        }

        const page = await browser.newPage()
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
    }): Promise<IGetCandlesResponse> {
        const url = new URL(
            'https://www.dextools.io/chain-ethereum/api/generic/history/candles/v3?sym=usd&span=month&timezone=3'
        )

        url.searchParams.append('res', res)
        url.searchParams.append('pair', pair.toLowerCase())
        url.searchParams.append('ts', String(ts))

        const response = await page.evaluate(async (url) => {
            try {
                const res = await fetch(url)
                const resJson = await res.json()

                return resJson
            } catch (error) {
                return error
            }
        }, url)

        if (response.__proro__ === Error.prototype || response.code !== 'OK') {
            throw new Error('Cant get candles', response)
        }

        return response
    }

    async getLatestCandles({ page }: { page: puppeteer.Page }) {}

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
        let tradersBoughtText = splittedOnBodyAndBuyers

        const bodySplitted = body?.split('\n')

        const detailsToAdd = {
            tokenId: '',
            price: 0,
            lastBuyDate: '',
            lastBuyTime: 0,
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

    // async #getAllDataForSignal({
    //     message,
    // }: {
    //     message: IMessageFromTelegramSignal
    // }): Promise<{ signalData: any }> {
    //     // Получить цену хорошую и плохую
    // }
}

const statsV2Service = new StatsV2Service()
export default statsV2Service
