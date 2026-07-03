// import { Module } from '@nestjs/common';
// import { OrdersController } from './orders.controller';
// import { OrdersService } from './orders.service';

// @Module({
//   controllers: [OrdersController],
//   providers: [OrdersService],
//   exports: [OrdersService],
// })
// export class OrdersModule {}

import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { EscrowModule } from '../escrow/escrow.module';

@Module({
  imports: [EscrowModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
