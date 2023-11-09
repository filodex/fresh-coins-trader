let str =
    '\n1.0.0\x02\n���w̹xB\x180.0000001010\x02\x120.0001902\x140.00001057\x02\x0E0.01984\x180.0000001306\x02\x120.0002461\x160.000006008\x02\x0E0.01137\x02\x141214259.86��@�\x1E�xB\x160.000006008\x02\x0E0.01137\x160.000006709\x02\x0E0.01268\x180.0000009879\x02\x100.001850\x160.000001031\x02\x100.001956\x02\x12434309.65���Cq�xB\x160.000001031\x02\x100.001956\x160.000005147\x02\x100.009597\x180.0000009049\x02\x100.001709\x160.000002647\x02\x100.004994\x02\x12230769.74����úxB\x160.000002647\x02\x100.004994\x160.000006461\x02\x0E0.01226\x160.000001742\x02\x100.003311\x160.000004375\x02\x100.008268\x02\x12224039.71���\x0E\x16�xB\x160.000004375\x02\x100.008268\x160.000004423\x02\x100.008380\x160.000003054\x02\x100.005842\x160.000003086\x02\x100.005899\x02\x1032483.79'

let splitted = str.trim().replace(/\x/gm, '\n').split('\n')
splitted.splice(0, 2)
console.log(splitted)

let candle = splitted[0]

const candleWithNoHex = candle.replace(/[^0-9.]/gm, ' ')
console.log(candleWithNoHex)
const candleWithNoHexSplitted = candleWithNoHex.split(' ')
console.log('candleWithNoHexSplitted', candleWithNoHexSplitted)
const candleWithNoHexSplittedNoEmpty = candleWithNoHexSplitted.filter((val) => {
    if (val !== '') {
        return true
    }
})
console.log(candleWithNoHexSplittedNoEmpty)

for (let i = 0; i < candle.length; i++) {}
