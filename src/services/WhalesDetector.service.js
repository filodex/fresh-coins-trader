import etherscanApi from '../apis/EtherscanApi/EtherscanApi.js'
import configService from './config.service.js'

export class WhalesDetectorService {
    async checkIsWalletProfitable({ address }) {}
    async getSetOfWalletsBoughtThisToken({ address }) {
        try {
            const setOfWalletsBoughtThisToken = new Set()
            const { listOfTokenTransfers } = await etherscanApi.getListOfTokenTransfers({
                address,
            })
            for (const tokenTransfer of listOfTokenTransfers) {
                const senderAdress = tokenTransfer.from
                if (tokenTransfer.tokenSymbol === 'WETH') {
                    setOfWalletsBoughtThisToken.add(senderAdress)
                }
            }
            return { setOfWalletsBoughtThisToken }
        } catch (error) {
            console.log('Error in getListOfWalletsToCheck', error)
        }
    }
    async findGoodWhalesInListOfWallets({ setOfWallets }) {
        try {
            const addressesToCheckForProfit = []
            for (const address of setOfWallets) {
                const { etherBalance } = await etherscanApi.getWalletEtherBalanceForSingleAddress({ address })
                const ethBalanceThreshold = configService.get('ethBalanceThreshold')
                Number(etherBalance) >= ethBalanceThreshold ? addressesToCheckForProfit.push(address) : null
            }
            console.log(addressesToCheckForProfit)
        } catch (error) {
            console.log('Error in findGoodWhalesInListOfWallets', error)
        }
    }
}

const whalesDetectorService = new WhalesDetectorService()
export default whalesDetectorService
