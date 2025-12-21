import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import Joi from 'joi';
import { HealthModule } from './health/health.module';
import { SmsModule } from './sms/sms.module';
import { PropertiesModule } from './properties/properties.module';
import { RoomTemplatesModule } from './room-templates/room-templates.module';
import { RoomsModule } from './rooms/rooms.module';
import { TenantsModule } from './tenants/tenants.module';
import { ContractsModule } from './contracts/contracts.module';
import { InvoicesModule } from './invoices/invoices.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().required(),
        ACCOUNT_SID: Joi.string().required(),
        AUTH_TOKEN: Joi.string().required(),
        FROM_PHONE_NUMBER: Joi.string().required(),
        CONTENT_SID: Joi.string().required(),
        CORS_WHITELIST: Joi.string().required(),
      }),
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://admin:admin123@localhost:27017/rentmaster?authSource=admin',
      }),
      inject: [ConfigService],
    }),
    HealthModule,
    AuthModule,
    SmsModule,
    PropertiesModule,
    RoomTemplatesModule,
    RoomsModule,
    TenantsModule,
    ContractsModule,
    InvoicesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
