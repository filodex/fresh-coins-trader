import puppeteer from 'puppeteer'
import { getYesterdayTime } from '../utils/utils.js'

export async function getDayCandleData({
    browser,
    pairAddress: address,
    res = 5,
}: {
    browser: puppeteer.Browser
    pairAddress: string
    res?: number
}) {
    const url = new URL(`
    https://io.dexscreener.com/dex/chart/amm/v2/uniswap/bars/ethereum/${address}`)

    url.searchParams.append('from', String(getYesterdayTime()))
    url.searchParams.append('to', String(new Date().getTime()))
    url.searchParams.append('res', String(res))
    url.searchParams.append('cb', '2')
    url.searchParams.append('q', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2')

    const page = await browser.newPage()

    await page.goto(String(url))

    const dayCandleData = await page.evaluate(() => {
        const text = document.querySelector('body > pre')?.textContent

        if (!text) return

        const noChars = text.replace(/[\u0000-\u001F\u007F-\u009F\x02]/g, '\n')

        const splitted = noChars.split('\n')

        let iterationsCount = 0
        while (true) {
            if (iterationsCount > 3) break

            for (const val of splitted) {
                if (val === '' || val.includes('1.0.0') || val.includes('ú') || val.includes('B')) {
                    splitted.splice(splitted.indexOf(val), 1)
                }
            }

            iterationsCount++
        }

        const o = splitted[1]
        const h = splitted[3]
        const l = splitted[5]
        const c = splitted[7]
        const v = splitted[8]

        return { o, h, l, c, v, to: new Date().toString() }
    })

    // await page.close()

    return { ...dayCandleData }
}

const decoder = new TextDecoder()
decoder.decode()