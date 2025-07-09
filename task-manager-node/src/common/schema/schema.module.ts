import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { FailedEvent, FailedEventSchema } from './failed-event.schema';

@Module({
  imports: [
    // Conexión a MongoDB usando Mongoose
    MongooseModule.forRootAsync({
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
            uri: config.getOrThrow<string>('MONGODB_URI'),
        }),
    }),
    MongooseModule.forFeature([
        { name: FailedEvent.name, schema: FailedEventSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SchemaModule {}
