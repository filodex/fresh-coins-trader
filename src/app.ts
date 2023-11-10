import 'dotenv/config'
import etherscanApi from './apis/EtherscanApi.js'
// import whalesDetectorService from './services/WhalesDetector.service.js'
import { sleep } from './utils/utils.js'
import path from 'path'
// import traderService from './services/Trader.service.js'
import fs from 'fs'
import dexScreenerApi from './apis/DexScreenerApi.js'
import telegramBotService from './services/TelegramBot.service.js'
import { fetchCandles } from './test/fetchcandles.js'
import { getCandles, getDayCandleData } from './test/getCandlesData.js'
import puppeteer from 'puppeteer'
import statsService from './services/Stats.service.js'
import traderService from './services/Trader.service.js'
import EthAddress from './model/EthAddress.js'
import syveApi from './apis/SyveApi.js'
import whalesListService, {
    WhalesListService,
} from './services/WhalesList.service.js'
import { config } from 'dotenv'
import configService from './services/Config.service.js'

process.on('uncaughtException', async (err) => {
    console.log(err)
    await sleep(5000)
})
process.on('unhandledRejection', async (err) => {
    console.log(err)
    await sleep(5000)
})

const tokensAreadyBoughtAndHandledSet = new Set()

/**
 * MAIN
 */
thisShouldRunOnServer()

setInterval(() => {}, 5000)

async function thisShouldRunOnServer() {
    await findAndHandleGoodTrades()
}

async function findAndHandleGoodTrades() {
    try {
        traderService.updateListOfEthAddressesFromFile()

        const { tokensTradedMoreThanOnce } =
            await traderService.findTokensTradedMoreThanOnce()
        console.log('tokensTradedMoreThanOnce', tokensTradedMoreThanOnce)

        for (const contractAddress in tokensTradedMoreThanOnce) {
            const walletsCountThreshold =
                Number(configService.get('walletsCountThreshold')) ?? 3

            if (
                tokensTradedMoreThanOnce[contractAddress].walletsCount >=
                walletsCountThreshold
            ) {
                if (tokensAreadyBoughtAndHandledSet.has(contractAddress)) {
                    continue
                }

                let tokenPrice = await traderService.getTokenPrice({
                    tokenSymbol:
                        tokensTradedMoreThanOnce[contractAddress]?.tokenSymbol,
                    tokenName:
                        tokensTradedMoreThanOnce[contractAddress]?.tokenName,
                })

                const walletsBoughtThisToken = []
                for (const walletAddress in tokensTradedMoreThanOnce[
                    contractAddress
                ].details) {
                    walletsBoughtThisToken.push(walletAddress)
                }

                try {
                    telegramBotService.sendMessageToMyChannel(
                        `Вот хэш токена ${tokensTradedMoreThanOnce[contractAddress]?.tokenName}, покупай\n${contractAddress}\nЕго купили ${tokensTradedMoreThanOnce[contractAddress]?.walletsCount} кит(ов)\nПо цене ${tokenPrice} WETH из tokenPrice\nКупили эти ребята:\n${walletsBoughtThisToken}\nПоследний кит купил: ${tokensTradedMoreThanOnce[contractAddress].lastBuyDate}`
                    )
                } catch (error) {
                    console.log(error)
                }

                tokensAreadyBoughtAndHandledSet.add(contractAddress)

                const jsonToWrite = JSON.stringify({
                    tokenAddress: contractAddress,
                    boughtAt: new Date(),
                    walletsCount:
                        tokensTradedMoreThanOnce[contractAddress]?.walletsCount,
                    lastBuy:
                        tokensTradedMoreThanOnce[contractAddress]?.lastBuyDate,
                    tokenName:
                        tokensTradedMoreThanOnce[contractAddress]?.tokenName,
                    price: tokenPrice,
                })
                fs.appendFileSync(
                    path.join(path.resolve(), 'diff', 'tokensBought.txt'),
                    '\n' + jsonToWrite
                )
            }
        }
        setTimeout(() => {
            findAndHandleGoodTrades()
        }, 20000)
    } catch (error) {
        console.log(error)
        setTimeout(() => {
            findAndHandleGoodTrades()
        }, 20000)
    }
}
