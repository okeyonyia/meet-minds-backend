import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<any> {
    const statusCode = context.switchToHttp().getResponse().statusCode;

    return next.handle().pipe(
      map((data) => {
        // Check if the response already has a "message" and "data" field
        if (
          data &&
          typeof data === 'object' &&
          'message' in data &&
          'data' in data
        ) {
          return {
            statusCode,
            message: data.message,
            data: data.data,
          };
        }

        // Otherwise, assume raw data and wrap it
        return {
          statusCode,
          message: 'Request processed successfully.',
          data,
        };
      }),
    );
  }
}
