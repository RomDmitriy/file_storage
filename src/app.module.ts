import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { DriveModule } from './drive/drive.module';
import { FolderModule } from './folder/folder.module';
import { FileModule } from './file/file.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),   // подключаем .env
        UserModule,                                 // модуль работы с данными пользователя
        AuthModule,                                 // модуль аутентификации
        DriveModule,                                // модуль работы с дисками
        FolderModule,                               // модуль работы с папками
        FileModule                                  // модуль работы с файлами
    ],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
