export async function sleep(ms: number) {
    console.log(`Sleeping ${ms / 1000} seconds`)
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}

export function getYesterdayTime() {
    const now = new Date().getTime()
    return now - 1000 * 60 * 60 * 24
}
