import 'dotenv/config'
import etherscanApi from './apis/EtherscanApi.js'
import { returnValueOfGetWalletTokenBalanceForSingleAddressByContractAddress } from './apis/IEtherscanApi'
import whalesDetectorService from './services/WhalesDetector.service.js'
import { sleep } from './utils/utils.js'
import path from 'path'
import traderService from './services/Trader.service.js'
import fs from 'fs'

process.on('uncaughtException', async (err) => {
    console.log(err)
    await sleep(5000)
})
process.on('unhandledRejection', async (err) => {
    console.log(err)
    await sleep(5000)
})

writeGoodTrades()

async function writeGoodTrades() {
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
}
