import path from 'path'
import fs from 'fs'

export default class EthAddress {
    balance = {
        updated: undefined,
        value: undefined,
    }
    totalProfitStats
    constructor({ address }) {
        this.address = address
    }
    async updateBalance() {}
    async appendToListInFile() {
        const goodWhalesJsonPath = path.join(path.resolve(), 'src', 'lib', 'goodWhales.json')
        fs.readFile(goodWhalesJsonPath, (err, text) => {
            const json = JSON.parse(String(text))
            json.push(this)
            fs.writeFile(goodWhalesJsonPath, JSON.stringify(json, ' ', 2), { encoding: 'utf-8' }, () => {})
        })
    }
}
