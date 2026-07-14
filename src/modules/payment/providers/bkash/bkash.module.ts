import { DynamicModule, Module, Provider, Global } from '@nestjs/common';
import { BKASH_OPTIONS } from './bkash.constant';
import { BkashStrategy } from './bkash.strategy';
import { BkashService } from './bkash.service';
import { BkashOptions } from './types/bkash.types';

export interface BkashModuleAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (...args: any[]) => Promise<BkashOptions> | BkashOptions;
}

@Global()
@Module({})
export class BkashModule {
  static register(config: BkashOptions): DynamicModule {
    return {
      module: BkashModule,
      providers: [
        { provide: BKASH_OPTIONS, useValue: config },
        BkashService,
        BkashStrategy,
      ],
      exports: [BkashService, BkashStrategy],
    };
  }

  static registerAsync(options: BkashModuleAsyncOptions): DynamicModule {
    const configProvider: Provider = {
      provide: BKASH_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: BkashModule,
      imports: options.imports || [],
      providers: [configProvider, BkashService, BkashStrategy],
      exports: [BkashService, BkashStrategy],
    };
  }
}
