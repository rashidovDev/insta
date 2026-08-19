import { Module } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsController } from './posts.controller';

@Module({
  imports : [TypeOrmModule.forFeature([Post])],
  providers: [PostsService],
  controllers: [PostsController]
})
export class PostsModule {}
