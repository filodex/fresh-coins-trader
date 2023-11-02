import 'dotenv/config'
import etherscanApi from './src/Apis/EtherscanApi.js'
import configService from './src/services/Config.service.js'
import whalesDetectorService from './src/Services/WhalesDetector.service.js'
import syveApi from './src/apis/SyveApi.js'
import EthAddress from './src/model/EthAddress.js'
import traderService from './src/services/Trader.service.js'
import path from 'path'
import fs from 'fs'

/**
 * Нашел токены, которые купили несколько крутых ребяt
 * Узнать цену, по которой я могу сейчас тоже купить
 * Запомнить цену
 */
console.log(await traderService.findTokensTradedByGoodWhales())

const tokensBoughtSet = new Set()

setInterval(async () => {
    const { tokensTradedByMoreThanOneWallet } = await traderService.findTokensTradedByGoodWhales()
    for (const key in tokensTradedByMoreThanOneWallet) {
        if (tokensTradedByMoreThanOneWallet[key].walletsCount > 2) {
            if (tokensBoughtSet.has(key)) {
                continue
            }

            tokensBoughtSet.add(key)
            const jsonToWrite = JSON.stringify({
                tokenAddress: key,
                boughtAt: new Date(),
            })
            fs.appendFileSync(path.join(path.resolve(), 'src', 'lib', 'tokensBought.txt'), '\n' + jsonToWrite)
        }
    }
}, 10000)
