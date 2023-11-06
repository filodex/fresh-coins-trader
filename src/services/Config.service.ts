import fs, { PathLike } from 'fs'
import path from 'path'
import { IConfigService } from './IConfig.service.js'

export class ConfigService implements IConfigService {
    configPath: PathLike = path.join(path.resolve(), 'src', 'config', 'config.cfg')

    get(settingName: string) {
        const configFileText = fs.readFileSync(this.configPath, { encoding: 'utf8' })
        const allSettingsArray = configFileText.split('\r\n')
        for (const setting of allSettingsArray) {
            const settingSplitted: Array<string> = setting.split('=')
            if (settingSplitted[0] === settingName) {
                return settingSplitted[1]
            }
        }
    }
}
const configService = new ConfigService()
export default configService
