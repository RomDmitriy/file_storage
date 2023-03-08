import { Module } from '@nestjs/common';
import { UserModule } from 'src/user/user.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from 'src/prisma.service';
import { JwtGeneratorModule } from './jwt/jwt-generator.module';
import { AccessStrategy } from './strategies/access.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
    imports: [
      UserModule,
      JwtGeneratorModule,
    ],
    providers: [PrismaService, AuthService, AccessStrategy, RefreshStrategy],
    controllers: [AuthController],
})
export class AuthModule {}
