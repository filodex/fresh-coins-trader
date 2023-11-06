import telegraf from 'telegraf'

export class TelegramBotService {
    #token: string
    bot: any
    channelId: string
    constructor(token: string | undefined, channelId: string | undefined) {
        if (!token) throw new Error('telegram token is required')
        if (!channelId) throw new Error('channel id is required')

        this.#token = token
        this.bot = new telegraf.Telegraf(this.#token)
        this.channelId = channelId
    }

    async sendMessageToMyChannel(text: string = '') {
        if (!text || text.length === 0) {
            return
        }

        this.bot.telegram.sendMessage(this.channelId, text, { disable_web_page_preview: true })
    }

    async handleBotCommands() {
        this.bot.start((ctx: any) => {
            ctx.reply('Ацтань, я ниче не умею')
        })

        this.bot.launch()
    }
}

const telegramBotService = new TelegramBotService(
    process.env.TELEGRAM_BOT_TOKEN,
    String(process.env.CHANNEL_ID)
)

telegramBotService.handleBotCommands()

export default telegramBotService
