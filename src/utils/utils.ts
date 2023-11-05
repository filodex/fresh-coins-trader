export async function sleep(ms: number) {
    console.log(`Sleeping ${ms / 1000} seconds`)
    return new Promise((resolve) => {
        setTimeout(resolve, ms)
    })
}
