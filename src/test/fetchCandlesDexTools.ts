import puppeteer from 'puppeteer'

export async function fetchCandles() {
    /**
     * Сначала перейти на страницу с графиком
     * В браузере открыть это 'https://www.dextools.io/app/ru/ether/pair-explorer/$pairAddress'
     * При этом не важно на какой странице я нахожусь
     *
     * Оттуда фетчить данные
     *
     * v3?latest вернет последние 6 свечей с не нулевым объемом
     * res=1d дает дневки
     *
     * https://www.dextools.io/chain-ethereum/api/generic/history/candles/v3?sym=usd&span=month&pair=0xc14e0b70ff7b88046f3eef5a1d6ac180f881a9b5&ts=1697749200000&v=1700292748304&res=15m&timezone=3
     * ts= просто месяцчной давности штамп
     * v= датУ сейчас отправлять нельзя, за 10 минут до можно
     */
    //
    const pageUrl = 'https://www.dextools.io/app/ru/ether/pair-explorer/'
    const fetchUrl =
        'https://www.dextools.io/chain-ethereum/api/generic/history/candles/v3?latest=15m&pair=0xc14e0b70ff7b88046f3eef5a1d6ac180f881a9b5&sym=usd&timezone=3'
    const browser = await puppeteer.launch({ headless: false })
    const page = await browser.newPage()
    await page.goto(pageUrl)

    await page.evaluate(async () => {
        /** пара link/weth 0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8
         * получить свечу 18.11.23 4:53 ts=1700272380000 UTC Date('2023-11-18T04:53')
         * o=13.49 v=198
         *
         * Нужжная свеча приходит в resJson.data.candles[0], у нее как раз ts=1700272380000
         * timezone=3 в моем случае ни на что не влияет
         */
        fetch(
            'https://www.dextools.io/chain-ethereum/api/generic/history/candles/v3?sym=usd&span=month&pair=0xa6cc3c2531fdaa6ae1a3ca84c2855806728693e8&ts=1700272380000&res=1m&timezone=3'
        ).then((res) => {
            res.json().then((json) => {
                console.log(json)
            })
        })
    })
}
