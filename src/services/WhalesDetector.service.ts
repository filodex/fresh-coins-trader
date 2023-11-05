import etherscanApi from '../apis/EtherscanApi.js'
import syveApi from '../apis/SyveApi.js'
import configService from './Config.service.js'
import EthAddress from '../model/EthAddress.js'
import path from 'path'
import fs from 'fs'
import { returnGetWalletTotalPerformance, setOfWalletsBoughtThisToken } from './IWhalesDetector.service'

export class WhalesDetectorService {
    #listOfWalletsFilePath = path.join(path.resolve(), 'diff', 'goodWhales.json')

    async getProfitableWhaleWalletsBoughtThisToken({ address }: { address: string }) {
        try {
            const { setOfWalletsBoughtThisToken } = await this.getSetOfWalletsBoughtThisToken({ address })
            const { addressesWithGoodProfit } = await this.findProfitableWalletsInListOfWallets({
                setOfWallets: setOfWalletsBoughtThisToken,
            })
            return { addressesWithGoodProfit }
        } catch (error) {
            throw new Error(`Error in getProfitableWhaleWalletsBoughtThisToken` + error)
        }
    }

    async getWalletTotalPerformance({
        address,
        ethAddress,
    }: {
        address: string
        ethAddress: { totalProfitStats?: object; address: string }
    }): Promise<returnGetWalletTotalPerformance> {
        try {
            const { totalProfit, totalWalletPerformance } = await syveApi.getLatestTotalPerformance({
                address,
            })
            ethAddress.totalProfitStats = totalWalletPerformance

            let isProfitable

            if (Number(totalProfit) > Number(configService.get('balanceEnoughThreshold'))) {
                isProfitable = true
            } else {
                isProfitable = false
            }

            return { isProfitable, totalWalletPerformance }
        } catch (error) {
            throw new Error('Error in getWalletTotalPerformance' + error)
        }
    }

    async getSetOfWalletsBoughtThisToken({
        address,
    }: {
        address: string
    }): Promise<setOfWalletsBoughtThisToken> {
        try {
            const setOfWalletsBoughtThisToken: Set<string> = new Set()
            const listOfWalletsBoughtThisToken: Array<any> = []
            const { listOfTokenTransfers } = await etherscanApi.getListOfTokenTransfers({
                address,
            })
            for (const tokenTransfer of listOfTokenTransfers) {
                const senderAdress: string = tokenTransfer.from
                if (tokenTransfer.tokenSymbol !== 'WETH') {
                    setOfWalletsBoughtThisToken.add(senderAdress)
                    listOfWalletsBoughtThisToken.push(senderAdress)
                }
            }
            return { setOfWalletsBoughtThisToken }
        } catch (error) {
            throw new Error('Error in getSetOfWalletsBoughtThisToken' + error)
        }
    }
    readListOfWhaleWalletsFromFile(): { listOfWallets: EthAddress[] } {
        const text: string = String(fs.readFileSync(this.#listOfWalletsFilePath))
        const listOfWallets = JSON.parse(text)
        listOfWallets.forEach((element: any) => {
            element = new EthAddress({ address: element.address })
        })
        return { listOfWallets }
    }
    async findProfitableWalletsInListOfWallets({
        setOfWallets,
    }: {
        setOfWallets: Set<string>
    }): Promise<{ addressesWithGoodProfit: Array<EthAddress> }> {
        try {
            const addressesWithGoodProfit: any[] = []
            for (const address of setOfWallets) {
                const ethAddress = new EthAddress({ address })
                const walletTotalPerformance = await this.getWalletTotalPerformance({ address, ethAddress })
                if (walletTotalPerformance?.isProfitable) {
                    addressesWithGoodProfit.push(ethAddress)
                }
            }

            return { addressesWithGoodProfit }
        } catch (error) {
            throw new Error('Error in findProfitableWalletsInListOfWallets' + error)
        }
    }
}

const whalesDetectorService = new WhalesDetectorService()
export default whalesDetectorService
