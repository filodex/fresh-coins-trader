// Cloudflare blocks requests

export async function fetchCandles({ address, res = 1 }: { address: string; res?: number }) {
    const url = new URL(`
    https://io.dexscreener.com/dex/chart/amm/v2/uniswap/bars/ethereum/${address}?from=1699401600000&to=1699427155000&res=1440&cb=2&q=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2`)

    url.searchParams.append('from', String(getYesterdayTime()))
    url.searchParams.append('to', String(new Date().getTime()))
    url.searchParams.append('res', String(res))
    url.searchParams.append('cb', '2')
    url.searchParams.append('q', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

    const response = await fetch(url)
    const resJson = await response.text()

    console.log(resJson)
}

function getYesterdayTime() {
    return Number(new Date().getTime) - 1000 * 60 * 60 * 24
}
