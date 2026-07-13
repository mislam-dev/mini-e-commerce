import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // @Column({ unique: true }) // ? may be this need skipping for faster development
  // slug: string;

  @Column({ name: 'parent_id', nullable: true })
  parentId?: string;

  @ManyToOne(() => Category, (c) => c.children, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent?: Category;

  @OneToMany(() => Category, (c) => c.parent)
  children?: Category[];
}
