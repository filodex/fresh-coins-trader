import 'dotenv/config'
import etherscanApi from './src/apis/EtherscanApi.js'
import configService from './src/services/Config.service.js'
import whalesDetectorService from './src/Services/WhalesDetector.service.js'
import syveApi from './src/apis/SyveApi.js'
import EthAddress from './src/model/EthAddress.js'
import traderService from './src/services/Trader.service.js'
import path from 'path'
import fs from 'fs'
import { sleep } from './src/utils/utils.js'

process.on('uncaughtException', async (err) => {
    console.log(err)
    await sleep(5000)
})
process.on('unhandledRejection', async (err) => {
    console.log(err)
    await sleep(5000)
})

/**
 * Нашел токены, которые купили несколько крутых ребяt
 * Узнать цену, по которой я могу сейчас тоже купить
 * Запомнить цену
 */
// console.log(await traderService.findTokensTradedByGoodWhales())

const tokensBoughtSet = new Set()

setInterval(async () => {
    try {
        traderService.updateListOfEthAddressesFromFile()

        const { tokensTradedByMoreThanOneWallet } = await traderService.findTokensTradedByGoodWhales()
        console.log(tokensTradedByMoreThanOneWallet)
        for (const key in tokensTradedByMoreThanOneWallet) {
            if (tokensTradedByMoreThanOneWallet[key].walletsCount >= 2) {
                if (tokensBoughtSet.has(key)) {
                    continue
                }

                tokensBoughtSet.add(key)
                const jsonToWrite = JSON.stringify({
                    tokenAddress: key,
                    boughtAt: new Date(),
                    walletsCount: tokensTradedByMoreThanOneWallet[key]?.walletsCount,
                    lastBuy: tokensTradedByMoreThanOneWallet[key]?.lastBuyDate,
                    tokenName: tokensTradedByMoreThanOneWallet[key]?.tokenName,
                })
                console.log('jsonToWrite', jsonToWrite)
                fs.appendFileSync(
                    path.join(path.resolve(), 'src', 'lib', 'tokensBought.txt'),
                    '\n' + jsonToWrite
                )
            }
        }
    } catch (error) {
        console.log(error)
    }
}, 120000)
