import etherscanApi from './src/apis/EtherscanApi/EtherscanApi.js'

export class WhalesDetectorService {
    async getListOfWalletsBoughtThisToken({ address }) {
        try {
            const listOfWalletsBoughtThisToken = []
            const { listOfTokenTransfers } = await etherscanApi.getListOfTokenTransfers({
                address,
            })
            for (const tokenTransfer of listOfTokenTransfers) {
                const senderAdress = tokenTransfer.from
                if (tokenTransfer.tokenSymbol === 'WETH') {
                    listOfWalletsBoughtThisToken.push(senderAdress)
                }
            }
            return { listOfWalletsBoughtThisToken }
        } catch (error) {
            console.log('Error in getListOfWalletsToCheck', error)
        }
    }
    async findGoodWhalesInListOfWallets({ listOfWallets }) {
        if (!Array.isArray(listOfWallets)) {
            throw new Error('findGoodWhalesInListOfWallets need an array to be provided')
        }
        try {
            for (const walletAddress of listOfWallets) {
            }
        } catch (error) {
            console.log('Error in findGoodWhalesInListOfWallets', error)
        }
    }
}

const whalesDetectorService = new WhalesDetectorService()
export default whalesDetectorService
