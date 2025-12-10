import { Observable } from "rxjs";
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { map } from "rxjs/operators";

export interface Response<T> {
    statusCode: number;
    error: number;
    message: string;
    data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
        return next.handle().pipe(
            map((data) => {
                const {
                    statusCode = context.switchToHttp().getResponse().statusCode,
                    error = 0,
                    message = "Success",
                } = data;
                return {
                    statusCode,
                    error,
                    message,
                    data,
                };
            })
        );
    }
}
