import {
    IEtrescanApi,
    returnValueOfGetWalletTokenBalanceForSingleAddressByContractAddress,
    returnValueOfGetWalletEtherBalanceForSingleAddress,
    returnGetListOfTokenTransfers,
} from './IEtherscanApi.js'

export class EtherscanApi implements IEtrescanApi {
    private apiToken
    constructor(apiToken: string | undefined) {
        if (!apiToken) {
            throw new Error('No Etherscan API token')
        }

        this.apiToken = apiToken
    }

    async getWalletTokenBalanceForSingleAddressByContractAddress({
        address,
        contractAddress,
    }: {
        address: string
        contractAddress: string | undefined
    }) {
        try {
            const url = new URL('https://api.etherscan.io/api?module=account&action=tokenbalance&address')
            url.searchParams.append('apikey', this.apiToken)
            url.searchParams.append('address', address)
            url.searchParams.append('contractaddress', contractAddress ?? '')
            console.log(url.toString())

            const res = await fetch(url)
            const resJson = await res.json()

            if (resJson.message !== 'OK') {
                console.log('Something wrong in getWalletBalanceForSingleAddress', resJson)
                throw new Error(`resJson message: ${resJson.message}, resJson result: ${resJson.result}`)
            }
            return { tokenBalance: resJson.result }
        } catch (error) {
            throw new Error('Error in getWalletTokenBalanceForSingleAddress' + error)
        }
    }
    async getWalletEtherBalanceForSingleAddress({
        address,
    }: {
        address: string
    }): Promise<returnValueOfGetWalletEtherBalanceForSingleAddress> {
        try {
            const url = new URL('https://api.etherscan.io/api?module=account&action=balance')
            url.searchParams.append('apikey', this.apiToken)
            url.searchParams.append('address', address)

            const res = await fetch(url)
            const resJson = await res.json()

            if (resJson.message !== 'OK') {
                console.log('Something wrong in getWalletBalanceForSingleAddress', resJson)
                throw new Error(`resJson message: ${resJson.message}, resJson result: ${resJson.result}`)
            }

            return { etherBalance: resJson.result / 10 ** 18, weiBalance: resJson.result }
        } catch (error) {
            throw new Error('Error in getListOfTokenTransfers' + error)
        }
    }
    async getListOfTokenTransfers({
        address,
        offset = 600,
        page = 1,
        sort = 'desc',
    }: {
        address: string
        offset?: number
        page?: number
        sort?: string
    }): Promise<returnGetListOfTokenTransfers> {
        try {
            const url = new URL('https://api.etherscan.io/api?module=account&action=tokentx')
            url.searchParams.append('apikey', this.apiToken)
            url.searchParams.append('offset', String(offset))
            url.searchParams.append('page', String(page))
            url.searchParams.append('sort', sort)
            address ? url.searchParams.append('address', address) : null

            const res = await fetch(url)
            const resJson = await res.json()
            if (resJson.message !== 'OK') {
                console.log('Something wrong in getListOfTokenTransfers', resJson)
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
