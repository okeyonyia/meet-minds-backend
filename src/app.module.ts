import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make the config module globally available
      envFilePath: '.env', // Specify the .env file
    }),
    MongooseModule.forRoot(process.env.MONGO_CONNECTION_STRING),
    , AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
