import fs from 'fs'
import path from 'path'
import dexScreenerApi from '../apis/DexScreenerApi.js'
import { getDayCandleData } from '../test/getCandlesData.js'
import puppeteer from 'puppeteer'
import { sleep } from '../utils/utils.js'
import { Pair } from '../apis/IDexScreenerApi.js'

interface ITelegramChatHistory {
    name: string
    id: number
    type: string
    messages: {
        id: number
        type: string
        date: string
        date_unixtime: string
        actor: string
        actor_id: string
        action: string
        title: string
        text: string
        text_entities: []
    }[]
}

interface SignalStats {
    tokenBought: {
        tokenAddress: string
        boughtAt: string
        walletsCount: number
        lastBuy: string
        price: string
        tokenName: string
    }
    pair: Pair
    dayCandleData: {
        o?: string | undefined
        h?: string | undefined
        l?: string | undefined
        c?: string | undefined
        v?: string | undefined
        updated?: string | undefined
    }
}

export class StatsService {
    telegramChatHistoryPath = path.join(path.resolve(), 'diff', 'telegramChatHistory.json')
    tokensBoughtPath = path.join(path.resolve(), 'diff', 'tokensBought.txt')
    signalsStatsPath = path.join(path.resolve(), 'diff', 'signalsStats.txt')
    ethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

    calcSignalsStats() {
        const text = String(fs.readFileSync(this.signalsStatsPath))
        const splitted = text.split('******')

        console.log('Splitted length: ' + splitted.length)

        const signalsStats: SignalStats[] = []
        splitted.forEach((signalText) => {
            try {
                const jsoned = JSON.parse(signalText)
                signalsStats.push(jsoned)
            } catch (error) {
                console.log('Error parsing json')
            }
        })

        console.log(signalsStats)
        console.log('signalsStats length', signalsStats.length)

        let noCandleDataErrCounter = 0
        let wrongPriceErrCounter = 0
        let badBuyTimeErrCounter = 0
        let buyDelay = { count: 0, sum: 0, max: 0 }
        let stats = { less20: 0, less50: 0, less100: 0, less300: 0, less500: 0, less1000: 0, more1000: 0 }
        for (const signalStats of signalsStats) {
            if (signalStats.tokenBought.walletsCount < 4) {
                continue
            }

            if (!signalStats.dayCandleData.h || signalStats.dayCandleData.h === '') {
                noCandleDataErrCounter++
                continue
            }

            if (Number(signalStats.tokenBought.price) > Number(signalStats.dayCandleData.h)) {
                wrongPriceErrCounter++
                continue
            }

            if (signalsStats.indexOf(signalStats) > 120) {
                const boughAtTime = new Date(signalStats.tokenBought.boughtAt).getTime()
                const lastBuyTime = new Date(signalStats.tokenBought.lastBuy).getTime()

                if (boughAtTime > lastBuyTime) {
                    buyDelay.count++
                    buyDelay.sum += boughAtTime - lastBuyTime
                    buyDelay.max = Math.max(boughAtTime - lastBuyTime, buyDelay.max)
                } else {
                    badBuyTimeErrCounter++
                }
            }

            const buyPrice = Number(signalStats.tokenBought.price)
            const h = Number(signalStats.dayCandleData.h)
            const l = Number(signalStats.dayCandleData.l)
            const percent = (h / buyPrice) * 100 - 100

            if (buyPrice < l) {
                wrongPriceErrCounter++
                continue
            }

            if (percent < 20) {
                stats.less20++
            } else if (percent < 50) {
                stats.less50++
            } else if (percent < 100) {
                stats.less100++
            } else if (percent < 300) {
                stats.less300++
            } else if (percent < 500) {
                stats.less500++
            } else if (percent < 1000) {
                stats.less1000++
            } else {
                stats.more1000++

                console.log(JSON.stringify(signalStats))
            }
        }

        // How much h more than price

        console.log('Wrong price errors:', wrongPriceErrCounter)
        console.log('badBuyTimeErrCounter:', badBuyTimeErrCounter)
        console.log('No candle data errors', noCandleDataErrCounter)
        console.log('Buy delay', buyDelay, buyDelay.sum / buyDelay.count)
        console.log('Stats', stats)
    }

    async writeStatsToFile() {
        try {
            const browser = await puppeteer.launch({ headless: false })
            const { tokensBought } = this.readTokensBought()
            console.log('tokensBought', tokensBought)

            for (const tokenBought of tokensBought) {
                try {
                    console.log('Starting in forof', tokenBought)

                    const pair = await this.getPairWithEthByContractAddress({
                        contractAddress: tokenBought.tokenAddress,
                    })

                    if (!pair) {
                        console.log(`Cant get pair for ${tokenBought.tokenAddress} token`)
                        continue
                    }

                    console.log('Got pair', pair)

                    const dayCandleData = await getDayCandleData({ browser, pairAddress: pair.pairAddress })

                    console.log('Got dayCandleData', dayCandleData)

                    const signalStats = { tokenBought, pair, dayCandleData }

                    fs.appendFileSync(
                        this.signalsStatsPath,
                        JSON.stringify(signalStats, null, 2) + '\n******\n'
                    )
                    console.log('Wrote to file')

                    await sleep(8000)
                } catch (error) {
                    console.log('Error in forof cycle', error)
                    await sleep(15000)
                }
            }
        } catch (error) {
            console.log(error)
        }
    }

    readTokensBought() {
        const tokensBoughtText = String(fs.readFileSync(this.tokensBoughtPath))
        const tokensBoughtSplitted = tokensBoughtText.split('\n')

        const tokensBought: {
            tokenAddress: string
            boughtAt: string
            walletsCount: number
            lastBuy: string
            price: string
            tokenName: string
        }[] = []
        for (const i of tokensBoughtSplitted) {
            tokensBought.push(JSON.parse(i))
        }

        return { tokensBought }
    }

    readTelegramChatHistory(): ITelegramChatHistory {
        const telegramChatHistory: ITelegramChatHistory = JSON.parse(
            String(fs.readFileSync(this.telegramChatHistoryPath))
        )
        return { ...telegramChatHistory }
    }

    async getPairsDataByContractAddress({ contractAddress }: { contractAddress: string }) {
        try {
            const pairsData = await dexScreenerApi.getPairsDataByTokenAddress({
                tokenAddress: contractAddress,
            })

            return { pairsData }
        } catch (error) {
            throw error
        }
    }

    async getPairWithEthByContractAddress({ contractAddress }: { contractAddress: string }) {
        try {
            const { pairsData } = await this.getPairsDataByContractAddress({ contractAddress })

            console.log('PairsData', pairsData)

            for (const pair of pairsData) {
                if (
                    pair.baseToken.address.toLowerCase() === contractAddress.toLowerCase() &&
                    pair.quoteToken.symbol.toLowerCase() === 'weth'
                ) {
                    return pair
                }
            }

            return pairsData?.[0]
        } catch (error) {
            throw error
        }
    }
}

const statsService = new StatsService()
export default statsService
