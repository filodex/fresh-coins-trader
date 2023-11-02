import 'dotenv/config'
import etherscanApi from './apis/EtherscanApi.js'
import { returnValueOfGetWalletTokenBalanceForSingleAddressByContractAddress } from './apis/IEtherscanApi'
import whalesDetectorService from './services/WhalesDetector.service.js'

const { addressesWithGoodProfit } = await whalesDetectorService.getProfitableWhaleWalletsBoughtThisToken({
    address: '0xC182fC7aFfAcb443263389409d5Dc70fb7f07847',
})

console.log(
    addressesWithGoodProfit.forEach((address) => {
        address.appendToListInFile()
    })
)
