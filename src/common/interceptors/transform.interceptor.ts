import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const statusCode = context.switchToHttp().getResponse().statusCode;
    return next.handle().pipe(
      map((responseData) => {
        if (responseData?.data && responseData?.meta) {
          return {
            statusCode,
            message: responseData.message || 'Success',
            data: responseData.data,
            meta: responseData.meta,
          };
        }
        return {
          statusCode,
          message: responseData?.message || 'Success',
          data: responseData?.data !== undefined ? responseData.data : responseData,
        };
      }),
    );
  }
}
