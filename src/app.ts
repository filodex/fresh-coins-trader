import 'dotenv/config'
import etherscanApi from './apis/EtherscanApi.js'
import { returnValueOfGetWalletTokenBalanceForSingleAddressByContractAddress } from './apis/IEtherscanApi'
// import whalesDetectorService from './services/WhalesDetector.service.js'
import { sleep } from './utils/utils.js'
import path from 'path'
import traderService from './services/Trader.service.js'
import fs from 'fs'
import dexScreenerApi from './apis/DexScreenerApi.js'

process.on('uncaughtException', async (err) => {
    console.log(err)
    await sleep(5000)
})
process.on('unhandledRejection', async (err) => {
    console.log(err)
    await sleep(5000)
})

const tokensBoughtSet = new Set()

await writeGoodTrades()

async function writeGoodTrades() {
    try {
        traderService.updateListOfEthAddressesFromFile()

        const { tokensTradedByMoreThanOneWallet } = await traderService.findTokensTradedByGoodWhales()
        console.log(tokensTradedByMoreThanOneWallet)
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
                    console.log(pairs)

                    for (const pair of pairs) {
                        if (pair.pairCreatedAt || 0 > new Date().getTime() - 1000 * 60 * 60 * 24) {
                            tokenPrice = pair.priceUsd
                            break
                        }
                    }
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
                console.log('jsonToWrite', jsonToWrite)
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
