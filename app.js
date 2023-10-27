import 'dotenv/config'
import etherscanApi from './src/Apis/EtherscanApi/EtherscanApi.js'

console.log(
    await etherscanApi.getListOfTokenTransfers({ address: '0x1f9090aaE28b8a3dCeaDf281B0F12828e676c326' })
)

setInterval(() => {}, 100000)
