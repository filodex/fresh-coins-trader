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
}

const dexScreenerApi = new DexScreenerApi()
export default dexScreenerApi
