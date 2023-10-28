export class SyveApi {
    async getLatestTotalPerformance({ address }) {
        try {
            const url = new URL('https://api.syve.ai/v1/wallet-api/latest-total-performance')
            url.searchParams.append('wallet_address', address)

            const res = await fetch(url)
            const resJson = await res.json()
            if (resJson.error) {
                console.log(resJson.error)
            }

            return { totalwalletPerformance: resJson, totalProfit: resJson.total_profit }
        } catch (error) {
            throw new Error('Error in getLatestTotalPerformance' + error)
        }
    }
}
const syveApi = new SyveApi()
export default syveApi
