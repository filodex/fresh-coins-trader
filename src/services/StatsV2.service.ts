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
            const signalData = await this.#getAllDataForSignal()

            // Сделать расчеты и записать в signalStats
            // Записать в новую переменную все вместе и сделать запись в файл
        }

        const page = await browser.newPage()
    }

    async launchBrowser({ headless = true }): Promise<puppeteer.Browser> {
        const browser = await puppeteer.launch({ headless })
        return browser
    }

    async getHistoryCandles() {}

    async getLatestCandles() {}

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

    async #getAllDataForSignal() {}
}

const statsV2Service = new StatsV2Service()
export default statsV2Service
