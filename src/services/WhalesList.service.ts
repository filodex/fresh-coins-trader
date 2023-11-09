import fs from 'fs'
import path from 'path'
import EthAddress from '../model/EthAddress.js'

export class WhalesListService {
    listOfWalletsFilePath = path.join(path.resolve(), 'diff', 'goodWhales.json')

    getListOfEthAddresses() {
        const text = String(fs.readFileSync(this.listOfWalletsFilePath))

        try {
            const arr: [] = JSON.parse(text)

            const listOfEthAddresses = arr.map((obj: EthAddress) => {
                return new EthAddress({
                    address: obj.address,
                    totalWalletPerformance: obj.totalWalletPerformance,
                })
            })

            return { listOfEthAddresses }
        } catch (error) {
            throw error
        }
    }
}

const whalesListService = new WhalesListService()
export default whalesListService
