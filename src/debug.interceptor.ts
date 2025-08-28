import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class DebugInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    console.log(`DEBUG: ${request.method} ${request.url} - BEFORE`);
    console.log('DEBUG: Body:', request.body);
    console.log('DEBUG: Query:', request.query);
    
    return next.handle().pipe(
      tap({
        next: (data) => {
          console.log(`DEBUG: ${request.method} ${request.url} - SUCCESS`);
        },
        error: (err) => {
          console.log(`DEBUG: ${request.method} ${request.url} - ERROR:`, err.message);
        }
      })
    );
  }
}