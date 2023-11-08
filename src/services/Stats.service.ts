import fs from 'fs'
import path from 'path'
import dexScreenerApi from '../apis/DexScreenerApi.js'
import { getDayCandleData } from '../test/getCandlesData.js'
import puppeteer from 'puppeteer'
import { sleep } from '../utils/utils.js'

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

export class StatsService {
    telegramChatHistoryPath = path.join(path.resolve(), 'diff', 'telegramChatHistory.json')
    tokensBoughtPath = path.join(path.resolve(), 'diff', 'tokensBought.txt')
    signalsStatsPath = path.join(path.resolve(), 'diff', 'signalsStats.txt')
    ethAddress = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

    async calcStats() {
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
