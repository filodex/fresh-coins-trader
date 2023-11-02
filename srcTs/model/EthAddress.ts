import path from 'path'
import fs from 'fs'

export default class EthAddress {
    address: string

    constructor({ address }: { address: string }) {
        this.address = address
    }

    async updateBalance() {}

    async appendToListInFile() {
        const goodWhalesJsonPath = path.join(path.resolve(), 'src', 'lib', 'goodWhales.json')
        const fileText = fs.readFileSync(goodWhalesJsonPath, { encoding: 'utf-8' })
        const jsoned = JSON.parse(fileText)
        jsoned.push(this)
        fs.writeFileSync(goodWhalesJsonPath, JSON.stringify(jsoned, null, 2))
    }
}
