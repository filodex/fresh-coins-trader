import { PathLike } from 'fs'

export interface IConfigService {
    configPath: PathLike
    get(settingName: string): string | undefined
}
