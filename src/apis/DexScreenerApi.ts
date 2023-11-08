import { Pair } from './IDexScreenerApi.js'

export class DexScreenerApi {
    async getPairsDataByName(name: string): Promise<Pair[]> {
        try {
            const url = new URL('https://api.dexscreener.com/latest/dex/search/')
            url.searchParams.append('q', name + '/WETH')

            const res = await fetch(url)
            const resJson = await res.json()

            return resJson.pairs
        } catch (error) {
            throw new Error('Error in getPairDataByName' + error)
        }
    }

    async getPairsDataByTokenAddress({ tokenAddress }: { tokenAddress: string }): Promise<Pair[]> {
        try {
            const url = new URL(`https://api.dexscreener.com/latest/dex/tokens/${tokenAddress}`)

            const res = await fetch(url)
            const resJson = await res.json()

            console.log('resJson in getPairsDataByTokenAddress', resJson)

            if (!Array.isArray(resJson.pairs)) {
                throw new Error('No pairs got from getPairsDataByTokenAddress')
            }

            return resJson.pairs
        } catch (error) {
            throw new Error('Error in getPairsDataByTokenAddress' + error)
        }
    }
}

const dexScreenerApi = new DexScreenerApi()
export default dexScreenerApi
