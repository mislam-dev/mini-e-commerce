import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'float' })
  price: number;

  @Column({ type: 'int', name: 'stock_quantity' })
  stockQuantity: number;
}
