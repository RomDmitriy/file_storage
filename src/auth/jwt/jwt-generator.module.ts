import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtGeneratorService } from './jwt-generator.service';

@Module({
    imports: [],
    controllers: [],
    providers: [JwtService, JwtGeneratorService],
    exports: [JwtGeneratorService]
})
export class JwtGeneratorModule {}
