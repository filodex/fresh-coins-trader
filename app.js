import 'dotenv/config'
import etherscanApi from './src/Apis/EtherscanApi.js'
import configService from './src/services/Config.service.js'
import whalesDetectorService from './src/Services/WhalesDetector.service.js'
import syveApi from './src/apis/SyveApi.js'
import EthAddress from './src/model/EthAddress.js'
import traderService from './src/services/Trader.service.js'

/**
 * Нашел токены, которые купили несколько крутых ребяt
 * Узнать цену, по которой я могу сейчас тоже купить
 * Запомнить цену
 */
console.log(await traderService.findTokensTradedByGoodWhales())

setInterval(() => {}, 100000)
