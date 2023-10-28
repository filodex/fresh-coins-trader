import fs from 'fs'
import path from 'path'

export class ConfigService {
    configPath = path.join(path.resolve(), 'src', 'config', 'config.cfg')

    get(settingName) {
        const configFileText = fs.readFileSync(this.configPath, { encoding: 'utf8' })
        const allSettingsArray = configFileText.split('/n')
        for (const setting of allSettingsArray) {
            const settingSplitted = setting.split('=')
            if (settingSplitted[0] === settingName) {
                return settingSplitted[1]
            }
        }
    }
}
const configService = new ConfigService()
export default configService
