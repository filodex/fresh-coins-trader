import path from 'path'
import fs from 'fs'

export default class EthAddress {
    address: string
    latestTokenTransfers?: any
    totalWalletPerformance?: any

    constructor({
        address,
        totalWalletPerformance,
    }: {
        address: string
        totalWalletPerformance?: any
    }) {
        this.address = address
        this.totalWalletPerformance = totalWalletPerformance
    }

    async updateBalance() {}

    async appendToListInFile() {
        const goodWhalesJsonPath = path.join(
            path.resolve(),
            'diff',
            'goodWhales.json'
        )
        const fileText = fs.readFileSync(goodWhalesJsonPath, {
            encoding: 'utf-8',
        })
        const jsoned = JSON.parse(fileText)
        jsoned.push(this)
        fs.writeFileSync(goodWhalesJsonPath, JSON.stringify(jsoned, null, 2))
    }
}
