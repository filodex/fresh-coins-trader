import 'dotenv/config'
import etherscanApi from './src/apis/EtherscanApi/EtherscanApi.js'
import configService from './src/services/config.service.js'
import whalesDetectorService from './src/Services/WhalesDetector.service.js'

const titanxTokenAddress = '0xc45a81bc23a64ea556ab4cdf08a86b61cdceea8b'

const { setOfWalletsBoughtThisToken: array } = await whalesDetectorService.getSetOfWalletsBoughtThisToken({
    address: titanxTokenAddress,
})
console.log('setOfWallets', array)
await whalesDetectorService.findGoodWhalesInListOfWallets({ setOfWallets: array })

setInterval(() => {}, 100000)
