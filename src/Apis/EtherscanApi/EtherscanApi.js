export class EtherscanApi {
    #apiToken
    constructor(apiToken) {
        this.#apiToken = apiToken
    }
    async getWalletBalance({ address }) {
        try {
            const url = new URL('https://api.etherscan.io/api?module=account&action=tokentx')
            url.searchParams.append('apikey', this.#apiToken)
            url.searchParams.append('offset', offset)
            url.searchParams.append('page', page)
            url.searchParams.append('sort', sort)
            address ? url.searchParams.append('address', address) : null

            const res = await fetch(url)
            const resJson = await res.json()
            if (resJson.message !== 'OK') {
                console.log(resJson)
                throw new Error(`resJson message: ${resJson.message}, resJson result: ${resJson.result}`)
            }
            return {}
        } catch (error) {
            throw new Error('Error in getListOfTokenTransfers' + error)
        }
    }
    async getListOfTokenTransfers({ address, offset = 50, page = 1, sort = 'desc' }) {
        try {
            const url = new URL('https://api.etherscan.io/api?module=account&action=tokentx')
            url.searchParams.append('apikey', this.#apiToken)
            url.searchParams.append('offset', offset)
            url.searchParams.append('page', page)
            url.searchParams.append('sort', sort)
            address ? url.searchParams.append('address', address) : null

            const res = await fetch(url)
            const resJson = await res.json()
            if (resJson.message !== 'OK') {
                console.log(resJson)
                throw new Error(`resJson message: ${resJson.message}, resJson result: ${resJson.result}`)
            }
            return { listOfTokenTransfers: resJson.result }
        } catch (error) {
            throw new Error('Error in getListOfTokenTransfers' + error)
        }
    }
}

const etherscanApi = new EtherscanApi(process.env.ETHERSCAN_TOKEN)
export default etherscanApi
