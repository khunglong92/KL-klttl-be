import { Module } from '@nestjs/common';
import { ContactInfoModule } from '../contact-info/contact-info.module';
import { AiChatController } from './ai-chat.controller';
import { AiChatService } from './ai-chat.service';
import { AiChatSettingsService } from './ai-chat-settings.service';
import { AiProviderProfileService } from './ai-provider-profile.service';
import { AiChatRagService } from './ai-chat-rag.service';
import { AiChatOpenAiClientService } from './ai-chat-openai-client.service';

@Module({
  imports: [ContactInfoModule],
  controllers: [AiChatController],
  providers: [
    AiChatService,
    AiChatSettingsService,
    AiProviderProfileService,
    AiChatRagService,
    AiChatOpenAiClientService,
  ],
})
export class AiChatModule {}
