import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model } from 'mongoose';
import { AppLogger } from '../../logger/app.logger';
import { TaskDeletedEventDto } from '../dto/task-deleted-event.dto';
import { TaskDeletedEvent, TaskDeletedEventDocument } from '../schema/task-deleted-event.schema';
import { BadRequestException } from '@nestjs/common';
import { NAME_CONNECTION_LOGGER_EVENTS } from '../../config/database.constants';
import { RetryPersist } from '../../util/retry-persist.util';
import { MetricsService } from '../../metrics/metrics.service';
// Funciones de class-validator y class-transformer
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TaskDeletedService {
  private readonly retryPersist: RetryPersist;

  constructor(
    @InjectModel(TaskDeletedEvent.name, NAME_CONNECTION_LOGGER_EVENTS)
    private readonly model: Model<TaskDeletedEventDocument>,
    private readonly logger: AppLogger,
    private readonly configService: ConfigService,
    private readonly metricsService: MetricsService, // para métricas
  ) {
    this.retryPersist = new RetryPersist(this.configService, this.logger);
  }

  /**
   * Guarda un evento de actualización de tarea en MongoDB.
   * Aplica validación por ID para evitar duplicados.
   */
  async saveEvent(payload : any): Promise<void> {
      const event = await this.getTaskCreatedEvent(payload);

    await this.retryPersist.execute(async () => {
      const doc = new this.model(event);
      await doc.save();
      // Aumentamos el contador de tareas eliminadas
      this.metricsService.tasksDeletedCounter.inc();
      this.logger.log(`Evento TaskDeletedEvent persistido (id: ${event.id})`, 'TaskDeletedService');
    });
  }

  private async getTaskCreatedEvent(payload : any) : Promise<TaskDeletedEvent> {
    // Convertir el objeto plano recibido a una instancia del DTO
    const dto = plainToInstance(TaskDeletedEventDto, payload);
    // Validar el DTO según las reglas declaradas en TaskCreatedEventDto
    const errors = await validate(dto);

    if (errors.length > 0) {
      this.logger.error('Validation failed for TaskDeletedEvent', JSON.stringify(errors));
      throw new BadRequestException('Invalid task status');
    }

    // Si pasa la validación, registrar logs estructurados
    this.logger.log('DTO validated successfully');
    this.logger.debug('Validated DTO: ' + JSON.stringify(dto));

    // crea el evento de tarea eliminada
    const taskEvent: TaskDeletedEvent = {
      id: dto.id,
      title: dto.title,
      description: dto.description,
      status: dto.status
    };
    return taskEvent;
  }
}
