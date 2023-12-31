import { sleep } from '../utils/utils.js'

export class SyveApi {
    async getLatestTotalPerformance({
        address,
    }: {
        address: string
    }): Promise<returnGetLatestTotalPerformance> {
        try {
            const url = new URL('https://api.syve.ai/v1/wallet-api/latest-total-performance')
            url.searchParams.append('wallet_address', address)

            const res = await fetch(url)
            const resJson = await res.json()
            if (resJson.error) {
                console.log(resJson.error)
                if (resJson.error?.includes('Rate limit of')) {
                    await sleep(1000)
                }
            }

            return { totalWalletPerformance: resJson, totalProfit: resJson.total_profit }
        } catch (error) {
            throw new Error('Error in getLatestTotalPerformance' + error)
        }
    }
}
const syveApi = new SyveApi()
export default syveApi

interface returnGetLatestTotalPerformance {
    totalWalletPerformance: object
    totalProfit: string
}
