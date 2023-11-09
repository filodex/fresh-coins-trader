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
import whalesListService, { WhalesListService } from './services/WhalesList.service.js'

process.on('uncaughtException', async (err) => {
    console.log(err)
    await sleep(5000)
})
process.on('unhandledRejection', async (err) => {
    console.log(err)
    await sleep(5000)
})

const tokensBoughtSet = new Set()

/**
 * MAIN
 */
await writeGoodTrades()
// await telegramBotService.handleBotCommands()

// const candlesData = await getDayCandleData({
//     browser,
//     pairAddress: '0x88c119ee1d2be7a3f35a4c957361bc445a05d3d6',
// })
// console.log(candlesData)

// const tokensBought = statsService.readTokensBought()
// console.log(tokensBought)

// statsService.writeStatsToFile()

// statsService.calcSignalsStats()

// traderService.updateListOfEthAddressesFromFile()
// traderService.handleListOfEthAddresses()
// console.log(traderService.listOfEthAddresses)
// for (const ethad of traderService.listOfEthAddresses) {
//     // const { totalWalletPerformance } = await syveApi.getLatestTotalPerformance({ address: ethad.address })
//     // ethad.totalWalletPerformance = totalWalletPerformance
//     // await ethad.appendToListInFile()
// }

// const { listOfEthAddresses } = whalesListService.getListOfEthAddresses()

// for (const ethAddress of listOfEthAddresses) {
//     console.log(ethAddress.totalWalletPerformance?.total_profit, ethAddress.totalWalletPerformance?.win_rate)
// }

setInterval(() => {}, 5000)

async function writeGoodTrades() {
    try {
        traderService.updateListOfEthAddressesFromFile()

        const { tokensTradedByMoreThanOneWallet } = await traderService.findTokensTradedByGoodWhales()
        console.log('tokensTradedByMoreThanOneWallet', tokensTradedByMoreThanOneWallet)
        for (const key in tokensTradedByMoreThanOneWallet) {
            if (tokensTradedByMoreThanOneWallet[key].walletsCount >= 2) {
                if (tokensBoughtSet.has(key)) {
                    continue
                }

                let tokenPrice
                try {
                    const pairs = await dexScreenerApi.getPairsDataByName(
                        tokensTradedByMoreThanOneWallet[key]?.tokenSymbol
                    )

                    for (const pair of pairs) {
                        if (pair.pairCreatedAt || 0 > new Date().getTime() - 1000 * 60 * 60 * 24) {
                            tokenPrice = pair.priceUsd
                            break
                        }
                    }
                } catch (error) {
                    console.log(error)
                }

                try {
                    telegramBotService.sendMessageToMyChannel(
                        `Вот хэш токена ${tokensTradedByMoreThanOneWallet[key]?.tokenName}, покупай\n${key}\nЕго купили ${tokensTradedByMoreThanOneWallet[key]?.walletsCount} кит(ов)`
                    )
                } catch (error) {
                    console.log(error)
                }

                tokensBoughtSet.add(key)
                const jsonToWrite = JSON.stringify({
                    tokenAddress: key,
                    boughtAt: new Date(),
                    walletsCount: tokensTradedByMoreThanOneWallet[key]?.walletsCount,
                    lastBuy: tokensTradedByMoreThanOneWallet[key]?.lastBuyDate,
                    tokenName: tokensTradedByMoreThanOneWallet[key]?.tokenName,
                    price: tokenPrice,
                })
                // console.log('jsonToWrite', jsonToWrite)
                fs.appendFileSync(path.join(path.resolve(), 'diff', 'tokensBought.txt'), '\n' + jsonToWrite)
            }
        }
        setTimeout(() => {
            writeGoodTrades()
        }, 20000)
    } catch (error) {
        console.log(error)
        setTimeout(() => {
            writeGoodTrades()
        }, 20000)
    }
}
