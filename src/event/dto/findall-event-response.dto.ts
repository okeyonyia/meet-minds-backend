import { Expose } from 'class-transformer';

export class FindAllEventsResponseDto {
  @Expose()
  statusCode: number;

  @Expose()
  message: string;

  @Expose()
  data: any[];

  @Expose()
  totalCount: number;
}
