import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from "@nestjs/common";
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost){
        
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request  = ctx.getRequest<Request>();
        const status   = exception.getStatus();

        console.log('Request body:', request.body); 
        console.log('Exception details:', exception.getResponse()); 


        const errorResponse = {
            code: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            details: exception.getResponse() || null,
        };

        response.status(status).json(errorResponse);
    }
}