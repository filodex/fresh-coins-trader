import 'dotenv/config'
import etherscanApi from './src/Apis/EtherscanApi.js'
import configService from './src/services/Config.service.js'
import whalesDetectorService from './src/Services/WhalesDetector.service.js'
import syveApi from './src/apis/SyveApi.js'
import EthAddress from './src/model/EthAddress.js'

const titanxTokenAddress = '0xc45a81bc23a64ea556ab4cdf08a86b61cdceea8b'
const walletsToCheckProfit = [
    '0x4a7c6899cdcb379e284fbfd045462e751da4c7ce',
    '0xdb5889e35e379ef0498aae126fc2cce1fbd23216',
    '0x00000047bb99ea4d791bb749d970de71ee0b1a34',
    '0xdef1c0ded9bec7f1a1670819833240f027b25eff',
]

// const { addressesWithGoodProfit } = await whalesDetectorService.getProfitableWhaleWalletsBoughtThisToken({
//     address: titanxTokenAddress,
// })
// console.log(addressesWithGoodProfit)
// addressesWithGoodProfit[0].appendToListInFile()
const addr = new EthAddress({ address: '0xedw4lk43l43hkj43kjh' })
addr.totalProfitStats = { a: 1, b: 2 }

addr.appendToListInFile()

setInterval(() => {}, 100000)
